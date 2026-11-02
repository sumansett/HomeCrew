const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    preferredTime: { type: Date, required: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "assigned", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    assignedProfessional: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", default: null },
    // On-site inspection & completion billing
    billing: {
      laborCharges: { type: Number, default: 0 },
      materialsCost: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      workNotes: { type: String, default: "" },
      invoicedAt: { type: Date },
    },
    // Payment status & distribution (Online to Admin vs Cash to Technician)
    payment: {
      preferredMethod: {
        type: String,
        enum: ["online", "cash"],
        default: "online",
      },
      status: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid",
      },
      method: {
        type: String,
        enum: ["online", "cash"],
        default: null,
      },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      paidAt: { type: Date },
      commissionRate: { type: Number, default: 10 }, // 10% platform commission
      platformFee: { type: Number, default: 0 },
      professionalNet: { type: Number, default: 0 },
    },
    // Admin to Professional Payout Settlement
    payout: {
      status: {
        type: String,
        enum: ["pending", "settled", "collected_cash"],
        default: "pending",
      },
      settledAt: { type: Date },
      transactionRef: { type: String, default: "" },
      note: { type: String, default: "" },
    },
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "Rating must be a whole number from 1 to 5",
        },
      },
      comment: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      submittedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
