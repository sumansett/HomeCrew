const fs = require("fs");
const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const { generateOtp, hashOtp, sameHash, deliverOtp, exposeCode } = require("../utils/otp");

const UPLOADS = path.join(__dirname, "..", "..", "uploads");
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_GAP_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

// remove an old profile photo from disk (only files inside /uploads)
const removeFile = (publicPath) => {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  fs.unlink(path.join(UPLOADS, path.basename(publicPath)), () => {});
};

/**
 * Builds the profile handlers for any account model.
 *   Model    - User or Professional
 *   options  - editable: fields the account may change directly
 *              populate: optional field to populate on the returned user
 * Email and phone are NOT directly editable - they change only through the
 * OTP flow below. Verification documents live in a different model and are
 * never touched here.
 */
module.exports = (Model, { editable = [], populate } = {}) => {
  const respond = async (res, user, extra = {}) => {
    if (populate) await user.populate(populate, "name icon");
    res.json({ success: true, user, ...extra });
  };

  // PUT /profile   { name, address, about?, experience?, currentPassword?, password? }
  const updateProfile = asyncHandler(async (req, res) => {
    const user = req.user;
    const body = req.body || {};

    for (const key of editable) {
      if (body[key] === undefined) continue;
      let value = body[key];
      if (key === "experience") {
        value = Number(value);
        if (!Number.isFinite(value) || value < 0 || value > 60) fail(res, 400, "Experience must be between 0 and 60 years");
      } else if (key === "address") {
        if (typeof value === "string") {
          try {
            value = JSON.parse(value);
          } catch {}
        }
      } else {
        value = String(value).trim();
      }
      if (key === "name" && !value) fail(res, 400, "Name cannot be empty");
      user[key] = value;
      if (key === "address") user.markModified("address");
    }

    if (body.password) {
      if (body.password.length < 6) fail(res, 400, "New password must be at least 6 characters");
      if (!body.currentPassword || !(await user.matchPassword(body.currentPassword))) {
        fail(res, 400, "Current password is incorrect");
      }
      user.password = body.password;
    }

    await user.save();
    await respond(res, user);
  });

  // POST /profile/avatar   (multipart field "avatar")
  const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) fail(res, 400, "Please choose an image");
    const old = req.user.avatar;
    req.user.avatar = `/uploads/${req.file.filename}`;
    await req.user.save();
    removeFile(old);
    await respond(res, req.user);
  });

  // DELETE /profile/avatar
  const removeAvatar = asyncHandler(async (req, res) => {
    const old = req.user.avatar;
    req.user.avatar = "";
    await req.user.save();
    removeFile(old);
    await respond(res, req.user);
  });

  // POST /profile/contact/request   { field: "email" | "phone", value? }
  // Sends a 6-digit code to the NEW value. Omit value to verify the current one.
  const requestContactChange = asyncHandler(async (req, res) => {
    const user = req.user;
    const { field } = req.body || {};
    if (!["email", "phone"].includes(field)) fail(res, 400, "field must be email or phone");

    let target = String(req.body.value ?? "").trim();
    if (field === "email") target = target.toLowerCase();
    if (!target) target = user[field] || "";
    if (!target) fail(res, 400, `Please enter your ${field}`);

    if (field === "email" && !EMAIL_RE.test(target)) fail(res, 400, "Enter a valid email address");
    if (field === "phone" && !PHONE_RE.test(target)) fail(res, 400, "Enter a valid phone number");

    const changing = target !== user[field];
    if (!changing && user[`${field}Verified`]) fail(res, 400, `This ${field} is already verified`);

    if (changing && field === "email") {
      const User = require("../models/User");
      const Professional = require("../models/Professional");
      const Admin = require("../models/Admin");
      const [takenUser, takenPro, takenAdmin] = await Promise.all([
        User.findOne({ email: target, _id: { $ne: user._id } }),
        Professional.findOne({ email: target, _id: { $ne: user._id } }),
        Admin.findOne({ email: target }),
      ]);
      if (takenUser || takenPro || takenAdmin) fail(res, 409, "That email is already in use");
    }

    if (changing && field === "phone") {
      const User = require("../models/User");
      const Professional = require("../models/Professional");
      const { phoneQuery } = require("../utils/otp");
      const [takenUser, takenPro] = await Promise.all([
        User.findOne({ phone: phoneQuery(target), _id: { $ne: user._id } }),
        Professional.findOne({ phone: phoneQuery(target), _id: { $ne: user._id } }),
      ]);
      if (takenUser || takenPro) fail(res, 409, "That mobile number is already in use");
    }

    const pending = user.pendingContact;
    if (pending && pending.sentAt && Date.now() - pending.sentAt.getTime() < RESEND_GAP_MS) {
      fail(res, 429, "Please wait a few seconds before requesting another code");
    }

    const code = generateOtp();
    user.pendingContact = {
      field,
      value: target,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      sentAt: new Date(),
      attempts: 0,
    };
    await user.save();
    await deliverOtp({ field, to: target, code });

    await respond(res, user, {
      message: `Verification code sent to ${target}`,
      ...(exposeCode() ? { devCode: code } : {}),
    });
  });

  // POST /profile/contact/verify   { code }
  const verifyContactChange = asyncHandler(async (req, res) => {
    const user = req.user;
    const pending = user.pendingContact;
    if (!pending || !pending.codeHash) fail(res, 400, "No verification in progress");

    const clear = async () => {
      user.pendingContact = undefined;
      await user.save();
    };

    if (pending.expiresAt < new Date()) {
      await clear();
      fail(res, 400, "That code has expired. Please request a new one");
    }
    if ((pending.attempts || 0) >= MAX_ATTEMPTS) {
      await clear();
      fail(res, 429, "Too many wrong attempts. Please request a new code");
    }

    const { checkTwilioVerifyCode } = require("../utils/otp");
    let passed = false;
    if (pending.field === "phone") {
      passed = await checkTwilioVerifyCode({ phone: pending.value, code: req.body.code });
    }
    if (!passed) {
      passed = sameHash(hashOtp(String(req.body.code || "").trim()), pending.codeHash);
    }
    if (!passed) {
      user.pendingContact.attempts = (pending.attempts || 0) + 1;
      await user.save();
      fail(res, 400, "Incorrect code");
    }

    const { field, value } = pending;
    if (field === "email" && value !== user.email) {
      const User = require("../models/User");
      const Professional = require("../models/Professional");
      const Admin = require("../models/Admin");
      const [takenUser, takenPro, takenAdmin] = await Promise.all([
        User.findOne({ email: value, _id: { $ne: user._id } }),
        Professional.findOne({ email: value, _id: { $ne: user._id } }),
        Admin.findOne({ email: value }),
      ]);
      if (takenUser || takenPro || takenAdmin) {
        await clear();
        fail(res, 409, "That email is already in use");
      }
    }

    if (field === "phone" && value !== user.phone) {
      const User = require("../models/User");
      const Professional = require("../models/Professional");
      const { phoneQuery } = require("../utils/otp");
      const [takenUser, takenPro] = await Promise.all([
        User.findOne({ phone: phoneQuery(value), _id: { $ne: user._id } }),
        Professional.findOne({ phone: phoneQuery(value), _id: { $ne: user._id } }),
      ]);
      if (takenUser || takenPro) {
        await clear();
        fail(res, 409, "That mobile number is already in use");
      }
    }
    user[field] = value;
    user[`${field}Verified`] = true;
    user.pendingContact = undefined;
    await user.save();

    await respond(res, user, { message: `${field === "email" ? "Email" : "Phone number"} verified` });
  });

  // DELETE /profile/contact  - cancel a pending change
  const cancelContactChange = asyncHandler(async (req, res) => {
    req.user.pendingContact = undefined;
    await req.user.save();
    await respond(res, req.user);
  });

  return { updateProfile, uploadAvatar, removeAvatar, requestContactChange, verifyContactChange, cancelContactChange };
};
