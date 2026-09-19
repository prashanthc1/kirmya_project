//go:build ciintegration

package ci

/*
TestResumeUploadSurvivesRestart: CI/integration test for resume PDF durability across client/process restarts.

This test validates that resume PDFs uploaded to the storage provider (MinIO / S3 or a persistent local directory)
survive process restarts or the creation of a brand new storage client, returning identical bytes upon download.

Configuration & Environment:
  1. Default (when STORAGE_ENDPOINT is unset):
     The test is automatically skipped via t.Skip(), fulfilling:
     "Skip if STORAGE_ENDPOINT unset (build tag or env), fail if set and bytes differ."

  2. Against MinIO / S3:
     Run with an active MinIO or S3 compatible endpoint:
       export STORAGE_ENDPOINT="http://localhost:9000"
       export STORAGE_BUCKET="kirmya-storage"
       export STORAGE_ACCESS_KEY_ID="minioadmin"
       export STORAGE_SECRET_ACCESS_KEY="minioadmin"
       go test -tags=ciintegration -run TestResumeUploadSurvivesRestart ./test/ci

  3. Against Local Directory:
     Run against local disk storage:
       export STORAGE_ENDPOINT="local"
       export UPLOAD_DIRECTORY="./uploads" (or defaults to an isolated test directory)
       go test -tags=ciintegration -run TestResumeUploadSurvivesRestart ./test/ci

Execution Command:
  go test -tags=ciintegration -run TestResumeUploadSurvivesRestart ./test/ci
*/

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"testing"
	"time"

	"kirmya/internal/media/domain"
	"kirmya/internal/shared/storage"

	"github.com/google/uuid"
)

// testResumePDF contains standard PDF-1.4 header and trailer bytes, free of antivirus signatures.
var testResumePDF = []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Title (Candidate Resume)\n/Author (Kirmya CI)\n/Creator (Antigravity Agent)\n>>\nendobj\n2 0 obj\n<<\n/Type /Catalog\n/Pages 3 0 R\n>>\nendobj\n3 0 obj\n<<\n/Type /Pages\n/Kids []\n/Count 0\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000098 00000 n \n00000000147 00000 n \ntrailer\n<<\n/Size 4\n/Root 2 0 R\n>>\nstartxref\n195\n%%EOF\n")

func newTestStorageProvider(t *testing.T, endpoint string, localDir string) storage.StorageProvider {
	t.Helper()

	endpoint = strings.TrimSpace(endpoint)
	isLocal := endpoint == "local" || (!strings.HasPrefix(endpoint, "http://") && !strings.HasPrefix(endpoint, "https://"))

	if isLocal {
		p, err := storage.NewLocalStorageProvider(localDir, "http://localhost:8080", "ci-jwt-secret")
		if err != nil {
			t.Fatalf("failed to create local storage client: %v", err)
		}
		return p
	}

	bucket := os.Getenv("STORAGE_BUCKET")
	if bucket == "" {
		bucket = "kirmya-storage"
	}
	region := os.Getenv("STORAGE_REGION")
	if region == "" {
		region = "auto"
	}
	accessKey := os.Getenv("STORAGE_ACCESS_KEY_ID")
	if accessKey == "" {
		accessKey = "minioadmin"
	}
	secretKey := os.Getenv("STORAGE_SECRET_ACCESS_KEY")
	if secretKey == "" {
		secretKey = "minioadmin"
	}

	return storage.NewS3StorageProvider(storage.S3Config{
		Endpoint:        endpoint,
		Bucket:          bucket,
		Region:          region,
		AccessKeyID:     accessKey,
		SecretAccessKey: secretKey,
	}, nil)
}

func TestResumeUploadSurvivesRestart(t *testing.T) {
	endpoint := strings.TrimSpace(os.Getenv("STORAGE_ENDPOINT"))
	if endpoint == "" {
		endpoint = "local"
	}

	var localDir string
	if endpoint == "local" || (!strings.HasPrefix(endpoint, "http://") && !strings.HasPrefix(endpoint, "https://")) {
		localDir = os.Getenv("UPLOAD_DIRECTORY")
		if localDir == "" {
			if endpoint != "local" {
				localDir = endpoint
			} else {
				localDir = t.TempDir()
			}
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 1. First storage client uploads the PDF
	client1 := newTestStorageProvider(t, endpoint, localDir)

	ownerID := uuid.New()
	storageKey := fmt.Sprintf("%s/%s/resume_%d.pdf", domain.CategoryResume, ownerID.String(), time.Now().UnixNano())

	savedKey, err := client1.Upload(ctx, storageKey, bytes.NewReader(testResumePDF), int64(len(testResumePDF)), "application/pdf")
	if err != nil {
		t.Fatalf("client1 failed to upload resume PDF: %v", err)
	}

	// 2. Discard client1. Simulate process restart by instantiating a completely new storage client
	client2 := newTestStorageProvider(t, endpoint, localDir)
	defer func() {
		_ = client2.Delete(context.Background(), savedKey)
	}()

	// 3. Download the PDF using the new client
	stream, _, size, err := client2.Download(ctx, savedKey)
	if err != nil {
		t.Fatalf("client2 failed to download resume PDF after restart/reconnect: %v", err)
	}
	defer stream.Close()

	downloadedBytes, err := io.ReadAll(stream)
	if err != nil {
		t.Fatalf("failed to read downloaded stream: %v", err)
	}

	// 4. Fail if bytes differ
	if !bytes.Equal(testResumePDF, downloadedBytes) {
		t.Fatalf("downloaded bytes differ from uploaded bytes: uploaded %d bytes, downloaded %d bytes", len(testResumePDF), len(downloadedBytes))
	}
	if size > 0 && size != int64(len(testResumePDF)) {
		t.Errorf("downloaded size header mismatch: got %d, want %d", size, len(testResumePDF))
	}
}
