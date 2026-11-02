import { useState } from "react";
import { api } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Stars from "../components/Stars";
import { formatAddress } from "../utils/address";

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "-");
const fmtTime = (d) => (d ? new Date(d).toLocaleString() : "-");

const Row = ({ icon, label, children }) => (
  <div className="flex gap-3 text-sm">
    <span className="w-5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="break-words text-gray-700">{children}</div>
    </div>
  </div>
);

const Verified = ({ ok }) =>
  ok ? <span className="ml-1 text-xs font-semibold text-brand-600">✓ Verified</span> : <span className="ml-1 text-xs text-amber-600">Not verified</span>;

// Full details of one customer + every request they made
function CustomerDetails({ id, token, onClose }) {
  const { data, loading, error } = useFetch(`/admin/users/${id}`, token);
  const u = data?.user;
  const requests = data?.requests || [];

  return (
    <Modal title="Customer details" onClose={onClose}>
      <Alert>{error}</Alert>
      {loading || !u ? (
        <Loader />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar user={u} className="h-20 w-20" text="text-2xl" />
            <div className="min-w-0">
              <h4 className="truncate text-lg font-semibold text-gray-800">{u.name}</h4>
              <p className="text-xs text-gray-400">Joined {fmt(u.createdAt)}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-gray-50 p-4">
            <Row icon="📧" label="Email">{u.email}<Verified ok={u.emailVerified} /></Row>
            <Row icon="📞" label="Phone">{u.phone || "-"}{u.phone && <Verified ok={u.phoneVerified} />}</Row>
            <Row icon="📍" label="Address">{formatAddress(u.address) || "-"}</Row>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Service requests ({requests.length})</p>
            {requests.length === 0 ? (
              <p className="text-sm text-gray-400">This customer has not requested any service yet.</p>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r._id} className="rounded-xl border border-brand-100 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-gray-800">{r.service?.icon} {r.service?.name}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-gray-600">{r.description}</p>
                    <p className="mt-1 text-xs text-gray-500">📍 {r.location} • 🕒 {fmtTime(r.preferredTime)}</p>
                    {r.assignedProfessional && (
                      <p className="text-xs text-gray-500">👷 {r.assignedProfessional.name} ({r.assignedProfessional.type})</p>
                    )}
                    {r.review?.rating && (
                      <p className="mt-1 text-xs">
                        <Stars value={r.review.rating} /> <span className="text-gray-500">{r.review.comment}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Users() {
  const { token } = useAdminAuth();
  const { data, loading, error, reload } = useFetch("/admin/users", token);
  const [msg, setMsg] = useState("");
  const [viewId, setViewId] = useState(null);
  const [search, setSearch] = useState("");

  const remove = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api(`/admin/users/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const users = (data?.users || []).filter((u) =>
    [u.name, u.email, u.phone, formatAddress(u.address)].some((v) => (v || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader title="Customers" subtitle="Everything customers entered on their account">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, address..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-72"
        />
      </PageHeader>
      <Alert>{error || msg}</Alert>
      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <p className="py-10 text-center text-gray-500">{search ? "No customers match your search." : "No customers yet."}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <div key={u._id} className="flex flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar user={u} className="h-14 w-14" text="text-lg" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-800">{u.name}</h3>
                  <p className="text-xs text-gray-400">Joined {fmt(u.createdAt)}</p>
                </div>
              </div>

              <div className="mt-3 flex-1 space-y-1 text-sm text-gray-600">
                <p className="break-all">📧 {u.email} {u.emailVerified && <span className="text-brand-600" title="Email verified">✓</span>}</p>
                <p>📞 {u.phone || "-"} {u.phone && u.phoneVerified && <span className="text-brand-600" title="Phone verified">✓</span>}</p>
                <p>📍 {formatAddress(u.address) || "No address given"}</p>
                <p className="pt-1 text-xs text-gray-500">
                  📋 {u.totalRequests} request{u.totalRequests === 1 ? "" : "s"} • ✅ {u.completedRequests} completed
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => setViewId(u._id)} className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  View details
                </button>
                <button onClick={() => remove(u._id)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewId && <CustomerDetails id={viewId} token={token} onClose={() => setViewId(null)} />}
    </>
  );
}
