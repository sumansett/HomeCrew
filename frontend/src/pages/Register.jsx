import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.phone.trim()) {
      setError("Please enter your mobile number.");
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
          Request home services in minutes. Mobile number is required. Email is optional.
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
            autoFocus
          />

          <FormInput
            label="Mobile number"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            required
            extra={<span className="text-xs text-gray-400">Required for account login and service updates</span>}
          />

          <FormInput
            label="Email address (Optional)"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com (optional)"
            extra={<span className="text-xs text-gray-400">Optional — No verification required</span>}
          />

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
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Create Account
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
