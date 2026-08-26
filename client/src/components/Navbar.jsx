import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import toast from "react-hot-toast";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const maxStorage = user?.maxStorage || 100 * 1024 * 1024;
  const storagePercent = user
    ? Math.round((user.usedStorage / maxStorage) * 100)
    : 0;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        SecureShare
      </Link>

      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user" title={`${formatBytes(user.usedStorage)} / ${formatBytes(user.maxStorage)}`}>
              📦 {storagePercent}% used
            </span>
            <span className="navbar-user">{user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
