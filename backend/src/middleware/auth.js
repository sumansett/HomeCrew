const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Professional = require("../models/Professional");

const models = { customer: User, admin: Admin, professional: Professional };

// Usage: protect()          -> any logged in account
//        protect("admin")   -> only admins
const protect = (...roles) => async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ success: false, message: "Not logged in" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const Model = models[decoded.role];
    const account = Model && (await Model.findById(decoded.id));
    if (!account) return res.status(401).json({ success: false, message: "Account not found" });

    req.user = account;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = protect;
