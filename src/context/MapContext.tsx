// src/context/MapContext.tsx
import { createContext, useCallback, useContext, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { mapbox_access_token } from "@/global/env";

type MapContextType = {
  mapRef: MutableRefObject<mapboxgl.Map | null>;
  ensureMap: (options?: {
    containerId?: string;
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    style?: string;
  }) => mapboxgl.Map;
};

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const ensureMap = useCallback(
    (options?: {
      containerId?: string;
      center?: [number, number];
      zoom?: number;
      style?: string;
    }) => {
      if (mapRef.current) {
        return mapRef.current;
      }

      const containerId = options?.containerId ?? "map";
      const container = document.getElementById(containerId);

      if (!container) {
        throw new Error(`Map container #${containerId} not found`);
      }

      mapboxgl.accessToken = mapbox_access_token;

      mapRef.current = new mapboxgl.Map({
        container,
        style: options?.style ?? "mapbox://styles/mapbox/dark-v11",
        center: options?.center ?? [-79.383184, 43.653226], // default Toronto
        zoom: options?.zoom ?? 13,
      });

      mapRef.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true })
      );

      return mapRef.current;
    },
    []
  );

  return (
    <MapContext.Provider value={{ mapRef, ensureMap }}>
      {children}
    </MapContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMap must be used inside MapProvider");
  }
  return ctx;
}
