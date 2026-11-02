const Professional = require("../models/Professional");
const Verification = require("../models/Verification");
const ServiceRequest = require("../models/ServiceRequest");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const fs = require("fs");
const {
  sendRegistrationOtp,
  verifyRegistrationOtpCode,
  assertRegistrationContactsVerified,
} = require("../utils/registrationOtp");
const { getProfessionalFinancialSummary } = require("../utils/financials");
const { getRazorpayInstance, verifySignature } = require("../utils/razorpay");
const { createNotification } = require("../utils/notify");

// POST /api/professionals/send-register-otp (email or phone)
exports.sendRegisterOtp = asyncHandler(async (req, res) => {
  const field = req.body?.field || "email";
  const value = req.body?.value || (field === "email" ? req.body?.email : req.body?.phone);
  const result = await sendRegistrationOtp({ res, field, value, role: "professional" });
  res.json(result);
});

// POST /api/professionals/verify-register-otp (email or phone)
exports.verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { field, value, code } = req.body || {};
  const result = await verifyRegistrationOtpCode({ res, field, value, role: "professional", code });
  res.json(result);
});

// POST /api/professionals/register  (multipart: idDocument, certificate)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, type, service, experience, about } = req.body || {};
  if (!name || !email || !password || !phone || !service) {
    res.status(400);
    throw new Error("Name, email, password, phone and service category are required");
  }
  const idDoc = req.files && req.files.idDocument && req.files.idDocument[0];
  const cert = req.files && req.files.certificate && req.files.certificate[0];
  if (!idDoc || !cert) {
    res.status(400);
    throw new Error("Identity document and experience certificate are required");
  }

  // Strictly enforce that BOTH email and phone number are verified with OTP
  try {
    await assertRegistrationContactsVerified({ res, email, phone, role: "professional" });
  } catch (err) {
    // Delete newly uploaded files if verification check fails to prevent junk on disk
    if (idDoc?.path) fs.unlink(idDoc.path, () => {});
    if (cert?.path) fs.unlink(cert.path, () => {});
    throw err;
  }

  let cleanAddress = address;
  if (typeof cleanAddress === "string") {
    try {
      cleanAddress = JSON.parse(cleanAddress);
    } catch {}
  }

  const professional = await Professional.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone.trim(),
    address: cleanAddress,
    type: type || "technician",
    service,
    experience: experience ? Number(experience) : 0,
    about: about ? about.trim() : "",
    emailVerified: true,
    phoneVerified: true,
  });

  await Verification.create({
    professional: professional._id,
    idDocument: `/uploads/${idDoc.filename}`,
    certificate: `/uploads/${cert.filename}`,
  });

  createNotification({
    recipientRole: "admin",
    title: "New Technician Application",
    message: `${professional.name} registered and submitted documents for verification.`,
    type: "verification",
    link: "/professionals",
  }).catch(() => {});

  res.status(201).json({
    success: true,
    token: generateToken(professional._id, "professional"),
    role: "professional",
    user: professional,
  });
});

// POST /api/professionals/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }
  const pro = await Professional.findOne({ email: email.toLowerCase() });
  if (!pro || !(await pro.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  res.json({ success: true, token: generateToken(pro._id, "professional"), role: "professional", user: pro });
});

// GET /api/professionals/me  (profile + verification + real-time financials)
exports.getMe = asyncHandler(async (req, res) => {
  const user = await Professional.findById(req.user._id).populate("service", "name icon");
  const verification = await Verification.findOne({ professional: req.user._id });
  const financials = await getProfessionalFinancialSummary(req.user._id);
  res.json({ success: true, user, verification, financials });
});

// GET /api/professionals/requests  (jobs assigned to me)
exports.getMyJobs = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find({ assignedProfessional: req.user._id })
    .populate("service", "name icon")
    .populate("customer", "name phone address")
    .sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// PUT /api/professionals/requests/:id/status  (in-progress | completed)
exports.updateJobStatus = asyncHandler(async (req, res) => {
  const { status, laborCharges, materialsCost, workNotes } = req.body;
  if (!["in-progress", "completed"].includes(status)) {
    res.status(400);
    throw new Error("Status must be in-progress or completed");
  }
  const request = await ServiceRequest.findOne({
    _id: req.params.id,
    assignedProfessional: req.user._id,
  });
  if (!request) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (status === "completed") {
    const labor = Number(laborCharges) || 0;
    const materials = Number(materialsCost) || 0;
    const total = labor + materials;

    if (total <= 0) {
      res.status(400);
      throw new Error("Please enter labor and/or materials charges to generate the final bill");
    }

    const rate = Number(process.env.PLATFORM_COMMISSION_PERCENT) || 10;
    const platformFee = Math.round(total * (rate / 100));
    const professionalNet = total - platformFee;

    request.billing = {
      laborCharges: labor,
      materialsCost: materials,
      totalAmount: total,
      workNotes: workNotes ? String(workNotes).trim() : "",
      invoicedAt: new Date(),
    };

    if (!request.payment || request.payment.status !== "paid") {
      const existingPreferred = request.payment?.preferredMethod || "online";
      request.payment = {
        preferredMethod: existingPreferred,
        status: "unpaid",
        method: null,
        commissionRate: rate,
        platformFee,
        professionalNet,
      };
      request.payout = {
        status: "pending",
      };
    }
  }

  request.status = status;
  await request.save();

  if (status === "in-progress") {
    createNotification({
      recipientRole: "customer",
      recipientId: request.customer,
      title: "Technician Started Work",
      message: `Your technician has started working on your request #${String(request._id).slice(-6)}.`,
      type: "booking",
      link: "/my-requests",
    }).catch(() => {});
  } else if (status === "completed") {
    const total = request.billing?.totalAmount || 0;
    const pref = request.payment?.preferredMethod === "cash" ? "Cash on Service" : "Online Payment";
    createNotification({
      recipientRole: "customer",
      recipientId: request.customer,
      title: "Work Completed & Bill Ready",
      message: `Technician completed your service #${String(request._id).slice(-6)}. Bill total: ₹${total}. Please pay via ${pref}.`,
      type: "billing",
      link: "/my-requests",
    }).catch(() => {});

    createNotification({
      recipientRole: "admin",
      title: "Job Completed by Technician",
      message: `Technician ${req.user.name} completed request #${String(request._id).slice(-6)}. Bill: ₹${total}.`,
      type: "billing",
      link: "/requests",
    }).catch(() => {});
  }

  res.json({ success: true, request });
});

// GET /api/professionals/earnings
exports.getMyEarnings = asyncHandler(async (req, res) => {
  const jobs = await ServiceRequest.find({
    assignedProfessional: req.user._id,
    status: "completed",
  })
    .populate("service", "name icon")
    .populate("customer", "name phone")
    .sort({ updatedAt: -1 });

  const summary = await getProfessionalFinancialSummary(req.user._id);

  res.json({
    success: true,
    summary,
    jobs,
  });
});

// POST /api/professionals/pay-commission/order
exports.createCommissionOrder = asyncHandler(async (req, res) => {
  const fin = await getProfessionalFinancialSummary(req.user._id);
  if (fin.netCommissionOwedToAdmin <= 0) {
    res.status(400);
    throw new Error("No outstanding cash commission debt owed to company.");
  }

  const rzp = getRazorpayInstance();
  if (!rzp) {
    res.status(503);
    throw new Error("Razorpay payment gateway is not configured.");
  }

  const amountPaise = Math.round(fin.netCommissionOwedToAdmin * 100);
  const options = {
    amount: amountPaise,
    currency: "INR",
    receipt: `COMM_${req.user._id.toString().slice(-6)}_${Date.now().toString().slice(-4)}`,
    notes: {
      professionalId: String(req.user._id),
      purpose: "platform_commission_clearance",
    },
  };

  const order = await rzp.orders.create(options);
  res.json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    netCommissionDue: fin.netCommissionOwedToAdmin,
  });
});

// POST /api/professionals/pay-commission/verify
exports.verifyCommissionPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400);
    throw new Error("Missing Razorpay transaction credentials");
  }

  const isValid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    res.status(400);
    throw new Error("Payment signature verification failed");
  }

  // Clear all pending cash commissions for this professional
  const cashRequests = await ServiceRequest.find({
    assignedProfessional: req.user._id,
    "payment.status": "paid",
    "payment.method": "cash",
    "payout.status": "collected_cash",
  });

  for (const r of cashRequests) {
    r.payout.status = "settled";
    r.payout.settledAt = new Date();
    r.payout.transactionRef = razorpayPaymentId;
    r.payout.note = "Commission paid online by technician via Razorpay";
    await r.save();
  }

  const fin = await getProfessionalFinancialSummary(req.user._id);

  createNotification({
    recipientRole: "admin",
    title: "Commission Paid by Technician",
    message: `Technician ${req.user.name} paid cash commission online via Razorpay (Ref: ${razorpayPaymentId}).`,
    type: "payment",
    link: "/financials",
  }).catch(() => {});

  createNotification({
    recipientRole: "professional",
    recipientId: req.user._id,
    title: "Commission Cleared",
    message: `Your payment was verified. Cash commission balance settled and account is fully unlocked!`,
    type: "payout",
    link: "/pro/dashboard",
  }).catch(() => {});

  res.json({
    success: true,
    message: `Payment successful! Cleared cash commission across ${cashRequests.length} jobs. Your account is fully unlocked.`,
    financials: fin,
  });
});


exports.getMyReviews = asyncHandler(async (req, res) => {
  const requests = await ServiceRequest.find({
    assignedProfessional: req.user._id,
    status: "completed",
    "review.rating": { $exists: true },
  })
    .populate("service", "name icon")
    .populate("customer", "name")
    .sort({ "review.submittedAt": -1 });

  const reviews = requests.map((request) => ({
    _id: request._id,
    service: request.service,
    customer: request.customer?.name || "Customer",
    rating: request.review.rating,
    comment: request.review.comment,
    submittedAt: request.review.submittedAt,
  }));

  const averageRating = reviews.length
    ? Number(
        (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      )
    : 0;

  res.json({
    success: true,
    reviews,
    averageRating,
    totalReviews: reviews.length,
  });
});

const { createPasswordResetHandlers } = require("../utils/passwordReset");
const proResetHandlers = createPasswordResetHandlers(Professional, "professional");
exports.forgotPassword = proResetHandlers.forgotPassword;
exports.resetPassword = proResetHandlers.resetPassword;

