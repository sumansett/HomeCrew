import { Routes, Route, Navigate } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext";
import AdminLayout from "./components/AdminLayout.jsx";
import Reviews from "./pages/Reviews.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Services from "./pages/Services.jsx";
import Professionals from "./pages/Professionals.jsx";
import Requests from "./pages/Requests.jsx";
import Users from "./pages/Users.jsx";
import Financials from "./pages/Financials.jsx";

// Only logged in admins can see the panel
function Guard({ children }) {
  const { token } = useAdminAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#fbfdf5] text-gray-800">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <Guard>
              <AdminLayout />
            </Guard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/financials" element={<Financials />} />
          <Route path="/services" element={<Services />} />
          <Route path="/professionals" element={<Professionals />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
