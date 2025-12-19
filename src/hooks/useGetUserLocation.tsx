import { useState, useEffect } from "react";

export default function useGetUserLocation() {
  const [lat_lng, setLat_lng] = useState<[number, number] | null>(null);

  useEffect(() => {
    console.log("firing getting location")
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
