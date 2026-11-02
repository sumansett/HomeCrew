import { useState } from "react";
import { api } from "../api/client";
import Button from "./Button";
import Alert from "./Alert";
import Modal from "./Modal";

export default function PaymentSection({ request, token, onPaid }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCodConfirm, setShowCodConfirm] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const billing = request.billing || {};
  const payment = request.payment || {};
  const totalAmount = billing.totalAmount || 0;
  const isPaid = payment.status === "paid";

  // If the job is not yet completed or no bill has been generated yet
  if (request.status !== "completed" || totalAmount <= 0) {
    return null;
  }

  // 1. Pay Online via Razorpay
  const handleRazorpayPayment = async () => {
    setError("");
    setLoading(true);

    try {
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK could not be loaded. Please check your internet connection.");
      }

      // Create order on backend
      const orderData = await api("/payments/create-order", {
        method: "POST",
        body: { requestId: request._id },
        token,
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "HomeCrew Services",
        description: `Payment for ${orderData.serviceName || "Service"}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customer?.name || "",
          email: orderData.customer?.email || "",
          contact: orderData.customer?.phone || "",
        },
        theme: {
          color: "#3f7230", // HomeCrew brand primary color
        },
        handler: async function (response) {
          try {
            await api("/payments/verify", {
              method: "POST",
              body: {
                requestId: request._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              token,
            });
            if (onPaid) onPaid();
          } catch (err) {
            setError(err.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (resp) {
        setError(resp.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setError(err.message || "Could not initiate online payment");
    } finally {
      setLoading(false);
    }
  };

  // 2. Cash on Service (Pay Cash to Technician at Doorstep)
  const handleCashOnService = async () => {
    setError("");
    setLoading(true);
    try {
      await api("/payments/cash-on-service", {
        method: "POST",
        body: { requestId: request._id },
        token,
      });
      setShowCodConfirm(false);
      if (onPaid) onPaid();
    } catch (err) {
      setError(err.message || "Could not confirm cash on delivery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-brand-200 bg-linear-to-b from-white to-brand-50/30 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧾</span>
          <h4 className="font-bold text-gray-800">Final Service Bill</h4>
        </div>
        <div>
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
              {payment.method === "cash" ? "Paid via Cash on Service" : "Paid Online (Razorpay)"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse"></span>
              Payment Pending
            </span>
          )}
        </div>
      </div>

      {error && <div className="mt-3"><Alert type="error">{error}</Alert></div>}

      {/* Bill Breakdown */}
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Labor & Service charge</span>
          <span className="font-medium text-gray-800">₹{billing.laborCharges || 0}</span>
        </div>
        {billing.materialsCost > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Parts & Materials</span>
            <span className="font-medium text-gray-800">₹{billing.materialsCost}</span>
          </div>
        )}
        {billing.workNotes && (
          <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500 italic">
            Note: “{billing.workNotes}”
          </p>
        )}
        <div className="flex justify-between border-t border-brand-100 pt-2 text-base font-bold text-brand-900">
          <span>Total Payable</span>
          <span>₹{totalAmount}</span>
        </div>
      </div>

      {/* Action Buttons: Pay Online or Cash on Service */}
      {/* Action Buttons: Pay via Selected Method Only */}
      {!isPaid ? (
        <div className="mt-4 pt-3 border-t border-dashed border-brand-100">
          <div className="mb-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3 text-xs text-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <span>🔒</span> Mandatory Payment Method
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 font-bold text-brand-800 border border-brand-200 text-[11px]">
                {payment.preferredMethod === "cash" ? "💵 Cash on Service (COD)" : "💳 Online Payment (Razorpay)"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-600">
              {payment.preferredMethod === "cash"
                ? `You selected Cash on Service at booking. Please pay the total amount of ₹${totalAmount} in cash directly to the technician at your doorstep.`
                : `You selected Online Payment at booking. Please complete the payment of ₹${totalAmount} online using UPI, Credit/Debit card, or NetBanking.`}
            </p>
          </div>

          <div>
            {payment.preferredMethod === "cash" ? (
              <button
                type="button"
                onClick={() => setShowCodConfirm(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
              >
                <span>💵</span> Confirm Cash Paid to Technician (₹{totalAmount})
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50"
              >
                <span>💳</span> Pay ₹{totalAmount} Online (Razorpay)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 pt-3">
          <p className="text-xs text-gray-500">
            Paid on {new Date(payment.paidAt || Date.now()).toLocaleString()}
            {payment.razorpayPaymentId && (
              <span className="block text-[11px] text-gray-400">Ref: {payment.razorpayPaymentId}</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline"
          >
            <span>📄</span> View Printable Invoice
          </button>
        </div>
      )}

      {/* Cash on Service Confirmation Modal */}
      {showCodConfirm && (
        <Modal title="Confirm Cash on Service" onClose={() => setShowCodConfirm(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You have chosen to pay <b className="text-gray-900">₹{totalAmount} in cash</b> directly to the technician (
              {request.assignedProfessional?.name || "assigned technician"}) upon completion of work at your doorstep.
            </p>
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              💡 Please ensure you hand over the exact cash amount to the technician.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCodConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Go Back
              </button>
              <Button onClick={handleCashOnService} loading={loading}>
                Confirm Cash Payment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Invoice Modal */}
      {showInvoiceModal && (
        <Modal title="Tax Invoice / Receipt" onClose={() => setShowInvoiceModal(false)}>
          <div className="space-y-4 p-2 text-gray-800" id="printable-invoice">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-brand-800">HomeCrew</h3>
                <p className="text-xs text-gray-500">Verified Household Services</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p className="font-semibold text-gray-700">INVOICE #{request._id.slice(-8).toUpperCase()}</p>
                <p>Date: {new Date(payment.paidAt || request.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="font-semibold text-gray-500 uppercase">Service Delivered to:</p>
                <p className="font-medium text-gray-800">{request.customer?.name}</p>
                <p className="text-gray-600">{request.location}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-500 uppercase">Technician:</p>
                <p className="font-medium text-gray-800">{request.assignedProfessional?.name || "HomeCrew Technician"}</p>
                <p className="text-gray-600">Service: {request.service?.name}</p>
              </div>
            </div>

            <table className="w-full text-left text-sm border-t border-b py-2">
              <thead>
                <tr className="border-b text-xs font-semibold text-gray-500">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                <tr>
                  <td className="py-2">Labor & Service Charges</td>
                  <td className="py-2 text-right font-medium">₹{billing.laborCharges || 0}</td>
                </tr>
                {billing.materialsCost > 0 && (
                  <tr>
                    <td className="py-2">Replacement Parts & Materials</td>
                    <td className="py-2 text-right font-medium">₹{billing.materialsCost}</td>
                  </tr>
                )}
                <tr className="font-bold text-sm bg-gray-50">
                  <td className="py-2 px-1">Total Paid</td>
                  <td className="py-2 px-1 text-right text-brand-800">₹{totalAmount}</td>
                </tr>
              </tbody>
            </table>

            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              <p>Payment Mode: <b className="capitalize">{payment.method === "cash" ? "Cash on Service" : "Online (Razorpay)"}</b></p>
              <p>Status: <b className="text-emerald-700">PAID</b></p>
              {payment.razorpayPaymentId && <p>Transaction ID: {payment.razorpayPaymentId}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-gray-800 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
