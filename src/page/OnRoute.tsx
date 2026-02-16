import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronRight, Flag, MapPin } from "lucide-react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";

import { useMap } from "@/context/MapContext";
import { useWebSocket } from "@/context/WebSocket";
import { Button } from "@/components/ui/button";
import { useGetLocationFromCoords } from "@/hooks/useGetLocationFromCoords";
import { formatAddress } from "@/utils/formatLocationName";
import { useAuth } from "@/context/userContext";
import { useGetUserLiveLocation } from "@/hooks/useGetUserLocation";
import {
  useCheckDriverTripStatus,
  useCancelTripByDriver,
  useGetActiveTrip,
  useDropOffRider,
  useUpdateTripStatus,
} from "@/API/trip-api";
import { useUpdateUserLocationRedis } from "@/API/auth-api";
import {
  clearRouteFromMap,
  drawRouteOnMap,
  toLngLat,
} from "@/utils/onRouteMap";
import { mapActiveTripToTripRequestData } from "@/utils/activeTripMapper";

// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Clock, Navigation } from "lucide-react";

const DRIVER_CANCEL_OPTIONS = [
  "Rider is taking too long",
  "Rider is behaving inappropriately",
  "Accidentally accepted this ride",
  "Pickup location is unsafe",
  "Vehicle issue or emergency",
  "Unable to reach rider",
  "Other",
] as const;

const ROUTE_REFRESH_MS = 30000;
const ROUTE_MIN_MOVE_METERS = 100;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(a: [number, number], b: [number, number]) {
  const earthRadiusMeters = 6371000;
  const latDiff = toRadians(b[0] - a[0]);
  const lngDiff = toRadians(b[1] - a[1]);
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);

  const haversine =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMeters * centralAngle;
}

export default function OnRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mapRef, ensureMap } = useMap();
  const {
    latLng: coords,
    error,
    status: locationStatus,
    requestLocationAccess,
  } = useGetUserLiveLocation();
  const { connected, trip_request_data, send, setTripRequestData } =
    useWebSocket();
  const [routePhase, setRoutePhase] = useState<"to_pickup" | "to_dropoff">(
    "to_pickup",
  );
  const { data: driverTripStatus, isLoading: isTripStatusLoading } =
    useCheckDriverTripStatus();
  const hasActiveTrip =
    driverTripStatus?.status === true ||
    driverTripStatus?.status === "accepted" ||
    driverTripStatus?.status === "on_route";
  const activeTripId = hasActiveTrip ? driverTripStatus.trip_id : "";
  const { data: activeTrip, isLoading: isActiveTripLoading } =
    useGetActiveTrip(activeTripId);
  const { mutate: updateUserLocationMutate } = useUpdateUserLocationRedis();
  const { mutate: updateTripStatusMutate, isPending: isUpdatingTripStatus } =
    useUpdateTripStatus();
  const { mutate: dropOffRiderMutate, isPending: isDroppingOff } =
    useDropOffRider();
  const { mutateAsync: cancelTripMutateAsync, isPending: isCancelling } =
    useCancelTripByDriver();
  const hardReloadHome = useCallback(() => {
    window.location.assign("/");
  }, []);
  const { user: driver_profile, driver_details } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [routedDriverOrigin, setRoutedDriverOrigin] = useState<
    [number, number] | null
  >(null);

  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const locationIntervalRef = useRef<number | null>(null);
  const socketIntervalRef = useRef<number | null>(null);
  const latestCoordsRef = useRef<[number, number] | null>(null);
  const latestDriverDetailsRef = useRef(driver_details);
  const latestDriverNameRef = useRef(driver_profile?.full_name || "");
  const latestDriverProfileRef = useRef(driver_profile);
  const latestTripRef = useRef(trip_request_data);
  const latestDriverOriginRef = useRef<[number, number] | null>(null);
  const routedDriverOriginRef = useRef<[number, number] | null>(null);

  const pickupLat = trip_request_data?.pickup_lat;
  const pickupLng = trip_request_data?.pickup_lng;
  const dropoffLat = trip_request_data?.dropoff_lat;
  const dropoffLng = trip_request_data?.dropoff_lng;

  const driverOrigin = useMemo<[number, number] | null>(() => {
    if (!coords) return null;
    return [coords[0], coords[1]];
  }, [coords]);

  const pickupLocation = useGetLocationFromCoords(pickupLat, pickupLng);
  const dropoffLocation = useGetLocationFromCoords(dropoffLat, dropoffLng);
  const hasCoords = !!coords;

  useEffect(() => {
    latestCoordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    latestDriverOriginRef.current = driverOrigin;
  }, [driverOrigin]);

  useEffect(() => {
    if (!driverOrigin) return;
    if (routedDriverOriginRef.current) return;

    routedDriverOriginRef.current = driverOrigin;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoutedDriverOrigin(driverOrigin);
  }, [driverOrigin]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const latest = latestDriverOriginRef.current;
      if (!latest) return;

      const previous = routedDriverOriginRef.current;
      if (!previous) {
        routedDriverOriginRef.current = latest;
        setRoutedDriverOrigin(latest);
        return;
      }

      if (getDistanceMeters(previous, latest) < ROUTE_MIN_MOVE_METERS) {
        return;
      }

      routedDriverOriginRef.current = latest;
      setRoutedDriverOrigin(latest);
    }, ROUTE_REFRESH_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const latest = latestDriverOriginRef.current;
    if (!latest) return;

    routedDriverOriginRef.current = latest;
    setRoutedDriverOrigin(latest);
  }, [routePhase]);

  useEffect(() => {
    latestDriverDetailsRef.current = driver_details;
  }, [driver_details]);

  useEffect(() => {
    latestDriverNameRef.current = driver_profile?.full_name || "";
  }, [driver_profile?.full_name]);

  useEffect(() => {
    latestDriverProfileRef.current = driver_profile;
  }, [driver_profile]);

  useEffect(() => {
    latestTripRef.current = trip_request_data;
  }, [trip_request_data]);

  const sendDriverLocationUpdate = useCallback(() => {
    const currentCoords = latestCoordsRef.current;
    const currentDriverDetails = latestDriverDetailsRef.current;
    const currentTrip = latestTripRef.current;

    if (!currentCoords || !currentDriverDetails || !currentTrip) return;

    updateUserLocationMutate({
      name: latestDriverNameRef.current,
      car_color: currentDriverDetails.vehicle_color,
      car_make: currentDriverDetails.vehicle_make,
      car_model: currentDriverDetails.vehicle_model,
      car_plate: currentDriverDetails.license_plate,
      current_trip: currentTrip.trip_id,
      is_online: true,
      status: "busy",
      last_updated: Date.now(),
      lat_lng: {
        lat: currentCoords[0],
        lng: currentCoords[1],
      },
      current_rider: currentTrip.rider_id,
      driver_id: currentDriverDetails.id,
    });
  }, [updateUserLocationMutate]);

  useEffect(() => {
    if (trip_request_data) return;
    if (!hasActiveTrip || !activeTrip) return;

    setTripRequestData(mapActiveTripToTripRequestData(activeTrip));
  }, [activeTrip, hasActiveTrip, setTripRequestData, trip_request_data]);

  const isHydratingActiveTrip =
    !trip_request_data &&
    (isTripStatusLoading || (hasActiveTrip && isActiveTripLoading));

  useEffect(() => {
    if (connected && !trip_request_data && !isHydratingActiveTrip) {
      navigate("/");
    }
  }, [connected, isHydratingActiveTrip, navigate, trip_request_data]);

  useEffect(() => {
    if (
      activeTrip?.status === "completed" ||
      driverTripStatus?.status === "completed"
    ) {
      setTripRequestData(null);
      queryClient.invalidateQueries({ queryKey: ["checkDriverTripStatus"] });
      queryClient.invalidateQueries({ queryKey: ["getActiveRideWithID"] });
      navigate("/", { replace: true });
    }
  }, [
    activeTrip?.status,
    driverTripStatus?.status,
    navigate,
    queryClient,
    setTripRequestData,
  ]);

  useEffect(() => {
    if (isHydratingActiveTrip) return;
    if (!trip_request_data) return;
    if (driverTripStatus?.status === false) {
      setTripRequestData(null);
      queryClient.invalidateQueries({ queryKey: ["checkDriverTripStatus"] });
      queryClient.invalidateQueries({ queryKey: ["getActiveRideWithID"] });
      navigate("/", { replace: true });
    }
  }, [
    driverTripStatus?.status,
    isHydratingActiveTrip,
    navigate,
    queryClient,
    setTripRequestData,
    trip_request_data,
  ]);

  useEffect(() => {
    if (!trip_request_data?.trip_id) return;
    const shouldStartDropoff =
      driverTripStatus?.status === "on_route" ||
      activeTrip?.status === "on_route";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoutePhase(shouldStartDropoff ? "to_dropoff" : "to_pickup");
  }, [
    activeTrip?.status,
    driverTripStatus?.status,
    trip_request_data?.trip_id,
  ]);

  const pickupPoint = useMemo<[number, number] | null>(() => {
    if (pickupLat == null || pickupLng == null) return null;
    return [pickupLat, pickupLng];
  }, [pickupLat, pickupLng]);

  const dropoffPoint = useMemo<[number, number] | null>(() => {
    if (dropoffLat == null || dropoffLng == null) return null;
    return [dropoffLat, dropoffLng];
  }, [dropoffLat, dropoffLng]);

  const origin = useMemo<[number, number] | null>(() => {
    return routedDriverOrigin ?? driverOrigin ?? pickupPoint;
  }, [driverOrigin, pickupPoint, routedDriverOrigin]);

  const destination = routePhase === "to_pickup" ? pickupPoint : dropoffPoint;

  const pickupLabel = formatAddress({
    city: pickupLocation?.city,
    place_name:
      pickupLocation?.place_name ?? trip_request_data?.pickup_location,
    region: pickupLocation?.region,
    street: pickupLocation?.street,
  });

  const dropoffLabel = formatAddress({
    city: dropoffLocation?.city,
    place_name:
      dropoffLocation?.place_name ?? trip_request_data?.dropoff_location,
    region: dropoffLocation?.region,
    street: dropoffLocation?.street,
  });

  const sendSocketLocationUpdate = useCallback(() => {
    const currentCoords = latestCoordsRef.current;
    const currentTrip = latestTripRef.current;
    const currentDriverDetails = latestDriverDetailsRef.current;
    const currentDriverProfile = latestDriverProfileRef.current;

    if (!currentCoords || !currentTrip || !currentDriverDetails) return;

    send({
      type: "DRIVER_LOCATION_UPDATE",
      trip_id: currentTrip.trip_id,
      rider_id: currentTrip.rider_id,
      driver_id: currentTrip.driver_id || currentDriverDetails.id,
      driver_name:
        currentDriverProfile?.full_name || latestDriverNameRef.current,
      driver_car_color: currentDriverDetails.vehicle_color,
      driver_car_number: currentDriverDetails.license_plate,
      driver_profile_pic: currentDriverProfile?.profile_picture_url,
      driver_phone_number: currentDriverProfile?.phone_number,
      lng: currentCoords[1],
      lat: currentCoords[0],
      status: routePhase === "to_pickup" ? "assigned" : "on_route",
    });
  }, [routePhase, send]);

  useEffect(() => {
    if (socketIntervalRef.current) {
      window.clearInterval(socketIntervalRef.current);
      socketIntervalRef.current = null;
    }

    if (!connected || !trip_request_data || error) return;

    sendSocketLocationUpdate();
    socketIntervalRef.current = window.setInterval(() => {
      sendSocketLocationUpdate();
    }, 10000);

    return () => {
      if (socketIntervalRef.current) {
        window.clearInterval(socketIntervalRef.current);
        socketIntervalRef.current = null;
      }
    };
  }, [connected, error, sendSocketLocationUpdate, trip_request_data]);

  useEffect(() => {
    if (locationIntervalRef.current) {
      window.clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    if (!hasCoords || !driver_details || !trip_request_data) return;

    sendDriverLocationUpdate();
    locationIntervalRef.current = window.setInterval(() => {
      sendDriverLocationUpdate();
    }, 15000);

    return () => {
      if (locationIntervalRef.current) {
        window.clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [driver_details, hasCoords, sendDriverLocationUpdate, trip_request_data]);

  /* ---------------- Init map ---------------- */
  useEffect(() => {
    if (!origin) return;
    const safeOrigin = origin;
    const map = ensureMap({
      center: toLngLat(safeOrigin),
      zoom: 14,
    });

    map.resize();
  }, [ensureMap, origin]);

  useEffect(() => {
    if (!coords) return;
    const map =
      mapRef.current ?? ensureMap({ center: toLngLat(coords), zoom: 14 });

    if (!driverMarkerRef.current) {
      const driverCarMarkerEl = document.createElement("div");
      driverCarMarkerEl.textContent = "🚗";
      driverCarMarkerEl.setAttribute("aria-label", "Driver car location");
      driverCarMarkerEl.style.fontSize = "24px";
      driverCarMarkerEl.style.lineHeight = "1";
      driverCarMarkerEl.style.filter =
        "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";

      driverMarkerRef.current = new mapboxgl.Marker({
        element: driverCarMarkerEl,
        anchor: "center",
      })
        .setLngLat(toLngLat(coords))
        .addTo(map);
    } else {
      driverMarkerRef.current.setLngLat(toLngLat(coords));
    }
  }, [coords, ensureMap, mapRef]);

  useEffect(() => {
    return () => {
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
    };
  }, []);

  /* ---------------- Draw route ---------------- */
  useEffect(() => {
    if (!origin || !destination) return;
    let cancelled = false;

    const map = ensureMap({
      center: toLngLat(origin),
      zoom: 14,
    });

    drawRouteOnMap({
      map,
      origin,
      destination,
      pickupMarkerRef,
      dropoffMarkerRef,
      shouldCancel: () => cancelled,
    });

    const cleanupMap = mapRef.current;

    return () => {
      cancelled = true;
      const map = cleanupMap;
      if (!map) return;

      clearRouteFromMap({
        map,
        pickupMarkerRef,
        dropoffMarkerRef,
      });
    };
  }, [ensureMap, mapRef, origin, destination]);

  if (!connected || !trip_request_data || !origin || !destination) {
    return (
      <div className="h-screen flex items-center justify-center">Loading…</div>
    );
  }

  const shouldShowLocationNotice = !coords && locationStatus !== "ready";
  const showLocationAction =
    locationStatus !== "unsupported" && locationStatus !== "ready";
  const isOtherReasonSelected = cancelReason === "Other";

  const handleOpenCancelModal = () => {
    setCancelReason("");
    setCustomCancelReason("");
    setCancelError("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!trip_request_data) return;
    if (!cancelReason) {
      setCancelError("Please select a reason.");
      return;
    }

    const reasonToSubmit = isOtherReasonSelected
      ? customCancelReason.trim()
      : cancelReason;

    if (!reasonToSubmit) {
      setCancelError("Please enter your reason.");
      return;
    }

    setCancelError("");

    try {
      const res = await cancelTripMutateAsync({
        trip_id: trip_request_data.trip_id,
        driver_id: trip_request_data.driver_id,
        rider_id: trip_request_data.rider_id,
        reason: reasonToSubmit,
        is_rider_picked: routePhase == "to_pickup" ? false : true,
      });

      const isSuccess =
        res?.success === true ||
        (res?.success !== false && res?.status !== false);

      if (isSuccess) {
        setTripRequestData(null);
        queryClient.invalidateQueries({ queryKey: ["checkDriverTripStatus"] });
        queryClient.invalidateQueries({ queryKey: ["getActiveRideWithID"] });
        hardReloadHome();
        return;
      }

      setCancelError("Unable to cancel ride. Please try again.");
    } catch {
      setCancelError("Unable to cancel ride. Please try again.");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/40 to-transparent" />
      {shouldShowLocationNotice && (
        <div className="pointer-events-auto absolute bottom-5 left-4 right-4 md:left-8 md:right-auto md:max-w-lg">
          <div className="rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {locationStatus === "locating"
                    ? "Waiting for location access"
                    : "Location access required"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Please allow location access to keep sharing your live trip
                  updates.
                </p>
                {error && (
                  <p className="mt-2 text-xs text-amber-700">{error}</p>
                )}
                {showLocationAction && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onClick={requestLocationAccess}
                  >
                    Enable location
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-auto absolute top-4 left-4 right-4 md:left-6 md:right-auto md:max-w-sm">
        {/* Main Card - Uber Style */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Trip Status Bar */}
          <div className="bg-black px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-900 animate-pulse" />
              <span className="text-white text-xs font-semibold uppercase tracking-wide">
                Trip Active
              </span>
            </div>
            <span className="text-white/70 text-xs font-medium">
              {routePhase === "to_pickup" ? "Step 1 of 2" : "Step 2 of 2"}
            </span>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Phase Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center ${
                  routePhase === "to_pickup" ? "bg-gray-950" : "bg-green-950"
                }`}
              >
                {routePhase === "to_pickup" ? (
                  <MapPin className="h-7 w-7 text-white" strokeWidth={2.5} />
                ) : (
                  <Flag className="h-7 w-7 text-white" strokeWidth={2.5} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  {routePhase === "to_pickup"
                    ? "Picking up rider"
                    : "Dropping off rider"}
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                  {routePhase === "to_pickup"
                    ? "Navigate to pickup"
                    : "Navigate to destination"}
                </p>
              </div>
            </div>

            {/* Destination Info */}
            <div className="bg-gray-50 rounded-lg p-3.5 mb-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div
                    className={`h-3 w-3 rounded-full border-2 ${
                      routePhase === "to_pickup"
                        ? "border-blue-500 bg-white"
                        : "bg-green-950 border-green-950"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    {routePhase === "to_pickup"
                      ? "Pickup location"
                      : "Dropoff location"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">
                    {routePhase === "to_pickup" ? pickupLabel : dropoffLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* ETA Banner */}
            <div className="bg-linear-to-r from-gray-900 to-gray-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-900 font-medium mb-0.5">
                    Estimated time
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {trip_request_data?.estimated_duration_min != null
                      ? `${trip_request_data.estimated_duration_min} min`
                      : "—"}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-500" />
              </div>
            </div>

            {/* Action Button */}
            {routePhase === "to_pickup" ? (
              <Button
                className="w-full h-12 bg-black hover:bg-gray-900 text-white font-semibold text-base rounded-lg transition-colors"
                onClick={() => {
                  if (!trip_request_data) return;
                  updateTripStatusMutate(
                    {
                      trip_id: trip_request_data.trip_id,
                      driver_id: trip_request_data.driver_id,
                      rider_id: trip_request_data.rider_id,
                    },
                    {
                      onSuccess: () => {
                        setRoutePhase("to_dropoff");
                        queryClient.invalidateQueries({
                          queryKey: ["checkDriverTripStatus"],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["getActiveRideWithID"],
                        });
                      },
                    },
                  );
                }}
                disabled={isUpdatingTripStatus}
              >
                {isUpdatingTripStatus ? "Confirming..." : "Confirm pickup"}
              </Button>
            ) : (
              <Button
                className="w-full h-12 bg-green-900 hover:bg-green-900 text-white font-semibold text-base rounded-lg transition-colors"
                onClick={() => {
                  if (!trip_request_data) return;
                  dropOffRiderMutate(
                    {
                      trip_id: trip_request_data.trip_id,
                      driver_id: trip_request_data.driver_id,
                      rider_id: trip_request_data.rider_id,
                    },
                    {
                      onSuccess: () => {
                        setTripRequestData(null);
                        queryClient.invalidateQueries({
                          queryKey: ["checkDriverTripStatus"],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["getActiveRideWithID"],
                        });
                        hardReloadHome();
                      },
                    },
                  );
                }}
                disabled={isDroppingOff}
              >
                {isDroppingOff ? "Completing..." : "Complete dropoff"}
              </Button>
            )}

            <Button
              type="button"
              onClick={handleOpenCancelModal}
              className="mt-2 h-11 w-full rounded-lg bg-red-700 font-semibold text-white hover:bg-rose-700"
            >
              Cancel ride
            </Button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl">
            <h3 className="text-xl font-bold text-black">Cancel Ride</h3>
            <p className="mt-1 text-sm text-gray-600">
              Why are you canceling this ride?
            </p>

            <div className="mt-4 space-y-2">
              {DRIVER_CANCEL_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCancelReason(option);
                    if (option !== "Other") {
                      setCustomCancelReason("");
                    }
                    setCancelError("");
                  }}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
                    cancelReason === option
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {isOtherReasonSelected && (
              <div className="mt-3">
                <label
                  htmlFor="driver-cancel-other-reason"
                  className="mb-1 block text-xs font-semibold text-gray-700"
                >
                  Enter reason
                </label>
                <textarea
                  id="driver-cancel-other-reason"
                  value={customCancelReason}
                  onChange={(event) => {
                    setCustomCancelReason(event.target.value);
                    setCancelError("");
                  }}
                  placeholder="Type your reason"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-black focus:outline-none"
                />
              </div>
            )}

            {cancelError && (
              <p className="mt-3 text-sm font-semibold text-red-600">
                {cancelError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Keep Ride
              </Button>
              <Button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="bg-red-800 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {isCancelling ? "Canceling..." : "Confirm Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
