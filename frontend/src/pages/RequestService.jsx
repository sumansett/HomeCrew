import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Alert from "../components/Alert";
import { formatAddress } from "../utils/address";

export default function RequestService() {
  const { token, user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data } = useFetch("/services");

  const [form, setForm] = useState({
    service: params.get("service") || "",
    description: "",
    location: formatAddress(user?.address),
    preferredTime: "",
    paymentMethod: "online",
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      images.forEach((img) => body.append("images", img));
      await api("/requests", { method: "POST", body, isForm: true, token });
      navigate("/my-requests");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader title="Request a service" subtitle="Tell us what needs fixing." />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        <Alert>{error}</Alert>
        <FormInput label="Service" as="select" name="service" value={form.service} onChange={handleChange} required>
          <option value="">Select a service</option>
          {(data?.services || []).map((s) => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
        </FormInput>
        <FormInput label="Describe the problem" as="textarea" rows="4" name="description" value={form.description} onChange={handleChange} required />
        <FormInput label="Location / address" name="location" value={form.location} onChange={handleChange} required />
        <FormInput label="Preferred date & time" type="datetime-local" name="preferredTime" value={form.preferredTime} onChange={handleChange} required />

        <label className="block text-sm font-medium text-gray-700">
          Photos (up to 4, optional)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files).slice(0, 4))}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:text-brand-700"
          />
        </label>
        {images.length > 0 && (
          <div className="flex gap-2">
            {images.map((img) => (
              <img key={img.name} src={URL.createObjectURL(img)} alt="preview" className="h-16 w-16 rounded-lg border object-cover" />
            ))}
          </div>
        )}

        {/* Payment Mode Selection (Mandatory - Locked for completion) */}
        <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
              <span>💳</span> Payment Method (Pay After Completion)
            </span>
            <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
              Mandatory Selection
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            No advance payment needed. Choose how you will pay once the technician finishes the job. 
            <b> Note: After work completion, you will be required to pay using this selected method only.</b>
          </p>

          <div className="grid gap-3 sm:grid-cols-2 pt-1.5">
            {/* Online via Razorpay */}
            <div
              onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "online" }))}
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-3.5 transition ${
                form.paymentMethod === "online"
                  ? "border-brand-600 bg-white ring-2 ring-brand-500/30 shadow-xs"
                  : "border-gray-200 bg-white/70 hover:border-brand-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>💳</span> Online Payment
                </span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={form.paymentMethod === "online"}
                  onChange={handleChange}
                  className="h-4 w-4 accent-brand-600 cursor-pointer"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500 leading-normal">
                UPI (GPay / PhonePe / Paytm), Credit/Debit Cards, NetBanking via Razorpay. Pay online only after work is done.
              </p>
            </div>

            {/* Cash on Delivery (COD) */}
            <div
              onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "cash" }))}
              className={`flex cursor-pointer flex-col rounded-xl border-2 p-3.5 transition ${
                form.paymentMethod === "cash"
                  ? "border-brand-600 bg-white ring-2 ring-brand-500/30 shadow-xs"
                  : "border-gray-200 bg-white/70 hover:border-brand-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>💵</span> Cash on Service (COD)
                </span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={form.paymentMethod === "cash"}
                  onChange={handleChange}
                  className="h-4 w-4 accent-brand-600 cursor-pointer"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500 leading-normal">
                Pay 100% cash directly to the technician at your doorstep once the work is inspected and finished.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">Submit request</Button>
      </form>
    </div>
  );
}
