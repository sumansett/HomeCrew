import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function getTypeIcon(type) {
  switch (type) {
    case "booking":
      return { icon: "🛠️", bg: "bg-blue-50 text-blue-600 border-blue-200" };
    case "billing":
      return { icon: "🧾", bg: "bg-amber-50 text-amber-600 border-amber-200" };
    case "payment":
      return { icon: "💳", bg: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    case "payout":
      return { icon: "💰", bg: "bg-green-50 text-green-600 border-green-200" };
    case "verification":
      return { icon: "📜", bg: "bg-purple-50 text-purple-600 border-purple-200" };
    default:
      return { icon: "🔔", bg: "bg-brand-50 text-brand-600 border-brand-200" };
  }
}

export default function NotificationBell({ token, role }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await api("/notifications", { token });
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Background poll silently fails if token expired or network offline
    }
  };

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Poll every 10 seconds for real-time news & updates
    const interval = setInterval(fetchNotifications, 10000);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [token]);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
      setLoading(true);
      await api("/notifications/mark-all-read", { method: "PUT", token });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api(`/notifications/${notif._id}/read`, { method: "PUT", token });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }

    setOpen(false);

    if (notif.link) {
      // Map role fallback paths
      let target = notif.link;
      if (role === "professional" && target === "/dashboard") target = "/pro/dashboard";
      if (role === "customer" && target === "/dashboard") target = "/my-requests";
      navigate(target);
    }
  };

  if (!token) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
          open
            ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
            : "bg-white text-gray-700 hover:bg-brand-50 hover:text-brand-700 border border-brand-100/80 shadow-sm"
        }`}
        aria-label="Notifications"
        title="Notifications & Updates"
      >
        {/* Bell SVG */}
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Counter Badge (1, 2, 3...) */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-[20px] h-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-md ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-[#fbfdf5] to-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-800">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {unreadCount} new
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  All caught up
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List of News/Notifications */}
          <div className="max-h-[380px] divide-y divide-gray-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400">
                  🔔
                </div>
                <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
                <p className="mt-1 text-xs text-gray-400">
                  Any updates regarding bookings, bills, or payments will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const badge = getTypeIcon(notif.type);
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-brand-50/50 ${
                      !notif.isRead ? "bg-brand-50/20" : "bg-white"
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base shadow-xs ${badge.bg}`}
                    >
                      {badge.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`truncate text-xs font-semibold ${
                            !notif.isRead ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-gray-400">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 group-hover:underline">
                          View details &rarr;
                        </span>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-[#fbfdf5]/60 px-4 py-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live system updates
            </span>
            <span>HomeCrew</span>
          </div>
        </div>
      )}
    </div>
  );
}
