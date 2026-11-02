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

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {s.startingPrice > 0 && <span className="rounded-lg bg-brand-50 px-4 py-2 font-semibold text-brand-700">Starts at ₹{s.startingPrice}</span>}
          <span className={`rounded-lg px-4 py-2 text-sm font-medium ${s.available ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"}`}>
            {s.available ? "Available" : "Currently unavailable"}
          </span>
        </div>

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
