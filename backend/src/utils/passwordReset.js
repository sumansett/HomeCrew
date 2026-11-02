const asyncHandler = require("./asyncHandler");
const { generateOtp, hashOtp, sameHash, deliverOtp, exposeCode } = require("./otp");

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_GAP_MS = 30 * 1000;   // 30 seconds
const MAX_ATTEMPTS = 5;

/**
 * Creates reusable password reset handlers for any account Model (User, Professional, Admin).
 * @param {import("mongoose").Model} Model 
 * @param {string} roleName
 */
exports.createPasswordResetHandlers = (Model, roleName = "user") => {
  // POST /forgot-password   { email }
  const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body || {};
    if (!email || !String(email).trim()) {
      res.status(400);
      throw new Error("Please enter your email address");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await Model.findOne({ email: cleanEmail });
    if (!user) {
      res.status(404);
      throw new Error(`No ${roleName} account found with that email address`);
    }

    const pending = user.resetPasswordOtp;
    if (pending && pending.sentAt && Date.now() - pending.sentAt.getTime() < RESEND_GAP_MS) {
      res.status(429);
      throw new Error("Please wait a few seconds before requesting another code");
    }

    const code = generateOtp();
    user.resetPasswordOtp = {
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      sentAt: new Date(),
      attempts: 0,
    };
    await user.save();

    await deliverOtp({ field: "password reset", to: cleanEmail, code });

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      ...(exposeCode() ? { devCode: code } : {}),
    });
  });

  // POST /reset-password   { email, code, newPassword }
  const resetPassword = asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      res.status(400);
      throw new Error("Email, verification code, and new password are required");
    }

    if (String(newPassword).length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters long");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await Model.findOne({ email: cleanEmail });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtp.codeHash) {
      res.status(400);
      throw new Error("No active password reset request found. Please request a new code");
    }

    const pending = user.resetPasswordOtp;
    const clearOtp = async () => {
      user.resetPasswordOtp = undefined;
      await user.save();
    };

    if (pending.expiresAt && pending.expiresAt < new Date()) {
      await clearOtp();
      res.status(400);
      throw new Error("Verification code has expired. Please request a new one");
    }

    if ((pending.attempts || 0) >= MAX_ATTEMPTS) {
      await clearOtp();
      res.status(429);
      throw new Error("Too many wrong attempts. Please request a new code");
    }

    if (!sameHash(hashOtp(String(code).trim()), pending.codeHash)) {
      user.resetPasswordOtp.attempts = (pending.attempts || 0) + 1;
      await user.save();
      res.status(400);
      throw new Error("Incorrect verification code");
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
    });
  });

  return { forgotPassword, resetPassword };
};
