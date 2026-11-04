import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Login() {
  const { token, role, login } = useAuth();
  const navigate = useNavigate();
  const [as, setAs] = useState("customer"); // customer | professional
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to={role === "professional" ? "/pro/dashboard" : "/dashboard"} replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = as === "customer" ? "/auth/login" : "/professionals/login";
      const data = await api(path, {
        method: "POST",
        body: {
          identifier: form.identifier.trim(),
          phone: form.identifier.trim(),
          email: form.identifier.trim(),
          password: form.password,
        },
      });
      login(data);
      navigate(as === "customer" ? "/dashboard" : "/pro/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-brand-800">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Log in to your HomeCrew account with your mobile number or email.</p>

        <div className="mt-5 grid grid-cols-2 rounded-lg bg-brand-50 p-1 text-sm font-medium">
          {[["customer", "Customer"], ["professional", "Technician / Contractor"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAs(key)}
              className={`rounded-md px-2 py-2 ${as === key ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Alert>{error}</Alert>
          <FormInput
            label="Mobile number or Email"
            type="text"
            name="identifier"
            value={form.identifier}
            onChange={handleChange}
            placeholder="+91 98765 43210 or you@example.com"
            required
            autoFocus
          />
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            extra={
              <Link
                to={`/forgot-password?role=${as}${form.identifier ? `&phone=${encodeURIComponent(form.identifier)}` : ""}`}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Forgot password?
              </Link>
            }
          />
          <Button type="submit" loading={loading} className="w-full">Login</Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {as === "customer" ? (
            <>New here? <Link to="/register" className="font-medium text-brand-600 hover:underline">Create an account</Link></>
          ) : (
            <>Not registered? <Link to="/join" className="font-medium text-brand-600 hover:underline">Join as a professional</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
