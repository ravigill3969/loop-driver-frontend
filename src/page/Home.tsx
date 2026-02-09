import { useEffect, useState } from "react";
import { useGetDriverStatusFromRedis } from "@/API/auth-api";
import { useCheckDriverTripStatus, useGetActiveTrip } from "@/API/trip-api";
import Live from "./Live";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/context/WebSocket";
import { useNavigate } from "react-router";
import { mapActiveTripToTripRequestData } from "@/utils/activeTripMapper";

function Home() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const { setTripRequestData } = useWebSocket();
  const { data: driverStatus, isLoading } = useGetDriverStatusFromRedis();
  const { data: driverTripStatus, isLoading: isTripStatusLoading } =
    useCheckDriverTripStatus();
  const hasActiveTrip =
    driverTripStatus?.status === true ||
    driverTripStatus?.status === "accepted" ||
    driverTripStatus?.status === "on_route";
  const tripId = hasActiveTrip ? driverTripStatus.trip_id : "";
  const { data: activeTrip, isLoading: isActiveTripLoading } =
    useGetActiveTrip(tripId);

  useEffect(() => {
    if (driverStatus === "online") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOnline(true);
      return;
    }

    if (driverStatus === "offline") {
      setIsOnline(false);
    }
  }, [driverStatus]);

  useEffect(() => {
    if (isTripStatusLoading || isActiveTripLoading) return;
    if (!hasActiveTrip || !activeTrip) return;

    setIsOnline(true);
    setTripRequestData(mapActiveTripToTripRequestData(activeTrip));
    navigate("/on-route", { replace: true });
  }, [
    activeTrip,
    hasActiveTrip,
    isActiveTripLoading,
    isTripStatusLoading,
    navigate,
    setTripRequestData,
  ]);

  const handleGoOnline = () => {
    setIsOnline(true);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Main Content - Map Always Visible */}
      <Live isDriverLive={isOnline} setIsOnline={setIsOnline} />

      {/* Offline Bottom Popup */}
      {!isOnline && !isLoading && !isTripStatusLoading && !isActiveTripLoading && (
        <div className="fixed top-5 left-0 right-0 z-50 pointer-events-none flex justify-center pb-6">
          <div className="bg-white shadow-lg rounded-lg max-w-sm w-full mx-4 pointer-events-auto">
            <div className="p-4 space-y-3">
              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold">You're Offline</h3>
                <p className="text-sm text-gray-600">
                  Go online to start accepting rides
                </p>
              </div>
              <Button
                onClick={handleGoOnline}
                className="w-full"
                variant="default"
              >
                Go Online
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
