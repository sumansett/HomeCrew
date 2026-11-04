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

// Full details of one customer + every request they made
function CustomerDetails({ id, token, onClose, onTogglePhoneVerify }) {
  const { data, loading, error, reload } = useFetch(`/admin/users/${id}`, token);
  const u = data?.user;
  const requests = data?.requests || [];

  const handleVerify = async (status) => {
    await onTogglePhoneVerify(id, status);
    reload();
  };

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
            {/* Email: no verified or unverified badge */}
            <Row icon="📧" label="Email">{u.email || "-"}</Row>

            {/* Phone with Call button and manual verify option */}
            <Row icon="📞" label="Phone">
              <div className="flex flex-wrap items-center gap-2">
                <span>{u.phone || "-"}</span>
                {u.phone && (
                  <>
                    <a
                      href={`tel:${u.phone}`}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                      title="Call customer"
                    >
                      📞 Call
                    </a>
                    {u.phoneVerified ? (
                      <button
                        type="button"
                        onClick={() => handleVerify(false)}
                        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 hover:bg-green-200 transition"
                        title="Phone is verified. Click to mark unverified."
                      >
                        ✓ Verified
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerify(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 hover:bg-brand-600 hover:text-white transition"
                        title="Phone is unverified. Click to mark verified."
                      >
                        Verify Phone
                      </button>
                    )}
                  </>
                )}
              </div>
            </Row>

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
                    {r.billing?.totalAmount > 0 ? (
                      <div className="mt-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 p-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1 font-semibold text-gray-800">
                          <span className="flex items-center gap-1 text-emerald-900 font-bold">
                            <span>🧾</span> Technician Bill: ₹{r.billing.totalAmount}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            r.payment?.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {r.payment?.status === "paid" ? "✓ Paid" : "⏳ Unpaid"} ({((r.payment?.status === "paid" ? r.payment?.method : r.payment?.preferredMethod) === "cash") ? "Cash" : "Online"})
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-gray-600 text-[11px]">
                          <span>Labor: ₹{r.billing.laborCharges || 0}</span>
                          {r.billing.materialsCost > 0 && <span>Parts: ₹{r.billing.materialsCost}</span>}
                          {r.billing.invoicedAt && (
                            <span>Invoiced: {new Date(r.billing.invoicedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        {r.billing.workNotes && (
                          <p className="mt-1.5 text-gray-700 italic bg-white/80 p-1.5 rounded border border-emerald-100 text-[11px]">
                            Work Notes: “{r.billing.workNotes}”
                          </p>
                        )}
                      </div>
                    ) : r.status === "in-progress" ? (
                      <p className="mt-1 text-xs text-blue-600">🔧 Job in progress — bill pending generation by technician</p>
                    ) : null}
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

  const handleTogglePhoneVerify = async (userId, targetStatus) => {
    try {
      await api(`/admin/users/${userId}/verify-phone`, {
        method: "PUT",
        body: { phoneVerified: targetStatus },
        token,
      });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

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

              <div className="mt-3 flex-1 space-y-2 text-sm text-gray-600">
                {/* Email: no verified or unverified badge */}
                <p className="break-all">📧 {u.email || "-"}</p>

                {/* Phone with Call button and manual verify option */}
                <div className="flex flex-wrap items-center gap-2">
                  <span>📞 {u.phone || "-"}</span>
                  {u.phone && (
                    <>
                      <a
                        href={`tel:${u.phone}`}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                        title="Call customer"
                      >
                        📞 Call
                      </a>
                      {u.phoneVerified ? (
                        <button
                          type="button"
                          onClick={() => handleTogglePhoneVerify(u._id, false)}
                          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 hover:bg-green-200 transition"
                          title="Phone is verified. Click to mark unverified."
                        >
                          ✓ Verified
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTogglePhoneVerify(u._id, true)}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-brand-600 hover:text-white transition"
                          title="Phone is unverified. Click to mark verified."
                        >
                          Verify Phone
                        </button>
                      )}
                    </>
                  )}
                </div>

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

      {viewId && (
        <CustomerDetails
          id={viewId}
          token={token}
          onClose={() => setViewId(null)}
          onTogglePhoneVerify={handleTogglePhoneVerify}
        />
      )}
    </>
  );
}
