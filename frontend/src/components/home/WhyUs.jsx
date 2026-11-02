import { Link } from "react-router-dom";

const points = [
  ["🛡️", "Verified professionals", "ID documents and certificates are reviewed by admins before approval."],
  ["⏱️", "Saves your time", "No more calling around - one request reaches the right expert."],
  ["📱", "Works on any device", "A responsive interface for phones, tablets and desktops."],
];

export default function WhyUs() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-bold text-brand-800">Why choose HomeCrew?</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {points.map(([icon, title, text]) => (
          <div key={title} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <div className="text-3xl">{icon}</div>
            <h3 className="mt-3 font-semibold text-gray-800">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-brand-700 px-6 py-10 text-center text-white">
        <h3 className="text-2xl font-bold">Are you a technician or contractor?</h3>
        <p className="mx-auto mt-2 max-w-xl text-brand-100">
          Register with your details and documents, get verified, and start receiving service requests.
        </p>
        <Link to="/join" className="mt-6 inline-block rounded-lg bg-[#fbfdf5] px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-white">
          Register as a professional
        </Link>
      </div>
    </section>
  );
}
