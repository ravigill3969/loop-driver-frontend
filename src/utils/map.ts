import type { Feature, LineString } from "geojson";

export type MapRoute = {
  route: LineString;
  geojson: Feature<LineString>;
};

export async function getRoute(
  start: [number, number], // [lat, lng]
  end: [number, number], // [lat, lng]
  mapbox_accessToken: string,
): Promise<MapRoute> {
  const query = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${start[1]},${start[0]};${end[1]},${end[0]}` +
      `?steps=true` +
      `&geometries=geojson` +
      `&overview=full` + // 👈 CRITICAL
      `&annotations=distance` +
      `&access_token=${mapbox_accessToken}`,
  );

  const json = await query.json();
  const data = json.routes?.[0];
  if (!data) throw new Error("No route found");

  return {
    route: data.geometry as LineString,
    geojson: {
      type: "Feature",
      properties: {},
      geometry: data.geometry as LineString,
    } as Feature<LineString>,
  };
}
