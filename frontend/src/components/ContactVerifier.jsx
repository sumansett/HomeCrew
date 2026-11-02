import { useEffect, useState } from "react";
import { api } from "../api/client";
import Alert from "./Alert";

// One row for email OR phone: edit -> receive a 6-digit code -> confirm.
// The new value is only saved on the account after the code is verified.
export default function ContactVerifier({ field, base, token, user, onUpdated }) {
  const isEmail = field === "email";
  const label = isEmail ? "Email address" : "Phone number";
  const current = user?.[field] || "";
  const verified = !!user?.[`${field}Verified`];
  const pending = user?.pendingContact?.field === field ? user.pendingContact : null;

  const [value, setValue] = useState(current);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    if (!pending) setValue(current);
  }, [current, pending]);

  const call = async (name, path, method, body, onOk) => {
    setBusy(name);
    setMsg({ type: "", text: "" });
    try {
      const res = await api(`${base}/contact${path}`, { method, body, token });
      onUpdated(res.user);
      onOk(res);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy("");
    }
  };

  const send = () =>
    call("send", "/request", "POST", { field, value: pending ? pending.value : value }, (res) => {
      setCode("");
      setCountdown(30);
      setMsg({ type: "success", text: res.message });
    });

  const verify = (e) => {
    e.preventDefault();
    call("verify", "/verify", "POST", { code }, (res) => {
      setCode("");
      setMsg({ type: "success", text: res.message });
    });
  };

  const cancel = () =>
    call("cancel", "", "DELETE", undefined, () => {
      setCode("");
      setCountdown(0);
    });

  const changed = value.trim().toLowerCase() !== current.toLowerCase();
  const canSend = !!value.trim() && (changed || !verified);

  return (
    <div className="rounded-2xl border border-brand-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {current && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${verified ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-800"}`}>
            {verified ? "✓ Verified" : "Not verified"}
          </span>
        )}
      </div>

      {!pending ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type={isEmail ? "email" : "tel"}
            inputMode={isEmail ? "email" : "tel"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isEmail ? "you@example.com" : "+91 98765 43210"}
            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            disabled={!canSend || busy === "send"}
            onClick={send}
            className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "send" ? "Sending..." : changed ? "Send code" : "Verify"}
          </button>
        </div>
      ) : (
        <form onSubmit={verify} className="mt-2 space-y-3">
          <p className="text-sm text-gray-600">
            Enter the 6-digit code sent to <span className="break-all font-semibold">{pending.value}</span>. Your {field} changes only after it is confirmed.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-lg font-mono tracking-[0.3em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-44"
            />
            <button
              type="submit"
              disabled={code.length !== 6 || busy === "verify"}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "verify" ? "Checking..." : "Confirm"}
            </button>
          </div>
          <div className="flex gap-4 text-sm">
            <button
              type="button"
              onClick={send}
              disabled={busy === "send" || countdown > 0}
              className="font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={busy === "cancel"}
              className="font-medium text-gray-500 hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {msg.text && (
        <div className="mt-3">
          <Alert type={msg.type}>{msg.text}</Alert>
        </div>
      )}
    </div>
  );
}
