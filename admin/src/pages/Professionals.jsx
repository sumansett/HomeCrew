import { useState } from "react";
import { api, fileUrl } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import Avatar from "../components/Avatar";
import Stars from "../components/Stars";
import { formatAddress } from "../utils/address";

const tabs = ["pending", "approved", "rejected", "all"];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");

function ProCard({ p, onReview, onRemove, onClearCash, onTogglePhoneVerify, onDeleteReview }) {
  const [showAll, setShowAll] = useState(false);
  const reviews = p.reviews || [];
  const shown = showAll ? reviews : reviews.slice(0, 2);
  const fin = p.financials || {};

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar user={p} className="h-14 w-14" text="text-lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-800">{p.name}</h3>
          <p className="text-sm capitalize text-gray-500">{p.type} • {p.service?.icon} {p.service?.name}</p>
          <p className="mt-0.5 text-sm">
            {p.totalReviews > 0 ? (
              <>
                <Stars value={p.averageRating} />
                <span className="ml-1 font-medium text-gray-700">{p.averageRating}</span>
                <span className="text-gray-400"> ({p.totalReviews} review{p.totalReviews > 1 ? "s" : ""})</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">No reviews yet</span>
            )}
          </p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div className="mt-3 space-y-2 text-sm text-gray-600">
        {/* Email: no verified or unverified badge */}
        <p className="break-all">📧 {p.email || "-"}</p>

        {/* Phone with Call button and manual verify option */}
        <div className="flex flex-wrap items-center gap-2">
          <span>📞 {p.phone || "-"}</span>
          {p.phone && (
            <>
              <a
                href={`tel:${p.phone}`}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                title="Call technician"
              >
                📞 Call
              </a>
              {p.phoneVerified ? (
                <button
                  type="button"
                  onClick={() => onTogglePhoneVerify(p._id, false)}
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 hover:bg-green-200 transition"
                  title="Phone is verified. Click to mark unverified."
                >
                  ✓ Verified
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onTogglePhoneVerify(p._id, true)}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 hover:bg-brand-600 hover:text-white transition"
                  title="Phone is unverified. Click to mark verified."
                >
                  Verify Phone
                </button>
              )}
            </>
          )}
        </div>

        <p>🧰 {p.experience} years experience</p>
        {formatAddress(p.address) && <p>📍 {formatAddress(p.address)}</p>}
        {p.about && <p className="text-gray-500">“{p.about}”</p>}
      </div>

      {p.verification && (
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a className="font-medium text-brand-600 hover:underline" href={fileUrl(p.verification.idDocument)} target="_blank" rel="noreferrer">📄 ID document</a>
          <a className="font-medium text-brand-600 hover:underline" href={fileUrl(p.verification.certificate)} target="_blank" rel="noreferrer">🎓 Certificate</a>
        </div>
      )}
      {p.verification?.remarks && <p className="mt-2 text-xs text-gray-400">Remarks: {p.verification.remarks}</p>}

      {/* Payment & Earnings Summary Box */}
      {p.status === "approved" && (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 text-xs text-gray-700">
          {/* Offer Eligibility & Limit Banner */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1 border-b border-brand-100/70 pb-2">
            <div>
              <span className="font-bold text-gray-900">Job Offer Status: </span>
              {fin.isBlockedForDebt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-800">
                  ⛔ BLOCKED (Exceeded Limit)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                  ✓ Eligible for Offers
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-500">
              Cash Debt: <b>₹{fin.netCommissionOwedToAdmin || 0}</b> / ₹{fin.cashDebtLimit || 500} limit
            </span>
          </div>

          {fin.isBlockedForDebt && (
            <div className="mb-2.5 rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-800">
              ⚠️ <b>Suspended:</b> Technician has accumulated ₹{fin.netCommissionOwedToAdmin} in unpaid cash platform fees. Cannot receive new service requests until cleared.
            </div>
          )}

          {/* 4-Stat Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-2 border border-gray-100 shadow-2xs">
              <p className="text-[10px] uppercase font-semibold text-gray-400">Completed Jobs</p>
              <p className="text-sm font-bold text-gray-800">{fin.totalJobs || 0}</p>
              <p className="text-[10px] text-gray-500">₹{fin.totalBilled || 0} billed</p>
            </div>

            <div className="rounded-lg bg-white p-2 border border-emerald-100 shadow-2xs">
              <p className="text-[10px] uppercase font-semibold text-emerald-700">Cash in Hand</p>
              <p className="text-sm font-bold text-emerald-800">₹{fin.cashCollected || 0}</p>
              <p className="text-[10px] text-emerald-600">Doorstep COS</p>
            </div>

            <div className="rounded-lg bg-white p-2 border border-amber-100 shadow-2xs">
              <p className="text-[10px] uppercase font-semibold text-amber-700">10% Cash Fee Due</p>
              <p className="text-sm font-bold text-amber-800">₹{fin.cashCommissionOwed || 0}</p>
              <p className="text-[10px] text-amber-600">Owed to company</p>
            </div>

            <div className="rounded-lg bg-white p-2 border border-blue-100 shadow-2xs">
              <p className="text-[10px] uppercase font-semibold text-blue-700">Online Held</p>
              <p className="text-sm font-bold text-blue-800">₹{fin.onlinePending || 0}</p>
              <p className="text-[10px] text-blue-600">Pending transfer</p>
            </div>
          </div>

          {/* Auto-Offset Settlement Row & Clear Action */}
          <div className="mt-2.5 pt-2 border-t border-brand-100/70 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-gray-800">Auto-Offset Balance: </span>
              {fin.netPayableByAdmin > 0 ? (
                <span className="font-bold text-blue-700">Admin owes Pro: ₹{fin.netPayableByAdmin}</span>
              ) : fin.netCommissionOwedToAdmin > 0 ? (
                <span className="font-bold text-amber-800">Pro owes Admin: ₹{fin.netCommissionOwedToAdmin}</span>
              ) : (
                <span className="font-bold text-emerald-700">✓ Fully Settled (₹0)</span>
              )}
            </div>

            {fin.cashCommissionOwed > 0 && (
              <button
                type="button"
                onClick={() => onClearCash(p._id, p.name, fin.cashCommissionOwed)}
                className="rounded-lg bg-amber-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-amber-700 shadow-2xs"
                title="Mark Doorstep Cash Commission as collected by Admin"
              >
                💵 Clear Cash Debt (₹{fin.cashCommissionOwed})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reviews Preview Accordion */}
      {reviews.length > 0 && (
        <div className="mt-4 border-t border-brand-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Customer feedback</span>
            {reviews.length > 2 && (
              <button onClick={() => setShowAll((v) => !v)} className="text-xs font-medium text-brand-600 hover:underline">
                {showAll ? "Show less" : `View all (${reviews.length})`}
              </button>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {shown.map((r) => (
              <div key={r._id} className="rounded-xl bg-brand-50/50 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Stars value={r.rating} />
                    <span className="font-medium text-gray-700">{r.customer?.name || "Customer"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{fmtDate(r.submittedAt)}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteReview(r._id)}
                      className="text-red-500 hover:text-red-700 text-xs transition cursor-pointer"
                      title="Delete customer review"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {r.comment && <p className="mt-1 text-gray-600">“{r.comment}”</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-brand-50">
        {p.status === "pending" && (
          <>
            <button onClick={() => onReview(p, "approved")} className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Approve
            </button>
            <button onClick={() => onReview(p, "rejected")} className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Reject
            </button>
          </>
        )}
        {p.status === "approved" && (
          <button onClick={() => onReview(p, "rejected")} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
            Revoke approval
          </button>
        )}
        {p.status === "rejected" && (
          <button onClick={() => onReview(p, "approved")} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
            Re-approve
          </button>
        )}
        <button onClick={() => onRemove(p._id)} className="ml-auto rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-red-600">
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Professionals() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState("pending");
  const query = tab === "all" ? "" : `?status=${tab}`;
  const { data, loading, error, reload } = useFetch(`/admin/professionals${query}`, token);
  const [review, setReview] = useState(null); // { pro, status }
  const [remarks, setRemarks] = useState("");
  const [msg, setMsg] = useState("");

  const handleTogglePhoneVerify = async (proId, targetStatus) => {
    try {
      await api(`/admin/professionals/${proId}/verify-phone`, {
        method: "PUT",
        body: { phoneVerified: targetStatus },
        token,
      });
      reload();
    } catch (err) {
      setMsg(err.message || "Failed to update phone verification");
    }
  };

  const handleDeleteReview = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this customer review?")) return;
    try {
      await api(`/admin/reviews/${requestId}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err.message || "Failed to delete review");
    }
  };

  const submitReview = async () => {
    try {
      await api(`/admin/professionals/${review.pro._id}/verify`, {
        method: "PUT",
        body: { status: review.status, remarks },
        token,
      });
      setReview(null);
      setRemarks("");
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Permanently delete this professional and verification records?")) return;
    try {
      await api(`/admin/professionals/${id}`, { method: "DELETE", token });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const clearCashCommission = async (proId, proName, amount) => {
    if (!window.confirm(`Clear cash platform commission of ₹${amount} for ${proName}? This confirms the admin has collected the cash in hand.`)) {
      return;
    }
    try {
      const res = await api(`/admin/financials/clear-cash-commission`, {
        method: "POST",
        body: { professionalId: proId },
        token,
      });
      setMsg(res.message || "Cash commission successfully cleared!");
      reload();
    } catch (err) {
      setMsg(err.message || "Failed to clear cash commission");
    }
  };

  return (
    <>
      <PageHeader title="Professionals" subtitle="Review documents, verify technicians & contractors, and monitor earnings & limits" />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-brand-600 text-white" : "bg-white text-gray-600 ring-1 ring-brand-100 hover:bg-brand-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Alert>{error || msg}</Alert>
      {loading ? (
        <Loader />
      ) : data.professionals.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No professionals found.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.professionals.map((p) => (
            <ProCard
              key={p._id}
              p={p}
              onReview={(pro, status) => setReview({ pro, status })}
              onRemove={remove}
              onClearCash={clearCashCommission}
              onTogglePhoneVerify={handleTogglePhoneVerify}
              onDeleteReview={handleDeleteReview}
            />
          ))}
        </div>
      )}

      {review && (
        <Modal title={`${review.status === "approved" ? "Approve" : "Reject"} ${review.pro.name}`} onClose={() => setReview(null)}>
          <FormInput label="Admin remarks (optional)" as="textarea" rows="3" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <Button className="mt-4 w-full" variant={review.status === "approved" ? "primary" : "danger"} onClick={submitReview}>
            Confirm {review.status}
          </Button>
        </Modal>
      )}
    </>
  );
}
