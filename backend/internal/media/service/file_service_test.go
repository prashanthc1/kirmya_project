package service

import (
	"bytes"
	"context"
	"io"
	"mime/multipart"
	"net/textproto"
	"os"
	"strings"
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

// pngBytes is a real 1x1 PNG, so magic-byte sniffing sees an image.
func pngBytes() []byte {
	return []byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
	}
}

// TestPublicFileURLIsFetchable is the regression test for the missing avatar.
//
// A public file's URL used to be whatever the storage provider said, and the
// local provider said "/api/v1/files/view?key=<storage key>" - a route this
// application does not serve, addressed by a parameter its view handler does
// not read. So every avatar uploaded on a local or self-hosted deployment was
// recorded with an address that answers 404, and nothing noticed, because the
// URL is written into a row rather than requested at write time. It fails
// later, in somebody's browser, as a profile picture that will not load.
//
// The assertion is deliberately about the shape the router serves rather than
// about a literal string: it must be the view route, and it must carry the
// file's own id, because that is what ViewFile reads.
func TestPublicFileURLIsFetchable(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	record, err := svc.UploadFile(context.Background(), uuid.New(),
		createTestFileHeader("avatar.png", pngBytes()), domain.CategoryAvatar, "", nil)
	if err != nil {
		t.Fatalf("upload: %v", err)
	}

	if record.URL == "" {
		t.Fatal("a public file was stored with no URL at all")
	}
	if want := PublicViewPath(record.ID); record.URL != want {
		t.Errorf("public URL = %q, want %q", record.URL, want)
	}
	if strings.Contains(record.URL, "?key=") {
		t.Errorf("public URL addresses the file by storage key (%q); the view route "+
			"takes the file id as a path parameter and ignores any key", record.URL)
	}
}

// Avatars and covers are rendered on a page other people look at. Storing one
// privately makes it unfetchable by exactly the audience it exists for, which
// is the same missing-avatar symptom by a different route.
func TestProfileImageryDefaultsToPublic(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	for _, category := range []string{domain.CategoryAvatar, domain.CategoryCover, domain.CategoryCompanyLogo} {
		t.Run(category, func(t *testing.T) {
			record, err := svc.UploadFile(context.Background(), uuid.New(),
				createTestFileHeader("image.png", pngBytes()), category, "", nil)
			if err != nil {
				t.Fatalf("upload: %v", err)
			}
			if record.Visibility != domain.VisibilityPublic {
				t.Errorf("%s stored as %q, want %q", category, record.Visibility, domain.VisibilityPublic)
			}
			if record.URL == "" {
				t.Errorf("%s stored with no URL, so nothing can render it", category)
			}
		})
	}
}

// And the default does not leak: a category that is not profile imagery stays
// private, and carries no public URL.
func TestNonProfileImageryStaysPrivate(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	record, err := svc.UploadFile(context.Background(), uuid.New(),
		createTestFileHeader("cv.pdf", []byte("%PDF-1.4\n%aaaa\n")), domain.CategoryResume, "", nil)
	if err != nil {
		t.Fatalf("upload: %v", err)
	}
	if record.Visibility != domain.VisibilityPrivate {
		t.Errorf("a resume was stored as %q, want %q", record.Visibility, domain.VisibilityPrivate)
	}
	if record.URL != "" {
		t.Errorf("a private file carries a public URL: %q", record.URL)
	}
}

// An explicit visibility from the caller still wins over the category default.
func TestExplicitVisibilityIsHonoured(t *testing.T) {
	svc, _, _, cleanup := setupTestService(t)
	defer cleanup()

	record, err := svc.UploadFile(context.Background(), uuid.New(),
		createTestFileHeader("avatar.png", pngBytes()), domain.CategoryAvatar, domain.VisibilityPrivate, nil)
	if err != nil {
		t.Fatalf("upload: %v", err)
	}
	if record.Visibility != domain.VisibilityPrivate {
		t.Errorf("an explicitly private avatar was stored as %q", record.Visibility)
	}
}

// The bytes must actually be there. This is the other half of the missing
// avatar: the profile handler validated an upload, composed a URL and dropped
// the file, so "stored" meant a string in a column and nothing else.
func TestUploadedBytesArePersistedAndReadable(t *testing.T) {
	svc, _, provider, cleanup := setupTestService(t)
	defer cleanup()

	content := pngBytes()
	record, err := svc.UploadFile(context.Background(), uuid.New(),
		createTestFileHeader("avatar.png", content), domain.CategoryAvatar, "", nil)
	if err != nil {
		t.Fatalf("upload: %v", err)
	}
	if record.FileSize != int64(len(content)) {
		t.Errorf("stored size %d, uploaded %d", record.FileSize, len(content))
	}

	stream, contentType, size, err := provider.Download(context.Background(), record.StorageKey)
	if err != nil {
		t.Fatalf("the stored object could not be read back: %v", err)
	}
	defer stream.Close()
	if size != int64(len(content)) {
		t.Errorf("storage reports %d bytes, uploaded %d", size, len(content))
	}
	if !strings.HasPrefix(contentType, "image/") {
		t.Errorf("stored content type %q is not an image", contentType)
	}
	got, err := io.ReadAll(stream)
	if err != nil {
		t.Fatalf("read back: %v", err)
	}
	if !bytes.Equal(got, content) {
		t.Errorf("read back %d bytes, uploaded %d; the stored object is not what was sent", len(got), len(content))
	}
}
