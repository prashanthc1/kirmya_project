package http

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"kirmya/internal/media/domain"
	"kirmya/internal/media/repository"
	"kirmya/internal/media/service"
	configPkg "kirmya/internal/shared/config"
	sharedMiddleware "kirmya/internal/shared/middleware"
	"kirmya/internal/shared/storage"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func generateTestToken(userID uuid.UUID, role string) string {
	claims := &sharedMiddleware.JWTClaims{
		UserID: userID,
		Email:  "test@kirmya.com",
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(configPkg.GetJWTSecretBytes())
	return tokenStr
}

func setupTestRouter() (*gin.Engine, *FileHandler, uuid.UUID, string, func()) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	tempDir, _ := os.MkdirTemp("", "kirmya-media-http-test-*")
	cleanup := func() {
		_ = os.RemoveAll(tempDir)
	}

	storageProv, _ := storage.NewLocalStorageProvider(tempDir, "http://localhost:8080", "test-secret")
	repo := repository.NewFileRepository(nil)
	svc := service.NewFileService(repo, storageProv)
	handler := NewFileHandler(svc)

	testUserID := uuid.New()
	testToken := generateTestToken(testUserID, "user")

	api := r.Group("/api/v1")
	RegisterRoutes(api, handler)

	return r, handler, testUserID, testToken, cleanup
}

func TestFileHandler_UploadAndDownloadFlow(t *testing.T) {
	r, _, _, token, cleanup := setupTestRouter()
	defer cleanup()

	// 1. Upload File
	pngHeader := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52}
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, _ := writer.CreateFormFile("file", "avatar.png")
	_, _ = part.Write(pngHeader)
	_ = writer.WriteField("category", domain.CategoryAvatar)
	_ = writer.WriteField("visibility", domain.VisibilityPublic)
	_ = writer.Close()

	uploadReq, _ := http.NewRequest(http.MethodPost, "/api/v1/files/upload", &body)
	uploadReq.Header.Set("Content-Type", writer.FormDataContentType())
	uploadReq.Header.Set("Authorization", "Bearer "+token)

	wUpload := httptest.NewRecorder()
	r.ServeHTTP(wUpload, uploadReq)

	if wUpload.Code != http.StatusCreated {
		t.Fatalf("Expected status 201 for upload, got %d. Body: %s", wUpload.Code, wUpload.Body.String())
	}

	var record domain.FileRecord
	if err := json.Unmarshal(wUpload.Body.Bytes(), &record); err != nil {
		t.Fatalf("Failed to parse uploaded record: %v", err)
	}
	if record.ID == uuid.Nil {
		t.Fatalf("Expected valid file ID in upload response")
	}

	// 2. Get Metadata
	metaReq, _ := http.NewRequest(http.MethodGet, "/api/v1/files/"+record.ID.String(), nil)
	metaReq.Header.Set("Authorization", "Bearer "+token)
	wMeta := httptest.NewRecorder()
	r.ServeHTTP(wMeta, metaReq)
	if wMeta.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for metadata, got %d", wMeta.Code)
	}

	// 3. View / Stream File Inline
	viewReq, _ := http.NewRequest(http.MethodGet, "/api/v1/files/"+record.ID.String()+"/view", nil)
	wView := httptest.NewRecorder()
	r.ServeHTTP(wView, viewReq)
	if wView.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for view file, got %d", wView.Code)
	}
	if wView.Header().Get("Content-Type") != "image/png" {
		t.Errorf("Expected Content-Type 'image/png', got %s", wView.Header().Get("Content-Type"))
	}

	// 4. Signed URL
	signedReq, _ := http.NewRequest(http.MethodGet, "/api/v1/files/"+record.ID.String()+"/signed-url", nil)
	signedReq.Header.Set("Authorization", "Bearer "+token)
	wSigned := httptest.NewRecorder()
	r.ServeHTTP(wSigned, signedReq)
	if wSigned.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for signed URL, got %d", wSigned.Code)
	}

	// 5. Delete File
	delReq, _ := http.NewRequest(http.MethodDelete, "/api/v1/files/"+record.ID.String(), nil)
	delReq.Header.Set("Authorization", "Bearer "+token)
	wDel := httptest.NewRecorder()
	r.ServeHTTP(wDel, delReq)
	if wDel.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for delete file, got %d", wDel.Code)
	}
}
