package storage

import (
	"context"
	"errors"
	"io"
	"time"
)

var (
	ErrFileNotFound     = errors.New("file not found in storage")
	ErrStorageAccess    = errors.New("storage access failure")
	ErrInvalidPath      = errors.New("invalid or unsafe storage path")
	ErrStorageLimit     = errors.New("storage limit exceeded")
	ErrInvalidOperation = errors.New("invalid storage operation")
)

// StorageProvider is the canonical interface decoupling application file workflows from storage backends.
type StorageProvider interface {
	// DriverName returns the identifier for this storage engine (e.g. "local", "s3", "r2", "minio").
	DriverName() string

	// Upload streams a file from the provided reader to the specified storage key.
	Upload(ctx context.Context, key string, reader io.Reader, size int64, contentType string) (string, error)

	// Download returns a readable stream, content type, content length, and error for the given key.
	Download(ctx context.Context, key string) (io.ReadCloser, string, int64, error)

	// Delete permanently removes the object from storage.
	Delete(ctx context.Context, key string) error

	// Exists checks if the given storage key exists.
	Exists(ctx context.Context, key string) (bool, error)

	// GetPublicURL returns a direct public URL for public assets, or an empty string if private.
	GetPublicURL(ctx context.Context, key string) string

	// GenerateSignedURL creates a cryptographically signed, time-limited URL for secure access.
	GenerateSignedURL(ctx context.Context, key string, expiry time.Duration) (string, error)
}
