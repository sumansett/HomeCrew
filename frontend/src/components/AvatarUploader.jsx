import { useRef, useState } from "react";
import { api } from "../api/client";
import Avatar from "./Avatar";

// base: "/auth/profile" (customer) or "/professionals/profile" (professional)
export default function AvatarUploader({ base, token, user, onUpdated, onMessage }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return onMessage({ type: "error", text: "Please choose a JPG, PNG or WEBP image" });
    if (file.size > 2 * 1024 * 1024) return onMessage({ type: "error", text: "Image must be 2 MB or smaller" });

    setBusy(true);
    onMessage({ type: "", text: "" });
    try {
      const body = new FormData();
      body.append("avatar", file);
      const res = await api(`${base}/avatar`, { method: "POST", body, isForm: true, token });
      onUpdated(res.user);
      onMessage({ type: "success", text: "Profile photo updated" });
    } catch (err) {
      onMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    onMessage({ type: "", text: "" });
    try {
      const res = await api(`${base}/avatar`, { method: "DELETE", token });
      onUpdated(res.user);
      onMessage({ type: "success", text: "Profile photo removed" });
    } catch (err) {
      onMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <Avatar user={user} className="h-24 w-24" text="text-3xl" />
      <div className="text-center sm:text-left">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Please wait..." : user?.avatar ? "Change photo" : "Upload photo"}
          </button>
          {user?.avatar && (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">JPG, PNG or WEBP, up to 2 MB.</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
      </div>
    </div>
  );
}
