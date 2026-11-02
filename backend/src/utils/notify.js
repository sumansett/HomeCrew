const Notification = require("../models/Notification");

/**
 * Creates a notification record for a specific user, professional, or admins.
 */
async function createNotification({
  recipientRole,
  recipientId = null,
  title,
  message,
  type = "system",
  link = "",
}) {
  try {
    return await Notification.create({
      recipientRole,
      recipientId: recipientId || null,
      title: String(title).trim(),
      message: String(message).trim(),
      type,
      link,
      isRead: false,
    });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
}

module.exports = {
  createNotification,
};
