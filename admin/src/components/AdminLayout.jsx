import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";

const menu = [
  ["/", "Dashboard", "📊"],
  ["/financials", "Financials & Payouts", "💰"],
  ["/requests", "Service Requests", "📋"],
  ["/professionals", "Professionals", "👷"],
  ["/services", "Services", "🛠️"],
  ["/users", "Customers", "👥"],
  ["/reviews", "Customer Reviews", "⭐"],
  ["/password-resets", "Password Resets", "🔑"],
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-brand-100 bg-white p-5 transition md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8"><Logo /></div>

        <nav className="space-y-1">
          {menu.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-brand-50"
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-brand-100 bg-[#fbfdf5] px-4 py-3">
          <button className="text-2xl md:hidden" onClick={() => setOpen(true)}>☰</button>
          <p className="hidden text-sm text-gray-500 md:block">Admin control panel</p>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="text-sm font-medium text-gray-700">{admin?.name}</span>
            <button onClick={handleLogout} className="rounded-lg border border-brand-200 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
