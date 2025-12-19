import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, LineString } from "geojson";
import { Navigation } from "lucide-react";

import { useMap } from "@/context/MapContext";
import useGetUserLocation from "@/hooks/useGetUserLocation";
import { getRoute } from "@/utils/map";
import { mapbox_access_token } from "@/global/env";
import { Button } from "@/components/ui/button";
import { useGetLocationFromCoords } from "@/hooks/useGetLocationFromCoords";
import { formatAddress } from "@/utils/formatLocationName";
import { useWebSocket } from "@/context/WebSocket";

const ROUTE_SOURCE_ID = "driver-active-route";
const ROUTE_LAYER_ID = "driver-active-route-line";

const DEFAULT_ORIGIN: [number, number] = [43.653226, -79.383184]; // [lat, lng]
const DEFAULT_DESTINATION: [number, number] = [43.6418, -79.3871]; // [lat, lng]
// const DEFAULT_PICKUP: [number, number] = [43.71, -79.39]; // [lat, lng]

const toLngLat = ([lat, lng]: [number, number]): [number, number] => [lng, lat];

export default function OnRoute() {
  const coords = useGetUserLocation();
  const { mapRef, ensureMap } = useMap();

  const [origin, setOrigin] = useState<[number, number]>(DEFAULT_ORIGIN);
  const destination: [number, number] = DEFAULT_DESTINATION;

  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // const current_lodation = useGetLocationFromCoords(origin[0], origin[1]);
  const dropoffLocation = useGetLocationFromCoords(
    destination[0],
    destination[1],
  );
  const pickupLocation = useGetLocationFromCoords(origin[0], origin[1]);

  /* ---------------- Update origin ---------------- */
  useEffect(() => {
    if (coords) setOrigin(coords);
  }, [coords]);

  /* ---------------- Init map ---------------- */
  useEffect(() => {
    const map = ensureMap({
      center: toLngLat(origin),
      zoom: 14,
    });

    map.resize();
  }, [ensureMap, origin]);

  /* ---------------- Draw route ---------------- */
  useEffect(() => {
    let cancelled = false;

    async function drawRoute() {
      const map = ensureMap({
        center: toLngLat(origin),
        zoom: 14,
      });

      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();

      try {
        const { geojson } = await getRoute(
          origin,
          destination,
          mapbox_access_token,
        );

        if (cancelled) return;

        /* ---------- Source ---------- */
        const source = map.getSource(ROUTE_SOURCE_ID) as
          | mapboxgl.GeoJSONSource
          | undefined;

        if (source) {
          source.setData(geojson as Feature<LineString>);
        } else {
          map.addSource(ROUTE_SOURCE_ID, {
            type: "geojson",
            data: geojson,
          });
        }

        /* ---------- Layer ---------- */
        if (map.getLayer(ROUTE_LAYER_ID)) {
          map.removeLayer(ROUTE_LAYER_ID);
        }

        map.addLayer(
          {
            id: ROUTE_LAYER_ID,
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#ffffff",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          },
          "waterway-label",
        );

        /* ---------- Pickup marker ---------- */
        if (!pickupMarkerRef.current) {
          pickupMarkerRef.current = new mapboxgl.Marker({
            color: "#10b981",
          })
            .setLngLat(toLngLat(origin))
            .addTo(map);
        } else {
          pickupMarkerRef.current.setLngLat(toLngLat(origin));
        }

        /* ---------- Dropoff marker ---------- */
        if (!dropoffMarkerRef.current) {
          dropoffMarkerRef.current = new mapboxgl.Marker({
            color: "#f97316",
          })
            .setLngLat(toLngLat(destination))
            .addTo(map);
        } else {
          dropoffMarkerRef.current.setLngLat(toLngLat(destination));
        }

        /* ---------- Fit bounds ---------- */
        const bounds = new mapboxgl.LngLatBounds();
        (geojson.geometry as LineString).coordinates.forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });

        map.fitBounds(bounds, {
          padding: 60,
          duration: 800,
        });
      } catch (err) {
        console.error("Failed to draw route", err);
      }
    }

    drawRoute();

    return () => {
      cancelled = true;
      const map = mapRef.current;
      if (!map) return;

      if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
    };
  }, [destination, ensureMap, mapRef, origin]);

  /* ---------------- UI ---------------- */
  return (
    <div className=" min-h-screen">
      <div className="absolute top-5 left-5 right-5 max-w-xl bg-white/90 backdrop-blur shadow-lg rounded-xl p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Active trip</p>
            <h2 className="text-lg font-semibold">Route to destination</h2>
          </div>

          <Button
            variant="secondary"
            size="icon"
            onClick={() => {
              const map =
                mapRef.current ?? ensureMap({ center: toLngLat(origin) });

              map.easeTo({
                center: toLngLat(origin),
                zoom: 14,
                duration: 800,
              });
            }}
          >
            <Navigation />
          </Button>
        </div>

        <div className="flex justify-between text-sm mt-3">
          <div>
            <p className="font-semibold">Pickup</p>
            <p>
              {formatAddress({
                city: pickupLocation?.city,
                place_name: pickupLocation?.place_name,
                region: pickupLocation?.region,
                street: pickupLocation?.street,
              })}
            </p>
          </div>

          <div className="text-right">
            <p className="font-semibold">Dropoff</p>
            <p>
              {formatAddress({
                city: dropoffLocation?.city,
                place_name: dropoffLocation?.place_name,
                region: dropoffLocation?.region,
                street: dropoffLocation?.street,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
