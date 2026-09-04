package repository

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"kirmya/internal/media/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrRecordNotFound = errors.New("file record not found")
)

type FileRepository interface {
	CreateFile(ctx context.Context, file *domain.FileRecord) error
	GetFileByID(ctx context.Context, id uuid.UUID) (*domain.FileRecord, error)
	GetFileByStorageKey(ctx context.Context, key string) (*domain.FileRecord, error)
	GetFilesByOwner(ctx context.Context, ownerID uuid.UUID, category string, limit, offset int) ([]domain.FileRecord, int, error)
	UpdateFileStatus(ctx context.Context, id uuid.UUID, status string) error
	SoftDeleteFile(ctx context.Context, id uuid.UUID) error
	DeleteFile(ctx context.Context, id uuid.UUID) error
	CreateAttachment(ctx context.Context, att *domain.FileAttachment) error
	GetAttachmentsByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]domain.FileRecord, error)
	DeleteAttachment(ctx context.Context, fileID uuid.UUID, entityType string, entityID uuid.UUID) error
}

type PostgresFileRepository struct {
	pool *pgxpool.Pool

	// In-memory fallback for unit tests when pool is nil
	mu          sync.RWMutex
	files       map[uuid.UUID]*domain.FileRecord
	attachments map[uuid.UUID]*domain.FileAttachment
}

func NewFileRepository(pool *pgxpool.Pool) FileRepository {
	return &PostgresFileRepository{
		pool:        pool,
		files:       make(map[uuid.UUID]*domain.FileRecord),
		attachments: make(map[uuid.UUID]*domain.FileAttachment),
	}
}

func (r *PostgresFileRepository) CreateFile(ctx context.Context, file *domain.FileRecord) error {
	if file.ID == uuid.Nil {
		file.ID = uuid.New()
	}
	if file.CreatedAt.IsZero() {
		file.CreatedAt = time.Now()
	}
	file.UpdatedAt = file.CreatedAt

	if r.pool != nil {
		metaJSON, _ := json.Marshal(file.Metadata)
		query := `
			INSERT INTO files (
				id, owner_id, original_filename, storage_key, media_type,
				detected_content_type, file_size, checksum, extension,
				category, visibility, status, metadata, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		`
		_, err := r.pool.Exec(ctx, query,
			file.ID, file.OwnerID, file.OriginalFilename, file.StorageKey, file.MediaType,
			file.DetectedContentType, file.FileSize, file.Checksum, file.Extension,
			file.Category, file.Visibility, file.Status, metaJSON, file.CreatedAt, file.UpdatedAt,
		)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	copied := *file
	r.files[file.ID] = &copied
	return nil
}

func (r *PostgresFileRepository) GetFileByID(ctx context.Context, id uuid.UUID) (*domain.FileRecord, error) {
	if r.pool != nil {
		query := `
			SELECT id, owner_id, original_filename, storage_key, media_type,
			       detected_content_type, file_size, checksum, extension,
			       category, visibility, status, metadata, created_at, updated_at, deleted_at
			FROM files
			WHERE id = $1 AND deleted_at IS NULL
		`
		row := r.pool.QueryRow(ctx, query, id)
		var f domain.FileRecord
		var metaBytes []byte
		err := row.Scan(
			&f.ID, &f.OwnerID, &f.OriginalFilename, &f.StorageKey, &f.MediaType,
			&f.DetectedContentType, &f.FileSize, &f.Checksum, &f.Extension,
			&f.Category, &f.Visibility, &f.Status, &metaBytes, &f.CreatedAt, &f.UpdatedAt, &f.DeletedAt,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrRecordNotFound
			}
			return nil, err
		}
		if len(metaBytes) > 0 {
			_ = json.Unmarshal(metaBytes, &f.Metadata)
		}
		return &f, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	f, exists := r.files[id]
	if !exists || f.DeletedAt != nil {
		return nil, ErrRecordNotFound
	}
	copied := *f
	return &copied, nil
}

func (r *PostgresFileRepository) GetFileByStorageKey(ctx context.Context, key string) (*domain.FileRecord, error) {
	if r.pool != nil {
		query := `
			SELECT id, owner_id, original_filename, storage_key, media_type,
			       detected_content_type, file_size, checksum, extension,
			       category, visibility, status, metadata, created_at, updated_at, deleted_at
			FROM files
			WHERE storage_key = $1 AND deleted_at IS NULL
		`
		row := r.pool.QueryRow(ctx, query, key)
		var f domain.FileRecord
		var metaBytes []byte
		err := row.Scan(
			&f.ID, &f.OwnerID, &f.OriginalFilename, &f.StorageKey, &f.MediaType,
			&f.DetectedContentType, &f.FileSize, &f.Checksum, &f.Extension,
			&f.Category, &f.Visibility, &f.Status, &metaBytes, &f.CreatedAt, &f.UpdatedAt, &f.DeletedAt,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, ErrRecordNotFound
			}
			return nil, err
		}
		if len(metaBytes) > 0 {
			_ = json.Unmarshal(metaBytes, &f.Metadata)
		}
		return &f, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, f := range r.files {
		if f.StorageKey == key && f.DeletedAt == nil {
			copied := *f
			return &copied, nil
		}
	}
	return nil, ErrRecordNotFound
}

func (r *PostgresFileRepository) GetFilesByOwner(ctx context.Context, ownerID uuid.UUID, category string, limit, offset int) ([]domain.FileRecord, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	if r.pool != nil {
		query := `
			SELECT id, owner_id, original_filename, storage_key, media_type,
			       detected_content_type, file_size, checksum, extension,
			       category, visibility, status, metadata, created_at, updated_at, deleted_at,
			       COUNT(*) OVER() as total_count
			FROM files
			WHERE owner_id = $1
			  AND ($2 = '' OR category = $2)
			  AND deleted_at IS NULL
			ORDER BY created_at DESC
			LIMIT $3 OFFSET $4
		`
		rows, err := r.pool.Query(ctx, query, ownerID, category, limit, offset)
		if err != nil {
			return nil, 0, err
		}
		defer rows.Close()

		var results []domain.FileRecord
		total := 0
		for rows.Next() {
			var f domain.FileRecord
			var metaBytes []byte
			if err := rows.Scan(
				&f.ID, &f.OwnerID, &f.OriginalFilename, &f.StorageKey, &f.MediaType,
				&f.DetectedContentType, &f.FileSize, &f.Checksum, &f.Extension,
				&f.Category, &f.Visibility, &f.Status, &metaBytes, &f.CreatedAt, &f.UpdatedAt, &f.DeletedAt,
				&total,
			); err == nil {
				if len(metaBytes) > 0 {
					_ = json.Unmarshal(metaBytes, &f.Metadata)
				}
				results = append(results, f)
			}
		}
		return results, total, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var matching []domain.FileRecord
	for _, f := range r.files {
		if f.OwnerID == ownerID && f.DeletedAt == nil && (category == "" || f.Category == category) {
			matching = append(matching, *f)
		}
	}

	total := len(matching)
	if offset >= total {
		return []domain.FileRecord{}, total, nil
	}
	end := offset + limit
	if end > total {
		end = total
	}
	return matching[offset:end], total, nil
}

func (r *PostgresFileRepository) UpdateFileStatus(ctx context.Context, id uuid.UUID, status string) error {
	now := time.Now()
	if r.pool != nil {
		query := `UPDATE files SET status = $1, updated_at = $2 WHERE id = $3`
		_, err := r.pool.Exec(ctx, query, status, now, id)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if f, exists := r.files[id]; exists {
		f.Status = status
		f.UpdatedAt = now
		return nil
	}
	return ErrRecordNotFound
}

func (r *PostgresFileRepository) SoftDeleteFile(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	if r.pool != nil {
		query := `UPDATE files SET status = $1, deleted_at = $2, updated_at = $2 WHERE id = $3`
		_, err := r.pool.Exec(ctx, query, domain.StatusDeleted, now, id)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if f, exists := r.files[id]; exists {
		f.Status = domain.StatusDeleted
		f.DeletedAt = &now
		f.UpdatedAt = now
		return nil
	}
	return ErrRecordNotFound
}

func (r *PostgresFileRepository) DeleteFile(ctx context.Context, id uuid.UUID) error {
	if r.pool != nil {
		query := `DELETE FROM files WHERE id = $1`
		_, err := r.pool.Exec(ctx, query, id)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.files, id)
	return nil
}

func (r *PostgresFileRepository) CreateAttachment(ctx context.Context, att *domain.FileAttachment) error {
	if att.ID == uuid.Nil {
		att.ID = uuid.New()
	}
	if att.CreatedAt.IsZero() {
		att.CreatedAt = time.Now()
	}

	if r.pool != nil {
		query := `INSERT INTO file_attachments (id, file_id, entity_type, entity_id, created_at) VALUES ($1, $2, $3, $4, $5)`
		_, err := r.pool.Exec(ctx, query, att.ID, att.FileID, att.EntityType, att.EntityID, att.CreatedAt)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	copied := *att
	r.attachments[att.ID] = &copied
	return nil
}

func (r *PostgresFileRepository) GetAttachmentsByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]domain.FileRecord, error) {
	if r.pool != nil {
		query := `
			SELECT f.id, f.owner_id, f.original_filename, f.storage_key, f.media_type,
			       f.detected_content_type, f.file_size, f.checksum, f.extension,
			       f.category, f.visibility, f.status, f.metadata, f.created_at, f.updated_at, f.deleted_at
			FROM files f
			INNER JOIN file_attachments a ON f.id = a.file_id
			WHERE a.entity_type = $1 AND a.entity_id = $2 AND f.deleted_at IS NULL
			ORDER BY a.created_at ASC
		`
		rows, err := r.pool.Query(ctx, query, entityType, entityID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		var files []domain.FileRecord
		for rows.Next() {
			var f domain.FileRecord
			var metaBytes []byte
			if err := rows.Scan(
				&f.ID, &f.OwnerID, &f.OriginalFilename, &f.StorageKey, &f.MediaType,
				&f.DetectedContentType, &f.FileSize, &f.Checksum, &f.Extension,
				&f.Category, &f.Visibility, &f.Status, &metaBytes, &f.CreatedAt, &f.UpdatedAt, &f.DeletedAt,
			); err == nil {
				if len(metaBytes) > 0 {
					_ = json.Unmarshal(metaBytes, &f.Metadata)
				}
				files = append(files, f)
			}
		}
		return files, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var files []domain.FileRecord
	for _, a := range r.attachments {
		if a.EntityType == entityType && a.EntityID == entityID {
			if f, exists := r.files[a.FileID]; exists && f.DeletedAt == nil {
				files = append(files, *f)
			}
		}
	}
	return files, nil
}

func (r *PostgresFileRepository) DeleteAttachment(ctx context.Context, fileID uuid.UUID, entityType string, entityID uuid.UUID) error {
	if r.pool != nil {
		query := `DELETE FROM file_attachments WHERE file_id = $1 AND entity_type = $2 AND entity_id = $3`
		_, err := r.pool.Exec(ctx, query, fileID, entityType, entityID)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for id, a := range r.attachments {
		if a.FileID == fileID && a.EntityType == entityType && a.EntityID == entityID {
			delete(r.attachments, id)
			break
		}
	}
	return nil
}
