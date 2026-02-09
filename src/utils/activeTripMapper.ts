import type { ActiveTrip } from "@/API/trip-api-types";
import type { TripRequestDataI } from "@/context/WebSocket";

export function mapActiveTripToTripRequestData(
  activeTrip: ActiveTrip,
): TripRequestDataI {
  return {
    type: "TRIP_REQUEST",
    driver_id: activeTrip.driver_id,
    dropoff_lat: activeTrip.dropoff_lat,
    dropoff_lng: activeTrip.dropoff_lng,
    estimated_distance_km: activeTrip.estimated_distance_km,
    estimated_duration_min: activeTrip.estimated_duration_min,
    estimated_price: activeTrip.estimated_price,
    expires_at: Date.now() + 15 * 60 * 1000,
    pickup_lat: activeTrip.pickup_lat,
    pickup_lng: activeTrip.pickup_lng,
    rider_age: 0,
    rider_gender: "",
    rider_id: activeTrip.rider_id,
    rider_name: "",
    pickup_location: activeTrip.pickup_location,
    dropoff_location: activeTrip.dropoff_location,
    trip_id: activeTrip.trip_id,
  };
}
