const mongoose = require("mongoose");
const passwordPlugin = require("../utils/passwordPlugin");
const profilePlugin = require("../utils/profilePlugin");

// Customers
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      set: (v) => (v && String(v).trim() ? String(v).trim().toLowerCase() : undefined),
    },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true, unique: true, trim: true },
    address: { type: mongoose.Schema.Types.Mixed, default: () => ({ street: "", postOffice: "", district: "", state: "", pinCode: "" }) },
    role: { type: String, default: "customer" },
  },
  { timestamps: true }
);

userSchema.plugin(passwordPlugin);
userSchema.plugin(profilePlugin);
module.exports = mongoose.model("User", userSchema);
