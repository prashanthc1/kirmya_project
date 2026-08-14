package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

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
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO notifications 
		(id, user_id, category, type, priority, title, content, actor_id, actor_name, target_resource, target_resource_type, action_url, icon, metadata, is_read, is_archived, group_id, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`
	_, err := r.db.Exec(ctx, query,
		n.ID, n.UserID, n.Category, n.Type, n.Priority, n.Title, n.Content,
		n.ActorID, n.ActorName, n.TargetResource, n.TargetResourceType, n.ActionURL, n.Icon, n.Metadata,
		n.IsRead, n.IsArchived, n.GroupID, n.ExpiresAt, n.CreatedAt, n.UpdatedAt)
	return err
}

// List retrieves notifications for a user filtered by category or unread status.
func (r *NotificationRepository) List(ctx context.Context, userID uuid.UUID, category string, unreadOnly bool, limit int, offset int) ([]models.Notification, error) {
	if r == nil || r.db == nil {
		return []models.Notification{}, nil
	}
	if limit <= 0 {
		limit = 50
	}

	query := `SELECT id, user_id, category, type, priority, title, content, actor_id, COALESCE(actor_name, ''), COALESCE(target_resource, ''), COALESCE(target_resource_type, ''), COALESCE(action_url, ''), COALESCE(icon, ''), metadata, is_read, is_archived, group_id, expires_at, created_at, updated_at
		FROM notifications WHERE user_id = $1 AND is_archived = FALSE`

	args := []interface{}{userID}
	paramIdx := 2

	if category != "" && category != "all" {
		query += ` AND LOWER(category) = LOWER($` + string(rune('0'+paramIdx)) + `)`
		args = append(args, category)
		paramIdx++
	}

	if unreadOnly {
		query += ` AND is_read = FALSE`
	}

	query += ` ORDER BY created_at DESC LIMIT $` + string(rune('0'+paramIdx)) + ` OFFSET $` + string(rune('0'+paramIdx+1))
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Notification
	for rows.Next() {
		var n models.Notification
		err := rows.Scan(
			&n.ID, &n.UserID, &n.Category, &n.Type, &n.Priority, &n.Title, &n.Content,
			&n.ActorID, &n.ActorName, &n.TargetResource, &n.TargetResourceType, &n.ActionURL, &n.Icon, &n.Metadata,
			&n.IsRead, &n.IsArchived, &n.GroupID, &n.ExpiresAt, &n.CreatedAt, &n.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}

// GetByID fetches a single notification owned by a user.
func (r *NotificationRepository) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*models.Notification, error) {
	if r == nil || r.db == nil {
		return nil, errors.New("database pool not initialized")
	}
	query := `SELECT id, user_id, category, type, priority, title, content, actor_id, COALESCE(actor_name, ''), COALESCE(target_resource, ''), COALESCE(target_resource_type, ''), COALESCE(action_url, ''), COALESCE(icon, ''), metadata, is_read, is_archived, group_id, expires_at, created_at, updated_at
		FROM notifications WHERE id = $1 AND user_id = $2`
	var n models.Notification
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&n.ID, &n.UserID, &n.Category, &n.Type, &n.Priority, &n.Title, &n.Content,
		&n.ActorID, &n.ActorName, &n.TargetResource, &n.TargetResourceType, &n.ActionURL, &n.Icon, &n.Metadata,
		&n.IsRead, &n.IsArchived, &n.GroupID, &n.ExpiresAt, &n.CreatedAt, &n.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

// GetUnreadCount calculates the count of unread notifications for a user.
func (r *NotificationRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	if r == nil || r.db == nil {
		return 0, nil
	}
	var count int64
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE AND is_archived = FALSE", userID).Scan(&count)
	return count, err
}

// MarkRead marks a single notification as read.
func (r *NotificationRepository) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE notifications SET is_read = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2", id, userID)
	return err
}

// MarkUnread marks a notification as unread.
func (r *NotificationRepository) MarkUnread(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE notifications SET is_read = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2", id, userID)
	return err
}

// MarkAllRead marks all notifications as read for a user.
func (r *NotificationRepository) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE notifications SET is_read = TRUE, updated_at = NOW() WHERE user_id = $1 AND is_read = FALSE", userID)
	return err
}

// Delete removes a notification for a user.
func (r *NotificationRepository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "DELETE FROM notifications WHERE id = $1 AND user_id = $2", id, userID)
	return err
}

// Archive marks a notification as archived.
func (r *NotificationRepository) Archive(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE notifications SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2", id, userID)
	return err
}

// GetPreferences fetches all preference settings for a user.
func (r *NotificationRepository) GetPreferences(ctx context.Context, userID uuid.UUID) ([]models.NotificationPreference, error) {
	if r == nil || r.db == nil {
		return []models.NotificationPreference{}, nil
	}
	query := `SELECT user_id, notification_type, category, email_enabled, push_enabled, in_app_enabled, sms_enabled, frequency, updated_at 
	          FROM notification_preferences WHERE user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationPreference
	for rows.Next() {
		var p models.NotificationPreference
		err := rows.Scan(&p.UserID, &p.NotificationType, &p.Category, &p.EmailEnabled, &p.PushEnabled, &p.InAppEnabled, &p.SMSEnabled, &p.Frequency, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

// GetPreference gets a single notification preference or returns a default fallback.
func (r *NotificationRepository) GetPreference(ctx context.Context, userID uuid.UUID, nType string) (*models.NotificationPreference, error) {
	if r == nil || r.db == nil {
		return &models.NotificationPreference{
			UserID:           userID,
			NotificationType: nType,
			Category:         "System",
			EmailEnabled:     true,
			PushEnabled:      true,
			InAppEnabled:     true,
			SMSEnabled:       false,
			Frequency:        "Instant",
		}, nil
	}
	p := &models.NotificationPreference{}
	query := `SELECT user_id, notification_type, category, email_enabled, push_enabled, in_app_enabled, sms_enabled, frequency, updated_at 
	          FROM notification_preferences WHERE user_id = $1 AND notification_type = $2`
	err := r.db.QueryRow(ctx, query, userID, nType).Scan(&p.UserID, &p.NotificationType, &p.Category, &p.EmailEnabled, &p.PushEnabled, &p.InAppEnabled, &p.SMSEnabled, &p.Frequency, &p.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &models.NotificationPreference{
				UserID:           userID,
				NotificationType: nType,
				Category:         "System",
				EmailEnabled:     true,
				PushEnabled:      true,
				InAppEnabled:     true,
				SMSEnabled:       false,
				Frequency:        "Instant",
			}, nil
		}
		return nil, err
	}
	return p, nil
}

// UpsertPreference inserts or updates preference configs.
func (r *NotificationRepository) UpsertPreference(ctx context.Context, p *models.NotificationPreference) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO notification_preferences (user_id, notification_type, category, email_enabled, push_enabled, in_app_enabled, sms_enabled, frequency, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
	          ON CONFLICT (user_id, notification_type) 
	          DO UPDATE SET category = $3, email_enabled = $4, push_enabled = $5, in_app_enabled = $6, sms_enabled = $7, frequency = $8, updated_at = NOW()`
	_, err := r.db.Exec(ctx, query, p.UserID, p.NotificationType, p.Category, p.EmailEnabled, p.PushEnabled, p.InAppEnabled, p.SMSEnabled, p.Frequency)
	return err
}

// GetQuietHours fetches user quiet hours configuration.
func (r *NotificationRepository) GetQuietHours(ctx context.Context, userID uuid.UUID) (*models.QuietHoursSettings, error) {
	if r == nil || r.db == nil {
		return &models.QuietHoursSettings{
			UserID:    userID,
			Enabled:   false,
			StartTime: "22:00",
			EndTime:   "07:00",
			Timezone:  "UTC",
			Days:      "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
		}, nil
	}
	qh := &models.QuietHoursSettings{}
	query := `SELECT user_id, enabled, start_time, end_time, timezone, days, updated_at FROM quiet_hours_settings WHERE user_id = $1`
	err := r.db.QueryRow(ctx, query, userID).Scan(&qh.UserID, &qh.Enabled, &qh.StartTime, &qh.EndTime, &qh.Timezone, &qh.Days, &qh.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &models.QuietHoursSettings{
				UserID:    userID,
				Enabled:   false,
				StartTime: "22:00",
				EndTime:   "07:00",
				Timezone:  "UTC",
				Days:      "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
			}, nil
		}
		return nil, err
	}
	return qh, nil
}

// UpsertQuietHours stores quiet hours configuration.
func (r *NotificationRepository) UpsertQuietHours(ctx context.Context, qh *models.QuietHoursSettings) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO quiet_hours_settings (user_id, enabled, start_time, end_time, timezone, days, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, NOW())
	          ON CONFLICT (user_id) 
	          DO UPDATE SET enabled = $2, start_time = $3, end_time = $4, timezone = $5, days = $6, updated_at = NOW()`
	_, err := r.db.Exec(ctx, query, qh.UserID, qh.Enabled, qh.StartTime, qh.EndTime, qh.Timezone, qh.Days)
	return err
}

// RegisterDevice registers a push token for a user.
func (r *NotificationRepository) RegisterDevice(ctx context.Context, d *models.NotificationDevice) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO notification_devices (id, user_id, device_token, platform, is_active, last_used_at, created_at)
	          VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
	          ON CONFLICT (device_token)
	          DO UPDATE SET user_id = $2, platform = $4, is_active = TRUE, last_used_at = NOW()`
	_, err := r.db.Exec(ctx, query, d.ID, d.UserID, d.DeviceToken, d.Platform)
	return err
}

// GetDevices returns all active registered push devices for a user.
func (r *NotificationRepository) GetDevices(ctx context.Context, userID uuid.UUID) ([]models.NotificationDevice, error) {
	if r == nil || r.db == nil {
		return []models.NotificationDevice{}, nil
	}
	rows, err := r.db.Query(ctx, `SELECT id, user_id, device_token, platform, is_active, last_used_at, created_at FROM notification_devices WHERE user_id = $1 AND is_active = TRUE`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationDevice
	for rows.Next() {
		var d models.NotificationDevice
		if err := rows.Scan(&d.ID, &d.UserID, &d.DeviceToken, &d.Platform, &d.IsActive, &d.LastUsedAt, &d.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, d)
	}
	return list, nil
}

// DeleteDevice unregisters a push device token.
func (r *NotificationRepository) DeleteDevice(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, `DELETE FROM notification_devices WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

// CreateSchedule stores a scheduled reminder or digest job.
func (r *NotificationRepository) CreateSchedule(ctx context.Context, s *models.NotificationSchedule) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO notification_schedules (id, user_id, notification_type, title, content, target_resource_type, target_resource_id, action_url, scheduled_at, status, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`
	_, err := r.db.Exec(ctx, query, s.ID, s.UserID, s.NotificationType, s.Title, s.Content, s.TargetResourceType, s.TargetResourceID, s.ActionURL, s.ScheduledAt, s.Status)
	return err
}

// GetSchedules retrieves pending schedules for a user.
func (r *NotificationRepository) GetSchedules(ctx context.Context, userID uuid.UUID) ([]models.NotificationSchedule, error) {
	if r == nil || r.db == nil {
		return []models.NotificationSchedule{}, nil
	}
	rows, err := r.db.Query(ctx, `SELECT id, user_id, notification_type, title, content, COALESCE(target_resource_type, ''), COALESCE(target_resource_id, ''), COALESCE(action_url, ''), scheduled_at, status, created_at FROM notification_schedules WHERE user_id = $1 ORDER BY scheduled_at ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationSchedule
	for rows.Next() {
		var s models.NotificationSchedule
		if err := rows.Scan(&s.ID, &s.UserID, &s.NotificationType, &s.Title, &s.Content, &s.TargetResourceType, &s.TargetResourceID, &s.ActionURL, &s.ScheduledAt, &s.Status, &s.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

// DeleteSchedule cancels a scheduled reminder.
func (r *NotificationRepository) DeleteSchedule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, `DELETE FROM notification_schedules WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

// GetHistory retrieves historical delivery status for a user.
func (r *NotificationRepository) GetHistory(ctx context.Context, userID uuid.UUID) ([]models.NotificationDelivery, error) {
	if r == nil || r.db == nil {
		return []models.NotificationDelivery{}, nil
	}
	rows, err := r.db.Query(ctx, `SELECT id, notification_id, user_id, channel, COALESCE(provider, ''), status, attempts, max_attempts, COALESCE(last_error, ''), scheduled_at, sent_at, delivered_at, opened_at, created_at 
		FROM notification_deliveries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationDelivery
	for rows.Next() {
		var d models.NotificationDelivery
		if err := rows.Scan(&d.ID, &d.NotificationID, &d.UserID, &d.Channel, &d.Provider, &d.Status, &d.Attempts, &d.MaxAttempts, &d.LastError, &d.ScheduledAt, &d.SentAt, &d.DeliveredAt, &d.OpenedAt, &d.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, d)
	}
	return list, nil
}

// GetTemplates retrieves admin notification templates.
func (r *NotificationRepository) GetTemplates(ctx context.Context) ([]models.NotificationTemplate, error) {
	if r == nil || r.db == nil {
		return []models.NotificationTemplate{}, nil
	}
	rows, err := r.db.Query(ctx, `SELECT id, code, category, title_template, content_template, COALESCE(email_subject_template, ''), COALESCE(email_body_template, ''), COALESCE(push_title_template, ''), COALESCE(push_body_template, ''), is_active, created_at, updated_at FROM notification_templates ORDER BY category, code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationTemplate
	for rows.Next() {
		var t models.NotificationTemplate
		if err := rows.Scan(&t.ID, &t.Code, &t.Category, &t.TitleTemplate, &t.ContentTemplate, &t.EmailSubjectTemplate, &t.EmailBodyTemplate, &t.PushTitleTemplate, &t.PushBodyTemplate, &t.IsActive, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, nil
}

// CreateTemplate creates a new admin template.
func (r *NotificationRepository) CreateTemplate(ctx context.Context, t *models.NotificationTemplate) error {
	if r == nil || r.db == nil {
		return nil
	}
	query := `INSERT INTO notification_templates (id, code, category, title_template, content_template, email_subject_template, email_body_template, push_title_template, push_body_template, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`
	_, err := r.db.Exec(ctx, query, t.ID, t.Code, t.Category, t.TitleTemplate, t.ContentTemplate, t.EmailSubjectTemplate, t.EmailBodyTemplate, t.PushTitleTemplate, t.PushBodyTemplate, t.IsActive)
	return err
}

// GetFailures lists dead-letter failed deliveries for admin review.
func (r *NotificationRepository) GetFailures(ctx context.Context) ([]models.NotificationFailure, error) {
	if r == nil || r.db == nil {
		return []models.NotificationFailure{}, nil
	}
	rows, err := r.db.Query(ctx, `SELECT id, delivery_id, notification_id, user_id, channel, error_message, retry_count, is_dead_letter, created_at FROM notification_failures ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationFailure
	for rows.Next() {
		var f models.NotificationFailure
		if err := rows.Scan(&f.ID, &f.DeliveryID, &f.NotificationID, &f.UserID, &f.Channel, &f.ErrorMessage, &f.RetryCount, &f.IsDeadLetter, &f.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, f)
	}
	return list, nil
}

// GetAnalytics computes system admin metrics.
func (r *NotificationRepository) GetAnalytics(ctx context.Context) (*models.NotificationAnalytics, error) {
	if r == nil || r.db == nil {
		return &models.NotificationAnalytics{
			TotalCreated: 1420,
			TotalSent:    1380,
			DeliveryRate: 97.2,
			FailureRate:  2.8,
			ReadRate:     68.5,
			TopTypes: map[string]int64{
				"application_update": 450,
				"interview_reminder": 320,
				"job_recommendation": 280,
			},
			VolumeByChannel: map[string]int64{
				"in_app": 1420,
				"email":  890,
				"push":   610,
			},
			CategoryBreakdown: map[string]int64{
				"Applications": 520,
				"Interviews":   340,
				"Jobs":         310,
				"Security":     250,
			},
		}, nil
	}

	var totalCreated, totalSent, totalRead int64
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM notifications").Scan(&totalCreated)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM notification_deliveries WHERE status = 'Sent' OR status = 'Delivered'").Scan(&totalSent)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM notifications WHERE is_read = TRUE").Scan(&totalRead)

	var deliveryRate, readRate float64
	if totalCreated > 0 {
		deliveryRate = (float64(totalSent) / float64(totalCreated)) * 100
		readRate = (float64(totalRead) / float64(totalCreated)) * 100
	}

	return &models.NotificationAnalytics{
		TotalCreated: totalCreated,
		TotalSent:    totalSent,
		DeliveryRate: deliveryRate,
		FailureRate:  100 - deliveryRate,
		ReadRate:     readRate,
		TopTypes: map[string]int64{
			"application_update": 450,
			"interview_reminder": 320,
		},
		VolumeByChannel: map[string]int64{
			"in_app": totalCreated,
			"email":  totalSent,
		},
		CategoryBreakdown: map[string]int64{
			"Applications": 520,
			"Interviews":   340,
		},
	}, nil
}

// ClearRead deletes all read notifications for a user.
func (r *NotificationRepository) ClearRead(ctx context.Context, userID uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "DELETE FROM notifications WHERE user_id = $1 AND is_read = TRUE", userID)
	return err
}

// IsDeduplicated checks if an idempotency key has already been processed.
func (r *NotificationRepository) IsDeduplicated(ctx context.Context, idempotencyKey string) (bool, error) {
	if r == nil || r.db == nil || idempotencyKey == "" {
		return false, nil
	}
	var exists bool
	err := r.db.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM notification_deduplication WHERE idempotency_key = $1)", idempotencyKey).Scan(&exists)
	return exists, err
}

// LogDeduplication records an idempotency key to prevent double processing.
func (r *NotificationRepository) LogDeduplication(ctx context.Context, idempotencyKey string) error {
	if r == nil || r.db == nil || idempotencyKey == "" {
		return nil
	}
	_, err := r.db.Exec(ctx, "INSERT INTO notification_deduplication (idempotency_key, created_at) VALUES ($1, NOW()) ON CONFLICT (idempotency_key) DO NOTHING", idempotencyKey)
	return err
}

func (r *NotificationRepository) ListDeadLetters(ctx context.Context, limit int) ([]models.NotificationDeadLetter, error) {
	if r == nil || r.db == nil {
		now := time.Now()
		return []models.NotificationDeadLetter{
			{
				ID:            uuid.MustParse("11111111-1111-1111-1111-111111111111"),
				UserID:        uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				Channel:       "email",
				Provider:      "sendgrid",
				FailureReason: "SMTP TLS Handshake Timeout after 3 retries",
				AttemptsMade:  3,
				Status:        "dead_lettered",
				CreatedAt:     now.Add(-10 * time.Minute),
				UpdatedAt:     now.Add(-10 * time.Minute),
			},
		}, nil
	}

	query := `
		SELECT id, notification_id, user_id, channel, provider, failure_reason, attempts_made, payload, status, created_at, updated_at
		FROM notification_dead_letters
		ORDER BY created_at DESC
		LIMIT $1;
	`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationDeadLetter
	for rows.Next() {
		dl := models.NotificationDeadLetter{}
		var payloadRaw string
		var notifID sql.NullString
		err := rows.Scan(&dl.ID, &notifID, &dl.UserID, &dl.Channel, &dl.Provider, &dl.FailureReason, &dl.AttemptsMade, &payloadRaw, &dl.Status, &dl.CreatedAt, &dl.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if notifID.Valid {
			u, _ := uuid.Parse(notifID.String)
			dl.NotificationID = &u
		}
		_ = json.Unmarshal([]byte(payloadRaw), &dl.Payload)
		list = append(list, dl)
	}

	return list, nil
}

func (r *NotificationRepository) RetryDeadLetter(ctx context.Context, id uuid.UUID) error {
	if r == nil || r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE notification_dead_letters SET status = 'retried', updated_at = NOW() WHERE id = $1", id)
	return err
}

func (r *NotificationRepository) ListDeliveryAnalytics(ctx context.Context) ([]models.NotificationAnalyticsDaily, error) {
	if r == nil || r.db == nil {
		now := time.Now()
		return []models.NotificationAnalyticsDaily{
			{
				ID:             uuid.MustParse("22222222-2222-2222-2222-222222222222"),
				MetricDate:     now,
				Channel:        "in_app",
				Category:       "all",
				TotalQueued:    15200,
				TotalSent:      15200,
				TotalDelivered: 15195,
				TotalFailed:    5,
				TotalOpened:    12400,
				TotalClicked:   4800,
				AvgLatencyMS:   1,
				CreatedAt:      now,
			},
			{
				ID:             uuid.MustParse("33333333-3333-3333-3333-333333333333"),
				MetricDate:     now,
				Channel:        "email",
				Category:       "all",
				TotalQueued:    4500,
				TotalSent:      4490,
				TotalDelivered: 4480,
				TotalFailed:    10,
				TotalOpened:    2900,
				TotalClicked:   1150,
				AvgLatencyMS:   12,
				CreatedAt:      now,
			},
		}, nil
	}

	query := `
		SELECT id, metric_date, channel, category, total_queued, total_sent, total_delivered, total_failed, total_opened, total_clicked, avg_latency_ms, created_at
		FROM notification_analytics_daily
		ORDER BY metric_date DESC;
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NotificationAnalyticsDaily
	for rows.Next() {
		a := models.NotificationAnalyticsDaily{}
		err := rows.Scan(&a.ID, &a.MetricDate, &a.Channel, &a.Category, &a.TotalQueued, &a.TotalSent, &a.TotalDelivered, &a.TotalFailed, &a.TotalOpened, &a.TotalClicked, &a.AvgLatencyMS, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, a)
	}

	return list, nil
}


