export default function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-3xl font-bold text-brand-700">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
