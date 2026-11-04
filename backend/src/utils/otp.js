const crypto = require("crypto");

const secret = () => process.env.JWT_SECRET || "homecrew";

exports.generateOtp = () => String(crypto.randomInt(100000, 1000000));

exports.hashOtp = (code) =>
  crypto.createHmac("sha256", secret()).update(String(code)).digest("hex");

exports.sameHash = (a, b) => {
  const x = Buffer.from(a || "", "hex");
  const y = Buffer.from(b || "", "hex");
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

// Formats phone numbers consistently (adds +91 if 10 digits without country code)
exports.normalizePhone = (phone) => {
  if (!phone) return "";
  let clean = String(phone).trim().replace(/[\s-]/g, "");
  if (!clean.startsWith("+")) {
    const digits = clean.replace(/\D/g, "");
    if (digits.length === 10) return "+91" + digits;
    if (digits.length > 10 && digits.startsWith("91")) return "+" + digits;
    return digits ? "+" + digits : "";
  }
  return clean;
};

// Matches phone numbers whether searched with or without +91 / country code
exports.phoneQuery = (phone) => {
  if (!phone) return { $in: [] };
  const raw = String(phone).trim();
  const clean = raw.replace(/[\s-]/g, "");
  const normalized = exports.normalizePhone(raw);
  const digits = raw.replace(/\D/g, "").slice(-10);
  const withPlus91 = digits ? "+91" + digits : "";
  const withoutPlus = digits;
  const with91 = digits ? "91" + digits : "";
  const candidates = Array.from(new Set([raw, clean, normalized, withPlus91, withoutPlus, with91])).filter(Boolean);
  return { $in: candidates };
};
