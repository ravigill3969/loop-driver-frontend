import { useCallback, useEffect, useState } from "react";

export default function useGetUserLocation() {
  const [lat_lng, setLat_lng] = useState<[number, number] | null>(null);

  useEffect(() => {
    function success(e: GeolocationPosition) {
      const { latitude, longitude } = e.coords;
      setLat_lng([latitude, longitude]);
      console.log("SUCCESS:", latitude, longitude);
    }

    function error(e: GeolocationPositionError) {
      console.log("ERROR:", e);
    }

    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(success, error);
  }, []);

  return lat_lng;
}

type LatLng = [number, number];
export type LocationStatus =
  | "idle"
  | "locating"
  | "ready"
  | "blocked"
  | "unsupported";

const isGeolocationSupported =
  typeof navigator !== "undefined" && "geolocation" in navigator;

export function useGetUserLiveLocation() {
  const [latLng, setLatLng] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocationStatus>(
    isGeolocationSupported ? "locating" : "unsupported",
  );
  const [error, setError] = useState<string | null>(
    isGeolocationSupported ? null : "Geolocation not supported",
  );
  const [locationRequestVersion, setLocationRequestVersion] = useState(0);

  const requestLocationAccess = useCallback(() => {
    setStatus("locating");
    setError(null);
    setLocationRequestVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isGeolocationSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatLng([latitude, longitude]);
        setStatus("ready");
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("blocked");
          setError(
            "Location permission denied. Please allow access to continue.",
          );
          return;
        }

        setStatus("idle");
        setError(err.message || "Unable to fetch your location right now.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [locationRequestVersion]);

  return { latLng, error, status, requestLocationAccess };
}
