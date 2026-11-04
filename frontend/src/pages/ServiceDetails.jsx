import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import useFetch from "../hooks/useFetch";
import { useAuth } from "../context/AuthContext";

export default function ServiceDetails() {
  const { id } = useParams();
  const { data, loading, error } = useFetch(`/services/${id}`);
  const { token, role } = useAuth();
  const navigate = useNavigate();

  if (loading) return <Loader />;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><Alert>{error}</Alert></div>;
  const s = data.service;

  const handleRequest = () => {
    if (!token) return navigate("/login");
    navigate(`/request?service=${s._id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/services" className="text-sm text-brand-600 hover:underline">← Back to services</Link>
      <div className="mt-4 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-4xl">{s.icon}</div>
        <h1 className="mt-4 text-3xl font-bold text-brand-800">{s.name}</h1>
        <p className="mt-1 text-sm text-gray-400">Category: {s.category}</p>
        <p className="mt-5 text-gray-600">{s.description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {s.startingPrice > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-200 px-4 py-2 text-brand-900">
              <span className="text-xs uppercase font-bold tracking-wider text-brand-700">Base Price:</span>
              <span className="text-lg font-extrabold text-brand-800">₹{s.startingPrice}</span>
              <span className="text-xs text-brand-600 font-medium">(Visiting & inspection fee on hire)</span>
            </div>
          )}
          <span className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
            s.available 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}>
            {s.available ? "✓ Available for Booking" : "Currently Unavailable"}
          </span>
        </div>

        {s.startingPrice > 0 && (
          <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 text-xs text-gray-700 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h4 className="font-bold text-gray-900 text-sm">
                Transparent Base Pricing Policy
              </h4>
            </div>
            <p className="leading-relaxed">
              When you hire a technician for <b>{s.name}</b>, the <b>base price of ₹{s.startingPrice}</b> is the minimum charge payable. This covers the technician's doorstep visit, on-site assessment, and initial diagnostic inspection.
            </p>
            <p className="leading-relaxed text-gray-600">
              Any additional labor for repairs or replacement parts/materials will be quoted on-site and included in your itemized final bill upon job completion. <b>No advance payment is needed</b> — you pay only after the work is done.
            </p>
          </div>
        )}

        {role === "professional" ? (
          <p className="mt-8 text-sm text-gray-500">Log in as a customer to request this service.</p>
        ) : (
          <button
            onClick={handleRequest}
            disabled={!s.available}
            className="mt-8 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Request this service
          </button>
        )}
      </div>
    </div>
  );
}
