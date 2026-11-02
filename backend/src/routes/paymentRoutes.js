const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  getConfig,
  createOrder,
  verifyPayment,
  payCashOnService,
} = require("../controllers/paymentController");

// Public or customer
router.get("/config", getConfig);
router.post("/create-order", protect("customer"), createOrder);
router.post("/verify", protect("customer"), verifyPayment);
router.post("/cash-on-service", protect("customer"), payCashOnService);

module.exports = router;
