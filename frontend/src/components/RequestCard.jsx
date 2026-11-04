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
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200/60 bg-gradient-to-r from-brand-50 to-emerald-50/40 p-3.5 sm:col-span-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar user={request.assignedProfessional} className="h-11 w-11 shrink-0" text="text-base" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  👷 Assigned: <span className="text-brand-900">{request.assignedProfessional.name}</span>{" "}
                  <span className="text-xs font-normal text-gray-500 capitalize">({request.assignedProfessional.type})</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">📞 {request.assignedProfessional.phone}</span>
                  {request.assignedProfessional.phone && (
                    <a
                      href={`tel:${request.assignedProfessional.phone}`}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                      title="Directly call technician"
                    >
                      📞 Call Technician
                    </a>
                  )}
                </div>
              </div>
            </div>
            <Link to={`/my-requests/${request._id}/professional`} className="text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline shrink-0">
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
