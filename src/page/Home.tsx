import { useState } from "react";
import Live from "./Live";
import { Button } from "@/components/ui/button";

function Home() {
  const [isOnline, setIsOnline] = useState(false);

  const handleGoOnline = () => {
    setIsOnline(true);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Main Content - Map Always Visible */}
      <Live isDriverLive={isOnline} setIsOnline={setIsOnline} />

      {/* Offline Bottom Popup */}
      {!isOnline && (
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
