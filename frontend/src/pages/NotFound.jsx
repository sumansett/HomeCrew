import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <p className="mt-2 text-gray-500">This page could not be found.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
        Go home
      </Link>
    </div>
  );
}
