import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
      <div>
        <span className="rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold text-brand-700">
          Trusted home services
        </span>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight text-brand-800 sm:text-5xl">
          Home repairs, <span className="text-brand-500">done right</span> by verified pros.
        </h1>
        <p className="mt-4 max-w-lg text-gray-600">
          Electrical, plumbing, carpentry, painting, AC servicing, appliance repair and cleaning.
          Request a service in minutes and track it until it is done.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/services" className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Browse services
          </Link>
          <Link to="/join" className="rounded-lg border border-brand-200 px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Join as a professional
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[["⚡", "Electrical"], ["🚰", "Plumbing"], ["🎨", "Painting"], ["❄️", "AC Service"]].map(([icon, name]) => (
          <div key={name} className="rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm">
            <div className="text-4xl">{icon}</div>
            <p className="mt-2 font-medium text-gray-700">{name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
