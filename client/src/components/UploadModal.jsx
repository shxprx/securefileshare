import { useState, useRef } from "react";
import { uploadFile } from "../services/fileService";
import toast from "react-hot-toast";

export default function UploadModal({ onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicate, setDuplicate] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDuplicate(null);
    }
  };

  const handleUpload = async (force = false) => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadFile(formData, setProgress, force);

      if (res.data.duplicate) {
        setDuplicate(res.data.existingFile);
        setUploading(false);
        return;
      }

      toast.success("File uploaded successfully");
      onUploadSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload File</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!duplicate ? (
          <>
            <div
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-8)",
                textAlign: "center",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                background: file ? "var(--color-primary-50)" : "transparent",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.zip,.png,.jpg,.jpeg,.docx,.txt"
                style={{ display: "none" }}
              />
              {file ? (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>{file.name}</p>
                  <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                    {formatBytes(file.size)}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "2rem", marginBottom: "var(--space-2)" }}>📁</p>
                  <p style={{ fontWeight: 500, marginBottom: "var(--space-1)" }}>
                    Click to select a file
                  </p>
                  <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    PDF, ZIP, PNG, JPG, DOCX, TXT — Max 20 MB
                  </p>
                </div>
              )}
            </div>

            {uploading && (
              <div className="upload-progress">
                <div className="upload-progress-text">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleUpload(false)}
                disabled={!file || uploading}
              >
                {uploading ? <><div className="spinner" /> Uploading...</> : "Upload"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{
              background: "var(--color-warning-light)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-4)",
            }}>
              <p style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>
                ⚠️ File already exists
              </p>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                A file with the same content already exists: <strong>{duplicate.name}</strong>
              </p>
            </div>
            <div className="modal-actions" style={{ flexDirection: "column", gap: "var(--space-2)" }}>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => { onClose(); }}>
                Use Existing
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  setDuplicate(null);
                  handleUpload(true);
                }}
              >
                Upload Anyway
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
