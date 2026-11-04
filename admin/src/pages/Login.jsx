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
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-2xl text-white">🏠</div>
          <h1 className="mt-3 text-2xl font-bold text-brand-800">HomeCrew Admin</h1>
          <p className="text-sm text-gray-500">Sign in to manage the platform</p>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Admin email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@homecrew.com"
            required
            autoFocus
          />
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
