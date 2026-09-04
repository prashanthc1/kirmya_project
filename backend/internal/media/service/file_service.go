package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"kirmya/internal/media/domain"
	"kirmya/internal/media/repository"
	"kirmya/internal/shared/storage"

	"github.com/google/uuid"
)

var (
	ErrUnauthorizedFileAccess = errors.New("unauthorized file access")
	ErrFileTooLarge           = errors.New("file exceeds maximum allowed size for this category")
	ErrUnsupportedMediaType   = errors.New("unsupported file format or MIME type")
	ErrInvalidFileName        = errors.New("invalid or malicious filename")
	ErrFileDeleted            = errors.New("file has been deleted")
)

type FileService interface {
	UploadFile(ctx context.Context, ownerID uuid.UUID, header *multipart.FileHeader, category, visibility string, metadata map[string]interface{}) (*domain.FileRecord, error)
	GetFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string) (*domain.FileRecord, error)
	DownloadFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string) (io.ReadCloser, *domain.FileRecord, error)
	GenerateSignedAccessURL(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string, expiry time.Duration) (*domain.SignedURLResponse, error)
	DeleteFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string) error
	AttachFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, entityType string, entityID uuid.UUID) error
	GetEntityAttachments(ctx context.Context, requesterID uuid.UUID, entityType string, entityID uuid.UUID) ([]domain.FileRecord, error)
	CreatePresignedUpload(ctx context.Context, ownerID uuid.UUID, req domain.PresignedUploadRequest) (*domain.PresignedUploadResponse, error)
}

type DefaultFileService struct {
	repo    repository.FileRepository
	storage storage.StorageProvider
}

func NewFileService(repo repository.FileRepository, storageProvider storage.StorageProvider) FileService {
	return &DefaultFileService{
		repo:    repo,
		storage: storageProvider,
	}
}

func (s *DefaultFileService) validateCategoryAndLimits(category string, size int64) (int64, error) {
	var maxLimit int64
	switch category {
	case domain.CategoryAvatar:
		maxLimit = domain.MaxAvatarSize
	case domain.CategoryCover:
		maxLimit = domain.MaxCoverSize
	case domain.CategoryResume:
		maxLimit = domain.MaxResumeSize
	case domain.CategoryApplicationDocument:
		maxLimit = domain.MaxApplicationDocumentSize
	case domain.CategoryMessageAttachment:
		maxLimit = domain.MaxMessageAttachmentSize
	default:
		maxLimit = domain.MaxGeneralFileSize
	}

	if size > maxLimit {
		return maxLimit, fmt.Errorf("%w: max allowed is %d bytes (received %d bytes)", ErrFileTooLarge, maxLimit, size)
	}
	return maxLimit, nil
}

func (s *DefaultFileService) validateContentAndType(category, filename string, firstBytes []byte) (string, string, error) {
	// Clean filename
	cleanName := filepath.Base(filename)
	if cleanName == "." || cleanName == "/" || cleanName == "\\" || strings.Contains(cleanName, "..") {
		return "", "", ErrInvalidFileName
	}

	ext := strings.ToLower(filepath.Ext(cleanName))
	detectedMime := http.DetectContentType(firstBytes)

	// Block dangerous executable scripts and files
	disallowedExts := map[string]bool{
		".exe": true, ".bat": true, ".cmd": true, ".sh": true, ".bash": true,
		".php": true, ".js": true, ".ts": true, ".html": true, ".htm": true,
		".jsp": true, ".asp": true, ".aspx": true, ".vbs": true, ".py": true,
	}
	if disallowedExts[ext] {
		return "", "", fmt.Errorf("%w: executable scripts and binaries are strictly prohibited", ErrUnsupportedMediaType)
	}

	var mediaType string
	switch category {
	case domain.CategoryAvatar, domain.CategoryCover, domain.CategoryCompanyLogo, domain.CategoryCommunityMedia:
		if !strings.HasPrefix(detectedMime, "image/") {
			return "", "", fmt.Errorf("%w: uploaded content signature is not an image (%s)", ErrUnsupportedMediaType, detectedMime)
		}
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
			return "", "", fmt.Errorf("%w: allowed image extensions are .jpg, .jpeg, .png, .webp", ErrUnsupportedMediaType)
		}
		mediaType = domain.MediaTypeImage

	case domain.CategoryResume:
		if ext != ".pdf" && ext != ".docx" && ext != ".doc" {
			return "", "", fmt.Errorf("%w: resume must be PDF or DOCX format", ErrUnsupportedMediaType)
		}
		mediaType = domain.MediaTypeDocument

	case domain.CategoryApplicationDocument, domain.CategoryVerificationEvidence:
		if ext != ".pdf" && ext != ".docx" && ext != ".doc" && ext != ".png" && ext != ".jpg" && ext != ".jpeg" {
			return "", "", fmt.Errorf("%w: document must be PDF, DOCX, or image format", ErrUnsupportedMediaType)
		}
		if strings.HasPrefix(detectedMime, "image/") {
			mediaType = domain.MediaTypeImage
		} else {
			mediaType = domain.MediaTypeDocument
		}

	case domain.CategoryMessageAttachment, domain.CategoryGeneral:
		if strings.HasPrefix(detectedMime, "image/") {
			mediaType = domain.MediaTypeImage
		} else if strings.HasPrefix(detectedMime, "video/") {
			mediaType = domain.MediaTypeVideo
		} else if strings.HasPrefix(detectedMime, "audio/") {
			mediaType = domain.MediaTypeAudio
		} else {
			mediaType = domain.MediaTypeDocument
		}

	default:
		mediaType = domain.MediaTypeOther
	}

	return mediaType, detectedMime, nil
}

func (s *DefaultFileService) UploadFile(
	ctx context.Context,
	ownerID uuid.UUID,
	header *multipart.FileHeader,
	category, visibility string,
	metadata map[string]interface{},
) (*domain.FileRecord, error) {
	if category == "" {
		category = domain.CategoryGeneral
	}
	if visibility == "" {
		if category == domain.CategoryAvatar || category == domain.CategoryCompanyLogo {
			visibility = domain.VisibilityPublic
		} else {
			visibility = domain.VisibilityPrivate
		}
	}

	if _, err := s.validateCategoryAndLimits(category, header.Size); err != nil {
		return nil, err
	}

	src, err := header.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded multipart file: %w", err)
	}
	defer src.Close()

	// Sniff magic bytes
	headerBuf := make([]byte, 512)
	n, _ := src.Read(headerBuf)
	_, _ = src.Seek(0, io.SeekStart)

	mediaType, detectedContentType, err := s.validateContentAndType(category, header.Filename, headerBuf[:n])
	if err != nil {
		return nil, err
	}

	// Compute SHA-256 and buffer
	hasher := sha256.New()
	var buf bytes.Buffer
	tee := io.TeeReader(src, io.MultiWriter(&buf, hasher))

	written, err := io.Copy(io.Discard, tee)
	if err != nil {
		return nil, fmt.Errorf("failed to process file stream: %w", err)
	}

	checksum := hex.EncodeToString(hasher.Sum(nil))
	fileID := uuid.New()
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".bin"
	}

	// Generate safe opaque storage key: {category}/{owner_id}/{uuid}{ext}
	storageKey := fmt.Sprintf("%s/%s/%s%s", category, ownerID.String(), fileID.String(), ext)

	// Stream to storage provider
	savedKey, err := s.storage.Upload(ctx, storageKey, bytes.NewReader(buf.Bytes()), written, detectedContentType)
	if err != nil {
		return nil, fmt.Errorf("failed to persist file to storage provider: %w", err)
	}

	fileRecord := &domain.FileRecord{
		ID:                  fileID,
		OwnerID:             ownerID,
		OriginalFilename:    filepath.Base(header.Filename),
		StorageKey:          savedKey,
		MediaType:           mediaType,
		DetectedContentType: detectedContentType,
		FileSize:            written,
		Checksum:            checksum,
		Extension:           ext,
		Category:            category,
		Visibility:          visibility,
		Status:              domain.StatusActive,
		Metadata:            metadata,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	if visibility == domain.VisibilityPublic {
		fileRecord.URL = s.storage.GetPublicURL(ctx, savedKey)
	}

	if err := s.repo.CreateFile(ctx, fileRecord); err != nil {
		// Clean up uploaded object if database insert fails
		_ = s.storage.Delete(ctx, savedKey)
		return nil, fmt.Errorf("failed to save file metadata: %w", err)
	}

	return fileRecord, nil
}

func (s *DefaultFileService) checkAccessAuthorization(requesterID uuid.UUID, file *domain.FileRecord, requesterRole string) error {
	if file.Visibility == domain.VisibilityPublic {
		return nil
	}
	if requesterRole == "admin" || requesterRole == "super_admin" {
		return nil
	}
	if requesterID != uuid.Nil && file.OwnerID == requesterID {
		return nil
	}
	return ErrUnauthorizedFileAccess
}

func (s *DefaultFileService) GetFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string) (*domain.FileRecord, error) {
	file, err := s.repo.GetFileByID(ctx, fileID)
	if err != nil {
		return nil, err
	}
	if file.DeletedAt != nil || file.Status == domain.StatusDeleted {
		return nil, ErrFileDeleted
	}

	if err := s.checkAccessAuthorization(requesterID, file, requesterRole); err != nil {
		return nil, err
	}

	if file.Visibility == domain.VisibilityPublic {
		file.URL = s.storage.GetPublicURL(ctx, file.StorageKey)
	}
	return file, nil
}

func (s *DefaultFileService) DownloadFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string) (io.ReadCloser, *domain.FileRecord, error) {
	file, err := s.GetFile(ctx, requesterID, fileID, requesterRole)
	if err != nil {
		return nil, nil, err
	}

	stream, _, _, err := s.storage.Download(ctx, file.StorageKey)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to stream file from storage: %w", err)
	}

	return stream, file, nil
}

func (s *DefaultFileService) GenerateSignedAccessURL(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string, expiry time.Duration) (*domain.SignedURLResponse, error) {
	file, err := s.GetFile(ctx, requesterID, fileID, requesterRole)
	if err != nil {
		return nil, err
	}

	if expiry <= 0 {
		expiry = 15 * time.Minute
	}
	if expiry > 24*time.Hour {
		expiry = 24 * time.Hour
	}

	signedURL, err := s.storage.GenerateSignedURL(ctx, file.StorageKey, expiry)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access URL: %w", err)
	}

	return &domain.SignedURLResponse{
		FileID:    file.ID,
		SignedURL: signedURL,
		ExpiresAt: time.Now().Add(expiry),
	}, nil
}

func (s *DefaultFileService) DeleteFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, requesterRole string) error {
	file, err := s.repo.GetFileByID(ctx, fileID)
	if err != nil {
		return err
	}

	// Only owner or admin may delete
	if file.OwnerID != requesterID && requesterRole != "admin" && requesterRole != "super_admin" {
		return ErrUnauthorizedFileAccess
	}

	if err := s.repo.SoftDeleteFile(ctx, fileID); err != nil {
		return err
	}

	// Purge object from storage provider
	_ = s.storage.Delete(ctx, file.StorageKey)
	return nil
}

func (s *DefaultFileService) AttachFile(ctx context.Context, requesterID uuid.UUID, fileID uuid.UUID, entityType string, entityID uuid.UUID) error {
	file, err := s.repo.GetFileByID(ctx, fileID)
	if err != nil {
		return err
	}

	if file.OwnerID != requesterID {
		return ErrUnauthorizedFileAccess
	}

	att := &domain.FileAttachment{
		ID:         uuid.New(),
		FileID:     fileID,
		EntityType: entityType,
		EntityID:   entityID,
		CreatedAt:  time.Now(),
	}

	return s.repo.CreateAttachment(ctx, att)
}

func (s *DefaultFileService) GetEntityAttachments(ctx context.Context, requesterID uuid.UUID, entityType string, entityID uuid.UUID) ([]domain.FileRecord, error) {
	files, err := s.repo.GetAttachmentsByEntity(ctx, entityType, entityID)
	if err != nil {
		return nil, err
	}

	for i := range files {
		if files[i].Visibility == domain.VisibilityPublic {
			files[i].URL = s.storage.GetPublicURL(ctx, files[i].StorageKey)
		}
	}
	return files, nil
}

func (s *DefaultFileService) CreatePresignedUpload(ctx context.Context, ownerID uuid.UUID, req domain.PresignedUploadRequest) (*domain.PresignedUploadResponse, error) {
	if _, err := s.validateCategoryAndLimits(req.Category, req.FileSize); err != nil {
		return nil, err
	}

	fileID := uuid.New()
	ext := strings.ToLower(filepath.Ext(req.FileName))
	if ext == "" {
		ext = ".bin"
	}

	storageKey := fmt.Sprintf("%s/%s/%s%s", req.Category, ownerID.String(), fileID.String(), ext)
	expiry := 30 * time.Minute
	signedURL, err := s.storage.GenerateSignedURL(ctx, storageKey, expiry)
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned upload session: %w", err)
	}

	return &domain.PresignedUploadResponse{
		FileID:       fileID,
		PresignedURL: signedURL,
		StorageKey:   storageKey,
		ExpiresAt:    time.Now().Add(expiry),
	}, nil
}
