import mapboxgl from "mapbox-gl";

import { useEffect, useRef, useState } from "react";
import useGetUserLocation from "../hooks/useGetUserLocation";
import { Button } from "@/components/ui/button";
import { Navigation, User } from "lucide-react";
import { Link } from "react-router";
import { useUpdateUserLocationRedis } from "@/API/auth-api";
import { useAuth } from "@/context/userContext";
import { useMap } from "@/context/MapContext";
import { useWebSocket } from "@/context/WebSocket";
import { useNavigate } from "react-router";

type LiveProps = {
  isDriverLive: boolean;
  setIsOnline: (isDriverOnline: boolean) => void;
};

function Live({ isDriverLive, setIsOnline }: LiveProps) {
  
  const { driver_details, user } = useAuth();
  // const [location_alert, set_location_alert] = useState(false)
  const [liveCoords, setLiveCoords] = useState<[number, number] | null>(null);
  const navigate = useNavigate()

  const coords = useGetUserLocation(); // initial [lat, lng]

  const { mapRef, ensureMap } = useMap();
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const { mutate: updateUserLocationMutate } = useUpdateUserLocationRedis();

  useEffect(() => {
    if (!coords) {
      return;
    }

    const [lat, lng] = coords;
    const map = ensureMap({ containerId: "map", center: [lng, lat], zoom: 15 });

    map.resize();

    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapboxgl.Marker({
        color: "#00E5FF",
        scale: 1.2,
      })
        .setLngLat([lng, lat])
        .addTo(map);
    }
  }, [coords, ensureMap]);

  useEffect(() => {
    if (!coords) return;
    if (!mapRef.current) return;
    if (!userMarkerRef.current) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setLiveCoords([latitude, longitude]);

        // Move marker
        userMarkerRef.current!.setLngLat([longitude, latitude]);

        // Move camera smoothly
        mapRef.current!.easeTo({
          center: [longitude, latitude],
          duration: 800,
        });
      },
      (err) => {
        console.log("GPS ERROR:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [coords, mapRef]);

  // getRoute(liveCoords, next_stop, mapbox_access_token);

  // TODO: Separate static driver profile (car + name) from live location updates.
  // Only send lat/lng + status every few seconds. Move full driver metadata to a one-time setup API.

  useEffect(() => {
    if (!driver_details) return;
    if (!liveCoords) return;
    if (!isDriverLive) return;

    // Interval runs every 15 seconds
    const interval = setInterval(() => {
      updateUserLocationMutate({
        name: user?.full_name || "",
        car_color: driver_details.vehicle_color,
        car_make: driver_details.vehicle_make,
        car_model: driver_details.vehicle_model,
        car_plate: driver_details.license_plate,
        current_trip: "",
        is_online: true,
        status: "available",
        last_updated: Date.now(),
        lat_lng: {
          lat: liveCoords[0],
          lng: liveCoords[1],
        },
      });
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, driver_details, user, liveCoords, isDriverLive]);

  const { send, showpop_up, trip_request_data } = useWebSocket();

  console.log(trip_request_data);

  function acceptTrip(tripId: string) {
    navigate("/on-route")
    send({
      type: "TRIP_ACCEPTED",
      trip_id: tripId,
    });
  }

  function rejectTrip(tripId: string) {
    send({
      type: "TRIP_REJECTED",
      trip_id: tripId,
    });
  }

  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="fixed bottom-5 right-5 flex flex-col gap-3 pointer-events-auto z-20">
        {/*<div  >Please turn on location</div>*/}
        <Button
          className="p-5"
          onClick={() => {
            if (!coords || !mapRef.current) return;
            const [lat, lng] = coords;

            mapRef.current.easeTo({
              center: [lng, lat],
              zoom: 15,
              duration: 800,
            });
          }}
        >
          <Navigation />
        </Button>
        <Link to={"/profile"}>
          <Button
            className="p-5"
            onClick={() => {
              if (!coords || !mapRef.current) return;
              const [lat, lng] = coords;

              mapRef.current.easeTo({
                center: [lng, lat],
                zoom: 15,
                duration: 800,
              });
            }}
          >
            <User />
          </Button>
        </Link>
      </div>

      {isDriverLive && (
        <div className="fixed top-6 inset-x-0 flex justify-center pointer-events-auto z-20">
          <button onClick={() => setIsOnline(false)} className="btn-donate">
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
                onClick={() => acceptTrip(trip_request_data.trip_id)}
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
