import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialRole = searchParams.get("role") === "professional" ? "professional" : "customer";
  const initialEmail = searchParams.get("email") || "";

  const [as, setAs] = useState(initialRole);
  const [step, setStep] = useState("request"); // "request" | "verify" | "success"
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const getBasePath = (role) => (role === "customer" ? "/auth" : "/professionals");

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const res = await api(`${getBasePath(as)}/forgot-password`, {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      setInfo(res.message || "A 6-digit verification code has been sent.");
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    setError("");
    setInfo("");
    setResending(true);
    try {
      const res = await api(`${getBasePath(as)}/forgot-password`, {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      setInfo(res.message || "A new verification code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api(`${getBasePath(as)}/reset-password`, {
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        },
      });
      setStep("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        {step === "request" && (
          <>
            <h1 className="text-2xl font-bold text-brand-800">Forgot password</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter your registered email address and we'll send you a 6-digit code to reset your password.
            </p>

            <div className="mt-5 grid grid-cols-2 rounded-lg bg-brand-50 p-1 text-sm font-medium">
              {[
                ["customer", "Customer"],
                ["professional", "Technician / Contractor"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setAs(key);
                    setError("");
                    setInfo("");
                  }}
                  className={`rounded-md px-2 py-2 transition ${
                    as === key ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
              <Alert type="error">{error}</Alert>
              <Alert type="success">{info}</Alert>

              <FormInput
                label="Registered email address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />

              <Button type="submit" loading={loading} className="w-full">
                Send verification code
              </Button>
            </form>
          </>
        )}

        {step === "verify" && (
          <>
            <h1 className="text-2xl font-bold text-brand-800">Reset password</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter the 6-digit verification code sent to <span className="font-semibold text-gray-700">{email}</span> and choose a new password.
            </p>


            <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
              <Alert type="error">{error}</Alert>
              <Alert type="success">{info}</Alert>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">6-Digit verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-lg font-mono tracking-[0.3em] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <FormInput
                label="New password"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />

              <FormInput
                label="Confirm new password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                minLength={6}
                required
              />

              <Button type="submit" loading={loading} className="w-full">
                Reset password
              </Button>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="font-medium text-brand-600 hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setCode("");
                    setError("");
                    setInfo("");
                  }}
                  className="font-medium text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Change email
                </button>
              </div>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-brand-800">Password reset complete</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been reset successfully. You can now log in to your account with your new credentials.
            </p>
            <div className="mt-6">
              <Button type="button" onClick={() => navigate("/login")} className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
