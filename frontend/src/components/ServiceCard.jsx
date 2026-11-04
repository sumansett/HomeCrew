import { Link } from "react-router-dom";

export default function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service._id}`}
      className="group flex flex-col justify-between rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div>
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl">{service.icon}</div>
        <h3 className="font-semibold text-gray-800 group-hover:text-brand-700">{service.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">{service.description}</p>
      </div>
      {service.startingPrice > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-brand-50 pt-2.5">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Base Price (Visiting & Inspection)
            </span>
            <span className="text-sm font-bold text-brand-800">
              ₹{service.startingPrice}
            </span>
          </div>
          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-100">
            Min. on hire
          </span>
        </div>
      )}
    </Link>
  );
}
