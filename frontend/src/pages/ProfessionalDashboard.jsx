import { useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import Modal from "../components/Modal";
import { formatAddress } from "../utils/address";

export default function ProfessionalDashboard() {
  const { token } = useAuth();
  const me = useFetch("/professionals/me", token);
  const jobs = useFetch("/professionals/requests", token);
  const earnings = useFetch("/professionals/earnings", token);
  const reviewsData = useFetch("/professionals/reviews", token);
  const [error, setError] = useState("");
  const [payCommissionLoading, setPayCommissionLoading] = useState(false);
  const [commissionSuccessMsg, setCommissionSuccessMsg] = useState("");

  const [billModal, setBillModal] = useState(null);
  const [billForm, setBillForm] = useState({ laborCharges: "", materialsCost: "", workNotes: "" });
  const [billLoading, setBillLoading] = useState(false);

  if (me.loading) return <Loader />;
  const pro = me.data?.user;
  const verification = me.data?.verification;
  const approved = pro?.status === "approved";

  const handlePayCommissionOnline = async () => {
    setError("");
    setCommissionSuccessMsg("");
    setPayCommissionLoading(true);

    try {
      if (!window.Razorpay) {
        throw new Error("Razorpay payment gateway could not be loaded. Please check your internet connection.");
      }

      const order = await api("/professionals/pay-commission/order", {
        method: "POST",
        token,
      });

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "HomeCrew Platform Fee",
        description: `Cash Commission Clearance - ₹${order.netCommissionDue}`,
        order_id: order.orderId,
        prefill: {
          name: pro?.name || "",
          email: pro?.email || "",
          contact: pro?.phone || "",
        },
        theme: {
          color: "#3f7230",
        },
        handler: async function (response) {
          try {
            const verifyRes = await api("/professionals/pay-commission/verify", {
              method: "POST",
              body: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              token,
            });
            setCommissionSuccessMsg(verifyRes.message || "Commission paid successfully! Your account is unlocked for new offers.");
            earnings.reload();
            me.reload();
            jobs.reload();
          } catch (err) {
            setError(err.message || "Failed to verify commission payment");
          }
        },
        modal: {
          ondismiss: function () {
            setPayCommissionLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || "Failed to initiate commission payment");
    } finally {
      setPayCommissionLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    try {
      await api(`/professionals/requests/${id}/status`, { method: "PUT", body: { status }, token });
      jobs.reload();
      earnings.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitBillAndComplete = async (e) => {
    e.preventDefault();
    if (!billModal) return;
    setBillLoading(true);
    setError("");
    try {
      await api(`/professionals/requests/${billModal._id}/status`, {
        method: "PUT",
        body: {
          status: "completed",
          laborCharges: billForm.laborCharges,
          materialsCost: billForm.materialsCost,
          workNotes: billForm.workNotes,
        },
        token,
      });
      setBillModal(null);
      setBillForm({ laborCharges: "", materialsCost: "", workNotes: "" });
      jobs.reload();
      earnings.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBillLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader title="Professional dashboard" subtitle={`${pro?.type} • ${pro?.service?.name} • ${pro?.experience} yrs experience`}>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/pro/profile" className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">Edit profile</Link>
          <StatusBadge status={pro?.status} />
        </div>
      </PageHeader>

      {pro?.status === "pending" && (
        <Alert type="warning">Your documents are under review. You will receive jobs once an admin approves your profile.</Alert>
      )}
      {pro?.status === "rejected" && (
        <Alert>Your registration was rejected. {verification?.remarks && `Admin remarks: ${verification.remarks}`}</Alert>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800">My details</h3>
          {pro?.email && (
            <p className="mt-2 break-all text-sm text-gray-500">📧 {pro.email} {pro.emailVerified && <span className="text-brand-600">✓</span>}</p>
          )}
          <p className="text-sm text-gray-500">📞 {pro?.phone} {pro?.phoneVerified && <span className="text-brand-600">✓</span>}</p>
          {formatAddress(pro?.address) && <p className="text-sm text-gray-500">📍 {formatAddress(pro.address)}</p>}
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800">Submitted documents</h3>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            {verification && (
              <>
                <a className="text-brand-600 hover:underline" href={fileUrl(verification.idDocument)} target="_blank" rel="noreferrer">View ID document</a>
                <a className="text-brand-600 hover:underline" href={fileUrl(verification.certificate)} target="_blank" rel="noreferrer">View certificate</a>
              </>
            )}
          </div>
        </div>
      </div>

      {approved && (
        <>
          {/* Earnings & Wallet Overview */}
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">My Earnings & Payouts</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Net Earnings</p>
                <p className="mt-1 text-2xl font-bold text-brand-800">
                  ₹{earnings.data?.summary?.totalNetEarnings ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">After 10% platform commission</p>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cash in Hand (Doorstep)</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  ₹{earnings.data?.summary?.cashCollected ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Kept directly by you</p>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payout from Admin</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">
                  ₹{earnings.data?.summary?.netPayoutFromAdmin ?? earnings.data?.summary?.pendingPayouts ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {earnings.data?.summary?.cashCommissionOwed > 0
                    ? `Auto-offsetting ₹${earnings.data?.summary?.cashCommissionOwed} cash fee`
                    : "Online payments pending transfer"}
                </p>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payouts Settled</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  ₹{earnings.data?.summary?.settledPayouts ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Transferred to your bank/UPI</p>
              </div>
            </div>

            {/* Real-time cash commission status & Debt Limit Suspensions */}
            {commissionSuccessMsg && (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <span>✓</span> {commissionSuccessMsg}
              </div>
            )}

            {earnings.data?.summary?.isBlockedForDebt ? (
              <div className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50/90 p-4 shadow-sm text-red-950">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="max-w-xl">
                    <p className="font-bold text-sm text-red-800 flex items-center gap-1.5">
                      <span>⛔</span> Account Temporarily Suspended for New Job Offers
                    </p>
                    <p className="mt-1 text-xs text-red-700 leading-relaxed">
                      You have collected <b>₹{earnings.data?.summary?.cashCollected}</b> in Cash on Service.
                      Your unpaid platform fee balance is <b>₹{earnings.data?.summary?.netCommissionOwedToAdmin}</b>, which exceeds the company limit of <b>₹{earnings.data?.summary?.cashDebtLimit}</b>.
                      You cannot receive new customer jobs until this commission is paid to HomeCrew.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePayCommissionOnline}
                    disabled={payCommissionLoading}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                  >
                    <span>💳</span> {payCommissionLoading ? "Processing..." : `Pay Fee Online (₹${earnings.data?.summary?.netCommissionOwedToAdmin})`}
                  </button>
                </div>
              </div>
            ) : earnings.data?.summary?.netCommissionOwedToAdmin > 0 ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-amber-950">
                    💡 Cash Commission Balance: ₹{earnings.data?.summary?.netCommissionOwedToAdmin}
                  </span>
                  <span className="text-[11px] text-amber-700 ml-1.5">
                    ({earnings.data?.summary?.cashDebtLimit - earnings.data?.summary?.netCommissionOwedToAdmin} remaining before account suspension limit of ₹{earnings.data?.summary?.cashDebtLimit})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePayCommissionOnline}
                  disabled={payCommissionLoading}
                  className="rounded-lg bg-amber-700 hover:bg-amber-800 text-white px-3 py-1 text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                >
                  {payCommissionLoading ? "Processing..." : `Pay Fee Early (₹${earnings.data?.summary?.netCommissionOwedToAdmin})`}
                </button>
              </div>
            ) : earnings.data?.summary?.cashCommissionOwed > 0 ? (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-center justify-between gap-2">
                <span>
                  💡 <b>Auto-Offset Active:</b> All cash commission fees (₹{earnings.data?.summary?.cashCommissionOwed}) are fully covered and auto-deducted from your online pending payouts.
                </span>
                <span className="font-bold whitespace-nowrap text-blue-950">
                  Net Receivable from Admin: ₹{earnings.data?.summary?.netPayoutFromAdmin}
                </span>
              </div>
            ) : null}
          </section>

          {/* Assigned Jobs */}
          <h2 className="mb-4 mt-10 text-lg font-semibold text-gray-800">My assigned jobs</h2>
          <Alert>{error}</Alert>
          {jobs.loading ? (
            <Loader />
          ) : (jobs.data?.requests || []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center text-gray-500">
              No jobs assigned yet.
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.data.requests.map((r) => (
                <div key={r._id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-800">{r.service?.icon} {r.service?.name}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{r.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex flex-wrap items-center gap-2 font-medium text-gray-700">
                      <span>👤 {r.customer?.name} • 📞 {r.customer?.phone}</span>
                      {r.customer?.phone && (
                        <a
                          href={`tel:${r.customer.phone}`}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                          title="Directly call customer"
                        >
                          📞 Call Customer
                        </a>
                      )}
                    </div>
                    <p className="mt-1">📍 {r.location}</p>
                    <p>🕒 {new Date(r.preferredTime).toLocaleString()}</p>
                    <p className="text-xs text-brand-700 font-medium mt-1">
                      💳 Payment Preference:{" "}
                      <b>{r.payment?.preferredMethod === "cash" ? "Cash on Service (COD)" : "Online Payment"}</b>
                    </p>
                  </div>

                  {/* Billing & Payout Status for completed jobs */}
                  {r.status === "completed" && (
                    <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-semibold text-gray-700">Final Bill: </span>
                          <span className="font-bold text-brand-900 text-sm">₹{r.billing?.totalAmount || 0}</span>
                          <span className="ml-1 text-gray-500">
                            (Labor: ₹{r.billing?.laborCharges || 0}
                            {r.billing?.materialsCost > 0 ? ` + Parts: ₹${r.billing.materialsCost}` : ""})
                          </span>
                        </div>
                        <div>
                          {r.payment?.status === "paid" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                              ✓ {r.payment.method === "cash" ? "Cash Collected by You" : "Paid Online"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                              ⏳ Awaiting Customer Payment
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Professional's Net Earning and Payout note */}
                      {r.payment?.status === "paid" && (
                        <div className="mt-2 flex flex-wrap items-center justify-between border-t border-brand-100/60 pt-2 text-[11px] text-gray-600">
                          <span>
                            Your share (90%): <b>₹{r.payment.professionalNet}</b> • Platform fee (10%): ₹{r.payment.platformFee}
                          </span>
                          <span>
                            {r.payment.method === "cash" ? (
                              <span className="text-gray-500">Kept in cash directly</span>
                            ) : r.payout?.status === "settled" ? (
                              <span className="font-semibold text-emerald-700">✓ Payout Settled ({r.payout.transactionRef || "Bank Transfer"})</span>
                            ) : (
                              <span className="font-semibold text-amber-700">⏳ Payout Pending from Admin</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {r.status === "assigned" && (
                      <Button onClick={() => updateStatus(r._id, "in-progress")}>Start work</Button>
                    )}
                    {r.status === "in-progress" && (
                      <Button
                        onClick={() => {
                          setBillModal(r);
                          setBillForm({ laborCharges: "", materialsCost: "", workNotes: "" });
                        }}
                      >
                        Complete & Generate Bill
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bill Generation Modal */}
          {billModal && (
            <Modal title="Generate Final Bill & Complete Job" onClose={() => setBillModal(null)}>
              <form onSubmit={submitBillAndComplete} className="space-y-4">
                <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
                  <p className="font-semibold">Service: {billModal.service?.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span>Customer: <b>{billModal.customer?.name}</b> ({billModal.customer?.phone})</span>
                    {billModal.customer?.phone && (
                      <a
                        href={`tel:${billModal.customer.phone}`}
                        className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        📞 Call
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-gray-500">
                    Enter the actual labor charges and replacement parts cost after on-site inspection/work.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Labor / Service Charges (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={billForm.laborCharges}
                    onChange={(e) => setBillForm({ ...billForm, laborCharges: e.target.value })}
                    placeholder="e.g. 350"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Parts / Materials Cost (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={billForm.materialsCost}
                    onChange={(e) => setBillForm({ ...billForm, materialsCost: e.target.value })}
                    placeholder="e.g. 150 (leave empty if none)"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                {/* Live total & share calculation */}
                {Number(billForm.laborCharges) > 0 && (
                  <div className="rounded-xl border border-brand-200 bg-white p-3 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-gray-800 text-sm">
                      <span>Total Customer Bill:</span>
                      <span>₹{(Number(billForm.laborCharges) || 0) + (Number(billForm.materialsCost) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Platform Commission (10%):</span>
                      <span>₹{Math.round(((Number(billForm.laborCharges) || 0) + (Number(billForm.materialsCost) || 0)) * 0.1)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-brand-800 border-t pt-1">
                      <span>Your Net Payout (90%):</span>
                      <span>₹{((Number(billForm.laborCharges) || 0) + (Number(billForm.materialsCost) || 0)) - Math.round(((Number(billForm.laborCharges) || 0) + (Number(billForm.materialsCost) || 0)) * 0.1)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Work Description / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={billForm.workNotes}
                    onChange={(e) => setBillForm({ ...billForm, workNotes: e.target.value })}
                    placeholder="e.g. Repaired faulty wiring, replaced 1 switch."
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBillModal(null)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button type="submit" loading={billLoading}>
                    Submit Bill & Complete
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}
      
<section className="mt-10">
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Customer Reviews
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Feedback received from customers after completed jobs.
      </p>
    </div>

    <div className="rounded-xl border border-brand-100 bg-white px-5 py-3">
      <p className="text-sm text-gray-500">Average rating</p>
      <p className="text-2xl font-bold text-gray-800">
        ★ {reviewsData.data?.averageRating ?? 0}
        <span className="text-sm font-normal text-gray-500"> / 5</span>
      </p>
      <p className="text-xs text-gray-500">
        {reviewsData.data?.totalReviews ?? 0} reviews
      </p>
    </div>
  </div>

  {reviewsData.error && (
    <Alert>{reviewsData.error}</Alert>
  )}

  {reviewsData.loading ? (
    <Loader />
  ) : (reviewsData.data?.reviews || []).length === 0 ? (
    <p className="rounded-xl border border-dashed border-brand-200 bg-white p-8 text-center text-gray-500">
      No customer reviews yet. Complete jobs to receive feedback.
    </p>
  ) : (
    <div className="space-y-4">
      {reviewsData.data.reviews.map((review) => (
        <article
          key={review._id}
          className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-800">
                {review.customer}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {review.service?.icon} {review.service?.name}
              </p>
            </div>
            <span className="text-sm text-gray-500">
              {review.submittedAt
                ? new Date(review.submittedAt).toLocaleDateString()
                : ""}
            </span>
          </div>

          <p className="mt-3 text-lg tracking-wide text-amber-400">
            {"★".repeat(review.rating)}
            <span className="text-gray-300">
              {"★".repeat(5 - review.rating)}
            </span>
            <span className="ml-2 text-sm text-gray-600">
              {review.rating}/5
            </span>
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {review.comment}
          </p>
        </article>
      ))}
    </div>
  )}
</section>

    </div>
  );
}
