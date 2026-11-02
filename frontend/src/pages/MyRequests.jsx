import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import RequestCard from "../components/RequestCard";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import PaymentSection from "../components/PaymentSection";

const filters = ["all", "pending", "assigned", "in-progress", "completed", "cancelled"];

function ReviewForm({ request, token, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api(`/requests/${request._id}/review`, {
        method: "PUT",
        body: { rating, comment },
        token,
      });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-4"
    >
      <h4 className="font-semibold text-gray-800">Rate your experience</h4>

      <div className="mt-3 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            aria-pressed={rating === star}
            className="text-3xl leading-none"
          >
            <span className={star <= rating ? "text-amber-400" : "text-gray-300"}>
              ★
            </span>
          </button>
        ))}
        <span className="text-sm text-gray-600">{rating}/5</span>
      </div>

      <label
        htmlFor={`review-${request._id}`}
        className="mt-4 block text-sm font-medium text-gray-700"
      >
        Your feedback
      </label>

      <textarea
        id={`review-${request._id}`}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        minLength={1}
        maxLength={1000}
        required
        rows={3}
        placeholder="How was the technician's work?"
        className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-brand-500"
      />

      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

      <Button className="mt-3" disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}

export default function MyRequests() {
  const { token } = useAuth();
  const { data, loading, error, reload } = useFetch("/requests/my", token);
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState("");

  const requests = (data?.requests || []).filter((r) => filter === "all" || r.status === filter);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await api(`/requests/${id}/cancel`, { method: "PUT", token });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader title="My requests" subtitle="Track the status of your service requests.">
        <Link to="/request" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">+ New request</Link>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${filter === f ? "bg-brand-600 text-white" : "bg-white text-gray-600 ring-1 ring-brand-100 hover:bg-brand-50"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Alert>{error || msg}</Alert>
        {loading ? (
          <Loader />
        ) : requests.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No requests found.</p>
        ) : (
          requests.map((r) => (
            <RequestCard key={r._id} request={r}>
              {r.status === "pending" && (
                <div className="mt-4"><Button variant="danger" onClick={() => cancel(r._id)}>Cancel request</Button></div>
              )}

              {/* Final Invoice & Payment (Razorpay Online or Cash on Service) */}
              {r.status === "completed" && (
                <PaymentSection request={r} token={token} onPaid={reload} />
              )}

              {r.status === "completed" && !r.review?.rating && (
                <ReviewForm
                  request={r}
                  token={token}
                  onSubmitted={reload}
                />
              )}

              {r.review?.rating && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-white p-4">
                  <p className="font-semibold text-gray-800">Your review</p>
                  <p className="mt-1 text-lg text-amber-400">
                    {"★".repeat(r.review.rating)}
                    <span className="text-gray-300">
                      {"★".repeat(5 - r.review.rating)}
                    </span>
                    <span className="ml-2 text-sm text-gray-600">
                      {r.review.rating}/5
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{r.review.comment}</p>
                </div>
              )}

            </RequestCard>
          ))
        )}
      </div>
    </div>
  );
}
