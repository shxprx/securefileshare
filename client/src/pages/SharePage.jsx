import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getLinkInfo, unlockLink, downloadLink } from "../services/shareService";
import toast from "react-hot-toast";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function SharePage() {
  const { shortCode } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchLinkInfo = async () => {
    try {
      const res = await getLinkInfo(shortCode);
      setInfo(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setInfo({ found: false });
      } else {
        toast.error("Failed to load share link info");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkInfo();
  }, [shortCode]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error("Password is required");
      return;
    }

    setUnlocking(true);
    try {
      await unlockLink(shortCode, password);
      setIsUnlocked(true);
      toast.success("Link unlocked!");
      // Automatically trigger download after successful unlock
      handleDownload();
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid password";
      toast.error(msg);
    } finally {
      setUnlocking(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await downloadLink(shortCode);
      toast.success("Download started!");
      
      // Navigate browser to download signed URL
      window.location.href = res.data.downloadUrl;
    } catch (err) {
      const msg = err.response?.data?.message || "Download failed";
      toast.error(msg);
      // Re-fetch link info because limit might have been reached or token expired
      fetchLinkInfo();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="share-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  // Not Found
  if (!info || info.found === false) {
    return (
      <div className="share-container">
        <div className="share-card">
          <div className="share-icon expired">✕</div>
          <h2 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-2)" }}>
            Link Not Found
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            The link you are trying to access does not exist or has been permanently deleted by the owner.
          </p>
        </div>
      </div>
    );
  }

  // Expired
  if (info.status === "EXPIRED") {
    return (
      <div className="share-container">
        <div className="share-card">
          <div className="share-icon expired">⏰</div>
          <h2 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-2)" }}>
            Link Expired
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            This share link has reached its expiration date and is no longer active.
          </p>
        </div>
      </div>
    );
  }

  // Limit Reached
  if (info.status === "LIMIT_REACHED") {
    return (
      <div className="share-container">
        <div className="share-card">
          <div className="share-icon limit">⚠️</div>
          <h2 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-2)" }}>
            Download Limit Reached
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            This link has reached its maximum download limit set by the owner.
          </p>
        </div>
      </div>
    );
  }

  // Active / Password Required
  const showPasswordForm = info.requiresPassword && !isUnlocked;

  return (
    <div className="share-container">
      <div className="share-card">
        <div className="share-icon active">📄</div>
        
        <div className="share-file-info">
          <div className="share-file-name">{info.file?.name}</div>
          <div className="share-file-size">
            {info.file?.mimeType} • {formatBytes(info.file?.size || 0)}
          </div>
        </div>

        {showPasswordForm ? (
          <form onSubmit={handleUnlock} className="auth-form" style={{ textAlign: "left" }}>
            <div className="input-group">
              <label htmlFor="share-password">Password Protected File</label>
              <input
                id="share-password"
                className="input"
                type="password"
                placeholder="Enter password to unlock"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "var(--space-2)" }}
              disabled={unlocking}
            >
              {unlocking ? <><div className="spinner" /> Unlocking...</> : "Unlock & Download"}
            </button>
          </form>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              This file is ready for download. Click the button below to download.
            </p>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? <><div className="spinner" /> Preparing Download...</> : "⬇️ Download File"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
