package service

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/textproto"
	"os"
	"testing"
	"time"

	"kirmya/internal/media/domain"
	"kirmya/internal/media/repository"
	"kirmya/internal/shared/storage"

	"github.com/google/uuid"
)

func createTestFileHeader(filename string, content []byte) *multipart.FileHeader {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="file"; filename="`+filename+`"`)
	h.Set("Content-Type", "application/octet-stream")

	part, _ := writer.CreatePart(h)
	_, _ = part.Write(content)
	_ = writer.Close()

	reader := multipart.NewReader(&body, writer.Boundary())
	form, _ := reader.ReadForm(int64(len(content) + 1024))
	return form.File["file"][0]
}

func setupTestService(t *testing.T) (FileService, repository.FileRepository, storage.StorageProvider, func()) {
	tempDir, err := os.MkdirTemp("", "kirmya-media-service-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	storageProv, _ := storage.NewLocalStorageProvider(tempDir, "http://localhost:8080", "secret-test-key")
	repo := repository.NewFileRepository(nil)
	svc := NewFileService(repo, storageProv)

	cleanup := func() {
		_ = os.RemoveAll(tempDir)
	}

	return svc, repo, storageProv, cleanup
}

func TestUploadFile_ValidImage(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	ownerID := uuid.New()
	// Real PNG header magic bytes
	pngHeader := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52}
	fileHeader := createTestFileHeader("avatar.png", pngHeader)

	record, err := svc.UploadFile(context.Background(), ownerID, fileHeader, domain.CategoryAvatar, domain.VisibilityPublic, nil)
	if err != nil {
		t.Fatalf("Expected valid image upload to succeed, got: %v", err)
	}

	if record.OwnerID != ownerID {
		t.Errorf("Expected owner ID %s, got %s", ownerID, record.OwnerID)
	}
	if record.MediaType != domain.MediaTypeImage {
		t.Errorf("Expected media type 'image', got %s", record.MediaType)
	}
	if record.DetectedContentType != "image/png" {
		t.Errorf("Expected detected type 'image/png', got %s", record.DetectedContentType)
	}
	if record.Visibility != domain.VisibilityPublic {
		t.Errorf("Expected public visibility, got %s", record.Visibility)
	}
	if record.URL == "" {
		t.Errorf("Expected public URL to be populated for public file")
	}
}

func TestUploadFile_MIMESpoofing_Rejected(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	ownerID := uuid.New()
	// Fake image: text file named fake.png
	fakeImage := []byte("plain text pretending to be an image")
	fileHeader := createTestFileHeader("fake.png", fakeImage)

	_, err := svc.UploadFile(context.Background(), ownerID, fileHeader, domain.CategoryAvatar, domain.VisibilityPublic, nil)
	if err == nil {
		t.Fatalf("Expected MIME spoofing upload to be rejected, got nil error")
	}
}

func TestUploadFile_ExecutableScript_Rejected(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	ownerID := uuid.New()
	scriptContent := []byte("#!/bin/bash\necho 'malicious'")
	fileHeader := createTestFileHeader("script.sh", scriptContent)

	_, err := svc.UploadFile(context.Background(), ownerID, fileHeader, domain.CategoryGeneral, domain.VisibilityPrivate, nil)
	if err == nil {
		t.Fatalf("Expected executable script upload to be rejected, got nil error")
	}
}

func TestGetFile_AuthorizationRules(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	ownerID := uuid.New()
	otherUserID := uuid.New()

	// PDF magic bytes %PDF-1.5
	pdfHeader := []byte("%PDF-1.5\n%sample pdf content binary stream")
	fileHeader := createTestFileHeader("resume.pdf", pdfHeader)

	record, err := svc.UploadFile(context.Background(), ownerID, fileHeader, domain.CategoryResume, domain.VisibilityPrivate, nil)
	if err != nil {
		t.Fatalf("Failed to upload private resume: %v", err)
	}

	ctx := context.Background()

	// 1. Owner can access
	fileOwner, err := svc.GetFile(ctx, ownerID, record.ID, "user")
	if err != nil || fileOwner.ID != record.ID {
		t.Errorf("Expected owner to access private file, got err: %v", err)
	}

	// 2. Admin can access
	fileAdmin, err := svc.GetFile(ctx, otherUserID, record.ID, "admin")
	if err != nil || fileAdmin.ID != record.ID {
		t.Errorf("Expected admin to access private file, got err: %v", err)
	}

	// 3. Unauthorized other user is forbidden
	_, errForbidden := svc.GetFile(ctx, otherUserID, record.ID, "user")
	if errForbidden == nil {
		t.Errorf("Expected access denial for unauthorized user, got nil error")
	}
}

func TestGenerateSignedURLAndDownload(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	ownerID := uuid.New()
	pdfContent := []byte("%PDF-1.5\n%sample pdf file data")
	fileHeader := createTestFileHeader("document.pdf", pdfContent)

	record, err := svc.UploadFile(context.Background(), ownerID, fileHeader, domain.CategoryApplicationDocument, domain.VisibilityPrivate, nil)
	if err != nil {
		t.Fatalf("Failed to upload document: %v", err)
	}

	ctx := context.Background()

	// Signed URL
	signedResp, err := svc.GenerateSignedAccessURL(ctx, ownerID, record.ID, "user", 15*time.Minute)
	if err != nil {
		t.Fatalf("Failed to generate signed URL: %v", err)
	}
	if signedResp.SignedURL == "" {
		t.Errorf("Expected non-empty signed URL")
	}

	// Download stream
	stream, meta, err := svc.DownloadFile(ctx, ownerID, record.ID, "user")
	if err != nil {
		t.Fatalf("Failed to download file stream: %v", err)
	}
	defer stream.Close()

	if meta.FileSize != int64(len(pdfContent)) {
		t.Errorf("Expected size %d, got %d", len(pdfContent), meta.FileSize)
	}
}

func TestDeleteFile_Lifecycle(t *testing.T) {
	svc, _, storageProv, cleanup := setupTestService(t)
	defer cleanup()

	ownerID := uuid.New()
	pngHeader := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52}
	fileHeader := createTestFileHeader("logo.png", pngHeader)

	record, err := svc.UploadFile(context.Background(), ownerID, fileHeader, domain.CategoryCompanyLogo, domain.VisibilityPublic, nil)
	if err != nil {
		t.Fatalf("Failed to upload: %v", err)
	}

	ctx := context.Background()

	// Delete file
	if err := svc.DeleteFile(ctx, ownerID, record.ID, "user"); err != nil {
		t.Fatalf("Failed to delete file: %v", err)
	}

	// Inaccessible after deletion
	_, errGet := svc.GetFile(ctx, ownerID, record.ID, "user")
	if errGet == nil {
		t.Errorf("Expected deleted file to be inaccessible, got nil error")
	}

	// Object removed from storage
	exists, _ := storageProv.Exists(ctx, record.StorageKey)
	if exists {
		t.Errorf("Expected storage object to be purged after delete")
	}
}
