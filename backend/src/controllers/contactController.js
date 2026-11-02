
const ContactMessage = require("../models/ContactMessage");
const asyncHandler = require("../utils/asyncHandler");

const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all contact form fields.",
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanSubject = subject.trim();
  const cleanMessage = message.trim();

  if (
    !cleanName ||
    cleanName.length > 100 ||
    !cleanSubject ||
    cleanSubject.length > 150 ||
    cleanMessage.length < 10 ||
    cleanMessage.length > 3000 ||
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    return res.status(400).json({
      success: false,
      message: "Please check your contact details and try again.",
    });
  }

  await ContactMessage.create({
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    message: cleanMessage,
  });

  res.status(201).json({
    success: true,
    message: "Your message has been sent successfully.",
  });
});

module.exports = { createContactMessage };
