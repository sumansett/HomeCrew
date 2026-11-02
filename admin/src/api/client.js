// One place for all backend calls (uses the Fetch API)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// turns "/uploads/abc.png" into a full URL
export const fileUrl = (path) => (path ? `${API_URL}${path}` : "");

export async function api(path, { method = "GET", body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}
