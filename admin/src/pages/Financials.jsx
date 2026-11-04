import { useState } from "react";
import { api } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import Button from "../components/Button";

const filterTabs = [
  { id: "all", label: "All Transactions" },
  { id: "pending_payout", label: "Pending Payouts" },
  { id: "settled", label: "Settled Payouts" },
  { id: "cash", label: "Cash on Service" },
];

export default function Financials() {
  const { token } = useAdminAuth();
  const { data, loading, error, reload } = useFetch("/admin/financials", token);
  const [filter, setFilter] = useState("all");
  const [settleModal, setSettleModal] = useState(null);
  const [proUpiModal, setProUpiModal] = useState(null);
  const [txRef, setTxRef] = useState("");
  const [txNote, setTxNote] = useState("");
  const [settleLoading, setSettleLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [cashClearLoading, setCashClearLoading] = useState(false);

  const summary = data?.summary || {};
  const allRequests = data?.requests || [];
  const technicianAccounts = data?.technicianAccounts || [];

  const handleClearCashCommission = async (proId, proName) => {
    if (!window.confirm(`Confirm collection of cash platform fee from ${proName}? This will mark their cash commission balance as cleared.`)) return;
    setCashClearLoading(true);
    setActionMsg("");
    try {
      await api("/admin/financials/clear-cash-commission", {
        method: "POST",
        body: { professionalId: proId },
        token,
      });
      reload();
      setActionMsg(`Cash platform fee successfully marked as collected for ${proName}.`);
    } catch (err) {
      setActionMsg(err.message || "Failed to clear cash commission");
    } finally {
      setCashClearLoading(false);
    }
  };

  const handleSettleProUpi = async (e) => {
    e.preventDefault();
    if (!proUpiModal) return;
    setSettleLoading(true);
    setActionMsg("");
    try {
      await api("/admin/financials/settle-pro-payout", {
        method: "POST",
        body: {
          professionalId: proUpiModal.professional._id,
          transactionRef: txRef,
          note: txNote,
        },
        token,
      });
      setProUpiModal(null);
      setTxRef("");
      setTxNote("");
      reload();
      setActionMsg(`Payout of ₹${proUpiModal.amount} transferred and marked as settled for ${proUpiModal.professional.name}.`);
    } catch (err) {
      setActionMsg(err.message || "Failed to settle technician payout");
    } finally {
      setSettleLoading(false);
    }
  };

  const filteredRequests = allRequests.filter((r) => {
    if (filter === "pending_payout") {
      return r.payment?.method === "online" && r.payout?.status === "pending";
    }
    if (filter === "settled") {
      return r.payout?.status === "settled";
    }
    if (filter === "cash") {
      return r.payment?.method === "cash";
    }
    return true;
  });

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!settleModal) return;
    setSettleLoading(true);
    setActionMsg("");

    try {
      await api(`/admin/payouts/${settleModal._id}/settle`, {
        method: "POST",
        body: { transactionRef: txRef, note: txNote },
        token,
      });
      setSettleModal(null);
      setTxRef("");
      setTxNote("");
      reload();
      setActionMsg("Payout successfully marked as settled.");
    } catch (err) {
      setActionMsg(err.message || "Failed to settle payout");
    } finally {
      setSettleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financials & Payouts"
        subtitle="Track revenue, platform commissions (10%), and manage professional payouts."
      />

      {error && <Alert type="error">{error}</Alert>}
      {actionMsg && <Alert>{actionMsg}</Alert>}

      {loading ? (
        <Loader />
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Revenue (GMV)</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">₹{summary.totalBilled ?? 0}</p>
              <p className="mt-1 text-xs text-gray-500">Across {summary.totalTransactions ?? 0} completed orders</p>
            </div>

            <div className="rounded-2xl border border-brand-200 bg-emerald-50/50 p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Platform Commission (10%)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">₹{summary.totalPlatformCommission ?? 0}</p>
              <p className="mt-1 text-xs text-emerald-600">HomeCrew net platform earnings</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Online Payouts</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">₹{summary.pendingPayoutsToPros ?? 0}</p>
              <p className="mt-1 text-xs text-amber-600">To be transferred to professionals</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Payouts Settled</p>
              <p className="mt-1 text-2xl font-bold text-blue-800">₹{summary.settledPayoutsToPros ?? 0}</p>
              <p className="mt-1 text-xs text-blue-600">Successfully released to professionals</p>
            </div>
          </div>

          {/* Payment Channels Sub-metric */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-white p-4">
              <div>
                <p className="text-xs text-gray-500">💳 Online (Razorpay) Volume</p>
                <p className="text-lg font-bold text-brand-800">₹{summary.totalOnlineVolume ?? 0}</p>
              </div>
              <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                Direct to Admin
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-white p-4">
              <div>
                <p className="text-xs text-gray-500">💵 Cash on Service Volume</p>
                <p className="text-lg font-bold text-gray-800">₹{summary.totalCashVolume ?? 0}</p>
              </div>
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                Direct to Technician
              </span>
            </div>
          </div>

          {/* Technician Wallets & Auto-Offset Settlements (Urban Company Model) */}
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Technician Accounts & Cash Commission Settlement
                </h3>
                
              </div>
            </div>

            {technicianAccounts.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No active technician earnings recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 uppercase text-[11px] text-gray-500">
                    <tr>
                      <th className="px-3.5 py-3">Technician</th>
                      <th className="px-3.5 py-3 text-center">Completed Jobs</th>
                      <th className="px-3.5 py-3 text-right">Cash in Hand</th>
                      <th className="px-3.5 py-3 text-right">10% Cash Fee Due to Admin</th>
                      <th className="px-3.5 py-3 text-right">Online Payout Held by Admin</th>
                      <th className="px-3.5 py-3 text-right font-bold">Auto-Offset Balance</th>
                      <th className="px-3.5 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {technicianAccounts.map((t) => {
                      const hasCashDebt = t.cashCommissionOwed > 0;
                      return (
                        <tr key={t.professional?._id} className="hover:bg-brand-50/20">
                          <td className="px-3.5 py-3">
                            <p className="font-semibold text-gray-900">{t.professional?.name}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                              <span>{t.professional?.phone}</span>
                              {t.professional?.phone && (
                                <a
                                  href={`tel:${t.professional.phone}`}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                                  title="Call technician"
                                >
                                  📞 Call
                                </a>
                              )}
                              <span>• {t.professional?.type}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center font-medium text-gray-700">
                            {t.totalJobs}
                          </td>
                          <td className="px-3.5 py-3 text-right font-semibold text-emerald-800">
                            ₹{t.cashVolume}
                          </td>
                          <td className="px-3.5 py-3 text-right font-semibold text-amber-700">
                            ₹{t.cashCommissionOwed}
                          </td>
                          <td className="px-3.5 py-3 text-right font-semibold text-blue-800">
                            ₹{t.onlinePending}
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            {t.netPayableByAdmin > 0 ? (
                              <div>
                                <span className="inline-flex rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800">
                                  Pay Pro: ₹{t.netPayableByAdmin}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">After ₹{t.cashCommissionOwed} cash fee offset</p>
                              </div>
                            ) : t.netCommissionOwedToAdmin > 0 ? (
                              <div>
                                <span className="inline-flex rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                                  Pro Owes Admin: ₹{t.netCommissionOwedToAdmin}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">Collect via cash or UPI</p>
                              </div>
                            ) : (
                              <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                                ✓ Fully Balanced (₹0)
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {t.netPayableByAdmin > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProUpiModal({
                                      professional: t.professional,
                                      amount: t.netPayableByAdmin,
                                    });
                                    setTxRef(`UPI_${Date.now().toString().slice(-6)}`);
                                    setTxNote(`Online earnings payout transferred via UPI/Bank`);
                                    setCopied(false);
                                  }}
                                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs transition"
                                  title="Pay technician via UPI and mark payout as settled"
                                >
                                  ⚡ Pay ₹{t.netPayableByAdmin} via UPI
                                </button>
                              )}

                              {hasCashDebt && (
                                <button
                                  type="button"
                                  disabled={cashClearLoading}
                                  onClick={() => handleClearCashCommission(t.professional?._id, t.professional?.name)}
                                  className="rounded-lg bg-amber-600 hover:bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs transition disabled:opacity-50"
                                  title="Click when technician hands over cash commission directly to Admin"
                                >
                                  Record Cash Fee Collected
                                </button>
                              )}

                              {!hasCashDebt && t.netPayableByAdmin <= 0 && (
                                <span className="text-[11px] text-emerald-600 font-semibold">✓ Balanced</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-brand-100 pb-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  filter === tab.id
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-brand-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transactions & Payouts Table */}
          <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3.5">Job & Date</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Professional</th>
                    <th className="px-4 py-3.5 text-right">Total Bill</th>
                    <th className="px-4 py-3.5">Payment Method</th>
                    <th className="px-4 py-3.5 text-right">Admin Cut (10%)</th>
                    <th className="px-4 py-3.5 text-right">Pro Share (90%)</th>
                    <th className="px-4 py-3.5">Payout Status</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        No transactions found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r) => {
                      const total = r.billing?.totalAmount || 0;
                      const adminFee = r.payment?.platformFee || Math.round(total * 0.1);
                      const proNet = r.payment?.professionalNet || total - adminFee;
                      const isOnline = r.payment?.method === "online";
                      const isPendingPayout = isOnline && r.payout?.status === "pending";

                      return (
                        <tr key={r._id} className="hover:bg-brand-50/20">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{r.service?.name}</p>
                            <p className="text-[11px] text-gray-400">
                              {new Date(r.billing?.invoicedAt || r.updatedAt).toLocaleDateString()}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{r.customer?.name || "Customer"}</p>
                            <p className="text-[11px] text-gray-400">{r.customer?.phone}</p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{r.assignedProfessional?.name || "Unassigned"}</p>
                            <p className="text-[11px] text-gray-400">{r.assignedProfessional?.phone}</p>
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            ₹{total}
                          </td>

                          <td className="px-4 py-3">
                            {r.payment?.status === "paid" ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                  isOnline
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {isOnline ? "💳 Online (Razorpay)" : "💵 Cash on Service"}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                                Unpaid
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                            +₹{adminFee}
                          </td>

                          <td className="px-4 py-3 text-right font-semibold text-brand-800">
                            ₹{proNet}
                          </td>

                          <td className="px-4 py-3">
                            {!isOnline ? (
                              <span className="text-gray-500 font-medium">Collected in Cash</span>
                            ) : r.payout?.status === "settled" ? (
                              <div>
                                <span className="inline-flex rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                                  ✓ Settled
                                </span>
                                {r.payout?.transactionRef && (
                                  <p className="text-[10px] text-gray-400 mt-0.5">Ref: {r.payout.transactionRef}</p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 animate-pulse">
                                ⏳ Pending Transfer
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {isPendingPayout ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSettleModal(r);
                                  setTxRef(`UPI_${Date.now().toString().slice(-6)}`);
                                  setTxNote("Transferred to professional account");
                                }}
                                className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 shadow-2xs"
                              >
                                Settle Payout
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settle Payout Modal */}
          {settleModal && (
            <Modal title="Release Payout to Professional" onClose={() => setSettleModal(null)}>
              <form onSubmit={handleSettle} className="space-y-4">
                <div className="rounded-xl bg-brand-50 p-3.5 text-xs text-brand-900 space-y-1">
                  <p>
                    <b>Professional:</b> {settleModal.assignedProfessional?.name} ({settleModal.assignedProfessional?.phone})
                  </p>
                  <p>
                    <b>Job:</b> {settleModal.service?.name} (Total Bill: ₹{settleModal.billing?.totalAmount})
                  </p>
                  <p className="text-sm font-bold text-brand-800 pt-1">
                    Net Payout to Transfer: ₹{settleModal.payment?.professionalNet || 0}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Transaction / UTR Reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="e.g. UPI / Bank IMPS Reference No."
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Admin Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="e.g. Sent to Google Pay / Bank account"
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSettleModal(null)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button type="submit" loading={settleLoading}>
                    Confirm & Mark Settled
                  </Button>
                </div>
              </form>
            </Modal>
          )}

          {/* Direct Technician UPI Payout Modal */}
          {proUpiModal && (
            <Modal title="Pay Technician via UPI" onClose={() => setProUpiModal(null)}>
              <form onSubmit={handleSettleProUpi} className="space-y-4">
                {/* Technician & Payment Details */}
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Recipient Technician</p>
                      <p className="text-base font-bold text-gray-900">{proUpiModal.professional?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Amount to Pay</p>
                      <p className="text-xl font-extrabold text-blue-900">₹{proUpiModal.amount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-blue-100 shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Registered UPI / Mobile</span>
                      <span className="font-mono text-sm font-bold text-gray-800">{proUpiModal.professional?.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(proUpiModal.professional?.phone || "");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                    >
                      {copied ? "✓ Copied!" : "📋 Copy Number"}
                    </button>
                  </div>

                  {/* UPI Deep link button */}
                  <a
                    href={`upi://pay?pa=${proUpiModal.professional?.phone}@upi&pn=${encodeURIComponent(proUpiModal.professional?.name || "Technician")}&am=${proUpiModal.amount}&cu=INR&tn=${encodeURIComponent("HomeCrew Technician Payout")}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition"
                  >
                    <span>⚡</span> Open UPI App (GPay / PhonePe / Paytm)
                  </a>
                  <p className="text-[11px] text-gray-500 text-center">
                    Pay through your favorite UPI app, then paste the UTR / Ref ID below to record it.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    UPI / Bank UTR Reference No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="e.g. 431098765432 or UPI Ref ID"
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Payment Note / Account (Optional)
                  </label>
                  <input
                    type="text"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="e.g. Sent via PhonePe to registered mobile"
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProUpiModal(null)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button type="submit" loading={settleLoading}>
                    Confirm & Mark Settled
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
