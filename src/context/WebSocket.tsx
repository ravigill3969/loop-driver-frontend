import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./userContext";

interface TripRequestDataI {
  driver_id: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_distance_km: number;
  estimated_duration_min: number;
  estimated_price: number;
  expires_at: number;
  pickup_lat: number;
  pickup_lng: number;
  rider_age: number;
  rider_gender: string;
  rider_id: string;
  rider_name: string;
}

export type WSContextType = {
  send: (data: unknown) => void;
  connected: boolean;
  trip_request_data: TripRequestDataI | null;
  showpop_up: boolean;
};

export const WebSocketContext = createContext<WSContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [trip_request_data, set_trip_request_data] =
    useState<TripRequestDataI | null>(null);

  const [showpop_up, set_showpop_up] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.user_id) return;

    const ws = new WebSocket(
      `ws://localhost:8080/ws?driver_id=${user.user_id}`,
    );

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("WS disconnected");
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error("WS error", err);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS message:", data);
      set_trip_request_data(event.data);
      set_showpop_up(true);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      set_showpop_up(false);
      set_trip_request_data(null);
    };
  }, [user?.user_id]);

  const send = (data: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      set_showpop_up(false);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{ send, connected, trip_request_data, showpop_up }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);

  if (!ctx) {
    throw new Error("useWebSocket must be used inside <WebSocketProvider>");
  }

  return ctx;
}
