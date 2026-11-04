import { useState } from "react";
import { api } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

const empty = { name: "", category: "", description: "", icon: "🛠️", startingPrice: 0, available: true };

export default function Services() {
  const { token } = useAdminAuth();
  const { data, loading, error, reload } = useFetch("/services?all=true", token);
  const [editing, setEditing] = useState(null); // null | service object (with or without _id)
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const isEdit = Boolean(editing._id);
      await api(isEdit ? `/services/${editing._id}` : "/services", {
        method: isEdit ? "PUT" : "POST",
        body: editing,
        token,
      });
      setEditing(null);
      reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api(`/services/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const set = (e) => setEditing({ ...editing, [e.target.name]: e.target.value });

  return (
    <>
      <PageHeader title="Services" subtitle="Add, update or remove household services">
        <Button onClick={() => { setMsg(""); setEditing(empty); }}>+ Add service</Button>
      </PageHeader>

      <Alert>{error || (!editing && msg)}</Alert>
      {loading ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Base Price (Visiting)</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((s) => (
                <tr key={s._id} className="border-t border-brand-100">
                  <td className="px-4 py-3 font-medium">{s.icon} {s.name}</td>
                  <td className="px-4 py-3">{s.category}</td>
                  <td className="px-4 py-3">₹{s.startingPrice}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.available ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"}`}>
                      {s.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="space-x-2 px-4 py-3 text-right">
                    <button onClick={() => { setMsg(""); setEditing(s); }} className="font-medium text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => remove(s._id)} className="font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing._id ? "Edit service" : "Add service"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            <Alert>{msg}</Alert>
            <FormInput label="Service name" name="name" value={editing.name} onChange={set} required />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Category" name="category" value={editing.category} onChange={set} required />
              <FormInput label="Icon (emoji)" name="icon" value={editing.icon} onChange={set} />
            </div>
            <FormInput label="Description" as="textarea" rows="3" name="description" value={editing.description} onChange={set} required />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormInput label="Base visiting & inspection price (₹)" type="number" min="0" name="startingPrice" value={editing.startingPrice} onChange={set} />
                <p className="mt-1 text-[11px] text-gray-500">Minimum price customer pays when hiring a technician.</p>
              </div>
              <FormInput
                label="Availability"
                as="select"
                value={String(editing.available)}
                onChange={(e) => setEditing({ ...editing, available: e.target.value === "true" })}
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </FormInput>
            </div>
            <Button type="submit" loading={saving} className="w-full">Save service</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
