const User = require("../models/User");
const Professional = require("../models/Professional");
const Admin = require("../models/Admin");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const { phoneQuery, normalizePhone } = require("../utils/otp");
const { createPasswordResetHandlers } = require("../utils/passwordReset");

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;

// POST /api/auth/register  (customer: phone is mandatory, email is optional, no OTP required)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body || {};
  if (!name || !phone || !password) {
    res.status(400);
    throw new Error("Full name, mobile number, and password are required");
  }

  const cleanPhone = normalizePhone(phone);
  if (!PHONE_RE.test(cleanPhone)) {
    res.status(400);
    throw new Error("Please enter a valid mobile number");
  }

  if (String(password).length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters long");
  }

  let cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
  if (!cleanEmail) cleanEmail = undefined;

  // Optional email format and uniqueness validation (no verification/OTP required)
  if (cleanEmail) {
    if (!EMAIL_RE.test(cleanEmail)) {
      res.status(400);
      throw new Error("Please enter a valid email address");
    }
    const [u, p, a] = await Promise.all([
      User.findOne({ email: cleanEmail }),
      Professional.findOne({ email: cleanEmail }),
      Admin.findOne({ email: cleanEmail }),
    ]);
    if (u || p || a) {
      res.status(409);
      throw new Error("An account with this email address already exists.");
    }
  }

  // Ensure mobile number uniqueness
  const [phoneUser, phonePro] = await Promise.all([
    User.findOne({ phone: phoneQuery(cleanPhone) }),
    Professional.findOne({ phone: phoneQuery(cleanPhone) }),
  ]);
  if (phoneUser || phonePro) {
    res.status(409);
    throw new Error("An account with this mobile number already exists.");
  }

  let cleanAddress = address;
  if (typeof cleanAddress === "string") {
    try {
      cleanAddress = JSON.parse(cleanAddress);
    } catch {}
  }

  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    password,
    phone: cleanPhone,
    address: cleanAddress,
    emailVerified: false,
    phoneVerified: true,
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id, "customer"),
    role: "customer",
    user,
  });
});

// POST /api/auth/login  (customer - login via registered mobile number or email + password)
exports.login = asyncHandler(async (req, res) => {
  const identifier = (req.body.identifier || req.body.phone || req.body.email || "").trim();
  const password = req.body.password;

  if (!identifier || !password) {
    res.status(400);
    throw new Error("Mobile number (or email) and password are required");
  }

  let user = null;
  if (identifier.includes("@")) {
    user = await User.findOne({ email: identifier.toLowerCase() });
  } else {
    user = await User.findOne({ phone: phoneQuery(identifier) });
  }

  if (!user && !identifier.includes("@")) {
    user = await User.findOne({ email: identifier.toLowerCase() });
  }

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid mobile number/email or password");
  }

  res.json({
    success: true,
    token: generateToken(user._id, "customer"),
    role: "customer",
    user,
  });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Administrator-assisted password reset request handler
const resetHandlers = createPasswordResetHandlers(User, "customer");
exports.forgotPassword = resetHandlers.forgotPassword;
