const Service = require("../models/Service");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/services  (public)  ?all=true for admin to include unavailable
exports.getServices = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { available: true };
  const services = await Service.find(filter).sort({ name: 1 });
  res.json({ success: true, services });
});

// GET /api/services/:id  (public)
exports.getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }
  res.json({ success: true, service });
});

// POST /api/services  (admin)
exports.createService = asyncHandler(async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, service });
});

// PUT /api/services/:id  (admin)
exports.updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }
  res.json({ success: true, service });
});

// DELETE /api/services/:id  (admin)
exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }
  res.json({ success: true, message: "Service deleted" });
});
