const ServiceRequest = require("../models/ServiceRequest");
const Service = require("../models/Service");
const Professional = require("../models/Professional");
const asyncHandler = require("../utils/asyncHandler");
const { createNotification } = require("../utils/notify");

const populateRequest = (q) =>
  q
    .populate("service", "name icon category")
    .populate("assignedProfessional", "name phone type avatar");

// POST /api/requests  (customer, multipart: images)
exports.createRequest = asyncHandler(async (req, res) => {
  const { service, description, location, preferredTime, paymentMethod } = req.body;
  if (!service || !description || !location || !preferredTime) {
    res.status(400);
    throw new Error("Service, description, location and preferred time are required");
  }
  const found = await Service.findById(service);
  if (!found || !found.available) {
    res.status(400);
    throw new Error("Selected service is not available");
  }
  const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const preferred = ["online", "cash"].includes(paymentMethod) ? paymentMethod : "online";

  const request = await ServiceRequest.create({
    customer: req.user._id,
    service,
    description,
    location,
    preferredTime,
    images,
    payment: {
      preferredMethod: preferred,
      status: "unpaid",
    },
  });

  // Notify Admin
  createNotification({
    recipientRole: "admin",
    title: `New Booking: ${found.name}`,
    message: `${req.user.name} booked a service at ${location}. Payment preference: ${preferred === "cash" ? "Cash on Service" : "Online"}.`,
    type: "request",
    link: "/requests",
  });

  // Notify Customer
  createNotification({
    recipientRole: "customer",
    recipientId: req.user._id,
    title: "Service Request Received",
    message: `Your booking for ${found.name} is confirmed. A verified professional will be assigned soon.`,
    type: "request",
    link: "/my-requests",
  });

  res.status(201).json({ success: true, request });
});

// GET /api/requests/my  (customer)
exports.getMyRequests = asyncHandler(async (req, res) => {
  const requests = await populateRequest(
    ServiceRequest.find({ customer: req.user._id }).sort({ createdAt: -1 })
  );
  res.json({ success: true, requests });
});

// GET /api/requests/:id  (customer - own request)
exports.getRequest = asyncHandler(async (req, res) => {
  const request = await populateRequest(
    ServiceRequest.findOne({ _id: req.params.id, customer: req.user._id })
  );
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  res.json({ success: true, request });
});

// PUT /api/requests/:id/cancel  (customer)
exports.cancelRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findOne({ _id: req.params.id, customer: req.user._id });
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  if (request.status !== "pending") {
    res.status(400);
    throw new Error("Only pending requests can be cancelled");
  }
  request.status = "cancelled";
  await request.save();
  res.json({ success: true, request });
});

exports.submitReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    typeof comment !== "string" ||
    !comment.trim() ||
    comment.trim().length > 1000
  ) {
    res.status(400);
    throw new Error("Provide a rating from 1 to 5 and a review of up to 1000 characters");
  }

  const request = await ServiceRequest.findOne({
    _id: req.params.id,
    customer: req.user._id,
  });

  if (!request) {
    res.status(404);
    throw new Error("Service request not found");
  }

  if (request.status !== "completed") {
    res.status(400);
    throw new Error("You can review a service only after it is completed");
  }

  if (!request.assignedProfessional) {
    res.status(400);
    throw new Error("No professional is assigned to this request");
  }

  if (request.review?.rating) {
    res.status(409);
    throw new Error("You have already reviewed this service");
  }

  request.review = {
    rating,
    comment: comment.trim(),
    submittedAt: new Date(),
  };

  await request.save();

  res.status(201).json({
    success: true,
    message: "Thank you! Your review has been submitted.",
    review: request.review,
  });
});

// "Rahul Sharma" -> "Rahul S." (customers see other customers' reviews by short name only)
const shortName = (name = "") => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first || "Customer";
};

// GET /api/requests/:id/professional  (customer - own request, once a professional is assigned)
// Public profile only: NO verification documents, email or home address.
exports.getAssignedProfessional = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findOne({ _id: req.params.id, customer: req.user._id });
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  if (!request.assignedProfessional) {
    res.status(400);
    throw new Error("No professional has been assigned to this request yet");
  }

  const pro = await Professional.findById(request.assignedProfessional).populate("service", "name icon");
  if (!pro) {
    res.status(404);
    throw new Error("This professional is no longer available");
  }

  const [reviewed, completedJobs] = await Promise.all([
    ServiceRequest.find({ assignedProfessional: pro._id, "review.rating": { $exists: true } })
      .populate("customer", "name")
      .populate("service", "name icon")
      .sort({ "review.submittedAt": -1 })
      .limit(20)
      .lean(),
    ServiceRequest.countDocuments({ assignedProfessional: pro._id, status: "completed" }),
  ]);

  const reviews = reviewed.map((r) => ({
    _id: r._id,
    customer: shortName(r.customer?.name),
    service: r.service,
    rating: r.review.rating,
    comment: r.review.comment,
    submittedAt: r.review.submittedAt,
  }));
  const averageRating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  res.json({
    success: true,
    professional: {
      _id: pro._id,
      name: pro.name,
      avatar: pro.avatar,
      type: pro.type,
      service: pro.service,
      experience: pro.experience,
      about: pro.about,
      phone: pro.phone,
      phoneVerified: pro.phoneVerified,
      verified: pro.status === "approved",
      memberSince: pro.createdAt,
      completedJobs,
      averageRating,
      totalReviews: reviews.length,
    },
    request: { _id: request._id, status: request.status },
    reviews,
  });
});
