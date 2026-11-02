const styles = {
  pending: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  "in-progress": "bg-indigo-100 text-indigo-800",
  completed: "bg-brand-100 text-brand-700",
  cancelled: "bg-gray-200 text-gray-600",
  approved: "bg-brand-100 text-brand-700",
  rejected: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
