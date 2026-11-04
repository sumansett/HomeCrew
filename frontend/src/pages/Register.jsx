import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";
import RegisterContactField from "../components/RegisterContactField";
import AddressInputs from "../components/AddressInputs";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: { street: "", postOffice: "", district: "", state: "", pinCode: "" },
    password: "",
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!phoneVerified) {
      setError("Please verify your mobile number using OTP before signing up.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const data = await api("/auth/register", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email ? form.email.trim().toLowerCase() : undefined,
          phone: form.phone.trim(),
          address: form.address,
          password: form.password,
        },
      });
      login(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-brand-800">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Request home services in minutes. Mobile verification is required. Email is optional.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Alert type="error">{error}</Alert>

          <FormInput
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

          {/* Mandatory Phone with inline SMS OTP verification */}
          <RegisterContactField
            label="Mobile number"
            field="phone"
            type="tel"
            value={form.phone}
            onChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
            placeholder="+91 98765 43210"
            apiBase="/auth"
            isVerified={phoneVerified}
            onVerifiedChange={setPhoneVerified}
            required
          />

          {/* Optional Email address - does not require OTP */}
          <FormInput
            label="Email address (Optional)"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com (optional)"
            extra={<span className="text-xs text-gray-400">Optional — No verification required</span>}
          />

          {/* Structured address fields: street, post office, district, state, pin code */}
          <AddressInputs
            value={form.address}
            onChange={(addr) => setForm((prev) => ({ ...prev, address: addr }))}
          />

          <FormInput
            label="Password (min 6 characters)"
            type="password"
            name="password"
            minLength={6}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <div className="pt-2">
            {!phoneVerified && (
              <p className="mb-2 text-center text-xs text-amber-700 font-medium">
                ⚠️ Verify your mobile number with OTP to register (email is optional)
              </p>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={!phoneVerified || loading}
              className="w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phoneVerified ? "Complete Registration" : "Verify Mobile Number to Register"}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
