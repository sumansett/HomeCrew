// Formats an address object or string into a readable string
export function formatAddress(addr) {
  if (!addr) return "";
  if (typeof addr === "string") return addr;

  const parts = [
    addr.street,
    addr.postOffice ? `P.O. ${addr.postOffice}` : "",
    addr.district ? `Dist. ${addr.district}` : "",
    addr.state,
    addr.pinCode ? `PIN - ${addr.pinCode}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}
