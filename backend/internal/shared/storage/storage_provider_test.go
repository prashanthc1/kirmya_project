package storage

import (
	"bytes"
	"context"
	"io"
	"os"
	"strings"
	"testing"
	"time"
)

func TestLocalStorageProvider_Flow(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "kirmya-storage-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp storage dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	secret := "test-secret-signing-key-32-chars-long"
	provider, err := NewLocalStorageProvider(tempDir, "http://localhost:8080/files", secret)
	if err != nil {
		t.Fatalf("Failed to create LocalStorageProvider: %v", err)
	}

	if provider.DriverName() != "local" {
		t.Errorf("Expected driver 'local', got %s", provider.DriverName())
	}

	ctx := context.Background()
	testKey := "avatars/user-123/avatar.png"
	testContent := []byte("fake-png-image-binary-data-stream-content")

	// 1. Upload
	savedKey, err := provider.Upload(ctx, testKey, bytes.NewReader(testContent), int64(len(testContent)), "image/png")
	if err != nil {
		t.Fatalf("Failed to upload file: %v", err)
	}
	if savedKey != testKey {
		t.Errorf("Expected key %s, got %s", testKey, savedKey)
	}

	// 2. Exists
	exists, err := provider.Exists(ctx, testKey)
	if err != nil || !exists {
		t.Errorf("Expected file to exist, got %v, err: %v", exists, err)
	}

	// 3. Download
	rc, contentType, size, err := provider.Download(ctx, testKey)
	if err != nil {
		t.Fatalf("Failed to download file: %v", err)
	}

	downloaded, _ := io.ReadAll(rc)
	rc.Close()
	if !bytes.Equal(downloaded, testContent) {
		t.Errorf("Downloaded content mismatch. Expected %s, got %s", string(testContent), string(downloaded))
	}
	if size != int64(len(testContent)) {
		t.Errorf("Expected size %d, got %d", len(testContent), size)
	}
	_ = contentType

	// 4. Signed URL Generation & Verification
	signedURL, err := provider.GenerateSignedURL(ctx, testKey, 10*time.Minute)
	if err != nil {
		t.Fatalf("Failed to generate signed URL: %v", err)
	}
	if !strings.Contains(signedURL, "sig=") || !strings.Contains(signedURL, "expires=") {
		t.Errorf("Malformed signed URL: %s", signedURL)
	}

	// 5. Delete
	if err := provider.Delete(ctx, testKey); err != nil {
		t.Fatalf("Failed to delete file: %v", err)
	}

	existsAfter, _ := provider.Exists(ctx, testKey)
	if existsAfter {
		t.Errorf("Expected file to be deleted, but still exists")
	}
}

func TestLocalStorageProvider_PathTraversalDefense(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "kirmya-storage-traversal-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	provider, err := NewLocalStorageProvider(tempDir, "http://localhost:8080", "test-secret")
	if err != nil {
		t.Fatalf("Failed to create provider: %v", err)
	}

	traversalKeys := []string{
		"../../etc/passwd",
		"..\\..\\windows\\system32\\cmd.exe",
		"avatars/../../../secret.txt",
		"/etc/shadow",
		"C:\\Windows\\System32\\calc.exe",
	}

	ctx := context.Background()
	for _, badKey := range traversalKeys {
		_, err := provider.Upload(ctx, badKey, strings.NewReader("malicious"), 9, "text/plain")
		if err == nil {
			t.Errorf("Expected error for traversal path %q, got nil", badKey)
		}

		_, _, _, errDown := provider.Download(ctx, badKey)
		if errDown == nil {
			t.Errorf("Expected error for downloading traversal path %q, got nil", badKey)
		}
	}
}

func TestS3StorageProvider_Fallback(t *testing.T) {
	tempDir, _ := os.MkdirTemp("", "kirmya-s3-fallback-*")
	defer os.RemoveAll(tempDir)

	localProv, _ := NewLocalStorageProvider(tempDir, "http://localhost:8080", "secret")
	s3Prov := NewS3StorageProvider(S3Config{
		Endpoint:        "",
		Bucket:          "test-bucket",
		AccessKeyID:     "",
		SecretAccessKey: "",
	}, localProv)

	ctx := context.Background()
	key := "resumes/user-999/cv.pdf"
	content := []byte("sample-pdf-data")

	savedKey, err := s3Prov.Upload(ctx, key, bytes.NewReader(content), int64(len(content)), "application/pdf")
	if err != nil {
		t.Fatalf("Expected fallback to succeed on unconfigured S3, got err: %v", err)
	}
	if savedKey != key {
		t.Errorf("Expected key %s, got %s", key, savedKey)
	}

	exists, _ := s3Prov.Exists(ctx, key)
	if !exists {
		t.Errorf("Expected file to exist in fallback storage")
	}
}
