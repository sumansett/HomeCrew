const fs = require("fs");
const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const { phoneQuery, normalizePhone } = require("../utils/otp");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Admin = require("../models/Admin");

const UPLOADS = path.join(__dirname, "..", "..", "uploads");
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;

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
 * Builds the profile handlers for any account model (User or Professional).
 * Email and mobile number can be updated directly without SMS/email OTP.
 * Verification documents live in a different model and are never touched here.
 */
module.exports = (Model, { editable = [], populate } = {}) => {
  const respond = async (res, user, extra = {}) => {
    if (populate) await user.populate(populate, "name icon");
    res.json({ success: true, user, ...extra });
  };

  // PUT /profile { name, email, phone, address, about?, experience?, currentPassword?, password? }
  const updateProfile = asyncHandler(async (req, res) => {
    const user = req.user;
    const body = req.body || {};

    // 1. Email update (no verification / no OTP)
    if (body.email !== undefined) {
      const rawEmail = String(body.email).trim().toLowerCase();
      if (rawEmail) {
        if (!EMAIL_RE.test(rawEmail)) fail(res, 400, "Please enter a valid email address");
        if (rawEmail !== user.email) {
          const [takenUser, takenPro, takenAdmin] = await Promise.all([
            User.findOne({ email: rawEmail, _id: { $ne: user._id } }),
            Professional.findOne({ email: rawEmail, _id: { $ne: user._id } }),
            Admin.findOne({ email: rawEmail }),
          ]);
          if (takenUser || takenPro || takenAdmin) fail(res, 409, "That email address is already in use");
        }
        user.email = rawEmail;
      } else {
        user.email = undefined;
      }
    }

    // 2. Mobile number update (no verification / no OTP)
    if (body.phone !== undefined) {
      const cleanPhone = normalizePhone(body.phone);
      if (!cleanPhone) fail(res, 400, "Mobile number cannot be empty");
      if (!PHONE_RE.test(cleanPhone)) fail(res, 400, "Please enter a valid mobile number");
      if (cleanPhone !== user.phone) {
        const [takenUser, takenPro] = await Promise.all([
          User.findOne({ phone: phoneQuery(cleanPhone), _id: { $ne: user._id } }),
          Professional.findOne({ phone: phoneQuery(cleanPhone), _id: { $ne: user._id } }),
        ]);
        if (takenUser || takenPro) fail(res, 409, "That mobile number is already in use");
      }
      user.phone = cleanPhone;
    }

    // 3. Other editable fields
    for (const key of editable) {
      if (key === "email" || key === "phone") continue;
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

    // 4. Password update
    if (body.password) {
      if (body.password.length < 6) fail(res, 400, "New password must be at least 6 characters");
      if (!body.currentPassword || !(await user.matchPassword(body.currentPassword))) {
        fail(res, 400, "Current password is incorrect");
      }
      user.password = body.password;
    }

    await user.save();
    await respond(res, user, { message: "Profile updated successfully" });
  });

  // POST /profile/avatar (multipart field "avatar")
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

  // Direct contact update helper (backwards compatibility without OTP)
  const requestContactChange = asyncHandler(async (req, res) => {
    const user = req.user;
    const { field, value } = req.body || {};
    if (!["email", "phone"].includes(field)) fail(res, 400, "field must be email or phone");
    if (field === "email") {
      const raw = value ? String(value).trim().toLowerCase() : undefined;
      if (raw) {
        if (!EMAIL_RE.test(raw)) fail(res, 400, "Enter a valid email address");
        const [u, p, a] = await Promise.all([
          User.findOne({ email: raw, _id: { $ne: user._id } }),
          Professional.findOne({ email: raw, _id: { $ne: user._id } }),
          Admin.findOne({ email: raw }),
        ]);
        if (u || p || a) fail(res, 409, "That email is already in use");
      }
      user.email = raw;
    } else {
      const p = normalizePhone(value);
      if (!p) fail(res, 400, "Please enter your mobile number");
      const [u, pr] = await Promise.all([
        User.findOne({ phone: phoneQuery(p), _id: { $ne: user._id } }),
        Professional.findOne({ phone: phoneQuery(p), _id: { $ne: user._id } }),
      ]);
      if (u || pr) fail(res, 409, "That mobile number is already in use");
      user.phone = p;
    }
    await user.save();
    await respond(res, user, { message: `${field === "email" ? "Email" : "Phone number"} updated successfully` });
  });

  const verifyContactChange = asyncHandler(async (req, res) => {
    await respond(res, req.user, { message: "Contact updated" });
  });

  const cancelContactChange = asyncHandler(async (req, res) => {
    await respond(res, req.user);
  });

  return { updateProfile, uploadAvatar, removeAvatar, requestContactChange, verifyContactChange, cancelContactChange };
};
