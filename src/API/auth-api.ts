import { backend_url } from "@/global/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DriverResponse,
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
    data: UpdateUserLocationRedisRequest
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
      }
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
