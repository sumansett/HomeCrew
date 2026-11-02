const mongoose = require("mongoose");

const emailOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: {
      type: String,
      enum: ["register_customer", "register_professional"],
      required: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index to automatically purge expired OTP records after 15 minutes
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailOtpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model("EmailOtp", emailOtpSchema);
