const asyncHandler = require("./asyncHandler");
const { generateOtp, hashOtp, sameHash, deliverOtp, exposeCode, phoneQuery, normalizePhone, checkTwilioVerifyCode } = require("./otp");

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_GAP_MS = 30 * 1000;   // 30 seconds
const MAX_ATTEMPTS = 5;

/**
 * Creates reusable password reset handlers for any account Model (User, Professional, Admin).
 * For customers and professionals, password reset is done via registered mobile number using Twilio SMS OTP.
 * For admins, password reset uses email.
 * @param {import("mongoose").Model} Model 
 * @param {string} roleName
 * @param {object} options
 */
exports.createPasswordResetHandlers = (Model, roleName = "user", options = {}) => {
  const usePhone = options.usePhone !== undefined ? options.usePhone : roleName !== "admin";

  if (usePhone) {
    // ── Mobile OTP Password Reset Flow (Customer & Professional) ─────────────

    // POST /forgot-password   { phone }
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

      // Dispatch OTP via Twilio SMS integration
      const targetPhone = cleanPhone || user.phone;
      await deliverOtp({ field: "phone", to: targetPhone, code });

      res.json({
        success: true,
        message: `Verification code sent via SMS to ${targetPhone}`,
        ...(exposeCode() ? { devCode: code } : {}),
      });
    });

    // POST /reset-password   { phone, code, newPassword }
    const resetPassword = asyncHandler(async (req, res) => {
      const phoneInput = (req.body?.phone || req.body?.identifier || "").trim();
      const code = String(req.body?.code || "").trim();
      const newPassword = req.body?.newPassword;

      if (!phoneInput || !code || !newPassword) {
        res.status(400);
        throw new Error("Mobile number, verification code, and new password are required");
      }

      if (code.length !== 6) {
        res.status(400);
        throw new Error("Please enter the 6-digit verification code");
      }

      if (String(newPassword).length < 6) {
        res.status(400);
        throw new Error("New password must be at least 6 characters long");
      }

      const cleanPhone = normalizePhone(phoneInput);
      const user = await Model.findOne({ phone: phoneQuery(phoneInput) });
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
        throw new Error("Verification code has expired. Please request a new code");
      }

      if ((pending.attempts || 0) >= MAX_ATTEMPTS) {
        await clearOtp();
        res.status(429);
        throw new Error("Too many wrong attempts. Please request a new code");
      }

      // Verify OTP through existing Twilio integration first, fallback to hashed code
      const targetPhone = cleanPhone || user.phone;
      let passed = await checkTwilioVerifyCode({ phone: targetPhone, code });
      if (!passed) {
        passed = sameHash(hashOtp(code), pending.codeHash);
      }

      if (!passed) {
        user.resetPasswordOtp.attempts = (pending.attempts || 0) + 1;
        await user.save();
        res.status(400);
        throw new Error("Incorrect verification code");
      }

      // Set new password (passwordPlugin automatically hashes with bcrypt)
      user.password = newPassword;
      user.resetPasswordOtp = undefined;
      await user.save();

      res.json({
        success: true,
        message: "Password reset successful! You can now log in with your new password.",
      });
    });

    return { forgotPassword, resetPassword };
  }

  // ── Email Password Reset Flow (Admin Account Only) ─────────────────────────

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
      throw new Error("Verification code has expired. Please request a new code");
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
