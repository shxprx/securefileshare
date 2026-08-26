import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe } from "../services/authService";

/**
 * ProtectedRoute — redirects to /login if no valid session.
 * Uses GET /auth/me as source of truth on every mount.
 */
export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return children({ user, setUser });
}
