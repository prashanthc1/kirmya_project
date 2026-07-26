package repository

import (
	"context"
	"errors"
	"kirmya/internal/notification/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NotificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create stores a new notification in the database.
func (r *NotificationRepository) Create(ctx context.Context, n *models.Notification) error {
	if r.db == nil {
		return nil // Graceful stub for tests running without DB connection pool
	}
	query := `INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, n.ID, n.UserID, n.Type, n.Title, n.Content, n.IsRead, n.CreatedAt)
	return err
}

// List retrieves all notifications for a specific user.
func (r *NotificationRepository) List(ctx context.Context, userID uuid.UUID) ([]models.Notification, error) {
	if r.db == nil {
		return []models.Notification{}, nil
	}
	query := `SELECT id, user_id, type, title, content, is_read, created_at 
	          FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Notification
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Title, &n.Content, &n.IsRead, &n.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}

// MarkRead marks a single notification as read.
func (r *NotificationRepository) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2", id, userID)
	return err
}

// MarkAllRead marks all notifications as read for a user.
func (r *NotificationRepository) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE notifications SET is_read = TRUE WHERE user_id = $1", userID)
	return err
}

// GetPreferences fetches all preference settings for a user.
func (r *NotificationRepository) GetPreferences(ctx context.Context, userID uuid.UUID) ([]models.NotificationPreference, error) {
	if r.db == nil {
		return []models.NotificationPreference{}, nil
	}
	query := `SELECT user_id, notification_type, email_enabled, push_enabled, in_app_enabled 
	          FROM notification_preferences WHERE user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationPreference
	for rows.Next() {
		var p models.NotificationPreference
		err := rows.Scan(&p.UserID, &p.NotificationType, &p.EmailEnabled, &p.PushEnabled, &p.InAppEnabled)
		if err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

// GetPreference gets a single notification preference or returns a default fallback.
func (r *NotificationRepository) GetPreference(ctx context.Context, userID uuid.UUID, nType string) (*models.NotificationPreference, error) {
	if r.db == nil {
		return &models.NotificationPreference{
			UserID:           userID,
			NotificationType: nType,
			EmailEnabled:     true,
			PushEnabled:      true,
			InAppEnabled:     true,
		}, nil
	}
	p := &models.NotificationPreference{}
	query := `SELECT user_id, notification_type, email_enabled, push_enabled, in_app_enabled 
	          FROM notification_preferences WHERE user_id = $1 AND notification_type = $2`
	err := r.db.QueryRow(ctx, query, userID, nType).Scan(&p.UserID, &p.NotificationType, &p.EmailEnabled, &p.PushEnabled, &p.InAppEnabled)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &models.NotificationPreference{
				UserID:           userID,
				NotificationType: nType,
				EmailEnabled:     true,
				PushEnabled:      true,
				InAppEnabled:     true,
			}, nil
		}
		return nil, err
	}
	return p, nil
}

// UpsertPreference inserts or updates preference configs.
func (r *NotificationRepository) UpsertPreference(ctx context.Context, p *models.NotificationPreference) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO notification_preferences (user_id, notification_type, email_enabled, push_enabled, in_app_enabled)
	          VALUES ($1, $2, $3, $4, $5)
	          ON CONFLICT (user_id, notification_type) 
	          DO UPDATE SET email_enabled = $3, push_enabled = $4, in_app_enabled = $5`
	_, err := r.db.Exec(ctx, query, p.UserID, p.NotificationType, p.EmailEnabled, p.PushEnabled, p.InAppEnabled)
	return err
}
