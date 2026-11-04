const crypto = require("crypto");
const nodemailer = require("nodemailer");

const secret = () => process.env.JWT_SECRET || "homecrew";

exports.generateOtp = () => String(crypto.randomInt(100000, 1000000)); // 6 digits

exports.hashOtp = (code) =>
  crypto.createHmac("sha256", secret()).update(String(code)).digest("hex");

exports.sameHash = (a, b) => {
  const x = Buffer.from(a || "", "hex");
  const y = Buffer.from(b || "", "hex");
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};

exports.normalizePhone = (phone) => {
  if (!phone) return "";
  let clean = String(phone).trim().replace(/[\s-]/g, "");
  if (!clean.startsWith("+")) {
    const digits = clean.replace(/\D/g, "");
    if (digits.length === 10) return "+91" + digits;
    if (digits.length > 10 && digits.startsWith("91")) return "+" + digits;
    return digits ? "+" + digits : "";
  }
  return clean;
};

exports.phoneQuery = (phone) => {
  if (!phone) return { $in: [] };
  const raw = String(phone).trim();
  const clean = raw.replace(/[\s-]/g, "");
  const digits = raw.replace(/\D/g, "").slice(-10);
  const withPlus91 = digits ? "+91" + digits : "";
  const withoutPlus = digits;
  const with91 = digits ? "91" + digits : "";
  const candidates = Array.from(new Set([raw, clean, withPlus91, withoutPlus, with91])).filter(Boolean);
  return { $in: candidates };
};

// ── Nodemailer transporter (Gmail) ──────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const email = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_APP_PASSWORD;

  if (!email || !pass || email === "your-gmail@gmail.com") {
    return null; // SMTP not configured → fall back to console
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: email, pass },
  });

  return transporter;
}

// Build a branded HTML email body
function buildOtpEmail({ field, code }) {
  const purpose =
    field === "password reset"
      ? "reset your password"
      : field === "registration"
      ? "complete your registration"
      : field === "email"
      ? "verify your email address"
      : `verify your ${field}`;

  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fbfdf5;border-radius:16px;border:1px solid #e5edd4">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:#4d7c0f;color:#fff;font-size:24px;width:48px;height:48px;line-height:48px;border-radius:12px">🏠</div>
      <h2 style="margin:12px 0 4px;color:#365314;font-size:20px">HomeCrew</h2>
      <p style="margin:0;color:#6b7280;font-size:14px">Your verification code</p>
    </div>
    <p style="color:#374151;font-size:14px;line-height:1.6">
      Hi there! Use the following 6-digit code to <strong>${purpose}</strong>.
      This code expires in <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:24px 0">
      <span style="display:inline-block;background:#fff;border:2px dashed #84cc16;border-radius:12px;padding:16px 32px;font-size:32px;font-weight:bold;letter-spacing:0.3em;color:#365314">${code}</span>
    </div>
    <p style="color:#6b7280;font-size:12px;line-height:1.6">
      If you didn't request this code, you can safely ignore this email. Do not share this code with anyone.
    </p>
    <hr style="border:none;border-top:1px solid #e5edd4;margin:24px 0" />
    <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0">
      © ${new Date().getFullYear()} HomeCrew — Home services made simple
    </p>
  </div>`;
}

// Send SMS via Fast2SMS
async function sendSmsFast2Sms({ phone, code }) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`[SMS-OTP] (No FAST2SMS_API_KEY set) Verification code for ${phone}: ${code}`);
    return;
  }

  // Format phone to 10 digits (strip +91, leading 0, spaces, dashes)
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
  if (cleanPhone.length !== 10) {
    console.error(`[SMS-OTP] Invalid 10-digit Indian phone number: ${phone}`);
    return;
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: String(code),
        numbers: cleanPhone,
      }),
    });

    const data = await response.json();
    if (!data.return) {
      console.warn(`[SMS-OTP] Fast2SMS notice: ${data.message || JSON.stringify(data)}`);
      console.log(`[SMS-OTP] (Dev Console Fallback) Verification code for ${cleanPhone}: ${code}`);
    } else {
      console.log(`[SMS-OTP] Code sent successfully via Fast2SMS to ${cleanPhone}`);
    }
  } catch (err) {
    console.error(`[SMS-OTP] Failed to send SMS via Fast2SMS:`, err.message);
    console.log(`[SMS-OTP] (Dev Console Fallback) Verification code for ${cleanPhone}: ${code}`);
  }
}

// Send SMS via Twilio Verify
async function sendSmsTwilio({ phone }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;

  if (!sid || !token || !verifySid) return false;

  let cleanPhone = String(phone).replace(/\s+/g, "").replace(/-/g, "");
  if (!cleanPhone.startsWith("+")) {
    const digits = cleanPhone.replace(/\D/g, "").slice(-10);
    cleanPhone = "+91" + digits;
  }

  try {
    const auth = Buffer.from(sid + ":" + token).toString("base64");
    const res = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `To=${encodeURIComponent(cleanPhone)}&Channel=sms`,
    });

    const data = await res.json();
    if (res.status === 201 || data.status === "pending") {
      console.log(`[SMS-OTP] Real SMS OTP dispatched via Twilio to ${cleanPhone}`);
      return true;
    } else {
      console.warn(`[SMS-OTP] Twilio Verify notice (${res.status}): ${data.message || JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    console.error(`[SMS-OTP] Twilio fetch error:`, err.message);
    return false;
  }
}

// Check OTP with Twilio Verify
exports.checkTwilioVerifyCode = async ({ phone, code }) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;

  if (!sid || !token || !verifySid) return false;

  let cleanPhone = String(phone).replace(/\s+/g, "").replace(/-/g, "");
  if (!cleanPhone.startsWith("+")) {
    const digits = cleanPhone.replace(/\D/g, "").slice(-10);
    cleanPhone = "+91" + digits;
  }

  try {
    const auth = Buffer.from(sid + ":" + token).toString("base64");
    const res = await fetch(`https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `To=${encodeURIComponent(cleanPhone)}&Code=${encodeURIComponent(code)}`,
    });

    const data = await res.json();
    return data.status === "approved";
  } catch {
    return false;
  }
};

// Sends the code to the user via email (or Twilio/Fast2SMS for phone numbers).
exports.deliverOtp = async ({ field, to, code }) => {
  // If it's a phone number, try Twilio Verify first, then Fast2SMS, then console fallback
  if (field === "phone") {
    const sentViaTwilio = await sendSmsTwilio({ phone: to });
    if (!sentViaTwilio) {
      await sendSmsFast2Sms({ phone: to, code });
    }
    return;
  }

  // Otherwise, send via Nodemailer Gmail SMTP
  const smtp = getTransporter();

  if (!smtp) {
    // Fallback: no SMTP configured, just log
    console.log(`[OTP] ${field} verification code for ${to}: ${code}`);
    return;
  }

  const subject =
    field === "password reset"
      ? "HomeCrew — Password Reset Code"
      : field === "registration"
      ? "HomeCrew — Registration Verification Code"
      : "HomeCrew — Email Verification Code";

  await smtp.sendMail({
    from: `"HomeCrew" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html: buildOtpEmail({ field, code }),
  });

  console.log(`[OTP] ${field} code sent via email to ${to}`);
};

// When OTP_DEBUG=true the API also returns the code so you can test without
// an email/SMS provider. Keep it OFF in production.
exports.exposeCode = () => process.env.OTP_DEBUG === "true";

