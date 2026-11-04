import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function RegisterContactField({
  label,
  field, // "email" | "phone"
  value,
  onChange,
  placeholder,
  type = "text",
  apiBase = "/auth", // "/auth" | "/professionals"
  isVerified,
  onVerifiedChange,
  required = true,
  className = "",
}) {
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  // 30s resend timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const cleanVal = (val) => String(val || "").trim();

  // Send OTP handler
  const handleSendOtp = async () => {
    setError("");
    setSuccessMsg("");
    const target = cleanVal(value);
    if (!target) {
      setError(`Please enter your ${field === "email" ? "email address" : "phone number"}`);
      return;
    }

    setSending(true);
    try {
      const res = await api(`${apiBase}/send-register-otp`, {
        method: "POST",
        body: { field, value: target },
      });
      setOtpSent(true);
      setCode("");
      setCountdown(30);
      setSuccessMsg(res.message || "Verification code sent!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setVerifying(true);
    try {
      const res = await api(`${apiBase}/verify-register-otp`, {
        method: "POST",
        body: { field, value: cleanVal(value), code: cleanCode },
      });
      onVerifiedChange(true);
      setOtpSent(false);
      setCode("");
      setSuccessMsg(res.message || "Verified successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    onVerifiedChange(false);
    setOtpSent(false);
    setCode("");
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isVerified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            ✓ Verified
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type={type}
          value={value}
          disabled={isVerified}
          onChange={(e) => {
            onChange(e.target.value);
            if (isVerified) onVerifiedChange(false);
          }}
          placeholder={placeholder}
          required={required}
          className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-600 disabled:border-emerald-200"
        />

        {isVerified ? (
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition"
          >
            Change
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sending || countdown > 0 || !cleanVal(value)}
            className="shrink-0 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
          >
            {sending ? "Sending..." : countdown > 0 ? `Resend (${countdown}s)` : otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        )}
      </div>

      {/* Inline OTP input card */}
      {otpSent && !isVerified && (
        <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-xs animate-in fade-in">
          <p className="font-medium text-gray-700 mb-1.5">
            Enter the 6-digit verification code sent via SMS to your mobile number:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              autoFocus
              className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-center font-mono text-base tracking-[0.25em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              disabled={code.length !== 6 || verifying}
              onClick={handleVerifyOtp}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {verifying ? "Checking..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="px-2 py-1.5 text-gray-500 hover:text-gray-700 hover:underline"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-red-600 font-medium">{error}</p>}
          {successMsg && <p className="mt-2 text-emerald-700 font-medium">{successMsg}</p>}
        </div>
      )}

      {/* Standalone error/success when card is not open */}
      {!otpSent && error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {!otpSent && successMsg && <p className="text-xs text-emerald-600 font-medium">{successMsg}</p>}
    </div>
  );
}
