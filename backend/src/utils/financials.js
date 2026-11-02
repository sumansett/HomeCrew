const ServiceRequest = require("../models/ServiceRequest");

/**
 * Calculates real-time financial stats, auto-offset balance, and cash debt status for a professional.
 * Uses Urban Company / Uber wallet auto-offset model:
 * - 10% platform fee on cash orders is auto-deducted from pending online payouts.
 * - If net cash debt exceeds MAX_CASH_DEBT_LIMIT (default 500), technician is blocked from receiving new job offers.
 */
async function getProfessionalFinancialSummary(professionalId) {
  const jobs = await ServiceRequest.find({
    assignedProfessional: professionalId,
    status: "completed",
    "billing.totalAmount": { $gt: 0 },
  }).lean();

  let totalBilled = 0;
  let totalNetEarnings = 0;
  let cashCollected = 0;
  let onlineCollected = 0;
  let cashCommissionOwed = 0;
  let onlinePending = 0;
  let onlineSettled = 0;

  jobs.forEach((j) => {
    const total = Number(j.billing?.totalAmount) || 0;
    const comm = Number(j.payment?.platformFee) || Math.round(total * 0.1);
    const net = Number(j.payment?.professionalNet) || total - comm;
    totalBilled += total;

    if (j.payment?.status === "paid") {
      totalNetEarnings += net;
      if (j.payment?.method === "cash") {
        cashCollected += total;
        if (j.payout?.status === "collected_cash") {
          cashCommissionOwed += comm;
        }
      } else if (j.payment?.method === "online") {
        onlineCollected += total;
        if (j.payout?.status === "settled") {
          onlineSettled += net;
        } else {
          onlinePending += net;
        }
      }
    }
  });

  const netPayableByAdmin = Math.max(0, onlinePending - cashCommissionOwed);
  const netCommissionOwedToAdmin = Math.max(0, cashCommissionOwed - onlinePending);
  const cashDebtLimit = Number(process.env.MAX_CASH_DEBT_LIMIT) || 500;
  const isBlockedForDebt = netCommissionOwedToAdmin >= cashDebtLimit;

  return {
    totalJobs: jobs.length,
    totalBilled,
    totalNetEarnings,
    cashCollected,
    onlineCollected,
    cashCommissionOwed,
    onlinePending,
    onlineSettled,
    netPayableByAdmin,
    netCommissionOwedToAdmin,
    cashDebtLimit,
    isBlockedForDebt,
  };
}

module.exports = {
  getProfessionalFinancialSummary,
};
