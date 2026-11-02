import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import RequestCard from "../components/RequestCard";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

export default function Dashboard() {
  const { token, user } = useAuth();
  const { data, loading, error } = useFetch("/requests/my", token);
  const requests = data?.requests || [];

  const count = (status) => requests.filter((r) => r.status === status).length;
  const stats = [
    ["Total requests", requests.length, "📋"],
    ["Pending", count("pending"), "⏳"],
    ["In progress", count("assigned") + count("in-progress"), "🔧"],
    ["Completed", count("completed"), "✅"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title={`Hello, ${user?.name?.split(" ")[0]} 👋`} subtitle="Manage your household service requests.">
        <Link to="/request" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          + New request
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, icon]) => (
          <div key={label} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <div className="text-2xl">{icon}</div>
            <p className="mt-2 text-3xl font-bold text-brand-700">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Recent requests</h2>
        <Link to="/my-requests" className="text-sm font-medium text-brand-600 hover:underline">View all →</Link>
      </div>

      <div className="mt-4 space-y-4">
        <Alert>{error}</Alert>
        {loading ? (
          <Loader />
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-10 text-center">
            <p className="text-gray-500">You have not requested any service yet.</p>
            <Link to="/services" className="mt-3 inline-block font-medium text-brand-600 hover:underline">Browse services</Link>
          </div>
        ) : (
          requests.slice(0, 3).map((r) => <RequestCard key={r._id} request={r} />)
        )}
      </div>
    </div>
  );
}
