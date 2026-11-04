import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";
import AddressInputs from "../components/AddressInputs";

export default function ProfessionalRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { data } = useFetch("/services");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: { street: "", postOffice: "", district: "", state: "", pinCode: "" },
    type: "technician",
    service: "",
    experience: "",
    about: "",
  });
  const [files, setFiles] = useState({ idDocument: null, certificate: null });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

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
    if (!form.service) {
      setError("Please select a service category.");
      return;
    }
    if (!files.idDocument || !files.certificate) {
      setError("Please upload both your ID document and experience certificate.");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "email") {
          if (v && v.trim()) body.append(k, v.trim().toLowerCase());
        } else if (k === "phone") {
          body.append(k, v.trim());
        } else if (k === "address") {
          body.append(k, JSON.stringify(v));
        } else if (v !== undefined && v !== null) {
          body.append(k, v);
        }
      });
      body.append("idDocument", files.idDocument);
      body.append("certificate", files.certificate);

      const res = await api("/professionals/register", { method: "POST", body, isForm: true });
      login(res);
      navigate("/pro/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-brand-800">Join HomeCrew as a professional</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit your details and documents. Mobile number is required. Email is optional. No OTP verification required.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Alert type="error">{error}</Alert>
          </div>

          <FormInput
            className="sm:col-span-2"
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
            extra={<span className="text-xs text-gray-400">Required for login & job alerts</span>}
          />

          <FormInput
            label="Email address (Optional)"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com (optional)"
            extra={<span className="text-xs text-gray-400">Optional — No verification required</span>}
          />

          <FormInput
            className="sm:col-span-2"
            label="Password (min 6 characters)"
            type="password"
            name="password"
            minLength={6}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <FormInput label="I am a" as="select" name="type" value={form.type} onChange={handleChange}>
            <option value="technician">Technician</option>
            <option value="contractor">Contractor</option>
          </FormInput>

          <FormInput
            label="Service category"
            as="select"
            name="service"
            value={form.service}
            onChange={handleChange}
            required
          >
            <option value="">Select a service</option>
            {(data?.services || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </FormInput>

          <FormInput
            label="Experience (years)"
            type="number"
            min="0"
            name="experience"
            value={form.experience}
            onChange={handleChange}
            placeholder="e.g. 5"
          />

          <AddressInputs
            className="sm:col-span-2"
            value={form.address}
            onChange={(addr) => setForm((prev) => ({ ...prev, address: addr }))}
          />

          <FormInput
            className="sm:col-span-2"
            label="About your work"
            as="textarea"
            rows="3"
            name="about"
            value={form.about}
            onChange={handleChange}
            placeholder="Describe your skills and services..."
          />

          <label className="block text-sm font-medium text-gray-700">
            ID document (JPG/PNG/PDF) <span className="text-red-500">*</span>
            <input
              type="file"
              name="idDocument"
              accept="image/*,.pdf"
              onChange={handleFile}
              required
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-brand-700"
            />
            {files.idDocument && (
              <span className="mt-1 block text-xs text-brand-700 font-medium">✓ Selected: {files.idDocument.name}</span>
            )}
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Experience certificate (JPG/PNG/PDF) <span className="text-red-500">*</span>
            <input
              type="file"
              name="certificate"
              accept="image/*,.pdf"
              onChange={handleFile}
              required
              className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-brand-700"
            />
            {files.certificate && (
              <span className="mt-1 block text-xs text-brand-700 font-medium">✓ Selected: {files.certificate.name}</span>
            )}
          </label>

          <div className="sm:col-span-2 pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Submit for verification
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
