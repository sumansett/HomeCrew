const steps = [
  { icon: "🔍", title: "Choose a service", text: "Pick from electrical, plumbing, carpentry, painting and more." },
  { icon: "📝", title: "Submit your request", text: "Add details, location, preferred time and photos of the problem." },
  { icon: "✅", title: "Verified pro assigned", text: "Our admin assigns a background-verified technician or contractor." },
  { icon: "📍", title: "Track progress", text: "Follow your request status from pending to completed." },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-brand-800">How HomeCrew works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-brand-100 bg-[#fbfdf5] p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-2xl">{s.icon}</div>
              <p className="mt-3 text-xs font-semibold text-brand-500">STEP {i + 1}</p>
              <h3 className="mt-1 font-semibold text-gray-800">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
