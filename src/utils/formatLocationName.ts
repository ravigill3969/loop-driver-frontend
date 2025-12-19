export function formatAddress(addr?: {
  place_name?: string;
  street?: string;
  city?: string;
  region?: string;
}) {
  if (!addr) return "Loading address...";

  if (addr.street && addr.city && addr.region) {
    return `${addr.street}, ${addr.city}, ${addr.region}`;
  }

  return addr.place_name ?? "Unknown location";
}
