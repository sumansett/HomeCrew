import { Link } from "react-router-dom";
import Hero from "../components/home/Hero";
import HowItWorks from "../components/home/HowItWorks";
import WhyUs from "../components/home/WhyUs";
import ServiceCard from "../components/ServiceCard";
import Loader from "../components/Loader";
import useFetch from "../hooks/useFetch";

export default function Home() {
  const { data, loading } = useFetch("/services");
  const services = (data?.services || []).slice(0, 4);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-brand-800">Popular services</h2>
          <Link to="/services" className="text-sm font-medium text-brand-600 hover:underline">View all →</Link>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>
        )}
      </section>

      <HowItWorks />
      <WhyUs />
    </>
  );
}
