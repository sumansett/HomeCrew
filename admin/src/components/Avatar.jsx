import { fileUrl } from "../api/client";

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

// Profile photo, or the person's initials when there is none
export default function Avatar({ user, className = "h-12 w-12", text = "text-base" }) {
  if (user?.avatar) {
    return <img src={fileUrl(user.avatar)} alt={user.name || "Profile"} className={`${className} shrink-0 rounded-full object-cover ring-2 ring-brand-100`} />;
  }
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700 ${className} ${text}`}>
      {initials(user?.name)}
    </span>
  );
}
