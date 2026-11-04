const Admin = require("../models/Admin");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Verification = require("../models/Verification");
const ServiceRequest = require("../models/ServiceRequest");
const Service = require("../models/Service");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { getProfessionalFinancialSummary } = require("../utils/financials");
const { createNotification } = require("../utils/notify");

// POST /api/admin/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid admin credentials");
  }
  res.json({ success: true, token: generateToken(admin._id, "admin"), role: "admin", user: admin });
});

// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [users, professionals, pendingVerifications, services, requests, pendingRequests, completedRequests] =
    await Promise.all([
      User.countDocuments(),
      Professional.countDocuments({ status: "approved" }),
      Verification.countDocuments({ status: "pending" }),
      Service.countDocuments(),
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: "pending" }),
      ServiceRequest.countDocuments({ status: "completed" }),
    ]);
  const recent = await ServiceRequest.find()
    .populate("service", "name icon")
    .populate("customer", "name")
    .sort({ createdAt: -1 })
    .limit(5);
  res.json({
    success: true,
    stats: { users, professionals, pendingVerifications, services, requests, pendingRequests, completedRequests },
    recent,
  });
});

// ---------- Users ----------
// All customer details + how many requests each has made
exports.getUsers = asyncHandler(async (req, res) => {
  const [users, counts] = await Promise.all([
    User.find().sort({ createdAt: -1 }),
    ServiceRequest.aggregate([
      {
        $group: {
          _id: "$customer",
          totalRequests: { $sum: 1 },
          completedRequests: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const byUser = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  res.json({
    success: true,
    users: users.map((u) => ({
      ...u.toJSON(),
      totalRequests: byUser[String(u._id)]?.totalRequests || 0,
      completedRequests: byUser[String(u._id)]?.completedRequests || 0,
    })),
  });
});

// GET /api/admin/users/:id -> one customer + every request they made
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("Customer not found");
  }
  const requests = await ServiceRequest.find({ customer: user._id })
    .populate("service", "name icon")
    .populate("assignedProfessional", "name type phone")
    .sort({ createdAt: -1 });
  res.json({ success: true, user, requests });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "User deleted" });
});

// ---------- Professionals & verification ----------
exports.getProfessionals = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const professionals = await Professional.find(filter)
    .populate("service", "name icon")
    .sort({ createdAt: -1 })
    .lean();
  const ids = professionals.map((p) => p._id);

  const [verifications, reviewed] = await Promise.all([
    Verification.find({ professional: { $in: ids } }).lean(),
    // every customer review given to these professionals
    ServiceRequest.find({ assignedProfessional: { $in: ids }, "review.rating": { $exists: true } })
      .populate("customer", "name avatar")
      .populate("service", "name icon")
      .sort({ "review.submittedAt": -1 })
      .lean(),
  ]);

  const byPro = Object.fromEntries(verifications.map((v) => [String(v.professional), v]));
  const reviewsByPro = {};
  for (const r of reviewed) {
    const key = String(r.assignedProfessional);
    (reviewsByPro[key] = reviewsByPro[key] || []).push({
      _id: r._id,
      customer: r.customer,
      service: r.service,
      rating: r.review.rating,
      comment: r.review.comment,
      submittedAt: r.review.submittedAt,
    });
  }

  const financialsList = await Promise.all(
    professionals.map((p) => getProfessionalFinancialSummary(p._id))
  );
  const financialsByPro = Object.fromEntries(
    professionals.map((p, idx) => [String(p._id), financialsList[idx]])
  );

  const result = professionals.map((p) => {
    delete p.password;
    delete p.pendingContact; // .lean() skips the model's toJSON, so strip the OTP data here
    const reviews = reviewsByPro[String(p._id)] || [];
    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;
    return {
      ...p,
      verification: byPro[String(p._id)] || null,
      reviews,
      averageRating,
      totalReviews: reviews.length,
      financials: financialsByPro[String(p._id)] || null,
    };
  });
  res.json({ success: true, professionals: result });
});

// PUT /api/admin/professionals/:id/verify   { status: approved|rejected, remarks }
exports.verifyProfessional = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Status must be approved or rejected");
  }
  const pro = await Professional.findById(req.params.id);
  if (!pro) {
    res.status(404);
    throw new Error("Professional not found");
  }
  pro.status = status;
  await pro.save();
  const verification = await Verification.findOneAndUpdate(
    { professional: pro._id },
    { status, remarks: remarks || "", reviewedAt: new Date() },
    { new: true }
  );

  createNotification({
    recipientRole: "professional",
    recipientId: pro._id,
    title: `Profile ${status === "approved" ? "Approved" : "Status Updated"}`,
    message: status === "approved"
      ? "Congratulations! Your profile has been approved. You are now eligible to receive service bookings."
      : `Your registration status is now: ${status}. ${remarks || ""}`,
    type: "system",
    link: "/pro/dashboard",
  });

  res.json({ success: true, professional: pro, verification });
});

exports.deleteProfessional = asyncHandler(async (req, res) => {
  await Verification.deleteOne({ professional: req.params.id });
  await Professional.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Professional deleted" });
});

// ---------- Service requests ----------
exports.getRequests = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const requests = await ServiceRequest.find(filter)
    .populate("service", "name icon category")
    .populate("customer", "name email phone")
    .populate("assignedProfessional", "name phone type")
    .sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// GET /api/admin/requests/:id/professionals  -> verified pros for that service with debt check
exports.getAssignable = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  const professionals = await Professional.find({ status: "approved", service: request.service })
    .select("name phone type experience");

  const assignable = await Promise.all(
    professionals.map(async (p) => {
      const fin = await getProfessionalFinancialSummary(p._id);
      return {
        _id: p._id,
        name: p.name,
        phone: p.phone,
        type: p.type,
        experience: p.experience,
        financials: fin,
        isBlockedForDebt: fin.isBlockedForDebt,
        netCommissionOwedToAdmin: fin.netCommissionOwedToAdmin,
        cashDebtLimit: fin.cashDebtLimit,
      };
    })
  );

  res.json({ success: true, professionals: assignable });
});

// PUT /api/admin/requests/:id/assign   { professionalId }
exports.assignProfessional = asyncHandler(async (req, res) => {
  const { professionalId } = req.body;
  const pro = await Professional.findById(professionalId);
  if (!pro || pro.status !== "approved") {
    res.status(400);
    throw new Error("Only approved professionals can be assigned");
  }

  // Check if technician has exceeded maximum allowable cash commission debt
  const fin = await getProfessionalFinancialSummary(pro._id);
  if (fin.isBlockedForDebt) {
    res.status(400);
    throw new Error(
      `Cannot assign ${pro.name}: Unpaid cash platform commission limit reached (₹${fin.netCommissionOwedToAdmin} owed, limit is ₹${fin.cashDebtLimit}). Please collect or clear their commission dues to unlock assignments.`
    );
  }

  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  request.assignedProfessional = pro._id;
  request.status = "assigned";
  await request.save();

  // Notify technician
  createNotification({
    recipientRole: "professional",
    recipientId: pro._id,
    title: "New Job Assigned",
    message: `You have been assigned to a service request at ${request.location}.`,
    type: "assignment",
    link: "/pro/dashboard",
  });

  // Notify customer
  createNotification({
    recipientRole: "customer",
    recipientId: request.customer,
    title: "Technician Assigned",
    message: `${pro.name} (${pro.phone}) has been assigned to your request.`,
    type: "assignment",
    link: "/my-requests",
  });

  res.json({ success: true, request });
});

// PUT /api/admin/requests/:id/status   { status }
exports.updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  request.status = status;
  await request.save();
  res.json({ success: true, request });
});

// PUT /api/admin/requests/:id/payment  { status: "paid" | "unpaid", method: "cash" | "online" }
exports.updateRequestPayment = asyncHandler(async (req, res) => {
  const { status, method } = req.body;
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }

  const rate = Number(process.env.PLATFORM_COMMISSION_PERCENT) || 10;
  const total = Number(request.billing?.totalAmount) || 0;
  const platformFee = Math.round(total * (rate / 100));
  const professionalNet = total - platformFee;

  if (status === "paid") {
    request.payment = {
      preferredMethod: request.payment?.preferredMethod || method || "cash",
      status: "paid",
      method: method || "cash",
      razorpayOrderId: request.payment?.razorpayOrderId || "",
      razorpayPaymentId: request.payment?.razorpayPaymentId || `ADMIN_CONFIRMED_${Date.now().toString().slice(-6)}`,
      paidAt: request.payment?.paidAt || new Date(),
      commissionRate: rate,
      platformFee,
      professionalNet,
    };

    if (method === "cash") {
      request.payout = {
        status: "collected_cash",
        settledAt: new Date(),
        transactionRef: "PAID_CASH_ON_SITE",
        note: "Cash collected directly by technician",
      };
    } else {
      request.payout = {
        status: "pending",
        settledAt: null,
        transactionRef: "",
        note: "",
      };
    }
  } else if (status === "unpaid") {
    request.payment.status = "unpaid";
    request.payment.paidAt = null;
    request.payout.status = "pending";
  }

  await request.save();
  res.json({ success: true, request });
});

exports.getReviews = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find({
    "review.rating": { $exists: true },
  })
    .populate("customer", "name email")
    .populate("assignedProfessional", "name email type")
    .populate("service", "name icon")
    .sort({ "review.submittedAt": -1 });

  const reviews = requests.map((request) => ({
    _id: request._id,
    requestId: request._id,
    customer: request.customer,
    professional: request.assignedProfessional,
    service: request.service,
    rating: request.review.rating,
    comment: request.review.comment,
    submittedAt: request.review.submittedAt,
  }));

  res.json({ success: true, reviews });
});

// GET /api/admin/financials
exports.getFinancials = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find({
    status: "completed",
    "billing.totalAmount": { $gt: 0 },
  })
    .populate("customer", "name email phone")
    .populate("assignedProfessional", "name email phone type")
    .populate("service", "name icon")
    .sort({ "billing.invoicedAt": -1, createdAt: -1 });

  let totalBilled = 0;
  let totalPlatformCommission = 0;
  let totalProfessionalNet = 0;
  let totalCashVolume = 0;
  let totalOnlineVolume = 0;
  let pendingPayoutsToPros = 0;
  let settledPayoutsToPros = 0;

  // Track per-technician balances for auto-deducting cash commission
  const techMap = {};

  requests.forEach((r) => {
    const total = Number(r.billing?.totalAmount) || 0;
    const comm = Number(r.payment?.platformFee) || 0;
    const net = Number(r.payment?.professionalNet) || 0;

    totalBilled += total;

    if (r.payment?.status === "paid") {
      totalPlatformCommission += comm;
      totalProfessionalNet += net;

      if (r.assignedProfessional) {
        const proId = r.assignedProfessional._id.toString();
        if (!techMap[proId]) {
          techMap[proId] = {
            professional: r.assignedProfessional,
            totalJobs: 0,
            cashVolume: 0,
            cashCommissionOwed: 0, // 10% owed to Admin from cash
            onlineNetEarnings: 0,  // 90% online held by Admin
            onlineSettled: 0,
            onlinePending: 0,
          };
        }
        const t = techMap[proId];
        t.totalJobs++;

        if (r.payment?.method === "cash") {
          totalCashVolume += total;
          if (r.payout?.status === "collected_cash") {
            t.cashVolume += total;
            t.cashCommissionOwed += comm;
          }
        } else if (r.payment?.method === "online") {
          totalOnlineVolume += total;
          t.onlineNetEarnings += net;
          if (r.payout?.status === "settled") {
            settledPayoutsToPros += net;
            t.onlineSettled += net;
          } else {
            pendingPayoutsToPros += net;
            t.onlinePending += net;
          }
        }
      }
    }
  });

  const technicianAccounts = Object.values(techMap).map((t) => {
    // Auto-offset: Deduct cash commission owed from pending online payouts!
    const netPayableByAdmin = Math.max(0, t.onlinePending - t.cashCommissionOwed);
    const netCommissionOwedToAdmin = Math.max(0, t.cashCommissionOwed - t.onlinePending);
    return {
      ...t,
      netPayableByAdmin,
      netCommissionOwedToAdmin,
    };
  });

  res.json({
    success: true,
    summary: {
      totalTransactions: requests.length,
      totalBilled,
      totalPlatformCommission,
      totalProfessionalNet,
      totalCashVolume,
      totalOnlineVolume,
      pendingPayoutsToPros,
      settledPayoutsToPros,
      commissionRate: Number(process.env.PLATFORM_COMMISSION_PERCENT) || 10,
    },
    technicianAccounts,
    requests,
  });
});

// POST /api/admin/payouts/:id/settle
exports.settlePayout = asyncHandler(async (req, res) => {
  const { transactionRef, note } = req.body || {};
  const request = await ServiceRequest.findById(req.params.id)
    .populate("assignedProfessional", "name email phone");

  if (!request) {
    res.status(404);
    throw new Error("Service request not found");
  }

  if (request.status !== "completed") {
    res.status(400);
    throw new Error("Can only settle payouts on completed jobs");
  }

  if (request.payment?.status !== "paid") {
    res.status(400);
    throw new Error("Cannot settle payout for an unpaid request");
  }

  request.payout = {
    status: "settled",
    settledAt: new Date(),
    transactionRef: transactionRef ? String(transactionRef).trim() : `UTR_${Date.now().toString().slice(-6)}`,
    note: note ? String(note).trim() : "Payout transferred by Admin",
  };

  await request.save();

  if (request.assignedProfessional?._id) {
    createNotification({
      recipientRole: "professional",
      recipientId: request.assignedProfessional._id,
      title: "Online Payout Settled",
      message: `Admin released payout of ₹${request.payment?.professionalNet || 0} (Ref: ${request.payout.transactionRef}).`,
      type: "payout",
      link: "/pro/dashboard",
    });
  }

  res.json({
    success: true,
    message: "Payout settled successfully",
    request,
  });
});

// POST /api/admin/financials/clear-cash-commission
exports.clearCashCommission = asyncHandler(async (req, res) => {
  const { professionalId, transactionRef, note } = req.body || {};
  if (!professionalId) {
    res.status(400);
    throw new Error("Professional ID is required");
  }

  const cashRequests = await ServiceRequest.find({
    assignedProfessional: professionalId,
    "payment.status": "paid",
    "payment.method": "cash",
    "payout.status": "collected_cash",
  });

  for (const r of cashRequests) {
    r.payout.status = "settled";
    r.payout.settledAt = new Date();
    r.payout.transactionRef = transactionRef ? String(transactionRef).trim() : `CASH_COMM_${Date.now().toString().slice(-6)}`;
    r.payout.note = note ? String(note).trim() : "Cash commission received by Admin";
    await r.save();
  }

  createNotification({
    recipientRole: "professional",
    recipientId: professionalId,
    title: "Cash Commission Settled",
    message: `Platform fees for ${cashRequests.length} cash orders have been marked as collected. Your account is fully unlocked.`,
    type: "payout",
    link: "/pro/dashboard",
  });

  res.json({
    success: true,
    message: `Cash commission recorded as collected for ${cashRequests.length} jobs`,
  });
});

// POST /api/admin/financials/settle-pro-payout
exports.settleProfessionalPayouts = asyncHandler(async (req, res) => {
  const { professionalId, transactionRef, note } = req.body || {};
  if (!professionalId) {
    res.status(400);
    throw new Error("Professional ID is required");
  }

  const pendingRequests = await ServiceRequest.find({
    assignedProfessional: professionalId,
    "payment.status": "paid",
    "payment.method": "online",
    "payout.status": "pending",
  });

  if (pendingRequests.length === 0) {
    res.status(400);
    throw new Error("No pending online payouts found for this technician");
  }

  let totalPaidOut = 0;
  const ref = transactionRef ? String(transactionRef).trim() : `UPI_${Date.now().toString().slice(-6)}`;
  const adminNote = note ? String(note).trim() : "Transferred via UPI / Bank transfer";

  for (const r of pendingRequests) {
    r.payout = {
      status: "settled",
      settledAt: new Date(),
      transactionRef: ref,
      note: adminNote,
    };
    totalPaidOut += Number(r.payment?.professionalNet) || 0;
    await r.save();
  }

  createNotification({
    recipientRole: "professional",
    recipientId: professionalId,
    title: "Online Payout Transferred via UPI",
    message: `Admin transferred total payout of ₹${totalPaidOut} across ${pendingRequests.length} online jobs (Ref: ${ref}).`,
    type: "payout",
    link: "/pro/dashboard",
  }).catch(() => {});

  res.json({
    success: true,
    message: `Successfully settled ₹${totalPaidOut} across ${pendingRequests.length} online jobs for technician.`,
    totalPaidOut,
    jobsSettled: pendingRequests.length,
  });
});


// GET /api/admin/password-resets
exports.getPasswordResetRequests = asyncHandler(async (req, res) => {
  const requests = await PasswordResetRequest.find().sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// PUT /api/admin/password-resets/:id/approve
exports.approvePasswordReset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { temporaryPassword, adminNotes } = req.body || {};

  if (!temporaryPassword || String(temporaryPassword).length < 6) {
    res.status(400);
    throw new Error("Temporary password must be at least 6 characters long");
  }

  const resetReq = await PasswordResetRequest.findById(id);
  if (!resetReq) {
    res.status(404);
    throw new Error("Password reset request not found");
  }

  if (resetReq.status !== "pending") {
    res.status(400);
    throw new Error(`This request has already been ${resetReq.status}`);
  }

  const TargetModel = resetReq.userModel === "Professional" ? Professional : User;
  const user = await TargetModel.findById(resetReq.userId);
  if (!user) {
    res.status(404);
    throw new Error("Associated user account no longer exists");
  }

  user.password = temporaryPassword;
  await user.save();

  resetReq.status = "approved";
  resetReq.adminNotes = adminNotes ? String(adminNotes).trim() : "";
  resetReq.resetBy = req.user._id;
  resetReq.resolvedAt = new Date();
  await resetReq.save();

  createNotification({
    recipientRole: resetReq.userType,
    recipientId: user._id,
    title: "Password Reset Approved",
    message: "An administrator has reset your password. Please log in using the temporary password provided by support.",
    type: "system",
  }).catch(() => {});

  res.json({
    success: true,
    message: `Password reset approved. Temporary password has been securely set for ${user.name || user.phone}.`,
    request: resetReq,
  });
});

// PUT /api/admin/password-resets/:id/reject
exports.rejectPasswordReset = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body || {};

  const resetReq = await PasswordResetRequest.findById(id);
  if (!resetReq) {
    res.status(404);
    throw new Error("Password reset request not found");
  }

  if (resetReq.status !== "pending") {
    res.status(400);
    throw new Error(`This request has already been ${resetReq.status}`);
  }

  resetReq.status = "rejected";
  resetReq.adminNotes = adminNotes ? String(adminNotes).trim() : "Rejected by administrator";
  resetReq.resetBy = req.user._id;
  resetReq.resolvedAt = new Date();
  await resetReq.save();

  createNotification({
    recipientRole: resetReq.userType,
    recipientId: resetReq.userId,
    title: "Password Reset Request Rejected",
    message: resetReq.adminNotes || "Your password reset request was not approved by administration.",
    type: "system",
  }).catch(() => {});

  res.json({
    success: true,
    message: "Password reset request rejected.",
    request: resetReq,
  });
});


