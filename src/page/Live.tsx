import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { AlertTriangle, LocateFixed, Navigation, User } from "lucide-react";

import { useGoingOffline, useUpdateUserLocationRedis } from "@/API/auth-api";
import { useAuth } from "@/context/userContext";
import { useMap } from "@/context/MapContext";
import { useWebSocket } from "@/context/WebSocket";
import { Button } from "@/components/ui/button";
import { useAcceptTripRequest } from "@/API/trip-api";
import { useGetUserLiveLocation } from "@/hooks/useGetUserLocation";

type LiveProps = {
  isDriverLive: boolean;
  setIsOnline: (isDriverOnline: boolean) => void;
};

const DEFAULT_MAP_CENTER: [number, number] = [-79.383184, 43.653226];

function Live({ isDriverLive, setIsOnline }: LiveProps) {
  const { driver_details, user } = useAuth();
  const { mutate } = useAcceptTripRequest();
  const {
    latLng: liveCoords,
    error: locationError,
    status: locationStatus,
    requestLocationAccess,
  } = useGetUserLiveLocation();

  const { mapRef, ensureMap } = useMap();
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const locationIntervalRef = useRef<number | null>(null);
  const hasSentOnlineUpdateRef = useRef(false);
  const latestCoordsRef = useRef<[number, number] | null>(null);
  const latestDriverDetailsRef = useRef(driver_details);
  const latestUserNameRef = useRef(user?.full_name || "");

  const { mutate: updateUserLocationMutate } = useUpdateUserLocationRedis();
  const { mutate: goOfflineMutate } = useGoingOffline();
  const { send, showpop_up, trip_request_data } = useWebSocket();
  const navigate = useNavigate();
  const hasLiveCoords = !!liveCoords;

  useEffect(() => {
    latestCoordsRef.current = liveCoords;
  }, [liveCoords]);

  useEffect(() => {
    latestDriverDetailsRef.current = driver_details;
  }, [driver_details]);

  useEffect(() => {
    latestUserNameRef.current = user?.full_name || "";
  }, [user?.full_name]);

  const sendDriverLocationUpdate = useCallback(
    (isOnline: boolean) => {
      const coords = latestCoordsRef.current;
      const currentDriverDetails = latestDriverDetailsRef.current;

      if (!coords || !currentDriverDetails) return;

      updateUserLocationMutate({
        name: latestUserNameRef.current,
        car_color: currentDriverDetails.vehicle_color,
        car_make: currentDriverDetails.vehicle_make,
        car_model: currentDriverDetails.vehicle_model,
        car_plate: currentDriverDetails.license_plate,
        current_trip: "",
        is_online: isOnline,
        status: "available",
        last_updated: Date.now(),
        lat_lng: {
          lat: coords[0],
          lng: coords[1],
        },
        current_rider: "",
        driver_id: "",
      });
    },
    [updateUserLocationMutate],
  );

  useEffect(() => {
    const map = ensureMap({
      containerId: "map",
      center: DEFAULT_MAP_CENTER,
      zoom: 12,
    });
    map.resize();
  }, [ensureMap]);

  useEffect(() => {
    if (!liveCoords) return;

    const [lat, lng] = liveCoords;
    const map = ensureMap({ containerId: "map", center: [lng, lat], zoom: 15 });

    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapboxgl.Marker({
        color: "#00E5FF",
        scale: 1.2,
      })
        .setLngLat([lng, lat])
        .addTo(map);
    }

    userMarkerRef.current.setLngLat([lng, lat]);
    map.easeTo({
      center: [lng, lat],
      zoom: 15,
      duration: 800,
    });
  }, [ensureMap, liveCoords]);

  useEffect(() => {
    if (locationIntervalRef.current) {
      window.clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    if (!isDriverLive) {
      hasSentOnlineUpdateRef.current = false;
      return;
    }

    if (!driver_details) return;
    if (!liveCoords) return;

    if (!hasSentOnlineUpdateRef.current) {
      sendDriverLocationUpdate(true);
      hasSentOnlineUpdateRef.current = true;
    }

    locationIntervalRef.current = window.setInterval(() => {
      sendDriverLocationUpdate(true);
    }, 15000);

    return () => {
      if (locationIntervalRef.current) {
        window.clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [
    driver_details,
    isDriverLive,
    sendDriverLocationUpdate,
    hasLiveCoords,
  ]);

  function acceptTrip() {
    if (trip_request_data) {
      mutate(
        {
          driver_id: trip_request_data?.driver_id,
          trip_id: trip_request_data?.trip_id,
        },
        {
          onSuccess: () => {
            navigate("/on-route", { replace: true });
          },
        },
      );
    }
  }

  function rejectTrip(tripId: string) {
    send({
      type: "TRIP_REJECTED",
      trip_id: tripId,
    });
  }

  function recenterMap() {
    if (!mapRef.current) return;
    const center: [number, number] = liveCoords
      ? [liveCoords[1], liveCoords[0]]
      : DEFAULT_MAP_CENTER;
    const zoom = liveCoords ? 15 : 12;

    mapRef.current.easeTo({
      center,
      zoom,
      duration: 800,
    });
  }

  function handleGoOffline() {
    if (!isDriverLive) return;

    setIsOnline(false);
    hasSentOnlineUpdateRef.current = false;
    goOfflineMutate();
  }

  const shouldShowPermissionNotice =
    !liveCoords &&
    (locationStatus === "blocked" ||
      locationStatus === "unsupported" ||
      locationStatus === "idle");
  const shouldShowLocatingNotice =
    locationStatus === "locating" && !liveCoords && !shouldShowPermissionNotice;
  const locationNoticeTitle =
    locationStatus === "idle"
      ? "Unable to get live location"
      : "Location access required";
  const locationNoticeDescription =
    locationStatus === "idle"
      ? "Please keep GPS enabled and try again."
      : "Please allow location access to share live updates on the map.";

  return (
    <div className="pointer-events-none fixed inset-0">
      {shouldShowPermissionNotice && (
        <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center px-4 pointer-events-auto">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {locationNoticeTitle}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {locationNoticeDescription}
                </p>
                {locationError && (
                  <p className="mt-2 text-xs text-amber-700">{locationError}</p>
                )}
                {locationStatus !== "unsupported" && (
                  <Button
                    size="sm"
                    className="mt-3 bg-slate-900 hover:bg-slate-800"
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

      {shouldShowLocatingNotice && (
        <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                <LocateFixed className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Getting your live location...
                </p>
                <p className="text-xs text-slate-600">
                  Keep GPS on for better trip matching.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 flex flex-col gap-3 pointer-events-auto z-20">
        <Button className="p-5" onClick={recenterMap}>
          <Navigation />
        </Button>
        <Link to="/profile">
          <Button className="p-5" onClick={recenterMap}>
            <User />
          </Button>
        </Link>
      </div>

      {isDriverLive && (
        <div className="fixed top-6 inset-x-0 flex justify-center pointer-events-auto z-20">
          <button onClick={handleGoOffline} className="btn-donate">
            Go offline
          </button>
        </div>
      )}
      {showpop_up && trip_request_data && (
        <div className="fixed inset-0 flex items-center justify-center z-30 pointer-events-auto">
          {/* backdrop */}

          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold">New Trip Request</h3>

            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium">Pickup:</span>
                <div className="text-gray-600">
                  {trip_request_data.pickup_location}
                </div>
              </div>

              <div>
                <span className="font-medium">Dropoff:</span>
                <div className="text-gray-600">
                  {trip_request_data.dropoff_location}
                </div>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Distance</span>
                <span>{trip_request_data.estimated_distance_km} km</span>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Duration</span>
                <span>{trip_request_data.estimated_duration_min} min</span>
              </div>

              <div className="flex justify-between font-semibold">
                <span>Fare</span>
                <span>${trip_request_data.estimated_price}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={acceptTrip}
              >
                Accept
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => rejectTrip(trip_request_data.trip_id)}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Live;
