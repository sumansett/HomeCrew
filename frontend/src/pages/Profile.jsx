import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import ProfileEditor from "../components/ProfileEditor";

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <PageHeader title="My profile" subtitle={user?.email || user?.phone} />
      <ProfileEditor base="/auth/profile" meUrl="/auth/me" />
    </div>
  );
}
