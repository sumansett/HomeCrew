const router = require("express").Router();
const c = require("../controllers/professionalController");
const protect = require("../middleware/auth");
const upload = require("../middleware/upload");
const Professional = require("../models/Professional");

// Permitted fields only. Service category, type and approval status are NOT here,
// and the Verification record (ID + certificate) is never touched by these routes.
// Email and phone can now be updated directly without OTP.
const profile = require("../controllers/profileController")(Professional, {
  editable: ["name", "email", "phone", "address", "about", "experience"],
  populate: "service",
});

router.post(
  "/register",
  upload.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  c.register
);
router.post("/login", c.login);
router.post("/forgot-password", c.forgotPassword);
router.get("/me", protect("professional"), c.getMe);
router.get("/requests", protect("professional"), c.getMyJobs);
router.put("/requests/:id/status", protect("professional"), c.updateJobStatus);
router.get("/earnings", protect("professional"), c.getMyEarnings);
router.post("/pay-commission/order", protect("professional"), c.createCommissionOrder);
router.post("/pay-commission/verify", protect("professional"), c.verifyCommissionPayment);
router.get("/reviews", protect("professional"), c.getMyReviews);

router.put("/profile", protect("professional"), profile.updateProfile);
router.post("/profile/avatar", protect("professional"), upload.image.single("avatar"), profile.uploadAvatar);
router.delete("/profile/avatar", protect("professional"), profile.removeAvatar);

module.exports = router;
