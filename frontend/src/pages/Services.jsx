import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import ServiceCard from "../components/ServiceCard";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import useFetch from "../hooks/useFetch";

export default function Services() {
  const { data, loading, error } = useFetch("/services");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const services = data?.services || [];
  const categories = useMemo(() => ["All", ...new Set(services.map((s) => s.category))], [services]);

  const filtered = services.filter(
    (s) =>
      (category === "All" || s.category === category) &&
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Our Services" subtitle="Choose a service and request a verified professional." />

      {/* Base Pricing Transparency Banner */}
      <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 text-xs text-gray-700 flex items-start gap-3 shadow-2xs">
        <span className="text-xl shrink-0">🏷️</span>
        <div>
          <p className="font-bold text-gray-900 text-sm">Transparent Base Pricing</p>
          <p className="text-gray-600 mt-0.5 leading-relaxed">
            The price displayed on each service is the <b>minimum base price</b> payable when hiring a technician. It covers the technician's doorstep visit, on-site problem assessment, and initial diagnostic inspection. Any additional repair labor or replacement materials will be clearly itemized on your final bill upon job completion.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                category === c ? "bg-brand-600 text-white" : "bg-white text-gray-600 ring-1 ring-brand-100 hover:bg-brand-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Alert>{error}</Alert>
      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No services found.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => <ServiceCard key={s._id} service={s} />)}
        </div>
      )}
    </div>
  );
}
