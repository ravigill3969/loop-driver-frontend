import { mapbox_access_token } from "@/global/env";
import { useEffect, useState } from "react";

export type FullAddressT = {
  place_name: string;
  street?: string;
  city?: string;
  region?: string;
};

export function useGetLocationFromCoords(
  lat?: number,
  lng?: number,
): FullAddressT | null {
  const [location, setLocation] = useState<FullAddressT | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) return;

    let cancelled = false;

    async function reverseGeocode() {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
            `?types=address` +
            `&limit=1` +
            `&access_token=${mapbox_access_token}`,
        );

        const json = await res.json();
        const feature = json.features?.[0];

        if (!feature || cancelled) {
          if (!cancelled) {
            setLocation({ place_name: "Unknown location" });
          }
          return;
        }

        const context = feature.context || [];
        const get = (id: string) =>
          context.find((c: any) => c.id.startsWith(id))?.text;

        if (!cancelled) {
          setLocation({
            place_name: feature.place_name,
            street: feature.text,
            city: get("place"),
            region: get("region"),
          });
        }
      } catch (err) {
        console.log(err);
        if (!cancelled) {
          setLocation({ place_name: "Unknown location" });
        }
      }
    }

    reverseGeocode();

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return location;
}
