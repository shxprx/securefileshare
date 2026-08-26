import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFiles, deleteFile } from "../services/fileService";
import { getMe } from "../services/authService";
import UploadModal from "../components/UploadModal";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function DashboardPage({ user, setUser }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [filesRes, meRes] = await Promise.all([getFiles(), getMe()]);
      setFiles(filesRes.data.files);
      setUser(meRes.data.user);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setDeleting(true);
    try {
      await deleteFile(fileToDelete.id);
      toast.success("File deleted successfully");
      setFileToDelete(null);
      await fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete file";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Compute stats
  const totalFiles = files.length;
  const totalLinks = files.reduce((acc, f) => acc + (f.linkCount || 0), 0);
  const totalDownloads = files.reduce((acc, f) => acc + (f.downloadCount || 0), 0);

  const maxStorage = user?.maxStorage || 100 * 1024 * 1024;
  const usedStorage = user?.usedStorage || 0;
  const storagePercent = Math.min(100, Math.round((usedStorage / maxStorage) * 100));

  // ASCII visual progress bar: e.g. ████░░░░░░ 42%
  const filledBlocks = Math.round(storagePercent / 10);
  const emptyBlocks = 10 - filledBlocks;
  const asciiBar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "2px" }}>
            Manage your secure files and shares
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          📁 Upload File
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Storage Used</span>
          <span className="stat-value" style={{ fontSize: "var(--font-size-lg)" }}>
            {formatBytes(usedStorage)} / {formatBytes(maxStorage)}
          </span>
          <div style={{ fontSize: "var(--font-size-xs)", fontFamily: "monospace", color: "var(--color-text-secondary)", marginTop: "auto" }}>
            {asciiBar} {storagePercent}%
          </div>
          <div className="progress-bar" style={{ marginTop: "var(--space-2)" }}>
            <div
              className={`progress-bar-fill ${storagePercent > 90 ? "danger" : storagePercent > 70 ? "warning" : ""}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Files</span>
          <span className="stat-value">{totalFiles}</span>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "auto" }}>
            Uploaded items
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Links</span>
          <span className="stat-value">{totalLinks}</span>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "auto" }}>
            Generated share links
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Downloads</span>
          <span className="stat-value">{totalDownloads}</span>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "auto" }}>
            Total downloads served
          </span>
        </div>
      </div>

      {/* Files Section */}
      <div className="card" style={{ padding: "0" }}>
        <div style={{ padding: "var(--space-6) var(--space-6) 0 var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Your Files</h2>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>📂</p>
            <h3>No files uploaded yet</h3>
            <p>Upload files to start sharing them securely with expiry and passwords.</p>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              Upload Your First File
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Links</th>
                  <th>Downloads</th>
                  <th>Uploaded</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td style={{ fontWeight: 500 }}>
                      <Link to={`/files/${file.id}`} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        📄 {file.name}
                      </Link>
                    </td>
                    <td>{formatBytes(file.size)}</td>
                    <td>
                      <span className="badge badge-active">{file.linkCount}</span>
                    </td>
                    <td>{file.downloadCount}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "var(--space-2)" }}>
                        <Link to={`/files/${file.id}`} className="btn btn-secondary btn-sm">
                          Details
                        </Link>
                        <button
                          className="btn btn-secondary btn-sm btn-danger-hover"
                          style={{ borderColor: "rgba(220, 38, 38, 0.2)", color: "var(--color-danger)" }}
                          onClick={() => setFileToDelete(file)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadSuccess={fetchDashboardData}
        />
      )}

      {fileToDelete && (
        <ConfirmModal
          title="Delete File"
          message={`Are you sure you want to permanently delete "${fileToDelete.name}"? This will invalidate all active share links and delete all transaction logs for this file.`}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setFileToDelete(null)}
        />
      )}
    </div>
  );
}
