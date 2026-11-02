const ServiceRequest = require("../models/ServiceRequest");
const asyncHandler = require("../utils/asyncHandler");
const { getRazorpayInstance, verifySignature } = require("../utils/razorpay");
const { createNotification } = require("../utils/notify");

// GET /api/payments/config
exports.getConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    keyId: process.env.RAZORPAY_KEY_ID || "",
    commissionPercent: Number(process.env.PLATFORM_COMMISSION_PERCENT) || 10,
  });
});

// POST /api/payments/create-order
exports.createOrder = asyncHandler(async (req, res) => {
  const { requestId } = req.body || {};
  if (!requestId) {
    res.status(400);
    throw new Error("Request ID is required");
  }

  const request = await ServiceRequest.findOne({
    _id: requestId,
    customer: req.user._id,
  }).populate("service", "name");

  if (!request) {
    res.status(404);
    throw new Error("Service request not found");
  }

  if (request.status !== "completed") {
    res.status(400);
    throw new Error("Invoice can only be paid once the service is marked completed by technician");
  }

  const totalAmount = Number(request.billing?.totalAmount) || 0;
  if (totalAmount <= 0) {
    res.status(400);
    throw new Error("Invoice total amount is invalid");
  }

  if (request.payment?.status === "paid") {
    res.status(400);
    throw new Error("This request has already been paid");
  }

  // Enforce booking payment method lock
  if (request.payment?.preferredMethod === "cash") {
    res.status(400);
    throw new Error("This request was booked with 'Cash on Service'. You must pay directly in cash to the technician at your doorstep.");
  }

  const rzp = getRazorpayInstance();
  if (!rzp) {
    res.status(500);
    throw new Error("Razorpay payment gateway is not properly configured on server");
  }

  const amountInPaise = Math.round(totalAmount * 100);

  const options = {
    amount: amountInPaise,
    currency: "INR",
    receipt: `rcpt_${request._id.toString().slice(-8)}_${Date.now().toString().slice(-4)}`,
    notes: {
      requestId: request._id.toString(),
      customerName: req.user.name,
      customerEmail: req.user.email,
      serviceName: request.service?.name || "Household Service",
    },
  };

  const order = await rzp.orders.create(options);

  request.payment.razorpayOrderId = order.id;
  await request.save();

  res.json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    customer: {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || "",
    },
    serviceName: request.service?.name || "Household Service",
  });
});

// POST /api/payments/verify
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { requestId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!requestId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("Missing required payment verification parameters");
  }

  const request = await ServiceRequest.findOne({
    _id: requestId,
    customer: req.user._id,
  });

  if (!request) {
    res.status(404);
    throw new Error("Service request not found");
  }

  const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) {
    res.status(400);
    throw new Error("Invalid payment signature verification failed");
  }

  const rate = Number(process.env.PLATFORM_COMMISSION_PERCENT) || 10;
  const total = Number(request.billing?.totalAmount) || 0;
  const platformFee = Math.round(total * (rate / 100));
  const professionalNet = total - platformFee;

  request.payment = {
    status: "paid",
    method: "online",
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    paidAt: new Date(),
    commissionRate: rate,
    platformFee,
    professionalNet,
  };

  // Online payment is collected by Admin; payout to professional is pending
  request.payout = {
    status: "pending",
    settledAt: null,
    transactionRef: "",
    note: "",
  };

  await request.save();

  // Notify Customer
  createNotification({
    recipientRole: "customer",
    recipientId: request.customer,
    title: "Payment Successful",
    message: `Payment of ₹${total} for request #${String(request._id).slice(-6)} was completed online. Receipt generated.`,
    type: "payment",
    link: "/my-requests",
  }).catch(() => {});

  // Notify Technician
  if (request.assignedProfessional) {
    createNotification({
      recipientRole: "professional",
      recipientId: request.assignedProfessional,
      title: "Customer Paid Online",
      message: `Customer paid ₹${total} online for job #${String(request._id).slice(-6)}. Your net payout: ₹${professionalNet}.`,
      type: "payment",
      link: "/pro/dashboard",
    }).catch(() => {});
  }

  // Notify Admin
  createNotification({
    recipientRole: "admin",
    title: "Online Payment Received",
    message: `Payment of ₹${total} received for request #${String(request._id).slice(-6)}. Platform fee: ₹${platformFee}.`,
    type: "payment",
    link: "/requests",
  }).catch(() => {});

  res.json({
    success: true,
    message: "Payment verified successfully",
    request,
  });
});

// POST /api/payments/cash-on-service
exports.payCashOnService = asyncHandler(async (req, res) => {
  const { requestId } = req.body || {};

  const request = await ServiceRequest.findOne({
    _id: requestId,
    customer: req.user._id,
  });

  if (!request) {
    res.status(404);
    throw new Error("Service request not found");
  }

  if (request.status !== "completed") {
    res.status(400);
    throw new Error("Payment can only be recorded once the job is completed");
  }

  if (request.payment?.status === "paid") {
    res.status(400);
    throw new Error("This request has already been paid");
  }

  // Enforce booking payment method lock
  if (request.payment?.preferredMethod === "online") {
    res.status(400);
    throw new Error("This request was booked with 'Online Payment'. You must complete the payment online via Razorpay.");
  }

  const rate = Number(process.env.PLATFORM_COMMISSION_PERCENT) || 10;
  const total = Number(request.billing?.totalAmount) || 0;
  const platformFee = Math.round(total * (rate / 100));
  const professionalNet = total - platformFee;

  request.payment = {
    status: "paid",
    method: "cash",
    razorpayOrderId: "",
    razorpayPaymentId: `CASH_${Date.now().toString().slice(-6)}`,
    paidAt: new Date(),
    commissionRate: rate,
    platformFee,
    professionalNet,
  };

  // Technician collected 100% cash directly on-site
  request.payout = {
    status: "collected_cash",
    settledAt: new Date(),
    transactionRef: "PAID_CASH_ON_SITE",
    note: "Paid in cash directly to technician at doorstep",
  };

  await request.save();

  // Notify Customer
  createNotification({
    recipientRole: "customer",
    recipientId: request.customer,
    title: "Cash Payment Confirmed",
    message: `Cash on Service of ₹${total} confirmed for request #${String(request._id).slice(-6)}.`,
    type: "payment",
    link: "/my-requests",
  }).catch(() => {});

  // Notify Technician
  if (request.assignedProfessional) {
    createNotification({
      recipientRole: "professional",
      recipientId: request.assignedProfessional,
      title: "Cash Payment Recorded",
      message: `Cash payment of ₹${total} recorded for job #${String(request._id).slice(-6)}. Platform fee (10%): ₹${platformFee}.`,
      type: "payment",
      link: "/pro/dashboard",
    }).catch(() => {});
  }

  // Notify Admin
  createNotification({
    recipientRole: "admin",
    title: "Cash On Service Recorded",
    message: `Cash payment of ₹${total} recorded for request #${String(request._id).slice(-6)}. Commission owed: ₹${platformFee}.`,
    type: "payment",
    link: "/financials",
  }).catch(() => {});

  res.json({
    success: true,
    message: "Cash payment confirmed. Receipt updated.",
    request,
  });
});
