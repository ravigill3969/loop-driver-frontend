import { useAuth } from "@/context/userContext";

function MapShell() {
  return <div id="map" className="fixed inset-0 w-screen h-screen" />;
}


function AuthedMapShell() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;
  return <MapShell />;
}


export default AuthedMapShell;
