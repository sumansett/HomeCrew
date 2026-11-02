const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const {
  sendRegistrationOtp,
  verifyRegistrationOtpCode,
  assertRegistrationContactsVerified,
} = require("../utils/registrationOtp");

// POST /api/auth/send-register-otp  (customer: email or phone)
exports.sendRegisterOtp = asyncHandler(async (req, res) => {
  const field = req.body?.field || "email";
  const value = req.body?.value || (field === "email" ? req.body?.email : req.body?.phone);
  const result = await sendRegistrationOtp({ res, field, value, role: "customer" });
  res.json(result);
});

// POST /api/auth/verify-register-otp  (customer: email or phone)
exports.verifyRegisterOtp = asyncHandler(async (req, res) => {
  const { field, value, code } = req.body || {};
  const result = await verifyRegistrationOtpCode({ res, field, value, role: "customer", code });
  res.json(result);
});

// POST /api/auth/register  (customer)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body || {};
  if (!name || !email || !password || !phone) {
    res.status(400);
    throw new Error("Name, email, phone number, and password are required");
  }

  // Strictly enforce that BOTH email and phone number are verified with OTP
  await assertRegistrationContactsVerified({ res, email, phone, role: "customer" });

  let cleanAddress = address;
  if (typeof cleanAddress === "string") {
    try {
      cleanAddress = JSON.parse(cleanAddress);
    } catch {}
  }

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone.trim(),
    address: cleanAddress,
    emailVerified: true,
    phoneVerified: true,
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id, "customer"),
    role: "customer",
    user,
  });
});

// POST /api/auth/login  (customer)
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  res.json({ success: true, token: generateToken(user._id, "customer"), role: "customer", user });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const { createPasswordResetHandlers } = require("../utils/passwordReset");
const resetHandlers = createPasswordResetHandlers(User, "customer");
exports.forgotPassword = resetHandlers.forgotPassword;
exports.resetPassword = resetHandlers.resetPassword;

