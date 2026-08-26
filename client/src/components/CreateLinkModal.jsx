import { useState } from "react";
import { createShareLink } from "../services/shareService";
import toast from "react-hot-toast";

export default function CreateLinkModal({ fileId, onClose, onSuccess }) {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [expiryPreset, setExpiryPreset] = useState("never"); // "never", "1day", "7days", "30days", "custom"
  const [customExpiry, setCustomExpiry] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!createdLink) return;
    try {
      const fullUrl = `${window.location.origin}/s/${createdLink.shortCode}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alias.trim()) {
      toast.error("Alias is required");
      return;
    }

    setLoading(true);
    try {
      // Calculate expiry date
      let expiresAt = null;
      const now = new Date();
      if (expiryPreset === "1day") {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (expiryPreset === "7days") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expiryPreset === "30days") {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expiryPreset === "custom" && customExpiry) {
        expiresAt = new Date(customExpiry).toISOString();
      }

      const payload = {
        alias: alias.trim(),
        password: password || null,
        expiresAt,
        maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : null,
      };

      const res = await createShareLink(fileId, payload);
      setCreatedLink(res.data.link);
      toast.success("Share link created successfully!");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create share link";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = () => {
    if (!loading) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{createdLink ? "Link Created" : "Create Share Link"}</h2>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        {createdLink ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              Your shareable link is ready:
            </p>
            <div style={{
              display: "flex",
              gap: "var(--space-2)",
              alignItems: "center",
              background: "var(--color-bg)",
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}>
              <input
                className="input"
                readOnly
                value={`${window.location.origin}/s/${createdLink.shortCode}`}
                style={{ flex: 1, background: "transparent", border: "none", padding: 0 }}
                onClick={(e) => e.target.select()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleCopy}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ width: "100%" }} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="alias">Link Alias (Required)</label>
              <input
                id="alias"
                className="input"
                type="text"
                placeholder="e.g. Client-Presentation"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password Protection (Optional)</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Leave blank for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Link Expiration</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                {[
                  { value: "never", label: "Never" },
                  { value: "1day", label: "1 Day" },
                  { value: "7days", label: "7 Days" },
                  { value: "30days", label: "30 Days" },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`btn ${expiryPreset === preset.value ? "btn-primary" : "btn-secondary"} btn-sm`}
                    onClick={() => setExpiryPreset(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`btn ${expiryPreset === "custom" ? "btn-primary" : "btn-secondary"} btn-sm`}
                style={{ width: "100%", marginBottom: "var(--space-2)" }}
                onClick={() => setExpiryPreset("custom")}
              >
                Custom Expiration Date
              </button>

              {expiryPreset === "custom" && (
                <input
                  className="input"
                  type="datetime-local"
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="input-group">
              <label htmlFor="maxDownloads">Max Downloads Limit (Optional)</label>
              <input
                id="maxDownloads"
                className="input"
                type="number"
                min="1"
                placeholder="e.g. 10 (Leave blank for unlimited)"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><div className="spinner" /> Creating...</> : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
