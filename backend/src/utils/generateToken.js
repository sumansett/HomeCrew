const jwt = require("jsonwebtoken");

// role = "customer" | "professional" | "admin"
module.exports = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "5d",
  });
