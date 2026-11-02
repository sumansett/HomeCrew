const bcrypt = require("bcryptjs");

// Reusable mongoose plugin: hashes password + adds matchPassword()
module.exports = (schema) => {
  schema.add({
    resetPasswordOtp: {
      codeHash: String,
      expiresAt: Date,
      sentAt: Date,
      attempts: { type: Number, default: 0 },
    },
  });

  schema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  schema.methods.matchPassword = function (plain) {
    return bcrypt.compare(plain, this.password);
  };

  schema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordOtp;
    // expose only what the UI needs about a pending email/phone change
    if (obj.pendingContact && obj.pendingContact.codeHash) {
      const { field, value, expiresAt } = obj.pendingContact;
      obj.pendingContact = { field, value, expiresAt };
    } else {
      delete obj.pendingContact;
    }
    return obj;
  };
};
