import { useState } from "react";
import { api } from "../api/client";
import { useAdminAuth } from "../context/AdminAuthContext";
import useFetch from "../hooks/useFetch";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import FormInput from "../components/FormInput";
import Button from "../components/Button";
import Loader from "../components/Loader";
import Alert from "../components/Alert";

const tabs = ["pending", "approved", "rejected", "all"];

const fmtTime = (d) => (d ? new Date(d).toLocaleString() : "-");

export default function PasswordResets() {
  const { token } = useAdminAuth();
  const { data, loading, error, refetch } = useFetch("/admin/password-resets", token);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // "approve" | "reject"
  const [tempPassword, setTempPassword] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const requests = data?.requests || [];

  const filtered = requests.filter((r) => {
    if (activeTab !== "all" && r.status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPhone = (r.phone || "").toLowerCase().includes(q);
      const matchName = (r.name || "").toLowerCase().includes(q);
      const matchType = (r.userType || "").toLowerCase().includes(q);
      if (!matchPhone && !matchName && !matchType) return false;
    }
    return true;
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pwd);
  };

  const handleOpenApprove = (req) => {
    setSelectedRequest(req);
    setActionType("approve");
    generatePassword();
    setAdminNotes("");
    setActionError("");
  };

  const handleOpenReject = (req) => {
    setSelectedRequest(req);
    setActionType("reject");
    setAdminNotes("");
    setActionError("");
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setActionType(null);
    setTempPassword("");
    setAdminNotes("");
    setActionError("");
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setActionError("");
    setSubmitting(true);

    try {
      if (actionType === "approve") {
        if (!tempPassword || tempPassword.length < 6) {
          throw new Error("Temporary password must be at least 6 characters");
        }
        const res = await api(`/admin/password-resets/${selectedRequest._id}/approve`, {
          method: "PUT",
          body: { temporaryPassword: tempPassword, adminNotes },
          token,
        });
        setSuccessMsg(res.message || "Password reset approved successfully.");
      } else {
        const res = await api(`/admin/password-resets/${selectedRequest._id}/reject`, {
          method: "PUT",
          body: { adminNotes },
          token,
        });
        setSuccessMsg(res.message || "Password reset request rejected.");
      }
      closeModal();
      refetch();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Password Reset Requests"
        subtitle="Review and securely assist customers and technicians requesting password recovery without SMS/email OTP."
      />

      {successMsg && (
        <Alert type="success" onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      )}

      {error && <Alert type="error">{error}</Alert>}

      {/* Tabs and search bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count = requests.filter((r) => tab === "all" || r.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition ${
                  activeTab === tab
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-brand-50 hover:text-brand-700 border border-brand-100"
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, role..."
          className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-xs text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-64"
        />
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-gray-400">
          No password reset requests found in this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-100 bg-brand-50/50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Account Role</th>
                  <th className="px-4 py-3 font-semibold">Registered Phone</th>
                  <th className="px-4 py-3 font-semibold">Reason / Note</th>
                  <th className="px-4 py-3 font-semibold">Requested At</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Admin Notes</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50 text-gray-700">
                {filtered.map((req) => (
                  <tr key={req._id} className="hover:bg-brand-50/30 transition">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800">{req.name || "User"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                          req.userType === "professional"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {req.userType === "professional" ? "Technician" : "Customer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <span>{req.phone}</span>
                        {req.phone && (
                          <a
                            href={`tel:${req.phone}`}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                            title="Call user"
                          >
                            📞 Call
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-600" title={req.reason}>
                      {req.reason || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtTime(req.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-500" title={req.adminNotes}>
                      {req.adminNotes || "-"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleOpenApprove(req)}
                            className="rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700 transition"
                          >
                            Approve & Set Password
                          </button>
                          <button
                            onClick={() => handleOpenReject(req)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50 transition"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action modal */}
      {selectedRequest && actionType && (
        <Modal
          title={
            actionType === "approve"
              ? "Approve Password Reset & Set Temporary Password"
              : "Reject Password Reset Request"
          }
          onClose={closeModal}
        >
          {actionError && <Alert type="error">{actionError}</Alert>}

          <form onSubmit={handleConfirmAction} className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900 space-y-1">
              <p><span className="font-semibold">User:</span> {selectedRequest.name || "User"}</p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">Mobile Number:</span>
                <span>{selectedRequest.phone}</span>
                {selectedRequest.phone && (
                  <a
                    href={`tel:${selectedRequest.phone}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                    title="Call user"
                  >
                    📞 Call
                  </a>
                )}
              </p>
              <p><span className="font-semibold">Role:</span> {selectedRequest.userType === "professional" ? "Technician" : "Customer"}</p>
              {selectedRequest.reason && <p><span className="font-semibold">User Note:</span> {selectedRequest.reason}</p>}
            </div>

            {actionType === "approve" ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Temporary Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[11px] font-medium text-brand-600 hover:underline"
                    >
                      🎲 Generate Random
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter temporary password"
                    className="w-full rounded-xl border border-brand-200 p-2.5 font-mono text-xs text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    This password will be securely hashed with bcrypt in the database. Share this password with the user so they can log in and update their password in profile settings.
                  </p>
                </div>

                <FormInput
                  label="Admin Notes (optional)"
                  as="textarea"
                  rows="2"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Identity verified by phone call, password provided to user"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={submitting}>
                    Confirm & Reset Password
                  </Button>
                </div>
              </>
            ) : (
              <>
                <FormInput
                  label="Reason for rejection (optional)"
                  as="textarea"
                  rows="3"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Mobile number could not be verified, duplicate request..."
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
