const RegistrationOtp = require("../models/RegistrationOtp");
const User = require("../models/User");
const Professional = require("../models/Professional");
const Admin = require("../models/Admin");
const { generateOtp, hashOtp, sameHash, deliverOtp } = require("./otp");

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,17}$/;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_GAP_MS = 30 * 1000;   // 30 seconds
const MAX_ATTEMPTS = 5;

const fail = (res, status, message) => {
  res.status(status);
  throw new Error(message);
};

const cleanContact = (field, value) => {
  if (!value) return "";
  const v = String(value).trim();
  return field === "email" ? v.toLowerCase() : v.replace(/[\s-]/g, "");
};

// Sends registration OTP to either email or phone
exports.sendRegistrationOtp = async ({ res, field, value, role }) => {
  if (!["email", "phone"].includes(field)) {
    fail(res, 400, "field must be email or phone");
  }

  const cleanVal = cleanContact(field, value);
  if (!cleanVal) {
    fail(res, 400, `Please enter your ${field === "email" ? "email address" : "phone number"}`);
  }

  if (field === "email") {
    if (!EMAIL_RE.test(cleanVal)) fail(res, 400, "Please enter a valid email address");
    const [u, p, a] = await Promise.all([
      User.findOne({ email: cleanVal }),
      Professional.findOne({ email: cleanVal }),
      Admin.findOne({ email: cleanVal }),
    ]);
    if (u || p || a) fail(res, 409, "An account with this email address already exists. Please log in.");
  } else {
    if (!PHONE_RE.test(cleanVal)) fail(res, 400, "Please enter a valid phone number");
    const [u, p] = await Promise.all([
      User.findOne({ phone: cleanVal }),
      Professional.findOne({ phone: cleanVal }),
    ]);
    if (u || p) fail(res, 409, "An account with this phone number already exists.");
  }

  // Check resend gap
  const existingOtp = await RegistrationOtp.findOne({ field, value: cleanVal, role });
  if (existingOtp && existingOtp.sentAt && Date.now() - existingOtp.sentAt.getTime() < RESEND_GAP_MS) {
    fail(res, 429, "Please wait a few seconds before requesting another code");
  }

  const code = generateOtp();
  await RegistrationOtp.findOneAndUpdate(
    { field, value: cleanVal, role },
    {
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      sentAt: new Date(),
      attempts: 0,
      verified: false,
    },
    { upsert: true, new: true }
  );

  await deliverOtp({ field, to: cleanVal, code });

  return {
    success: true,
    message: `Verification code sent to ${cleanVal}`,
  };
};

// Verifies the 6-digit OTP code for email or phone
exports.verifyRegistrationOtpCode = async ({ res, field, value, role, code }) => {
  if (!["email", "phone"].includes(field)) {
    fail(res, 400, "field must be email or phone");
  }

  const cleanVal = cleanContact(field, value);
  const cleanCode = String(code || "").trim();

  if (!cleanVal) {
    fail(res, 400, `Please enter your ${field === "email" ? "email address" : "phone number"}`);
  }
  if (!cleanCode || cleanCode.length !== 6) {
    fail(res, 400, "Please enter the 6-digit verification code");
  }

  const record = await RegistrationOtp.findOne({ field, value: cleanVal, role });
  if (!record) {
    fail(res, 400, `No active verification found for this ${field}. Please request a code first.`);
  }

  if (record.expiresAt < new Date()) {
    await RegistrationOtp.deleteOne({ _id: record._id });
    fail(res, 400, "Verification code has expired. Please request a new code.");
  }

  if ((record.attempts || 0) >= MAX_ATTEMPTS) {
    await RegistrationOtp.deleteOne({ _id: record._id });
    fail(res, 429, "Too many wrong attempts. Please request a new code.");
  }

  const { checkTwilioVerifyCode } = require("./otp");
  let passed = false;

  if (field === "phone") {
    passed = await checkTwilioVerifyCode({ phone: cleanVal, code: cleanCode });
  }

  if (!passed) {
    passed = sameHash(hashOtp(cleanCode), record.codeHash);
  }

  if (!passed) {
    record.attempts = (record.attempts || 0) + 1;
    await record.save();
    fail(res, 400, "Incorrect verification code. Please check and try again.");
  }

  // Mark as verified and extend validity for 1 hour so the user can complete the rest of the form
  record.verified = true;
  record.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await record.save();

  return {
    success: true,
    verified: true,
    message: `${field === "email" ? "Email" : "Phone number"} verified successfully!`,
  };
};

// Enforces that BOTH email and phone have been verified prior to account creation
exports.assertRegistrationContactsVerified = async ({ res, email, phone, role }) => {
  const cleanEmail = cleanContact("email", email);
  const cleanPhone = cleanContact("phone", phone);

  if (!cleanEmail) fail(res, 400, "Email address is required");
  if (!cleanPhone) fail(res, 400, "Phone number is required");

  const [emailRecord, phoneRecord] = await Promise.all([
    RegistrationOtp.findOne({ field: "email", value: cleanEmail, role, verified: true }),
    RegistrationOtp.findOne({ field: "phone", value: cleanPhone, role, verified: true }),
  ]);

  if (!emailRecord || emailRecord.expiresAt < new Date()) {
    fail(res, 400, "Please verify your email address with OTP before registering");
  }
  if (!phoneRecord || phoneRecord.expiresAt < new Date()) {
    fail(res, 400, "Please verify your phone number with OTP before registering");
  }

  // Cleanup after verification check is passed
  await RegistrationOtp.deleteMany({
    role,
    $or: [
      { field: "email", value: cleanEmail },
      { field: "phone", value: cleanPhone },
    ],
  });

  return true;
};
