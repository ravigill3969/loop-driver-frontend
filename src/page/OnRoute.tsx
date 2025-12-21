import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Feature, LineString } from "geojson";
import { Navigation } from "lucide-react";
import { useNavigate } from "react-router";

import { useMap } from "@/context/MapContext";
import { useWebSocket } from "@/context/WebSocket";
import { getRoute } from "@/utils/map";
import { mapbox_access_token } from "@/global/env";
import { Button } from "@/components/ui/button";
import { useGetLocationFromCoords } from "@/hooks/useGetLocationFromCoords";
import { formatAddress } from "@/utils/formatLocationName";
import { useAuth } from "@/context/userContext";

const ROUTE_SOURCE_ID = "driver-active-route";
const ROUTE_LAYER_ID = "driver-active-route-line";

const toLngLat = ([lat, lng]: [number, number]): [number, number] => [lng, lat];

export default function OnRoute() {
  const navigate = useNavigate();
  const { connected, trip_request_data, send } = useWebSocket();
  const { mapRef, ensureMap } = useMap();

  /* ---------------- Guard ---------------- */
  useEffect(() => {
    if (connected && !trip_request_data) {
      navigate("/");
    }
  }, [connected, navigate]);

  if (!connected || !trip_request_data) {
    return (
      <div className="h-screen flex items-center justify-center">Loading…</div>
    );
  }

  /* ---------------- Coordinates ---------------- */
  const origin: [number, number] = [
    trip_request_data.pickup_lat,
    trip_request_data.pickup_lng,
  ];

  const destination: [number, number] = [
    trip_request_data.dropoff_lat,
    trip_request_data.dropoff_lng,
  ];

  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const pickupLocation = useGetLocationFromCoords(origin[0], origin[1]);
  const dropoffLocation = useGetLocationFromCoords(
    destination[0],
    destination[1],
  );

  const { user: driver_profile, driver_details } = useAuth();
  // const { send, trip_request_data } = useWebSocket();

  useEffect(() => {
    function updateLiveLocation() {
      send({
        type: "DRIVER_LOCATION_UPDATE",
        trip_id: trip_request_data?.trip_id,
        rider_id: trip_request_data?.rider_id,
        driver_id: trip_request_data?.driver_id,
        driver_name: driver_profile?.full_name,
        driver_car_number: driver_details?.license_plate,
        driver_car_color: driver_details?.vehicle_color,
        driver_profile_pic: driver_profile?.profile_picture_url,
        driver_phone_number: driver_profile?.phone_number,
      });
    }

    setInterval(() => {
      updateLiveLocation();
    }, 10000);
  });

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

        if (!map.getLayer(ROUTE_LAYER_ID)) {
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
        }

        if (!pickupMarkerRef.current) {
          pickupMarkerRef.current = new mapboxgl.Marker({ color: "#10b981" })
            .setLngLat(toLngLat(origin))
            .addTo(map);
        } else {
          pickupMarkerRef.current.setLngLat(toLngLat(origin));
        }

        if (!dropoffMarkerRef.current) {
          dropoffMarkerRef.current = new mapboxgl.Marker({ color: "#f97316" })
            .setLngLat(toLngLat(destination))
            .addTo(map);
        } else {
          dropoffMarkerRef.current.setLngLat(toLngLat(destination));
        }

        const bounds = new mapboxgl.LngLatBounds();
        (geojson.geometry as LineString).coordinates.forEach((c) =>
          bounds.extend(c as [number, number]),
        );

        map.fitBounds(bounds, { padding: 60, duration: 800 });
      } catch (err) {
        console.error("Route draw failed", err);
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
  }, [ensureMap, mapRef, origin, destination]);

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen">
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
              const map = mapRef.current;
              if (!map) return;

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
