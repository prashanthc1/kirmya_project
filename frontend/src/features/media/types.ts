export type FileCategory =
  | 'avatar'
  | 'cover'
  | 'resume'
  | 'application_document'
  | 'message_attachment'
  | 'company_logo'
  | 'community_media'
  | 'verification_evidence'
  | 'general';

export type FileVisibility = 'private' | 'public' | 'shared';
export type FileStatus = 'uploading' | 'active' | 'deleted';
export type MediaType = 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';

export interface FileRecord {
  id: string;
  owner_id: string;
  original_filename: string;
  storage_key: string;
  media_type: MediaType;
  detected_content_type: string;
  file_size: number;
  checksum: string;
  extension: string;
  category: FileCategory;
  visibility: FileVisibility;
  status: FileStatus;
  url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SignedURLResponse {
  file_id: string;
  signed_url: string;
  expires_at: string;
}

export interface PresignedUploadRequest {
  file_name: string;
  file_type: string;
  file_size: number;
  category?: FileCategory;
}

export interface PresignedUploadResponse {
  file_id: string;
  presigned_url: string;
  storage_key: string;
  expires_at: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}
