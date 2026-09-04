import { useState, useCallback } from 'react';
import { mediaApi } from '../features/media/api';
import { FileCategory, FileRecord, FileVisibility } from '../features/media/types';

interface UseFileUploadOptions {
  category?: FileCategory;
  visibility?: FileVisibility;
  maxSizeBytes?: number;
  allowedExtensions?: string[];
  onSuccess?: (file: FileRecord) => void;
  onError?: (errorMsg: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileRecord | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  const upload = useCallback(
    async (file: File, overrideOptions?: Partial<UseFileUploadOptions>): Promise<FileRecord | null> => {
      const category = overrideOptions?.category || options.category || 'general';
      const visibility = overrideOptions?.visibility || options.visibility || 'private';
      const maxSizeBytes = overrideOptions?.maxSizeBytes || options.maxSizeBytes;
      const allowedExtensions = overrideOptions?.allowedExtensions || options.allowedExtensions;

      setError(null);
      setProgress(0);

      // Client-side quick size validation
      if (maxSizeBytes && file.size > maxSizeBytes) {
        const mb = Math.round(maxSizeBytes / (1024 * 1024));
        const err = `File size exceeds the ${mb} MB limit.`;
        setError(err);
        options.onError?.(err);
        return null;
      }

      // Client-side extension validation
      if (allowedExtensions && allowedExtensions.length > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const isAllowed = ext && allowedExtensions.map((e) => e.replace('.', '').toLowerCase()).includes(ext);
        if (!isAllowed) {
          const err = `Invalid file format. Allowed: ${allowedExtensions.join(', ')}`;
          setError(err);
          options.onError?.(err);
          return null;
        }
      }

      setUploading(true);
      try {
        const record = await mediaApi.uploadFile(file, category, visibility, (pct) => {
          setProgress(pct);
        });

        setUploadedFile(record);
        setUploading(false);
        options.onSuccess?.(record);
        return record;
      } catch (err: any) {
        setUploading(false);
        const errorMsg =
          err?.response?.data?.error ||
          err?.message ||
          'Failed to upload file. Please check your connection and try again.';
        setError(errorMsg);
        options.onError?.(errorMsg);
        return null;
      }
    },
    [options]
  );

  return {
    upload,
    reset,
    uploading,
    progress,
    error,
    uploadedFile,
  };
}
