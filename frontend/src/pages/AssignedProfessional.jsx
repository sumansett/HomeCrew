import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import Avatar from "../components/Avatar";
import Stars from "../components/Stars";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

// What a customer sees about the technician/contractor assigned to their request.
// Public profile only - verification documents are never shown here.
export default function AssignedProfessional() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data, loading, error } = useFetch(`/requests/${id}/professional`, token);
  const pro = data?.professional;
  const reviews = data?.reviews || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Link to="/my-requests" className="text-sm font-medium text-brand-600 hover:underline">← Back to my requests</Link>

      <div className="mt-4 space-y-6">
        <Alert>{error}</Alert>
        {loading ? (
          <Loader />
        ) : (
          pro && (
            <>
              <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                  <Avatar user={pro} className="h-28 w-28" text="text-4xl" />
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-brand-800">{pro.name}</h1>
                    <p className="mt-1 capitalize text-gray-500">{pro.type} • {pro.service?.icon} {pro.service?.name}</p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                      {pro.verified && <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">✓ Verified by HomeCrew</span>}
                      {data?.request && <StatusBadge status={data.request.status} />}
                    </div>
                    <p className="mt-3 text-sm">
                      {pro.totalReviews > 0 ? (
                        <>
                          <Stars value={pro.averageRating} className="text-lg" />
                          <span className="ml-2 font-semibold text-gray-700">{pro.averageRating}</span>
                          <span className="text-gray-400"> ({pro.totalReviews} review{pro.totalReviews > 1 ? "s" : ""})</span>
                        </>
                      ) : (
                        <span className="text-gray-400">No reviews yet</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    [pro.experience ?? 0, "Years experience"],
                    [pro.completedJobs, "Jobs completed"],
                    [new Date(pro.memberSince).getFullYear(), "On HomeCrew since"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-brand-50 p-3">
                      <p className="text-xl font-bold text-brand-700 sm:text-2xl">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                {pro.about && (
                  <div className="mt-6">
                    <h2 className="text-sm font-semibold text-gray-700">About</h2>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">{pro.about}</p>
                  </div>
                )}

                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-gray-700">Contact</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-base font-semibold text-gray-800">📞 {pro.phone}</span>
                    {pro.phone && (
                      <a
                        href={`tel:${pro.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
                        title="Directly call technician"
                      >
                        📞 Call Technician
                      </a>
                    )}
                    {pro.phoneVerified && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        ✓ Number verified
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">Customer reviews</h2>
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-400">No customer has reviewed {pro.name.split(" ")[0]} yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <article key={r._id} className="rounded-xl bg-gray-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-sm font-medium text-gray-700">{r.customer}</span>
                          <span className="text-xs text-gray-400">
                            {r.service?.icon} {r.service?.name}
                            {r.submittedAt && ` • ${new Date(r.submittedAt).toLocaleDateString()}`}
                          </span>
                        </div>
                        <p className="mt-1"><Stars value={r.rating} /> <span className="text-sm text-gray-500">{r.rating}/5</span></p>
                        {r.comment && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{r.comment}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )
        )}
      </div>
    </div>
  );
}
