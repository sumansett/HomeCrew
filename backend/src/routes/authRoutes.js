const router = require("express").Router();
const c = require("../controllers/authController");
const protect = require("../middleware/auth");
const upload = require("../middleware/upload");
const User = require("../models/User");

// customers may edit name + address directly; email/phone go through OTP verification
const profile = require("../controllers/profileController")(User, { editable: ["name", "address"] });

router.post("/send-register-otp", c.sendRegisterOtp);
router.post("/verify-register-otp", c.verifyRegisterOtp);
router.post("/register", c.register);
router.post("/login", c.login);
router.post("/forgot-password", c.forgotPassword);
router.post("/reset-password", c.resetPassword);
router.get("/me", protect("customer"), c.getMe);

router.put("/profile", protect("customer"), profile.updateProfile);
router.post("/profile/avatar", protect("customer"), upload.image.single("avatar"), profile.uploadAvatar);
router.delete("/profile/avatar", protect("customer"), profile.removeAvatar);
router.post("/profile/contact/request", protect("customer"), profile.requestContactChange);
router.post("/profile/contact/verify", protect("customer"), profile.verifyContactChange);
router.delete("/profile/contact", protect("customer"), profile.cancelContactChange);

module.exports = router;
