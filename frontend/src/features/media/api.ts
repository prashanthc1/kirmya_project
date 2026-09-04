import { apiClient, API_BASE_URL } from '../../services/api';
import {
  FileCategory,
  FileRecord,
  FileVisibility,
  PresignedUploadRequest,
  PresignedUploadResponse,
  SignedURLResponse,
} from './types';

export const mediaApi = {
  uploadFile: async (
    file: File,
    category: FileCategory = 'general',
    visibility: FileVisibility = 'private',
    onProgress?: (percentage: number) => void
  ): Promise<FileRecord> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('visibility', visibility);

    const res = await apiClient.post<FileRecord>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });
    return res.data;
  },

  getFileMetadata: async (id: string): Promise<FileRecord> => {
    const res = await apiClient.get<FileRecord>(`/files/${id}`);
    return res.data;
  },

  getSignedURL: async (id: string, expiryMinutes: number = 15): Promise<SignedURLResponse> => {
    const res = await apiClient.get<SignedURLResponse>(`/files/${id}/signed-url`, {
      params: { expiry_minutes: expiryMinutes },
    });
    return res.data;
  },

  deleteFile: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/files/${id}`);
    return res.data;
  },

  presignUpload: async (req: PresignedUploadRequest): Promise<PresignedUploadResponse> => {
    const res = await apiClient.post<PresignedUploadResponse>('/files/presign', req);
    return res.data;
  },

  getViewURL: (id: string): string => {
    return `${API_BASE_URL}/files/${id}/view`;
  },

  getDownloadURL: (id: string): string => {
    return `${API_BASE_URL}/files/${id}/download`;
  },
};
