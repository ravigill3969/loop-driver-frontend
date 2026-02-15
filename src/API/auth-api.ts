import { backend_url } from "../global/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DriverRedisStatus,
  DriverResponse,
  GetDriverStatusFroRedisError,
  GoingOfflineResponse,
  GoingOfflineResponseError,
  UpdateUserLocationRedisRequest,
} from "./auth-api-types";

export function useLogin() {
  const queryClient = useQueryClient();
  const login = async (data: { email: string; password: string }) => {
    console.log(backend_url);
    const res = await fetch(`${backend_url}/api/v1/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const response = await res.json();

    if (!res.ok) {
      console.log(response);
      throw new Error("Login error");
    }

    return response;
  };
  const mutation = useMutation({
    mutationKey: ["login"],
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getDriverInfo"] });
      //   navigate("/");
    },
    onError: (err) => {
      console.log("ERROR FIRED", err);
    },
  });

  return mutation;
}

export function useGetDriverInfo() {
  const getDriverInfo = async (): Promise<DriverResponse> => {
    console.log(backend_url);
    const res = await fetch(`${backend_url}/api/v1/auth/driver-details`, {
      credentials: "include",
    });

    const response = await res.json();

    console.log(response);
    if (!res.ok) {
      console.log(response);
      throw new Error("Login error");
    }

    return response;
  };
  const mutation = useQuery({
    queryKey: ["getDriverInfo"],
    queryFn: getDriverInfo,
  });

  return mutation;
}
  
export function useUpdateUserLocationRedis() {
  const updateUserLocationRedis = async (
    data: UpdateUserLocationRedisRequest,
  ): Promise<void> => {
    const res = await fetch(
      `${backend_url}/api/v1/update-redis/driver-location-details`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    const response = await res.json();

    if (!res.ok) {
      throw new Error("Internal server error");
    }

    return response;
  };

  const mutation = useMutation({
    mutationFn: updateUserLocationRedis,
    mutationKey: ["updateUserLocationRedis"],
  });

  return mutation;
}

export function useGetDriverStatusFromRedis() {
  const getDriverStatusFromRedis = async (): Promise<DriverRedisStatus> => {
    const response = await fetch(`${backend_url}/api/v1/redis-driver-status`, {
      method: "GET",
      credentials: "include",
    });

    const res = await response.json();

    if (!response.ok) {
      const err: GetDriverStatusFroRedisError = {
        error: res.error,
        message: res.message,
      };
      throw new Error(err.message || "Internal server error");
    }

    return res === "online" ? "online" : "offline";
  };

  const query = useQuery({
    queryKey: ["getDriverStatusFromRedis"],
    queryFn: getDriverStatusFromRedis,
    refetchOnWindowFocus: false,
  });

  return query;
}

export function useGoingOffline() {
  const goingOffline = async (): Promise<GoingOfflineResponse> => {
    const response = await fetch(`${backend_url}/api/v1/redis-driver-offline`, {
      method: "POST",
      credentials: "include",
    });

    const res = await response.json();

    if (!response.ok) {
      const err: GoingOfflineResponseError = {
        error: res.error,
        message: res.message,
      };
      throw new Error(err.message || "Internal server error");
    }

    return res;
  };

  const mutation = useMutation({
    mutationKey: ["goingOffline"],
    mutationFn: goingOffline,
  });

  return mutation;
}
