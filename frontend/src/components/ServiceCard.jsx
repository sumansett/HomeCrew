import { Link } from "react-router-dom";

export default function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service._id}`}
      className="group rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl">{service.icon}</div>
      <h3 className="font-semibold text-gray-800 group-hover:text-brand-700">{service.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{service.description}</p>
      {service.startingPrice > 0 && (
        <p className="mt-3 text-sm font-medium text-brand-700">Starts at ₹{service.startingPrice}</p>
      )}
    </Link>
  );
}
