import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-gray-500">
            Verified technicians and contractors for every household need.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-gray-700">Quick links</p>
          <div className="flex flex-col gap-1 text-gray-500">
            <Link to="/services" className="hover:text-brand-700">Services</Link>
            <Link to="/contact" className="hover:text-brand-700">
              Contact Us
            </Link>
            <Link to="/register" className="hover:text-brand-700">Create account</Link>
            <Link to="/join" className="hover:text-brand-700">Join as technician / contractor</Link>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <p className="mb-2 font-semibold text-gray-700">About</p>
          <p>Home Maintenance & Household Services Platform built with the MERN stack.</p>
        </div>
      </div>
      <p className="border-t border-brand-100 py-3 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} HomeCrew. All rights reserved.
      </p>
    </footer>
  );
}
