const router = require("express").Router();
const c = require("../controllers/notificationController");
const protect = require("../middleware/auth");

// All notification routes require an authenticated user (admin, professional, or customer)
router.use(protect());

router.get("/", c.getNotifications);
router.put("/read-all", c.markAllAsRead);
router.put("/:id/read", c.markAsRead);
router.delete("/:id", c.deleteNotification);

module.exports = router;
