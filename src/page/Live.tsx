import mapboxgl from "mapbox-gl";

import { useEffect, useRef, useState } from "react";
import useGetUserLocation from "../hooks/useGetUserLocation";
import { Button } from "@/components/ui/button";
import { Navigation, User } from "lucide-react";
import { Link } from "react-router";
import { useUpdateUserLocationRedis } from "@/API/auth-api";
import { useAuth } from "@/context/userContext";
import { useMap } from "@/context/MapContext";

type LiveProps = {
  isDriverLive: boolean;
  setIsOnline: (isDriverOnline: boolean) => void;
};

function Live({ isDriverLive, setIsOnline }: LiveProps) {
  // const ws = useContext(WebSocketContext)

  const { driver_details, user } = useAuth();
  // const [location_alert, set_location_alert] = useState(false)
  const [liveCoords, setLiveCoords] = useState<[number, number] | null>(null);

  const coords  = useGetUserLocation(); // initial [lat, lng]

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
    </div>
  );
}

export default Live;
