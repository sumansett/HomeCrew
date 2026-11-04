import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import FormInput from "./FormInput";
import Button from "./Button";
import Alert from "./Alert";
import AvatarUploader from "./AvatarUploader";
import AddressInputs from "./AddressInputs";
import { parseAddress } from "../utils/address";

const card = "rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8";

// Shared profile screen for customers and professionals.
//   base   - "/auth/profile" or "/professionals/profile"
//   meUrl  - endpoint that returns the latest account ("/auth/me" or "/professionals/me")
export default function ProfileEditor({ base, meUrl, professional = false }) {
  const { token, user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: parseAddress(user?.address),
    about: user?.about || "",
    experience: user?.experience ?? 0,
  });
  const [pw, setPw] = useState({ currentPassword: "", password: "", confirm: "" });
  const [msgs, setMsgs] = useState({});
  const [busy, setBusy] = useState("");

  const setMsg = (section) => (m) => setMsgs((prev) => ({ ...prev, [section]: m }));

  // pull the latest account
  useEffect(() => {
    api(meUrl, { token }).then((res) => updateUser(res.user)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the form in step with the server copy
  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      address: parseAddress(user?.address),
      about: user?.about || "",
      experience: user?.experience ?? 0,
    });
  }, [user?.name, user?.phone, user?.email, JSON.stringify(user?.address), user?.about, user?.experience]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const saveDetails = async (e) => {
    e.preventDefault();
    setBusy("details");
    setMsg("details")({});
    try {
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email ? form.email.trim().toLowerCase() : "",
        address: form.address,
      };
      if (professional) {
        body.about = form.about;
        body.experience = form.experience === "" ? 0 : Number(form.experience);
      }
      const res = await api(base, { method: "PUT", body, token });
      updateUser(res.user);
      setMsg("details")({ type: "success", text: "Profile details updated successfully (no OTP required)" });
    } catch (err) {
      setMsg("details")({ type: "error", text: err.message });
    } finally {
      setBusy("");
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMsg("password")({});
    if (pw.password !== pw.confirm) return setMsg("password")({ type: "error", text: "New passwords do not match" });
    setBusy("password");
    try {
      const res = await api(base, { method: "PUT", body: { currentPassword: pw.currentPassword, password: pw.password }, token });
      updateUser(res.user);
      setPw({ currentPassword: "", password: "", confirm: "" });
      setMsg("password")({ type: "success", text: "Password changed successfully" });
    } catch (err) {
      setMsg("password")({ type: "error", text: err.message });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Profile photo</h2>
        <div className="space-y-3">
          <Alert type={msgs.photo?.type}>{msgs.photo?.text}</Alert>
          <AvatarUploader base={base} token={token} user={user} onUpdated={updateUser} onMessage={setMsg("photo")} />
        </div>
      </section>

      {/* Profile & contact details */}
      <section className={card}>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">
          {professional ? "Personal & professional details" : "Personal details"}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          You can update your personal information, mobile number, and email address directly. No OTP verification required.
        </p>

        <form onSubmit={saveDetails} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Alert type={msgs.details?.type}>{msgs.details?.text}</Alert>
          </div>

          <FormInput
            className="sm:col-span-2"
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <FormInput
            label="Mobile number"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            required
          />

          <FormInput
            label="Email address (Optional)"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com (optional)"
          />

          <AddressInputs
            className="sm:col-span-2"
            value={form.address}
            onChange={(addr) => setForm((prev) => ({ ...prev, address: addr }))}
          />

          {professional && (
            <>
              <FormInput
                label="Experience (years)"
                type="number"
                min="0"
                max="60"
                name="experience"
                value={form.experience}
                onChange={handleChange}
              />
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-700">Category:</span> {user?.service?.name || "-"}
                </p>
                <p className="capitalize">
                  <span className="font-medium text-gray-700">Role:</span> {user?.type}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Category and role are tied to your verification documents and cannot be edited here.
                </p>
              </div>
              <FormInput
                className="sm:col-span-2"
                label="About your work"
                as="textarea"
                rows="4"
                name="about"
                value={form.about}
                onChange={handleChange}
              />
            </>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" loading={busy === "details"} className="w-full sm:w-auto">
              Save changes
            </Button>
          </div>
        </form>
      </section>

      {/* Change password */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Change password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <Alert type={msgs.password?.type}>{msgs.password?.text}</Alert>
          <FormInput
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="New password (min 6)"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={pw.password}
              onChange={(e) => setPw({ ...pw, password: e.target.value })}
              required
            />
            <FormInput
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              required
            />
          </div>
          <Button type="submit" loading={busy === "password"} className="w-full sm:w-auto">
            Update password
          </Button>
        </form>
      </section>
    </div>
  );
}
