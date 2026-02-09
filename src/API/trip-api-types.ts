export interface AcceptTripI {
  driver_id: string;
  trip_id: string;
}

export interface DriverTripStatusResponse {
  trip_id: string;
  status: boolean | TripStatus;
}

export type TripStatus =
  | "searching"
  | "accepted"
  | "on_route"
  | "completed"
  | "cancelled";

export interface ActiveTrip {
  trip_id: string;
  rider_id: string;
  driver_id: string;
  payment_id: string;

  pickup_location: string;
  dropoff_location: string;

  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;

  estimated_distance_km: number;
  estimated_duration_min: number;
  estimated_price: number;

  status: TripStatus;
}

//rider is picked up
export interface UpdateTripStatusI {
  driver_id: string;
  rider_id: string;
  trip_id: string;
}

export interface DropOffTripStatusI {
  driver_id: string;
  rider_id: string;
  trip_id: string;
}

export interface CancelTripByDriverI {
  driver_id: string;
  rider_id: string;
  trip_id: string;
  reason: string;
  is_rider_picked: boolean;
}
