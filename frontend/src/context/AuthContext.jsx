import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const KEY = "homecrew_auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { token: null, role: null, user: null };
    } catch {
      return { token: null, role: null, user: null };
    }
  });

  // data = { token, role, user } returned by the login/register API
  const login = (data) => {
    const next = { token: data.token, role: data.role, user: data.user };
    localStorage.setItem(KEY, JSON.stringify(next));
    setAuth(next);
  };

  const updateUser = (user) => login({ ...auth, user });

  const logout = () => {
    localStorage.removeItem(KEY);
    setAuth({ token: null, role: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
