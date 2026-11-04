const asyncHandler = require("./asyncHandler");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const { phoneQuery, normalizePhone } = require("./otp");
const { createNotification } = require("./notify");

/**
 * Creates administrator-assisted forgot password request handler.
 * Users submit their registered mobile number.
 * Creates a pending PasswordResetRequest for an authorized admin to approve.
 * Does not automatically reset passwords or use SMS/email OTP.
 */
exports.createPasswordResetHandlers = (Model, roleName = "user") => {
  // POST /forgot-password   { phone, reason? }
  const forgotPassword = asyncHandler(async (req, res) => {
    const phoneInput = (req.body?.phone || req.body?.identifier || "").trim();
    if (!phoneInput) {
      res.status(400);
      throw new Error("Please enter your registered mobile number");
    }

    const cleanPhone = normalizePhone(phoneInput);
    const user = await Model.findOne({ phone: phoneQuery(phoneInput) });
    if (!user) {
      res.status(404);
      throw new Error(`No ${roleName} account found with that mobile number`);
    }

    // Check if an unresolved request already exists for this phone
    const existing = await PasswordResetRequest.findOne({
      userType: roleName === "professional" ? "professional" : "customer",
      phone: phoneQuery(cleanPhone),
      status: "pending",
    });

    if (existing) {
      return res.json({
        success: true,
        alreadyPending: true,
        message: "You already have a pending password reset request. An administrator will review your account shortly.",
      });
    }

    const resetReq = await PasswordResetRequest.create({
      userType: roleName === "professional" ? "professional" : "customer",
      userId: user._id,
      userModel: roleName === "professional" ? "Professional" : "User",
      phone: user.phone || cleanPhone,
      name: user.name || "",
      reason: req.body?.reason ? String(req.body.reason).trim() : "",
      status: "pending",
    });

    // Notify administrators of the new request
    createNotification({
      recipientRole: "admin",
      title: "Password Reset Request",
      message: `${user.name} (${user.phone}) requested an administrator-assisted password reset.`,
      type: "system",
      link: "/password-resets",
    }).catch(() => {});

    res.json({
      success: true,
      requestId: resetReq._id,
      message: "Password reset request submitted successfully. An administrator will review your request and reset your password.",
    });
  });

  return { forgotPassword };
};
