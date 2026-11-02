const mongoose = require("mongoose");

const registrationOtpSchema = new mongoose.Schema(
  {
    field: { type: String, enum: ["email", "phone"], required: true },
    value: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["customer", "professional"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

registrationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
registrationOtpSchema.index({ field: 1, value: 1, role: 1 });

module.exports = mongoose.model("RegistrationOtp", registrationOtpSchema);
