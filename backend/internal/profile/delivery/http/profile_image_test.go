package http

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	mediaDomain "kirmya/internal/media/domain"
	"kirmya/internal/profile/service"
)

// recordingStore stands in for the media file service.
//
// It records what it was asked to store, which is the whole point: the defect
// was a handler that answered "updated successfully" having asked nobody to
// store anything.
type recordingStore struct {
	calls    int
	category string
	url      string
	err      error
}

func (s *recordingStore) UploadFile(
	_ context.Context,
	ownerID uuid.UUID,
	header *multipart.FileHeader,
	category, visibility string,
	_ map[string]interface{},
) (*mediaDomain.FileRecord, error) {
	s.calls++
	s.category = category
	if s.err != nil {
		return nil, s.err
	}
	id := uuid.New()
	url := s.url
	if url == "" {
		url = "/api/v1/files/" + id.String() + "/view"
	}
	return &mediaDomain.FileRecord{ID: id, OwnerID: ownerID, URL: url, Visibility: visibility}, nil
}

func pngPart(t *testing.T, field string) (*bytes.Buffer, string) {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile(field, "avatar.png")
	if err != nil {
		t.Fatal(err)
	}
	// Real PNG magic bytes, so the handler's own image sniffing passes.
	_, _ = part.Write([]byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
	})
	_ = writer.Close()
	return &body, writer.FormDataContentType()
}

func uploadRequest(t *testing.T, handler *ProfileHandler, path, field string, register func(*gin.RouterGroup, *ProfileHandler)) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	userID := uuid.New()
	group := engine.Group("/api/v1", func(c *gin.Context) { c.Set("userID", userID) })
	register(group, handler)

	body, contentType := pngPart(t, field)
	req := httptest.NewRequest(http.MethodPost, path, body)
	req.Header.Set("Content-Type", contentType)
	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, req)
	return rec
}

func registerPhoto(group *gin.RouterGroup, h *ProfileHandler) {
	group.POST("/profile/me/photo", h.UploadPhoto)
}

func registerCover(group *gin.RouterGroup, h *ProfileHandler) {
	group.POST("/profile/me/cover", h.UploadCover)
}

// TestUploadPhotoStoresTheFile is the regression test for the missing avatar.
//
// The handler used to compose "/uploads/profiles/<user id>_avatar.png" from the
// user id, save that string, and never write the bytes anywhere - and nothing
// served /uploads either, so the URL answered 404. It reported success both
// times.
func TestUploadPhotoStoresTheFile(t *testing.T) {
	store := &recordingStore{}
	handler := NewProfileHandler(service.NewProfileService(nil)).WithImageStore(store)

	rec := uploadRequest(t, handler, "/api/v1/profile/me/photo", "photo", registerPhoto)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	if store.calls != 1 {
		t.Fatalf("the image store was asked to store %d files, want 1", store.calls)
	}
	if store.category != mediaDomain.CategoryAvatar {
		t.Errorf("stored under category %q, want %q", store.category, mediaDomain.CategoryAvatar)
	}

	var body struct {
		PhotoURL string `json:"photo_url"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	// The URL must come from the store, not be composed from the user id.
	if body.PhotoURL == "" {
		t.Fatal("the response carries no photo URL")
	}
	if bytes.Contains(rec.Body.Bytes(), []byte("/uploads/profiles/")) {
		t.Errorf("the response fabricates a path from the user id: %s", rec.Body.String())
	}
}

func TestUploadCoverStoresTheFile(t *testing.T) {
	store := &recordingStore{}
	handler := NewProfileHandler(service.NewProfileService(nil)).WithImageStore(store)

	rec := uploadRequest(t, handler, "/api/v1/profile/me/cover", "cover", registerCover)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	if store.category != mediaDomain.CategoryCover {
		t.Errorf("stored under category %q, want %q", store.category, mediaDomain.CategoryCover)
	}
}

// A handler with nowhere to put the file refuses. It must not fall back to
// naming a location nothing was written to, which is precisely what the old
// code did on every request.
func TestUploadPhotoWithoutAStoreRefuses(t *testing.T) {
	handler := NewProfileHandler(service.NewProfileService(nil))

	rec := uploadRequest(t, handler, "/api/v1/profile/me/photo", "photo", registerPhoto)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d, want 500 when no image store is wired (body: %s)", rec.Code, rec.Body.String())
	}
	if bytes.Contains(rec.Body.Bytes(), []byte("successfully")) {
		t.Errorf("an upload that stored nothing reported success: %s", rec.Body.String())
	}
}

// A store that accepts the bytes but reports no address has not produced
// something a page can render, so the upload is a failure rather than a
// success with an empty URL.
func TestUploadPhotoWithoutAURLRefuses(t *testing.T) {
	store := &recordingStore{url: " "}
	handler := NewProfileHandler(service.NewProfileService(nil)).WithImageStore(store)

	rec := uploadRequest(t, handler, "/api/v1/profile/me/photo", "photo", registerPhoto)
	if rec.Code == http.StatusOK {
		t.Errorf("an upload with no retrievable address reported success: %s", rec.Body.String())
	}
}
