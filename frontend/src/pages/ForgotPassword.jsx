import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get("role") === "professional" ? "professional" : "customer";
  const initialPhone = searchParams.get("phone") || searchParams.get("email") || "";

  const [as, setAs] = useState(initialRole);
  const [phone, setPhone] = useState(initialPhone);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultMsg, setResultMsg] = useState("");

  const getBasePath = (role) => (role === "customer" ? "/auth" : "/professionals");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResultMsg("");

    if (!phone.trim()) {
      setError("Please enter your registered mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await api(`${getBasePath(as)}/forgot-password`, {
        method: "POST",
        body: {
          phone: phone.trim(),
          reason: reason.trim(),
        },
      });

      setResultMsg(res.message || "Your password reset request has been submitted to an administrator.");
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl text-brand-600">
            🔑
          </div>
          <h1 className="mt-3 text-2xl font-bold text-brand-800">Password Assistance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administrator-assisted password recovery for your account
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-left text-sm text-green-900">
              <div className="flex items-center gap-2 font-semibold text-green-800">
                <span className="text-lg">✓</span> Request Submitted Successfully
              </div>
              <p className="mt-2 text-xs leading-relaxed text-green-800">
                {resultMsg}
              </p>
              <div className="mt-3 rounded-lg bg-white/70 p-3 text-xs text-gray-700">
                <p><span className="font-semibold">Account Role:</span> {as === "customer" ? "Customer" : "Technician"}</p>
                <p className="mt-1"><span className="font-semibold">Mobile Number:</span> {phone}</p>
                <p className="mt-1 text-gray-500">For security, an authorized administrator will verify your account and provide a temporary password. You can then log in and update your password.</p>
              </div>
            </div>

            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition"
            >
              Back to Login
            </Link>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setError("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <>
            {/* Role selector */}
            <div className="mb-5 grid grid-cols-2 rounded-xl bg-brand-50 p-1 text-sm font-medium">
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
                  }}
                  className={`rounded-lg px-2 py-2 transition ${
                    as === key ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Alert type="error">{error}</Alert>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                <span className="font-semibold">Administrator-Assisted Reset:</span> Submit your registered mobile number below. An administrator will review your account and set a temporary password without requiring SMS or email verification.
              </div>

              <FormInput
                label="Registered mobile number"
                type="tel"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                autoFocus
              />

              <FormInput
                label="Note / reason (optional)"
                as="textarea"
                rows="2"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Forgot my password, cannot access my account..."
              />

              <Button type="submit" loading={loading} className="w-full">
                Submit Password Reset Request
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Remember your password?{" "}
              <Link to="/login" className="font-medium text-brand-600 hover:underline">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
