import type { Feature, LineString } from "geojson";
import type { MutableRefObject } from "react";
import mapboxgl from "mapbox-gl";

import { mapbox_access_token } from "@/global/env";
import { getRoute } from "@/utils/map";

export const ROUTE_SOURCE_ID = "driver-active-route";
export const ROUTE_LAYER_ID = "driver-active-route-line";

export const toLngLat = ([lat, lng]: [number, number]): [number, number] => [
  lng,
  lat,
];

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

type DrawRouteParams = {
  map: mapboxgl.Map;
  origin: [number, number];
  destination: [number, number];
  pickupMarkerRef: MutableRefObject<mapboxgl.Marker | null>;
  dropoffMarkerRef: MutableRefObject<mapboxgl.Marker | null>;
  routeSourceId?: string;
  routeLayerId?: string;
  shouldCancel?: () => boolean;
};

function waitForStyle(map: mapboxgl.Map) {
  if (map.isStyleLoaded()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    map.once("load", () => resolve());
  });
}

export async function drawRouteOnMap({
  map,
  origin,
  destination,
  pickupMarkerRef,
  dropoffMarkerRef,
  routeSourceId = ROUTE_SOURCE_ID,
  routeLayerId = ROUTE_LAYER_ID,
  shouldCancel,
}: DrawRouteParams) {
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();

  await waitForStyle(map);
  if (shouldCancel?.()) return;

  try {
    const { geojson } = await getRoute(origin, destination, mapbox_access_token);
    if (shouldCancel?.()) return;

    const source = map.getSource(routeSourceId) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (source) {
      source.setData(geojson as Feature<LineString>);
    } else {
      map.addSource(routeSourceId, {
        type: "geojson",
        data: geojson,
      });
    }

    if (!map.getLayer(routeLayerId)) {
      const beforeLayer = map.getLayer("waterway-label")
        ? "waterway-label"
        : undefined;

      map.addLayer(
        {
          id: routeLayerId,
          type: "line",
          source: routeSourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": 5,
            "line-opacity": 0.95,
          },
        },
        beforeLayer,
      );
    }

    // Remove origin marker so nothing appears on top of the car.
    pickupMarkerRef.current?.remove();
    pickupMarkerRef.current = null;

    // Keep destination marker, but hide it when it overlaps current car position.
    if (getDistanceMeters(origin, destination) < 20) {
      dropoffMarkerRef.current?.remove();
      dropoffMarkerRef.current = null;
    } else if (!dropoffMarkerRef.current) {
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

    map.fitBounds(bounds, { padding: 70, duration: 800 });
  } catch (err) {
    console.error("Route draw failed", err);
  }
}

export function clearRouteFromMap({
  map,
  pickupMarkerRef,
  dropoffMarkerRef,
  routeSourceId = ROUTE_SOURCE_ID,
  routeLayerId = ROUTE_LAYER_ID,
}: {
  map: mapboxgl.Map;
  pickupMarkerRef: MutableRefObject<mapboxgl.Marker | null>;
  dropoffMarkerRef: MutableRefObject<mapboxgl.Marker | null>;
  routeSourceId?: string;
  routeLayerId?: string;
}) {
  if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
  if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);

  pickupMarkerRef.current?.remove();
  dropoffMarkerRef.current?.remove();
  pickupMarkerRef.current = null;
  dropoffMarkerRef.current = null;
}
