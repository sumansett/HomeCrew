const router = require("express").Router();
const c = require("../controllers/authController");
const protect = require("../middleware/auth");
const upload = require("../middleware/upload");
const User = require("../models/User");

// Customers may edit name, address, email, and phone directly without OTP
const profile = require("../controllers/profileController")(User, { editable: ["name", "email", "phone", "address"] });

router.post("/register", c.register);
router.post("/login", c.login);
router.post("/forgot-password", c.forgotPassword);
router.get("/me", protect("customer"), c.getMe);

router.put("/profile", protect("customer"), profile.updateProfile);
router.post("/profile/avatar", protect("customer"), upload.image.single("avatar"), profile.uploadAvatar);
router.delete("/profile/avatar", protect("customer"), profile.removeAvatar);

module.exports = router;
