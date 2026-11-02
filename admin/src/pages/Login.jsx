import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Login() {
  const { token, login } = useAdminAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // "login" | "forgot" | "reset"
  const [form, setForm] = useState({ email: "", password: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);
    try {
      const data = await api("/admin/login", { method: "POST", body: form });
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!resetEmail.trim()) {
      setError("Please enter your admin email");
      return;
    }
    setLoading(true);
    try {
      const res = await api("/admin/forgot-password", {
        method: "POST",
        body: { email: resetEmail.trim().toLowerCase() },
      });
      setMsg(res.message || "A verification code has been sent.");
      setView("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
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
      const res = await api("/admin/reset-password", {
        method: "POST",
        body: {
          email: resetEmail.trim().toLowerCase(),
          code: resetCode.trim(),
          newPassword,
        },
      });
      setForm((prev) => ({ ...prev, email: resetEmail, password: "" }));
      setView("login");
      setMsg(res.message || "Password reset successful! Please log in with your new password.");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-2xl text-white">🏠</div>
          <h1 className="mt-3 text-2xl font-bold text-brand-800">HomeCrew Admin</h1>
          <p className="text-sm text-gray-500">
            {view === "login" && "Sign in to manage the platform"}
            {view === "forgot" && "Reset your admin credentials"}
            {view === "reset" && "Verify OTP & set new password"}
          </p>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}
        {msg && <Alert type="success" className="mb-4">{msg}</Alert>}

        {view === "login" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Admin email" type="email" name="email" value={form.email} onChange={handleChange} required />
            <FormInput
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              extra={
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(form.email);
                    setError("");
                    setMsg("");
                    setView("forgot");
                  }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </button>
              }
            />
            <Button type="submit" loading={loading} className="w-full">Login</Button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <FormInput
              label="Admin email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="admin@homecrew.com"
              required
              autoFocus
            />
            <Button type="submit" loading={loading} className="w-full">Send verification code</Button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMsg("");
                  setView("login");
                }}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">6-Digit verification code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-lg font-mono tracking-[0.3em] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <FormInput
              label="New password"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />

            <FormInput
              label="Confirm new password"
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />

            <Button type="submit" loading={loading} className="w-full">Update Password</Button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="font-medium text-brand-600 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMsg("");
                  setView("forgot");
                }}
                className="font-medium text-gray-500 hover:underline"
              >
                Change email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
