const mongoose = require("mongoose");
const passwordPlugin = require("../utils/passwordPlugin");
const profilePlugin = require("../utils/profilePlugin");

// Technicians and contractors
const professionalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true, trim: true },
    address: { type: mongoose.Schema.Types.Mixed, default: () => ({ street: "", postOffice: "", district: "", state: "", pinCode: "" }) },
    type: { type: String, enum: ["technician", "contractor"], default: "technician" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    experience: { type: Number, default: 0 }, // years
    about: { type: String },
    // mirrors the Verification record for quick filtering
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    role: { type: String, default: "professional" },
  },
  { timestamps: true }
);

professionalSchema.plugin(passwordPlugin);
professionalSchema.plugin(profilePlugin);
module.exports = mongoose.model("Professional", professionalSchema);
