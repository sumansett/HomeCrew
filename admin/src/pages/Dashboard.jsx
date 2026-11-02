import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

export default function Dashboard() {
  const { token } = useAdminAuth();
  const { data, loading, error } = useFetch("/admin/stats", token);

  if (loading) return <Loader />;
  if (error) return <Alert>{error}</Alert>;
  const s = data.stats;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of the HomeCrew platform" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value={s.users} icon="👥" />
        <StatCard label="Approved professionals" value={s.professionals} icon="👷" />
        <StatCard label="Pending verifications" value={s.pendingVerifications} icon="🕵️" />
        <StatCard label="Services" value={s.services} icon="🛠️" />
        <StatCard label="Total requests" value={s.requests} icon="📋" />
        <StatCard label="Pending requests" value={s.pendingRequests} icon="⏳" />
        <StatCard label="Completed" value={s.completedRequests} icon="✅" />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold text-gray-800">Recent requests</h2>
      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((r) => (
              <tr key={r._id} className="border-t border-brand-100">
                <td className="px-4 py-3">{r.customer?.name}</td>
                <td className="px-4 py-3">{r.service?.icon} {r.service?.name}</td>
                <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {data.recent.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-400">No requests yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
