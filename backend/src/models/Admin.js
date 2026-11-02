const mongoose = require("mongoose");
const passwordPlugin = require("../utils/passwordPlugin");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

adminSchema.plugin(passwordPlugin);
module.exports = mongoose.model("Admin", adminSchema);
