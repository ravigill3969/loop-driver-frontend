//Get driver details
export interface DriverDetails {
  id: string;
  license_number: string;
  license_plate: string;
  phone_number: string;
  vehicle_color: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_type: string;
}

export interface UserDetails {
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  profile_picture_url: string;
}

export interface DriverResponse {
  success: boolean;
  status: number;
  message: string;

  details: DriverDetails;
  user: UserDetails;
}

//Update location
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UpdateUserLocationRedisRequest {
  driver_id: string;
  name: string;
  car_make: string;
  car_model: string;
  car_color: string;
  car_plate: string;

  lat_lng: Coordinates;
  last_updated: number;
  status: "available" | "busy";
  is_online: boolean;
  current_trip: string;
  current_rider: string;
}

export interface GetDriverStatusFroRedisError {
  message: string;
  error: string;
}

export type DriverRedisStatus = "online" | "offline";

export interface GoingOfflineResponseError{
  message: string;
  error: string;
}

export interface GoingOfflineResponse {
  success: boolean;
}

export type RegisterStateT = {
  driver_details: {
    phone_number: string;
    license_number: string;
    vehicle_type: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_color: string;
    license_plate: string;
  };
  user_details: {
    email: string;
    password: string;
    full_name: string;
    phone_number: string;
  };
};