import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Services from "./pages/Services.jsx";
import Contact from "./pages/Contact.jsx";
import ServiceDetails from "./pages/ServiceDetails.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Register from "./pages/Register.jsx";
import ProfessionalRegister from "./pages/ProfessionalRegister.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RequestService from "./pages/RequestService.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Profile from "./pages/Profile.jsx";
import ProfessionalDashboard from "./pages/ProfessionalDashboard.jsx";
import ProfessionalProfile from "./pages/ProfessionalProfile.jsx";
import AssignedProfessional from "./pages/AssignedProfessional.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfdf5] text-gray-800">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* public */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/join" element={<ProfessionalRegister />} />

          {/* customer only */}
          <Route path="/dashboard" element={<ProtectedRoute roles={["customer"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/request" element={<ProtectedRoute roles={["customer"]}><RequestService /></ProtectedRoute>} />
          <Route path="/my-requests" element={<ProtectedRoute roles={["customer"]}><MyRequests /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={["customer"]}><Profile /></ProtectedRoute>} />
          <Route path="/my-requests/:id/professional" element={<ProtectedRoute roles={["customer"]}><AssignedProfessional /></ProtectedRoute>} />

          {/* technician / contractor only */}
          <Route path="/pro/dashboard" element={<ProtectedRoute roles={["professional"]}><ProfessionalDashboard /></ProtectedRoute>} />
          <Route path="/pro/profile" element={<ProtectedRoute roles={["professional"]}><ProfessionalProfile /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
