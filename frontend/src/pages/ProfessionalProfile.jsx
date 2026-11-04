import { Link } from "react-router-dom";
import { fileUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import ProfileEditor from "../components/ProfileEditor";
import StatusBadge from "../components/StatusBadge";

export default function ProfessionalProfile() {
  const { token, user } = useAuth();
  const me = useFetch("/professionals/me", token);
  const verification = me.data?.verification;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <PageHeader title="My profile" subtitle={user?.email || user?.phone}>
        <Link to="/pro/dashboard" className="text-sm font-medium text-brand-600 hover:underline">← Back to dashboard</Link>
      </PageHeader>

      <ProfileEditor base="/professionals/profile" meUrl="/professionals/me" professional />

      {/* read-only: documents can only be reviewed by the admin */}
      <section className="mt-6 rounded-3xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-800">🔒 Verification documents</h2>
          <StatusBadge status={user?.status} />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Your ID and certificate were submitted for verification and cannot be changed from your profile. Editing your details above does not affect your approval status.
        </p>
        {verification && (
          <div className="mt-3 flex flex-col gap-1 text-sm">
            <a className="text-brand-600 hover:underline" href={fileUrl(verification.idDocument)} target="_blank" rel="noreferrer">View ID document</a>
            <a className="text-brand-600 hover:underline" href={fileUrl(verification.certificate)} target="_blank" rel="noreferrer">View certificate</a>
          </div>
        )}
      </section>
    </div>
  );
}
