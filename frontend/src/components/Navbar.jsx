import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-brand-100 text-brand-700" : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"}`;

export default function Navbar() {
  const { token, role, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const dashboardLink = role === "professional" ? "/pro/dashboard" : "/dashboard";
  const profileLink = role === "professional" ? "/pro/profile" : "/profile";
  const firstName = user?.name?.split(" ")[0];

  const links = (
    <>
      <NavLink to="/" end className={linkClass}>Home</NavLink>
      <NavLink to="/services" className={linkClass}>Services</NavLink>
      <NavLink to="/contact" className={linkClass}>Contact</NavLink>
      {token && <NavLink to={dashboardLink} className={linkClass}>Dashboard</NavLink>}
      {role === "customer" && <NavLink to="/my-requests" className={linkClass}>My Requests</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-[#fbfdf5]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Logo tagline />

        <nav className="hidden items-center gap-1 lg:flex">{links}</nav>

        <div className="hidden items-center gap-3 lg:flex">
          {token ? (
            <>
              <NotificationBell token={token} role={role} />
              <Link to={profileLink} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700" title="My profile">
                <Avatar user={user} className="h-8 w-8" text="text-xs" />
                Hi, {firstName}
              </Link>
              <button onClick={handleLogout} className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/join" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-700">Join as Pro</Link>
              <Link to="/login" className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">Login</Link>
              <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Sign up</Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {token && <NotificationBell token={token} role={role} />}
          <button
            className="grid h-10 w-10 place-items-center rounded-md text-2xl"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto border-t border-brand-100 px-4 pb-4 pt-2 lg:hidden">
          {token && (
            <Link to={profileLink} className="mb-2 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
              <Avatar user={user} className="h-11 w-11" text="text-base" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-800">{user?.name}</span>
                <span className="block text-xs text-brand-600">View &amp; edit profile</span>
              </span>
            </Link>
          )}
          <div className="flex flex-col gap-1">{links}</div>
          <div className="mt-2 flex flex-col gap-2">
            {token ? (
              <button onClick={handleLogout} className="rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-medium text-brand-700">Logout</button>
            ) : (
              <>
                <Link to="/login" className="rounded-lg border border-brand-200 px-4 py-2.5 text-center text-sm font-medium text-brand-700">Login</Link>
                <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white">Sign up</Link>
                <Link to="/join" className="px-4 py-2 text-center text-sm font-medium text-gray-600">Join as Pro</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
