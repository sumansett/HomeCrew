const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

// Helper to determine query for current authenticated user/role
function getRecipientFilter(req) {
  const role = req.role || req.user?.role || (req.user?.type ? "professional" : "customer");

  if (role === "admin") {
    return { recipientRole: "admin" };
  }
  if (role === "professional") {
    return { recipientRole: "professional", recipientId: req.user._id };
  }
  return { recipientRole: "customer", recipientId: req.user._id };
}

// GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const filter = getRecipientFilter(req);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.json({
    success: true,
    unreadCount,
    notifications,
  });
});

// PUT /api/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json({ success: true, notification });
});

// PUT /api/notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const filter = getRecipientFilter(req);

  await Notification.updateMany({ ...filter, isRead: false }, { isRead: true });

  res.json({ success: true, message: "All notifications marked as read" });
});

// DELETE /api/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Notification deleted" });
});
