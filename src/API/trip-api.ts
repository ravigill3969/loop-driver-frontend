import { backend_url } from "@/global/env";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  AcceptTripI,
  ActiveTrip,
  CancelTripByDriverI,
  DriverTripStatusResponse,
  DropOffTripStatusI,
  UpdateTripStatusI,
} from "./trip-api-types";

//fire on user accepting request
export function useAcceptTripRequest() {
  async function acceptTripRequest(data: AcceptTripI) {
    const response = await fetch(`${backend_url}/api/v1/trip/accept-trip`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-type": "application/json",
      },

      body: JSON.stringify(data),
    });

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || "Something went wrong");
    }

    return res;
  }

  const mutate = useMutation({
    mutationFn: acceptTripRequest,
    mutationKey: ["acceptTripRequest"],
  });

  return mutate;
}

export function useCheckDriverTripStatus() {
  async function checkDriverTripStatus(): Promise<DriverTripStatusResponse> {
    const response = await fetch(
      `${backend_url}/api/v1/trip/check-driver-trip-status`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || "Something went wrong");
    }

    return res;
  }

  const query = useQuery({
    queryFn: checkDriverTripStatus,
    queryKey: ["checkDriverTripStatus"],
    refetchOnWindowFocus: false,
  });

  return query;
}

export function useGetActiveTrip(tid: string) {
  const getActiveRideWithID = async (): Promise<ActiveTrip> => {
    const response = await fetch(
      `${backend_url}/api/v1/trip/get-active-ride/?tid=${tid}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || "Failed to fetch active trip");
    }

    return res;
  };
  const query = useQuery({
    queryKey: ["getActiveRideWithID", tid],
    queryFn: getActiveRideWithID,
    enabled: !!tid,
    refetchOnWindowFocus: false,
  });

  return query;
}

//rider pickedup
export function useUpdateTripStatus() {
  const updateTripStatus = async (data: UpdateTripStatusI) => {
    const response = await fetch(
      `${backend_url}/api/v1/trip/rider-pickedup-update`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || "Something went wrong try again");
    }

    return res;
  };

  const mutate = useMutation({
    mutationFn: updateTripStatus,
    mutationKey: ["updateTripStatus"],
  });
  return mutate;
}
export function useDropOffRider() {
  const updateTripStatus = async (data: DropOffTripStatusI) => {
    const response = await fetch(
      `${backend_url}/api/v1/trip/rider-dropoff-update`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || "Something went wrong try again");
    }

    return res;
  };

  const mutate = useMutation({
    mutationFn: updateTripStatus,
    mutationKey: ["updateTripStatus"],
  });
  return mutate;
}

export function useCancelTripByDriver() {
  const cancelTrip = async (data: CancelTripByDriverI) => {
    const response = await fetch(`${backend_url}/api/v1/trip/cancel-ride`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.message || "Something went wrong try again");
    }

    return res;
  };

  const mutate = useMutation({
    mutationFn: cancelTrip,
    mutationKey: ["cancelTripByDriver"],
  });
  return mutate;
}
