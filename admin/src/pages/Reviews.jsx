
import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

export default function Reviews() {
  const { token } = useAdminAuth();
  const { data, loading, error } = useFetch("/admin/reviews", token);
  const reviews = data?.reviews || [];

  const average = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "0.0";

  return (
    <>
      <PageHeader
        title="Customer Reviews"
        subtitle="Review ratings and feedback for completed household services."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total reviews</p>
          <p className="mt-2 text-3xl font-bold text-gray-800">
            {reviews.length}
          </p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5">
          <p className="text-sm text-gray-500">Overall average rating</p>
          <p className="mt-2 text-3xl font-bold text-gray-800">
            <span className="text-amber-400">★</span> {average}/5
          </p>
        </div>
      </div>

      <Alert>{error}</Alert>

      {loading ? (
        <Loader />
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-200 bg-white p-10 text-center text-gray-500">
          No customer reviews have been submitted yet.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review._id}
              className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {review.service?.icon} {review.service?.name || "Service"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Customer: {review.customer?.name || "Unavailable"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Professional: {review.professional?.name || "Unavailable"}
                    {review.professional?.type
                      ? ` (${review.professional.type})`
                      : ""}
                  </p>
                </div>

                <span className="text-xs text-gray-400">
                  {review.submittedAt
                    ? new Date(review.submittedAt).toLocaleString()
                    : ""}
                </span>
              </div>

              <p className="mt-3 text-lg text-amber-400">
                {"★".repeat(review.rating)}
                <span className="text-gray-300">
                  {"★".repeat(5 - review.rating)}
                </span>
                <span className="ml-2 text-sm text-gray-600">
                  {review.rating}/5
                </span>
              </p>

              <div className="mt-3 rounded-lg bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {review.comment}
                </p>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Request ID: {review.requestId}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
