import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import TeamPayment from "./pages/TeamPayment";
import Success from "./pages/Success";
import Status from "./pages/Status";

// Admin Portal
import AdminLayout from "./admin/AdminLayout";
import Login from "./admin/Login";
import Dashboard from "./admin/Dashboard";
import Students from "./admin/Students";
import Registrations from "./admin/Registrations";
import Settings from "./admin/Settings";

import FloatingHelpButton from "./components/FloatingHelpButton";

const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-[#040806]/40 backdrop-blur-[0.5px] text-slate-100 selection:bg-emerald-800 selection:text-emerald-100">
    <Navbar />
    <div className="flex-1 pt-16">{children}</div>
    <Footer />
    <FloatingHelpButton />
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public Student Registration Flow */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Landing />
          </PublicLayout>
        }
      />
      <Route path="/agrigenevent/registerationforstudent" element={<Register />} />
      <Route
        path="/team-payment"
        element={
          <PublicLayout>
            <TeamPayment />
          </PublicLayout>
        }
      />
      <Route
        path="/success/:registrationId"
        element={
          <PublicLayout>
            <Success />
          </PublicLayout>
        }
      />
      {/* Redirect status to home */}
      {/* <Route path="/status" element={<Navigate to="/" replace />} /> */}
      <Route
        path="/status"
        element={
          <PublicLayout>
            <Status />
          </PublicLayout>
        }
      />

      {/* Admin Authentication */}
      <Route path="/admin/login" element={<Login />} />

      {/* Protected Admin Portal */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
