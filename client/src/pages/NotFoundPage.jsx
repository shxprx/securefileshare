import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="share-container">
      <div className="share-card">
        <div className="share-icon expired" style={{ background: "var(--color-primary-50)", color: "var(--color-primary)" }}>
          🔍
        </div>
        <h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-2)" }}>
          Page Not Found
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-6)" }}>
          The page you are looking for does not exist, has been removed, or you don't have access to it.
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ display: "inline-flex" }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
