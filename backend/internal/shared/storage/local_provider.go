package storage

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// LocalStorageProvider provides local filesystem storage with path traversal defense and HMAC signed URLs.
type LocalStorageProvider struct {
	baseDir       string
	baseURL       string
	signingSecret []byte
}

// NewLocalStorageProvider creates a new local filesystem storage adapter.
func NewLocalStorageProvider(baseDir, baseURL, signingSecret string) (*LocalStorageProvider, error) {
	if strings.TrimSpace(baseDir) == "" {
		baseDir = "./uploads"
	}
	absBaseDir, err := filepath.Abs(baseDir)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve absolute storage base directory: %w", err)
	}

	if err := os.MkdirAll(absBaseDir, 0750); err != nil {
		return nil, fmt.Errorf("failed to initialize storage directory %s: %w", absBaseDir, err)
	}

	if strings.TrimSpace(signingSecret) == "" {
		signingSecret = "kirmya-default-local-storage-hmac-secret-key-32b"
	}

	return &LocalStorageProvider{
		baseDir:       absBaseDir,
		baseURL:       strings.TrimRight(baseURL, "/"),
		signingSecret: []byte(signingSecret),
	}, nil
}

func (p *LocalStorageProvider) DriverName() string {
	return "local"
}

// resolveSafePath ensures target paths cannot escape baseDir.
func (p *LocalStorageProvider) resolveSafePath(key string) (string, error) {
	if strings.HasPrefix(key, "/") || strings.HasPrefix(key, "\\") || filepath.IsAbs(key) || strings.Contains(key, ":") {
		return "", ErrInvalidPath
	}

	cleanKey := filepath.Clean(filepath.ToSlash(key))
	if cleanKey == "." || cleanKey == "" || strings.HasPrefix(cleanKey, "..") || strings.Contains(cleanKey, "/..") || strings.Contains(cleanKey, "\\..") {
		return "", ErrInvalidPath
	}

	targetPath := filepath.Join(p.baseDir, filepath.FromSlash(cleanKey))
	absTarget, err := filepath.Abs(targetPath)
	if err != nil {
		return "", ErrInvalidPath
	}

	// Security: Strict prefix check ensuring directory isolation
	if !strings.HasPrefix(absTarget, p.baseDir) {
		return "", ErrInvalidPath
	}

	return absTarget, nil
}

func (p *LocalStorageProvider) Upload(ctx context.Context, key string, reader io.Reader, size int64, contentType string) (string, error) {
	targetPath, err := p.resolveSafePath(key)
	if err != nil {
		return "", err
	}

	dir := filepath.Dir(targetPath)
	if err := os.MkdirAll(dir, 0750); err != nil {
		return "", fmt.Errorf("failed to create parent storage directories: %w", err)
	}

	file, err := os.OpenFile(targetPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0640)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, reader); err != nil {
		_ = os.Remove(targetPath)
		return "", fmt.Errorf("failed to stream content to storage: %w", err)
	}

	return key, nil
}

func (p *LocalStorageProvider) Download(ctx context.Context, key string) (io.ReadCloser, string, int64, error) {
	targetPath, err := p.resolveSafePath(key)
	if err != nil {
		return nil, "", 0, err
	}

	file, err := os.Open(targetPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, "", 0, ErrFileNotFound
		}
		return nil, "", 0, err
	}

	stat, err := file.Stat()
	if err != nil {
		_ = file.Close()
		return nil, "", 0, err
	}

	// Detect content type from initial bytes
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	_, _ = file.Seek(0, io.SeekStart)

	contentType := http.DetectContentType(buf[:n])

	return file, contentType, stat.Size(), nil
}

func (p *LocalStorageProvider) Delete(ctx context.Context, key string) error {
	targetPath, err := p.resolveSafePath(key)
	if err != nil {
		return err
	}

	if err := os.Remove(targetPath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (p *LocalStorageProvider) Exists(ctx context.Context, key string) (bool, error) {
	targetPath, err := p.resolveSafePath(key)
	if err != nil {
		return false, err
	}

	_, err = os.Stat(targetPath)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func (p *LocalStorageProvider) GetPublicURL(ctx context.Context, key string) string {
	if p.baseURL == "" {
		return fmt.Sprintf("/api/v1/files/view?key=%s", url.QueryEscape(key))
	}
	return fmt.Sprintf("%s/api/v1/files/view?key=%s", p.baseURL, url.QueryEscape(key))
}

func (p *LocalStorageProvider) GenerateSignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	expiresAt := time.Now().Add(expiry).Unix()
	msg := fmt.Sprintf("%s:%d", key, expiresAt)

	mac := hmac.New(sha256.New, p.signingSecret)
	mac.Write([]byte(msg))
	sig := hex.EncodeToString(mac.Sum(nil))

	baseURL := p.baseURL
	if baseURL == "" {
		baseURL = "/api/v1/files/view"
	} else {
		baseURL = baseURL + "/api/v1/files/view"
	}

	return fmt.Sprintf("%s?key=%s&expires=%d&sig=%s",
		baseURL,
		url.QueryEscape(key),
		expiresAt,
		sig,
	), nil
}

// VerifySignature validates a signed URL token and expiration.
func (p *LocalStorageProvider) VerifySignature(key string, expiresStr, sig string) bool {
	expiresAt, err := strconv.ParseInt(expiresStr, 10, 64)
	if err != nil {
		return false
	}

	if time.Now().Unix() > expiresAt {
		return false // Expired
	}

	msg := fmt.Sprintf("%s:%d", key, expiresAt)
	mac := hmac.New(sha256.New, p.signingSecret)
	mac.Write([]byte(msg))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(sig), []byte(expectedSig))
}
