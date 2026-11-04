import { useState } from "react";
import { api } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

export default function Reviews() {
  const { token } = useAdminAuth();
  const { data, loading, error, reload } = useFetch("/admin/reviews", token);
  const reviews = data?.reviews || [];

  const [deletingId, setDeletingId] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const average = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "0.0";

  const handleDeleteReview = async (review) => {
    const customerName = review.customer?.name || "Customer";
    const serviceName = review.service?.name || "Service";
    if (
      !window.confirm(
        `Are you sure you want to delete this customer review by "${customerName}" for "${serviceName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setActionMsg("");
    setActionError("");
    setDeletingId(review._id);

    try {
      await api(`/admin/reviews/${review._id}`, {
        method: "DELETE",
        token,
      });
      setActionMsg(`Customer review by ${customerName} has been deleted.`);
      reload();
    } catch (err) {
      setActionError(err.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Customer Reviews"
        subtitle="Review ratings, feedback, and moderation for completed household services."
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

      {actionMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span>✓ {actionMsg}</span>
          <button
            type="button"
            onClick={() => setActionMsg("")}
            className="text-emerald-600 hover:text-emerald-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center justify-between">
          <span>⚠️ {actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-red-600 hover:text-red-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

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
              className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-base">
                    {review.service?.icon} {review.service?.name || "Service"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Customer:</span>{" "}
                    {review.customer?.name || "Unavailable"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Professional:</span>{" "}
                    {review.professional?.name || "Unavailable"}
                    {review.professional?.type
                      ? ` (${review.professional.type})`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-400">
                    {review.submittedAt
                      ? new Date(review.submittedAt).toLocaleString()
                      : ""}
                  </span>
                  <button
                    type="button"
                    disabled={deletingId === review._id}
                    onClick={() => handleDeleteReview(review)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-600 hover:text-white transition disabled:opacity-50 shadow-2xs cursor-pointer"
                    title="Delete customer review"
                  >
                    <span>🗑️</span>
                    <span>{deletingId === review._id ? "Deleting..." : "Delete Review"}</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <p className="text-lg text-amber-400">
                  {"★".repeat(review.rating)}
                  <span className="text-gray-300">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </p>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {review.rating}/5
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700 italic">
                  “{review.comment}”
                </p>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                Request ID: #{review.requestId?.slice(-8).toUpperCase()}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
