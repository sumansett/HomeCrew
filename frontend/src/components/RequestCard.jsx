import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import Avatar from "./Avatar";
import { fileUrl } from "../api/client";

// One service request (used in Dashboard + My Requests)
export default function RequestCard({ request, children }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">{request.service?.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{request.service?.name}</h3>
            <p className="text-xs text-gray-400">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-3 text-sm text-gray-600">{request.description}</p>
      <div className="mt-3 grid gap-1 text-sm text-gray-500 sm:grid-cols-2">
        <p>📍 {request.location}</p>
        <p>🕒 {new Date(request.preferredTime).toLocaleString()}</p>
        <p className="sm:col-span-2 text-xs">
          💳 Payment Preference:{" "}
          <span className="font-semibold text-brand-700">
            {request.payment?.preferredMethod === "cash"
              ? "💵 Cash on Service (Pay after work)"
              : "💳 Online Payment (Pay after work)"}
          </span>
        </p>
        {request.assignedProfessional && (
          <div className="mt-1 flex flex-wrap items-center gap-3 rounded-xl bg-brand-50 p-3 sm:col-span-2">
            <Avatar user={request.assignedProfessional} className="h-11 w-11" text="text-base" />
            <p className="min-w-0 flex-1">
              👷 Assigned: <b className="text-gray-700">{request.assignedProfessional.name}</b>{" "}
              <span className="capitalize">({request.assignedProfessional.type})</span>
              <span className="block text-xs">📞 {request.assignedProfessional.phone}</span>
            </p>
            <Link to={`/my-requests/${request._id}/professional`} className="text-sm font-semibold text-brand-600 hover:underline">
              View profile →
            </Link>
          </div>
        )}
      </div>

      {request.images?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {request.images.map((img) => (
            <a key={img} href={fileUrl(img)} target="_blank" rel="noreferrer">
              <img src={fileUrl(img)} alt="request" className="h-16 w-16 rounded-lg border object-cover" />
            </a>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
