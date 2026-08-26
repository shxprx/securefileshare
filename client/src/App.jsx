import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import FileDetailsPage from "./pages/FileDetailsPage";
import SharePage from "./pages/SharePage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />

        {/* Public share link download landing page */}
        <Route path="/s/:shortCode" element={<SharePage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {({ user: authUser, setUser: setAuthUser }) => (
                <>
                  <Navbar user={authUser} setUser={setAuthUser} />
                  <DashboardPage user={authUser} setUser={setAuthUser} />
                </>
              )}
            </ProtectedRoute>
          }
        />

        {/* Protected File Details */}
        <Route
          path="/files/:id"
          element={
            <ProtectedRoute>
              {({ user: authUser, setUser: setAuthUser }) => (
                <>
                  <Navbar user={authUser} setUser={setAuthUser} />
                  <FileDetailsPage />
                </>
              )}
            </ProtectedRoute>
          }
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
