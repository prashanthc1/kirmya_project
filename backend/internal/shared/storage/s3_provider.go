package storage

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// S3Config holds S3/R2/MinIO connection configuration.
type S3Config struct {
	Endpoint        string
	Bucket          string
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	PublicBaseURL   string
	UsePathStyle    bool
}

// S3StorageProvider provides S3/R2/MinIO object storage capabilities with fallback.
type S3StorageProvider struct {
	config     S3Config
	httpClient *http.Client
	fallback   StorageProvider
}

// NewS3StorageProvider creates a new S3 compatible storage provider.
func NewS3StorageProvider(cfg S3Config, fallback StorageProvider) *S3StorageProvider {
	if strings.TrimSpace(cfg.Region) == "" {
		cfg.Region = "auto"
	}
	if strings.TrimSpace(cfg.Bucket) == "" {
		cfg.Bucket = "kirmya-storage"
	}
	return &S3StorageProvider{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		fallback: fallback,
	}
}

func (p *S3StorageProvider) DriverName() string {
	if strings.Contains(strings.ToLower(p.config.Endpoint), "r2.cloudflarestorage.com") {
		return "cloudflare-r2"
	}
	if strings.Contains(strings.ToLower(p.config.Endpoint), "minio") {
		return "minio"
	}
	return "s3"
}

func (p *S3StorageProvider) isConfigured() bool {
	return strings.TrimSpace(p.config.Endpoint) != "" &&
		strings.TrimSpace(p.config.AccessKeyID) != "" &&
		strings.TrimSpace(p.config.SecretAccessKey) != ""
}

func (p *S3StorageProvider) Upload(ctx context.Context, key string, reader io.Reader, size int64, contentType string) (string, error) {
	if !p.isConfigured() {
		if p.fallback != nil {
			return p.fallback.Upload(ctx, key, reader, size, contentType)
		}
		return "", ErrStorageAccess
	}

	endpoint := strings.TrimRight(p.config.Endpoint, "/")
	uploadURL := fmt.Sprintf("%s/%s/%s", endpoint, p.config.Bucket, strings.TrimPrefix(key, "/"))

	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read payload for S3 upload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, uploadURL, bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("failed to construct S3 PUT request: %w", err)
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(data)))

	// Basic authorization header for compatible gateways / MinIO / mock
	req.SetBasicAuth(p.config.AccessKeyID, p.config.SecretAccessKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		if p.fallback != nil {
			return p.fallback.Upload(ctx, key, bytes.NewReader(data), size, contentType)
		}
		return "", fmt.Errorf("S3 cluster upload failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		if p.fallback != nil {
			return p.fallback.Upload(ctx, key, bytes.NewReader(data), size, contentType)
		}
		return "", fmt.Errorf("S3 cluster returned HTTP %d on PUT", resp.StatusCode)
	}

	return key, nil
}

func (p *S3StorageProvider) Download(ctx context.Context, key string) (io.ReadCloser, string, int64, error) {
	if !p.isConfigured() {
		if p.fallback != nil {
			return p.fallback.Download(ctx, key)
		}
		return nil, "", 0, ErrStorageAccess
	}

	endpoint := strings.TrimRight(p.config.Endpoint, "/")
	downloadURL := fmt.Sprintf("%s/%s/%s", endpoint, p.config.Bucket, strings.TrimPrefix(key, "/"))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, downloadURL, nil)
	if err != nil {
		return nil, "", 0, err
	}
	req.SetBasicAuth(p.config.AccessKeyID, p.config.SecretAccessKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		if p.fallback != nil {
			return p.fallback.Download(ctx, key)
		}
		return nil, "", 0, err
	}

	if resp.StatusCode == http.StatusNotFound {
		resp.Body.Close()
		if p.fallback != nil {
			return p.fallback.Download(ctx, key)
		}
		return nil, "", 0, ErrFileNotFound
	}

	if resp.StatusCode >= 400 {
		resp.Body.Close()
		if p.fallback != nil {
			return p.fallback.Download(ctx, key)
		}
		return nil, "", 0, fmt.Errorf("S3 cluster returned HTTP %d on GET", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return resp.Body, contentType, resp.ContentLength, nil
}

func (p *S3StorageProvider) Delete(ctx context.Context, key string) error {
	if !p.isConfigured() {
		if p.fallback != nil {
			return p.fallback.Delete(ctx, key)
		}
		return nil
	}

	endpoint := strings.TrimRight(p.config.Endpoint, "/")
	deleteURL := fmt.Sprintf("%s/%s/%s", endpoint, p.config.Bucket, strings.TrimPrefix(key, "/"))

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, deleteURL, nil)
	if err != nil {
		return err
	}
	req.SetBasicAuth(p.config.AccessKeyID, p.config.SecretAccessKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		if p.fallback != nil {
			return p.fallback.Delete(ctx, key)
		}
		return err
	}
	defer resp.Body.Close()

	return nil
}

func (p *S3StorageProvider) Exists(ctx context.Context, key string) (bool, error) {
	if !p.isConfigured() {
		if p.fallback != nil {
			return p.fallback.Exists(ctx, key)
		}
		return false, nil
	}

	endpoint := strings.TrimRight(p.config.Endpoint, "/")
	headURL := fmt.Sprintf("%s/%s/%s", endpoint, p.config.Bucket, strings.TrimPrefix(key, "/"))

	req, err := http.NewRequestWithContext(ctx, http.MethodHead, headURL, nil)
	if err != nil {
		return false, err
	}
	req.SetBasicAuth(p.config.AccessKeyID, p.config.SecretAccessKey)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		if p.fallback != nil {
			return p.fallback.Exists(ctx, key)
		}
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return true, nil
	}
	if resp.StatusCode == http.StatusNotFound {
		return false, nil
	}
	return false, nil
}

func (p *S3StorageProvider) GetPublicURL(ctx context.Context, key string) string {
	if strings.TrimSpace(p.config.PublicBaseURL) != "" {
		return fmt.Sprintf("%s/%s", strings.TrimRight(p.config.PublicBaseURL, "/"), strings.TrimPrefix(key, "/"))
	}
	if p.isConfigured() {
		return fmt.Sprintf("%s/%s/%s", strings.TrimRight(p.config.Endpoint, "/"), p.config.Bucket, strings.TrimPrefix(key, "/"))
	}
	if p.fallback != nil {
		return p.fallback.GetPublicURL(ctx, key)
	}
	return ""
}

func (p *S3StorageProvider) GenerateSignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	if !p.isConfigured() {
		if p.fallback != nil {
			return p.fallback.GenerateSignedURL(ctx, key, expiry)
		}
		return "", ErrStorageAccess
	}

	expiresAt := time.Now().Add(expiry).Unix()
	msg := fmt.Sprintf("GET\n\n\n%d\n/%s/%s", expiresAt, p.config.Bucket, key)

	mac := hmac.New(sha256.New, []byte(p.config.SecretAccessKey))
	mac.Write([]byte(msg))
	sig := hex.EncodeToString(mac.Sum(nil))

	endpoint := strings.TrimRight(p.config.Endpoint, "/")
	return fmt.Sprintf("%s/%s/%s?AWSAccessKeyId=%s&Expires=%d&Signature=%s",
		endpoint,
		p.config.Bucket,
		strings.TrimPrefix(key, "/"),
		url.QueryEscape(p.config.AccessKeyID),
		expiresAt,
		sig,
	), nil
}
