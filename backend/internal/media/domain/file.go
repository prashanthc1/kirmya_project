package domain

import (
	"time"

	"github.com/google/uuid"
)

// File categories
const (
	CategoryAvatar              = "avatar"
	CategoryCover               = "cover"
	CategoryResume              = "resume"
	CategoryApplicationDocument = "application_document"
	CategoryMessageAttachment   = "message_attachment"
	CategoryCompanyLogo         = "company_logo"
	CategoryCommunityMedia      = "community_media"
	CategoryVerificationEvidence = "verification_evidence"
	CategoryGeneral             = "general"
)

// File visibility levels
const (
	VisibilityPrivate = "private"
	VisibilityPublic  = "public"
	VisibilityShared  = "shared"
)

// File lifecycle statuses
const (
	StatusUploading = "uploading"
	StatusActive    = "active"
	StatusDeleted   = "deleted"
)

// Media types
const (
	MediaTypeImage    = "image"
	MediaTypeDocument = "document"
	MediaTypeVideo    = "video"
	MediaTypeAudio    = "audio"
	MediaTypeArchive  = "archive"
	MediaTypeOther    = "other"
)

// Size limits per category in bytes
const (
	MaxAvatarSize              = 5 * 1024 * 1024  // 5 MB
	MaxCoverSize               = 10 * 1024 * 1024 // 10 MB
	MaxResumeSize              = 10 * 1024 * 1024 // 10 MB
	MaxApplicationDocumentSize = 15 * 1024 * 1024 // 15 MB
	MaxMessageAttachmentSize   = 25 * 1024 * 1024 // 25 MB
	MaxGeneralFileSize         = 30 * 1024 * 1024 // 30 MB
)

// FileRecord represents the canonical file metadata persisted in PostgreSQL.
type FileRecord struct {
	ID                  uuid.UUID              `json:"id"`
	OwnerID             uuid.UUID              `json:"owner_id"`
	OriginalFilename    string                 `json:"original_filename"`
	StorageKey          string                 `json:"storage_key"`
	MediaType           string                 `json:"media_type"`
	DetectedContentType string                 `json:"detected_content_type"`
	FileSize            int64                  `json:"file_size"`
	Checksum            string                 `json:"checksum"`
	Extension           string                 `json:"extension"`
	Category            string                 `json:"category"`
	Visibility          string                 `json:"visibility"`
	Status              string                 `json:"status"`
	URL                 string                 `json:"url,omitempty"`
	Metadata            map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
	DeletedAt           *time.Time             `json:"deleted_at,omitempty"`
}

// FileAttachment represents a polymorphic link between a file and a parent domain entity.
type FileAttachment struct {
	ID         uuid.UUID `json:"id"`
	FileID     uuid.UUID `json:"file_id"`
	EntityType string    `json:"entity_type"`
	EntityID   uuid.UUID `json:"entity_id"`
	CreatedAt  time.Time `json:"created_at"`
}

// UploadFileRequest encapsulates upload parameters.
type UploadFileRequest struct {
	Category   string                 `json:"category"`
	Visibility string                 `json:"visibility"`
	Metadata   map[string]interface{} `json:"metadata"`
}

// SignedURLResponse contains a short-lived authorized access URL.
type SignedURLResponse struct {
	FileID    uuid.UUID `json:"file_id"`
	SignedURL string    `json:"signed_url"`
	ExpiresAt time.Time `json:"expires_at"`
}

// PresignedUploadRequest requests a direct upload session.
type PresignedUploadRequest struct {
	FileName string `json:"file_name" binding:"required"`
	FileType string `json:"file_type" binding:"required"`
	FileSize int64  `json:"file_size" binding:"required"`
	Category string `json:"category"`
}

// PresignedUploadResponse contains the upload token and URL.
type PresignedUploadResponse struct {
	FileID       uuid.UUID `json:"file_id"`
	PresignedURL string    `json:"presigned_url"`
	StorageKey   string    `json:"storage_key"`
	ExpiresAt    time.Time `json:"expires_at"`
}
