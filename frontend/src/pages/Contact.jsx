
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const result = await api("/contact", {
        method: "POST",
        body: form,
      });

      setStatus(result.message || "Message sent successfully.");
      setIsError(false);
      setForm(initialForm);
    } catch (error) {
      setStatus(error.message || "Unable to send your message.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="min-h-full bg-[#fbfdf5]">
      <section className="bg-brand-700 px-4 py-14 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
          HomeCrew Support
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Contact Us
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
          Have a question about our household services? Send us a
          message and our team will review your enquiry.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-5 md:py-14">
        <div className="space-y-5 md:col-span-2">
          <h2 className="text-2xl font-bold text-gray-800">
            Get in Touch
          </h2>
          <p className="text-sm leading-7 text-gray-600">
            We welcome your questions, suggestions, service enquiries,
            and feedback. Contact HomeCrew for assistance with your
            household service experience.
          </p>

          {/* Email Support */}
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800">Email Support</h3>
                <p className="mt-0.5 text-xs text-gray-500">For enquiries, feedback & assistance</p>
                <a
                  href="mailto:genxproject8@gmail.com"
                  className="mt-2 inline-flex items-center gap-1.5 font-medium text-sm text-brand-700 hover:text-brand-800 hover:underline break-all"
                >
                  ✉ genxproject8@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Phone Support */}
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800">Phone Support</h3>
                <p className="mt-0.5 text-xs text-gray-500">Direct helpline & call assistance</p>
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href="tel:+919836182728"
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-brand-500 hover:bg-brand-50/60 hover:text-brand-900"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-brand-600">📞</span> +91 98361 82728
                    </span>
                    <span className="rounded bg-brand-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 uppercase group-hover:bg-brand-600 group-hover:text-white transition">
                      Call
                    </span>
                  </a>

                  <a
                    href="tel:+919330982319"
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-brand-500 hover:bg-brand-50/60 hover:text-brand-900"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-brand-600">📞</span> +91 93309 82319
                    </span>
                    <span className="rounded bg-brand-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 uppercase group-hover:bg-brand-600 group-hover:text-white transition">
                      Call
                    </span>
                  </a>

                  <a
                    href="tel:+918017498512"
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-brand-500 hover:bg-brand-50/60 hover:text-brand-900"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-brand-600">📞</span> +91 80174 98512
                    </span>
                    <span className="rounded bg-brand-100/70 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 uppercase group-hover:bg-brand-600 group-hover:text-white transition">
                      Call
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Connect Card */}
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0A66C2]">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800">Connect on LinkedIn</h3>
                <p className="mt-0.5 text-xs text-gray-500">Reach out to the team directly</p>
                <div className="mt-3 flex flex-col gap-2">
                  <a
                    href="https://www.linkedin.com/in/suman-sett/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-800 transition hover:border-[#0A66C2] hover:bg-blue-50/50 hover:text-[#0A66C2]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0A66C2] text-[10px] font-bold text-white">
                        SS
                      </span>
                      <span className="truncate">Suman Sett</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0A66C2] opacity-70 group-hover:opacity-100 transition">
                      Connect ↗
                    </span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/sumit-basu-1098ba310/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-800 transition hover:border-[#0A66C2] hover:bg-blue-50/50 hover:text-[#0A66C2]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0A66C2] text-[10px] font-bold text-white">
                        SB
                      </span>
                      <span className="truncate">Sumit Basu</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0A66C2] opacity-70 group-hover:opacity-100 transition">
                      Connect ↗
                    </span>
                  </a>

                  <a
                    href="https://www.linkedin.com/in/arijit-sen-99b9a932b/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2 text-xs font-medium text-gray-800 transition hover:border-[#0A66C2] hover:bg-blue-50/50 hover:text-[#0A66C2]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0A66C2] text-[10px] font-bold text-white">
                        AS
                      </span>
                      <span className="truncate">Arijit Sen</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0A66C2] opacity-70 group-hover:opacity-100 transition">
                      Connect ↗
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="inline-block text-sm font-semibold text-brand-700 hover:underline"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8 md:col-span-3">
          <h2 className="text-2xl font-bold text-gray-800">
            Send Us a Message
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Complete the form below to submit your enquiry.
          </p>

          {status && (
            <div
              role="status"
              aria-live="polite"
              className={`mt-5 rounded-lg p-3 text-sm ${
                isError
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Enter your full name"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                maxLength={150}
                placeholder="What do you need help with?"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={form.message}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={3000}
                placeholder="Write your message here..."
                className={`${inputClass} resize-y`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
