import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFileDetails, deleteFile } from "../services/fileService";
import { deleteShareLink } from "../services/shareService";
import CreateLinkModal from "../components/CreateLinkModal";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function FileDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [copyState, setCopyState] = useState({}); // { [linkId]: boolean }

  const fetchData = async () => {
    try {
      const res = await getFileDetails(id);
      setData(res.data);
    } catch {
      toast.error("Failed to load file details");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCopyLink = async (link) => {
    try {
      const fullUrl = `${window.location.origin}/s/${link.shortCode}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopyState((prev) => ({ ...prev, [link.id]: true }));
      toast.success("Link copied!");
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [link.id]: false }));
      }, 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDeleteFile = async () => {
    try {
      await deleteFile(id);
      toast.success("File deleted successfully");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete file");
    }
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    try {
      await deleteShareLink(linkToDelete.id);
      toast.success("Share link deleted");
      setLinkToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete share link");
    }
  };

  const getLinkStatus = (link) => {
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { label: "Expired", class: "badge-expired" };
    }
    if (link.maxDownloads && link.downloadCount >= link.maxDownloads) {
      return { label: "Limit Reached", class: "badge-limit" };
    }
    return { label: "Active", class: "badge-active" };
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  const { file, links, recentActivity } = data;

  // Map link ID to alias for easy display in activities list
  const linkAliasMap = links.reduce((acc, l) => {
    acc[l.id] = l.alias;
    return acc;
  }, {});

  return (
    <div className="page">
      {/* Navigation */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="page-header" style={{ alignItems: "center" }}>
        <div>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-primary)", fontWeight: 600, textTransform: "uppercase" }}>
            File Overview
          </span>
          <h1 style={{ marginTop: "2px" }}>{file.name}</h1>
        </div>
        <button
          className="btn btn-danger"
          onClick={() => setFileToDelete(file)}
        >
          🗑️ Delete File
        </button>
      </div>

      {/* File Meta Info Card */}
      <div className="card" style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ fontSize: "var(--font-size-md)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          File Details
        </h2>
        <div className="file-meta">
          <div className="file-meta-item">
            <span className="meta-label">File Size</span>
            <span className="meta-value">{formatBytes(file.size)}</span>
          </div>
          <div className="file-meta-item">
            <span className="meta-label">MIME Type</span>
            <span className="meta-value">{file.mimeType || "Unknown"}</span>
          </div>
          <div className="file-meta-item">
            <span className="meta-label">Uploaded On</span>
            <span className="meta-value">{new Date(file.createdAt).toLocaleString()}</span>
          </div>
          <div className="file-meta-item" style={{ gridColumn: "span 2" }}>
            <span className="meta-label">SHA-256 Hash</span>
            <span className="meta-value" style={{ fontFamily: "monospace" }}>{file.hash}</span>
          </div>
        </div>
      </div>

      {/* Share Links Section */}
      <div className="card" style={{ padding: 0, marginBottom: "var(--space-8)" }}>
        <div style={{ padding: "var(--space-6) var(--space-6) 0 var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Active Share Links</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateLink(true)}>
            + Create Link
          </button>
        </div>

        {links.length === 0 ? (
          <div className="empty-state" style={{ padding: "var(--space-8) var(--space-6)" }}>
            <p>No share links generated yet for this file.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }} onClick={() => setShowCreateLink(true)}>
              Generate First Share Link
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Alias</th>
                  <th>Status</th>
                  <th>Visits</th>
                  <th>Downloads</th>
                  <th>Expires</th>
                  <th>Password</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const status = getLinkStatus(link);
                  return (
                    <tr key={link.id}>
                      <td style={{ fontWeight: 500 }}>{link.alias}</td>
                      <td>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </td>
                      <td>{link.visitCount}</td>
                      <td>
                        {link.downloadCount}
                        {link.maxDownloads ? ` / ${link.maxDownloads}` : ""}
                      </td>
                      <td style={{ color: "var(--color-text-secondary)" }}>
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
                      </td>
                      <td>{link.hasPassword ? "🔒 Yes" : "🔓 No"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "var(--space-2)" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCopyLink(link)}
                          >
                            {copyState[link.id] ? "Copied ✓" : "Copy"}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-danger-hover"
                            style={{ borderColor: "rgba(220, 38, 38, 0.2)", color: "var(--color-danger)" }}
                            onClick={() => setLinkToDelete(link)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity Timeline */}
      <div className="card">
        <h2 style={{ fontSize: "var(--font-size-md)", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Recent Activity (Last 50 events)
        </h2>
        {recentActivity.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", padding: "var(--space-4) 0" }}>
            No activity tracked yet. Once users visit or download via share links, events will appear here.
          </p>
        ) : (
          <div className="activity-list">
            {recentActivity.map((activity) => {
              const alias = linkAliasMap[activity.shareLinkId] || "Deleted Link";
              const isVisit = activity.type === "VISIT";
              return (
                <div className="activity-item" key={activity.id}>
                  <div className={`activity-dot ${isVisit ? "visit" : "download"}`} />
                  <span className="activity-text">
                    Link <strong>"{alias}"</strong> was {isVisit ? "visited" : "downloaded"}
                  </span>
                  <span className="activity-time">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateLink && (
        <CreateLinkModal
          fileId={id}
          onClose={() => setShowCreateLink(false)}
          onSuccess={fetchData}
        />
      )}

      {linkToDelete && (
        <ConfirmModal
          title="Delete Share Link"
          message={`Are you sure you want to delete the share link "${linkToDelete.alias}"? This will disable access immediately.`}
          danger
          onConfirm={handleDeleteLink}
          onCancel={() => setLinkToDelete(null)}
        />
      )}

      {fileToDelete && (
        <ConfirmModal
          title="Delete File"
          message={`Are you sure you want to permanently delete "${fileToDelete.name}"? This will invalidate all active share links and delete all transaction logs for this file.`}
          danger
          onConfirm={handleDeleteFile}
          onCancel={() => setFileToDelete(null)}
        />
      )}
    </div>
  );
}
