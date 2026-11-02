const mongoose = require("mongoose");

// Documents submitted by a professional + admin decision
const verificationSchema = new mongoose.Schema(
  {
    professional: { type: mongoose.Schema.Types.ObjectId, ref: "Professional", required: true, unique: true },
    idDocument: { type: String, required: true },
    certificate: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    remarks: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Verification", verificationSchema);
