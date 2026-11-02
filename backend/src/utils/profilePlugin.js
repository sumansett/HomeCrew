// Adds profile-photo + contact-verification fields to a schema (customers and professionals)
module.exports = (schema) => {
  schema.add({
    avatar: { type: String, default: "" }, // e.g. /uploads/123.png
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    // A pending email/phone change waiting for its one-time code
    pendingContact: {
      field: { type: String, enum: ["email", "phone"] },
      value: String,
      codeHash: String,
      expiresAt: Date,
      sentAt: Date,
      attempts: Number,
    },
  });
};
