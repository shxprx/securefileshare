import api from "./api";

export const createShareLink = (fileId, data) =>
  api.post(`/files/${fileId}/share`, data);

export const deleteShareLink = (linkId) =>
  api.delete(`/links/${linkId}`);

export const getLinkInfo = (shortCode) =>
  api.get(`/s/${shortCode}`);

export const unlockLink = (shortCode, password) =>
  api.post(`/s/${shortCode}/unlock`, { password });

export const downloadLink = (shortCode) =>
  api.post(`/s/${shortCode}/download`);
