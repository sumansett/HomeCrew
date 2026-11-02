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

// Converts any address value into a standard structured object
export function parseAddress(addr) {
  if (!addr) {
    return { street: "", postOffice: "", district: "", state: "", pinCode: "" };
  }
  if (typeof addr === "object") {
    return {
      street: addr.street || "",
      postOffice: addr.postOffice || "",
      district: addr.district || "",
      state: addr.state || "",
      pinCode: addr.pinCode || "",
    };
  }
  return {
    street: String(addr),
    postOffice: "",
    district: "",
    state: "",
    pinCode: "",
  };
}
