// contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { useGetDriverInfo } from "@/API/auth-api";
import { backend_url } from "@/global/env";
import type { DriverDetails, UserDetails } from "@/API/auth-api-types";

interface AuthContextType {
  user: UserDetails | null;
  driver_details: DriverDetails | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => Promise<unknown>;
  updateUser: (userData: Partial<UserDetails>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [driver_details, set_driver_details] = useState<DriverDetails | null>(
    null
  );
  const navigate = useNavigate();

  // Fetch user info
  const { data, isLoading, refetch, isError, isFetching } = useGetDriverInfo();

  const currentUser = data?.user ?? user;
  const current_driver_details = data?.details ?? driver_details;

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
      set_driver_details(data.details);
    }
  }, [data]);

  useEffect(() => {
    if (isError && !isLoading) {
      setUser(null);
      set_driver_details(null);
      navigate("/login");
    }
  }, [isError, isLoading, navigate]);

  const updateUser = (userData: Partial<UserDetails>) => {
    setUser((prev) =>
      prev ? { ...prev, ...userData } : (userData as UserDetails)
    );
    set_driver_details((prev) =>
      prev ? { ...prev, ...driver_details } : (driver_details as DriverDetails)
    );
  };

  const logout = async () => {
    try {
      await fetch(`${backend_url}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isLoading: isLoading || isFetching,
        isAuthenticated: !!currentUser,
        refetchUser: refetch,
        updateUser,
        logout,
        driver_details: current_driver_details,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
