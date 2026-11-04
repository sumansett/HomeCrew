const mongoose = require("mongoose");

const passwordResetRequestSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["customer", "professional"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel",
    },
    userModel: {
      type: String,
      required: true,
      enum: ["User", "Professional"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reason: {
      type: String,
      default: "",
    },
    adminNotes: {
      type: String,
      default: "",
    },
    resetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

passwordResetRequestSchema.index({ phone: 1, status: 1 });
passwordResetRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
