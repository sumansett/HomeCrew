import { createContext, useContext, useState } from "react";

const AdminAuthContext = createContext(null);
const KEY = "homecrew_admin_auth";

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { token: null, admin: null };
    } catch {
      return { token: null, admin: null };
    }
  });

  const login = (data) => {
    const next = { token: data.token, admin: data.user };
    localStorage.setItem(KEY, JSON.stringify(next));
    setAuth(next);
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setAuth({ token: null, admin: null });
  };

  return (
    <AdminAuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
