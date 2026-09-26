package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net"
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
	// UsePathStyle addresses objects as <endpoint>/<bucket>/<key> rather than
	// <bucket>.<endpoint-host>/<key>. Virtual-hosted style is the S3 standard,
	// and what Railway buckets require; path style is for MinIO and other
	// local servers. See PathStyleFor.
	UsePathStyle bool
}

// PathStyleFor decides the URL style for an endpoint: an explicit
// STORAGE_USE_PATH_STYLE setting wins; otherwise a local server (localhost or
// an IP address, as MinIO in docker-compose) is addressed by path, and
// anything else virtual-hosted.
func PathStyleFor(endpoint, setting string) bool {
	switch strings.ToLower(strings.TrimSpace(setting)) {
	case "true", "1", "yes":
		return true
	case "false", "0", "no":
		return false
	}
	u, err := url.Parse(strings.TrimSpace(endpoint))
	if err != nil {
		return false
	}
	host := u.Hostname()
	return host == "localhost" || net.ParseIP(host) != nil
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

func (p *S3StorageProvider) canUseFallback() bool {
	if p.fallback == nil {
		return false
	}
	if isProductionEnv() && p.fallback.DriverName() == "local" {
		return false
	}
	return true
}

// objectURL addresses one object at the endpoint, virtual-hosted or by path.
func (p *S3StorageProvider) objectURL(key string) (*url.URL, error) {
	u, err := url.Parse(strings.TrimRight(strings.TrimSpace(p.config.Endpoint), "/"))
	if err != nil || u.Host == "" {
		return nil, fmt.Errorf("invalid storage endpoint %q", p.config.Endpoint)
	}
	key = strings.TrimPrefix(key, "/")
	if p.config.UsePathStyle {
		u.Path = strings.TrimRight(u.Path, "/") + "/" + p.config.Bucket + "/" + key
	} else {
		u.Host = p.config.Bucket + "." + u.Host
		u.Path = strings.TrimRight(u.Path, "/") + "/" + key
	}
	// Send the path exactly as it is signed. Go would leave some characters
	// raw ('+', for one) that SigV4 encodes, and the service checks the
	// signature against the path it received - so a key with a '+' in it
	// would be refused.
	u.RawPath = canonicalPath(u)
	return u, nil
}

func (p *S3StorageProvider) credentials() sigV4Credentials {
	return sigV4Credentials{
		AccessKeyID:     p.config.AccessKeyID,
		SecretAccessKey: p.config.SecretAccessKey,
		Region:          p.config.Region,
	}
}

// do sends one SigV4-signed request for an object.
func (p *S3StorageProvider) do(ctx context.Context, method, key string, body []byte, contentType string) (*http.Response, error) {
	u, err := p.objectURL(key)
	if err != nil {
		return nil, err
	}
	var reader io.Reader
	payloadHash := emptyPayloadHash
	if body != nil {
		reader = bytes.NewReader(body)
		payloadHash = hexSHA256(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, u.String(), reader)
	if err != nil {
		return nil, err
	}
	if body != nil {
		req.ContentLength = int64(len(body))
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	signRequest(req, p.credentials(), payloadHash, time.Now())
	return p.httpClient.Do(req)
}

func (p *S3StorageProvider) Upload(ctx context.Context, key string, reader io.Reader, size int64, contentType string) (string, error) {
	if !p.isConfigured() {
		if p.canUseFallback() {
			return p.fallback.Upload(ctx, key, reader, size, contentType)
		}
		return "", ErrStorageAccess
	}

	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read payload for S3 upload: %w", err)
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	resp, err := p.do(ctx, http.MethodPut, key, data, contentType)
	if err != nil {
		if p.canUseFallback() {
			return p.fallback.Upload(ctx, key, bytes.NewReader(data), size, contentType)
		}
		return "", fmt.Errorf("S3 cluster upload failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		if p.canUseFallback() {
			return p.fallback.Upload(ctx, key, bytes.NewReader(data), size, contentType)
		}
		return "", fmt.Errorf("S3 cluster returned HTTP %d on PUT", resp.StatusCode)
	}

	return key, nil
}

func (p *S3StorageProvider) Download(ctx context.Context, key string) (io.ReadCloser, string, int64, error) {
	if !p.isConfigured() {
		if p.canUseFallback() {
			return p.fallback.Download(ctx, key)
		}
		return nil, "", 0, ErrStorageAccess
	}

	resp, err := p.do(ctx, http.MethodGet, key, nil, "")
	if err != nil {
		if p.canUseFallback() {
			return p.fallback.Download(ctx, key)
		}
		return nil, "", 0, err
	}

	if resp.StatusCode == http.StatusNotFound {
		resp.Body.Close()
		if p.canUseFallback() {
			return p.fallback.Download(ctx, key)
		}
		return nil, "", 0, ErrFileNotFound
	}

	if resp.StatusCode >= 400 {
		resp.Body.Close()
		if p.canUseFallback() {
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
		if p.canUseFallback() {
			return p.fallback.Delete(ctx, key)
		}
		return nil
	}

	resp, err := p.do(ctx, http.MethodDelete, key, nil, "")
	if err != nil {
		if p.canUseFallback() {
			return p.fallback.Delete(ctx, key)
		}
		return err
	}
	defer resp.Body.Close()
	// S3 answers 204 whether or not the object existed; anything else means the
	// object may still be there, and the caller must not believe it is gone.
	if resp.StatusCode >= 400 && resp.StatusCode != http.StatusNotFound {
		return fmt.Errorf("S3 cluster returned HTTP %d on DELETE", resp.StatusCode)
	}
	return nil
}

func (p *S3StorageProvider) Exists(ctx context.Context, key string) (bool, error) {
	if !p.isConfigured() {
		if p.canUseFallback() {
			return p.fallback.Exists(ctx, key)
		}
		return false, nil
	}

	resp, err := p.do(ctx, http.MethodHead, key, nil, "")
	if err != nil {
		if p.canUseFallback() {
			return p.fallback.Exists(ctx, key)
		}
		return false, err
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		return true, nil
	case http.StatusNotFound:
		return false, nil
	}
	// A refusal (403 for wrong credentials, 301 for the wrong URL style or
	// region) is not "absent": the health probe relies on this to prove the
	// endpoint, bucket and credentials actually work.
	return false, fmt.Errorf("S3 cluster returned HTTP %d on HEAD", resp.StatusCode)
}

// GetPublicURL is the object's address for anyone to fetch, which exists only
// when STORAGE_PUBLIC_BASE_URL names one (a public bucket or a CDN in front of
// it). A private bucket - every Railway bucket - has none, and "" sends the
// caller to the application's own file route instead.
func (p *S3StorageProvider) GetPublicURL(ctx context.Context, key string) string {
	if strings.TrimSpace(p.config.PublicBaseURL) != "" {
		return fmt.Sprintf("%s/%s", strings.TrimRight(p.config.PublicBaseURL, "/"), strings.TrimPrefix(key, "/"))
	}
	if !p.isConfigured() && p.canUseFallback() {
		return p.fallback.GetPublicURL(ctx, key)
	}
	return ""
}

// GenerateSignedURL is a SigV4 presigned GET for the object, valid for expiry
// (at most the seven days SigV4 allows).
func (p *S3StorageProvider) GenerateSignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	if !p.isConfigured() {
		if p.canUseFallback() {
			return p.fallback.GenerateSignedURL(ctx, key, expiry)
		}
		return "", ErrStorageAccess
	}
	u, err := p.objectURL(key)
	if err != nil {
		return "", err
	}
	return presignGet(u, p.credentials(), expiry, time.Now()), nil
}
