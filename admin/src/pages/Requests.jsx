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

const statuses = ["all", "pending", "assigned", "in-progress", "completed", "cancelled"];

export default function Requests() {
  const { token } = useAdminAuth();
  const [filter, setFilter] = useState("all");
  const { data, loading, error, reload } = useFetch(
    `/admin/requests${filter === "all" ? "" : `?status=${filter}`}`,
    token
  );
  const [assigning, setAssigning] = useState(null); // request
  const [options, setOptions] = useState([]);
  const [chosen, setChosen] = useState("");
  const [msg, setMsg] = useState("");
  const [viewInvoice, setViewInvoice] = useState(null);

  const openAssign = async (req) => {
    setMsg("");
    setChosen("");
    setAssigning(req);
    try {
      const res = await api(`/admin/requests/${req._id}/professionals`, { token });
      setOptions(res.professionals);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const assign = async () => {
    try {
      await api(`/admin/requests/${assigning._id}/assign`, { method: "PUT", body: { professionalId: chosen }, token });
      setAssigning(null);
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const [paymentActionLoading, setPaymentActionLoading] = useState(false);

  const markPayment = async (id, status, method) => {
    try {
      setPaymentActionLoading(true);
      await api(`/admin/requests/${id}/payment`, {
        method: "PUT",
        body: { status, method },
        token,
      });
      reload();
    } catch (err) {
      setMsg(err.message || "Failed to update payment");
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await api(`/admin/requests/${id}/status`, { method: "PUT", body: { status }, token });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Service requests" subtitle="View requests, assign verified professionals, and track payment status" />

      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              filter === s ? "bg-brand-600 text-white" : "bg-white text-gray-600 ring-1 ring-brand-100 hover:bg-brand-50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Alert>{error || (!assigning && msg)}</Alert>
      {loading ? (
        <Loader />
      ) : data.requests.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No requests found.</p>
      ) : (
        <div className="space-y-4">
          {data.requests.map((r) => {
            const isPaid = r.payment?.status === "paid";
            const isCash = (isPaid ? r.payment?.method : r.payment?.preferredMethod) === "cash";
            const totalBill = Number(r.billing?.totalAmount) || 0;
            const adminCut = Number(r.payment?.platformFee) || Math.round(totalBill * 0.1);
            const proShare = Number(r.payment?.professionalNet) || totalBill - adminCut;

            return (
              <div key={r._id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                {/* Header: Service info, customer contact & badges */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-base">
                      {r.service?.icon} {r.service?.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>{r.customer?.name} • {r.customer?.phone || r.customer?.email}</span>
                      {r.customer?.phone && (
                        <a
                          href={`tel:${r.customer.phone}`}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                          title="Call customer"
                        >
                          📞 Call
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Payment Done / Not Done Badge */}
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                        ✓ Payment Done ({r.payment?.method === "cash" ? "Cash on Service" : "Online"})
                      </span>
                    ) : r.status === "completed" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                        ⚠️ Payment Not Done ({r.payment?.preferredMethod === "cash" ? "Cash on Service" : "Online"})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                        <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                        Payment Pending ({r.payment?.preferredMethod === "cash" ? "Cash" : "Online"})
                      </span>
                    )}

                    <StatusBadge status={r.status} />
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600">{r.description}</p>
                <div className="mt-2 grid gap-1 text-sm text-gray-500 sm:grid-cols-2">
                  <p>📍 {r.location}</p>
                  <p>🕒 {new Date(r.preferredTime).toLocaleString()}</p>
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                    <span>
                      👷 {r.assignedProfessional ? `${r.assignedProfessional.name} (${r.assignedProfessional.phone})` : "Not assigned yet"}
                    </span>
                    {r.assignedProfessional?.phone && (
                      <a
                        href={`tel:${r.assignedProfessional.phone}`}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                        title="Call technician"
                      >
                        📞 Call Technician
                      </a>
                    )}
                  </div>
                </div>

                {/* Payment Method & Billing Details Card */}
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 text-xs text-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100/70 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">Payment Method:</span>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 font-semibold border ${
                        isCash
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}>
                        {isCash ? "💵 Cash on Service (COD)" : "💳 Online Payment (Razorpay)"}
                      </span>
                      {!isPaid && (
                        <span className="text-[11px] text-gray-500 hidden sm:inline">(Payable after service completion)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-800">Payment Status:</span>
                      {isPaid ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          ✓ Payment Done {r.payment?.paidAt && `(${new Date(r.payment.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700">
                          ⏳ Payment Not Done
                        </span>
                      )}
                    </div>
                  </div>

                  {totalBill > 0 ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🧾</span>
                          <div>
                            <p className="font-bold text-gray-900 text-xs sm:text-sm">
                              Technician Generated Bill
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {r.assignedProfessional ? `Invoiced by ${r.assignedProfessional.name}` : "Generated by technician"}
                              {r.billing?.invoicedAt && ` • ${new Date(r.billing.invoicedAt).toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewInvoice(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 hover:text-brand-900 transition shadow-2xs"
                          title="View formal itemized invoice & print"
                        >
                          <span>📄</span> View / Print Official Bill
                        </button>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[11px] text-gray-500 font-medium">Labor / Service</p>
                          <p className="text-sm font-semibold text-gray-800">₹{r.billing?.laborCharges || 0}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[11px] text-gray-500 font-medium">Parts / Materials</p>
                          <p className="text-sm font-semibold text-gray-800">₹{r.billing?.materialsCost || 0}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2">
                          <p className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">Total Customer Bill</p>
                          <p className="text-base font-extrabold text-emerald-900">₹{totalBill}</p>
                        </div>
                        <div className="rounded-lg bg-brand-50/70 border border-brand-200 p-2">
                          <p className="text-[11px] text-brand-800 font-semibold">Admin (10%) / Pro (90%)</p>
                          <p className="text-xs font-bold text-brand-900">
                            ₹{adminCut} / ₹{proShare}
                          </p>
                        </div>
                      </div>

                      {r.billing?.workNotes && (
                        <div className="mt-2.5 rounded-lg bg-gray-50 border border-gray-200/80 p-2 text-xs">
                          <span className="font-semibold text-gray-800">📝 Technician On-Site Notes:</span>
                          <p className="mt-0.5 text-gray-600 italic">“{r.billing.workNotes}”</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white/70 p-3 text-xs text-gray-600">
                      {r.status === "completed" ? (
                        <div className="flex items-center gap-2 text-amber-800 font-medium">
                          <span>⚠️</span>
                          <span>Job marked completed, but no bill charges were submitted by the technician.</span>
                        </div>
                      ) : r.status === "in-progress" ? (
                        <div className="flex items-center gap-2 text-blue-700 font-medium">
                          <span className="animate-pulse">⚙️</span>
                          <span>Job is in progress. The technician will generate the itemized bill upon finishing the work.</span>
                        </div>
                      ) : r.status === "assigned" ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span>👷</span>
                          <span>Assigned to {r.assignedProfessional?.name || "technician"}. Bill will be generated upon job completion.</span>
                        </div>
                      ) : r.status === "cancelled" ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>🚫</span>
                          <span>Request cancelled — no bill generated.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <span>⏳</span>
                          <span>Pending technician assignment. Technician will generate the bill upon service completion.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cash settlement or Online payout status note */}
                  {isPaid && (
                    <div className="mt-2.5 pt-2 border-t border-brand-100/60 flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-600">
                      <span>
                        <b>Fund Distribution:</b> {isCash ? (
                          <span className="text-gray-700">Technician collected full ₹{totalBill} cash directly on site.</span>
                        ) : (
                          <span className="text-gray-700">Admin received ₹{totalBill} online via Razorpay.</span>
                        )}
                      </span>
                      <span>
                        {isCash ? (
                          r.payout?.status === "settled" ? (
                            <span className="font-semibold text-emerald-700">✓ 10% Cash commission received by Admin</span>
                          ) : (
                            <span className="font-semibold text-amber-700">⚠️ Admin 10% commission due: ₹{adminCut} (Auto-deducted from online payouts)</span>
                          )
                        ) : r.payout?.status === "settled" ? (
                          <span className="font-semibold text-emerald-700">✓ 90% Payout Settled to Pro (Ref: {r.payout?.transactionRef || "Bank Transfer"})</span>
                        ) : (
                          <span className="font-semibold text-blue-700">⏳ 90% Payout Pending to Pro: ₹{proShare}</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {r.images?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.images.map((img) => (
                      <a key={img} href={fileUrl(img)} target="_blank" rel="noreferrer">
                        <img src={fileUrl(img)} alt="request" className="h-16 w-16 rounded-lg border object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Actions row: Assignment, status change, and payment verification */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {["pending", "assigned"].includes(r.status) && (
                      <Button onClick={() => openAssign(r)}>
                        {r.assignedProfessional ? "Reassign" : "Assign professional"}
                      </Button>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">Status:</span>
                      <select
                        value={r.status}
                        onChange={(e) => changeStatus(r._id, e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm capitalize outline-none focus:border-brand-500"
                      >
                        {statuses.slice(1).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Payment Action for Admin */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isPaid ? (
                      <button
                        type="button"
                        disabled={paymentActionLoading}
                        onClick={() => markPayment(r._id, "paid", r.payment?.preferredMethod || "cash")}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
                        title="Click to mark payment as collected/verified"
                      >
                        <span>✓</span> Mark Payment as Done ({r.payment?.preferredMethod === "cash" ? "Cash" : "Online"})
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={paymentActionLoading}
                        onClick={() => markPayment(r._id, "unpaid", r.payment?.method || "cash")}
                        className="rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50"
                        title="Revert payment status to unpaid if marked by mistake"
                      >
                        Mark as Unpaid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assigning && (
        <Modal title="Assign a verified professional" onClose={() => setAssigning(null)}>
          <Alert>{msg}</Alert>
          {options.length === 0 ? (
            <p className="text-sm text-gray-500">No approved professionals available for this service yet.</p>
          ) : (
            <>
              <FormInput label="Choose professional" as="select" value={chosen} onChange={(e) => setChosen(e.target.value)}>
                <option value="">Select</option>
                {options.map((p) => (
                  <option key={p._id} value={p._id} disabled={p.isBlockedForDebt}>
                    {p.name} ({p.type}, {p.experience} yrs) — {p.isBlockedForDebt ? `⛔ BLOCKED (₹${p.netCommissionOwedToAdmin} commission debt exceeds limit)` : `✓ Eligible`}
                  </option>
                ))}
              </FormInput>
              {options.some((p) => p.isBlockedForDebt) && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  ⚠️ <b>Offer Policy:</b> Technicians who have accumulated ₹500 or more in unpaid cash platform commission are blocked from receiving new jobs until their commission dues are cleared.
                </p>
              )}
            </>
          )}
          <Button className="mt-4 w-full" onClick={assign} disabled={!chosen}>Assign</Button>
        </Modal>
      )}
    
      {viewInvoice && (
        <Modal title={`Tax Invoice & Service Bill #${viewInvoice._id.slice(-8).toUpperCase()}`} onClose={() => setViewInvoice(null)}>
          <div className="space-y-4 text-gray-800" id="printable-admin-invoice">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-brand-800">HomeCrew</h3>
                <p className="text-xs text-gray-500">Verified Household Services • Official Invoice</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p className="font-bold text-gray-800 text-sm">INVOICE #{viewInvoice._id.slice(-8).toUpperCase()}</p>
                <p>Date: {new Date(viewInvoice.billing?.invoicedAt || viewInvoice.updatedAt).toLocaleDateString()}</p>
                <p className="mt-0.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    viewInvoice.payment?.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {viewInvoice.payment?.status === "paid" ? "PAID" : "PAYMENT PENDING"}
                  </span>
                </p>
              </div>
            </div>

            {/* Customer & Technician details */}
            <div className="grid gap-3 text-xs sm:grid-cols-2 rounded-xl bg-gray-50/80 p-3 border border-gray-100">
              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Customer Details:</p>
                <p className="font-semibold text-gray-900 mt-0.5">{viewInvoice.customer?.name}</p>
                <p className="text-gray-600">📞 {viewInvoice.customer?.phone || "N/A"}</p>
                {viewInvoice.customer?.email && <p className="text-gray-600">📧 {viewInvoice.customer.email}</p>}
                <p className="text-gray-600 mt-1">📍 {viewInvoice.location}</p>
              </div>
              <div>
                <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Technician Details (Invoiced By):</p>
                <p className="font-semibold text-gray-900 mt-0.5">{viewInvoice.assignedProfessional?.name || "HomeCrew Technician"}</p>
                <p className="text-gray-600">📞 {viewInvoice.assignedProfessional?.phone || "N/A"}</p>
                <p className="text-gray-600">🛠️ Service: {viewInvoice.service?.name}</p>
                <p className="text-gray-600 mt-1">🕒 Scheduled: {new Date(viewInvoice.preferredTime).toLocaleString()}</p>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-left text-sm border-t border-b">
              <thead>
                <tr className="border-b text-xs font-semibold text-gray-500 bg-gray-50/50">
                  <th className="py-2.5 px-2">Item Description</th>
                  <th className="py-2.5 px-2">Category</th>
                  <th className="py-2.5 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                <tr>
                  <td className="py-2.5 px-2 font-medium text-gray-800">
                    Labor & On-Site Service Charges
                  </td>
                  <td className="py-2.5 px-2 text-gray-500">Service Fee</td>
                  <td className="py-2.5 px-2 text-right font-semibold text-gray-900">
                    ₹{viewInvoice.billing?.laborCharges || 0}
                  </td>
                </tr>
                {viewInvoice.billing?.materialsCost > 0 && (
                  <tr>
                    <td className="py-2.5 px-2 font-medium text-gray-800">
                      Replacement Parts & Materials
                    </td>
                    <td className="py-2.5 px-2 text-gray-500">Hardware / Consumables</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-gray-900">
                      ₹{viewInvoice.billing?.materialsCost}
                    </td>
                  </tr>
                )}
                <tr className="font-bold text-sm bg-brand-50/50 text-gray-900">
                  <td colSpan={2} className="py-2.5 px-2">
                    Total Billed Amount
                  </td>
                  <td className="py-2.5 px-2 text-right text-brand-900 font-extrabold">
                    ₹{viewInvoice.billing?.totalAmount || 0}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Platform Revenue & Technician Net Breakdown */}
            <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-3 text-xs">
              <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider mb-1.5">
                Revenue & Payout Distribution
              </p>
              <div className="grid grid-cols-2 gap-2 text-gray-700">
                <div className="flex justify-between border-r border-brand-100 pr-3">
                  <span>HomeCrew Commission (10%):</span>
                  <span className="font-bold text-brand-900">
                    ₹{Number(viewInvoice.payment?.platformFee) || Math.round((viewInvoice.billing?.totalAmount || 0) * 0.1)}
                  </span>
                </div>
                <div className="flex justify-between pl-1">
                  <span>Technician Net Share (90%):</span>
                  <span className="font-bold text-brand-900">
                    ₹{Number(viewInvoice.payment?.professionalNet) || ((viewInvoice.billing?.totalAmount || 0) - (Number(viewInvoice.payment?.platformFee) || Math.round((viewInvoice.billing?.totalAmount || 0) * 0.1)))}
                  </span>
                </div>
              </div>
            </div>

            {/* Technician Work Notes */}
            {viewInvoice.billing?.workNotes && (
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700 border border-gray-200">
                <p className="font-semibold text-gray-900">Technician Work Notes & Description:</p>
                <p className="mt-1 text-gray-600 italic">“{viewInvoice.billing.workNotes}”</p>
              </div>
            )}

            {/* Payment Details */}
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <b className="capitalize">
                  {(viewInvoice.payment?.status === "paid" ? viewInvoice.payment?.method : viewInvoice.payment?.preferredMethod) === "cash"
                    ? "Cash on Service (COD)"
                    : "Online Payment (Razorpay)"}
                </b>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <b className={viewInvoice.payment?.status === "paid" ? "text-emerald-700" : "text-amber-700"}>
                  {viewInvoice.payment?.status === "paid" ? "✓ PAID" : "⏳ PAYMENT NOT DONE"}
                </b>
              </div>
              {viewInvoice.payment?.paidAt && (
                <div className="flex justify-between">
                  <span>Payment Date:</span>
                  <span>{new Date(viewInvoice.payment.paidAt).toLocaleString()}</span>
                </div>
              )}
              {viewInvoice.payment?.razorpayPaymentId && (
                <div className="flex justify-between">
                  <span>Razorpay Reference:</span>
                  <span className="font-mono">{viewInvoice.payment.razorpayPaymentId}</span>
                </div>
              )}
            </div>

            {/* Action Buttons (Hidden when printed) */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 no-print">
              <button
                type="button"
                onClick={() => setViewInvoice(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <span>🖨️</span> Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

    </>
  );
}
