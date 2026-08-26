import api from "./api";

export const uploadFile = (formData, onProgress, force = false) =>
  api.post(`/files/upload${force ? "?force=true" : ""}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });

export const getFiles = () => api.get("/files");
export const getFileDetails = (id) => api.get(`/files/${id}`);
export const deleteFile = (id) => api.delete(`/files/${id}`);
