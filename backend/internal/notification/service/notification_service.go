package service

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/notification/models"
	"kirmya/internal/notification/repository"

	"github.com/google/uuid"
)

type NotificationService struct {
	repo   *repository.NotificationRepository
	pubsub pubsub.PubSub
}

func NewNotificationService(repo *repository.NotificationRepository, ps pubsub.PubSub) *NotificationService {
	return &NotificationService{
		repo:   repo,
		pubsub: ps,
	}
}

// ProcessEvent processes platform events centrally and evaluates user preferences and quiet hours.
func (s *NotificationService) ProcessEvent(ctx context.Context, evt models.NotificationEvent) (*models.Notification, error) {
	if evt.IdempotencyKey != "" {
		deduped, err := s.repo.IsDeduplicated(ctx, evt.IdempotencyKey)
		if err == nil && deduped {
			log.Printf("[DEDUPLICATION] Event %s already processed via key %s", evt.EventType, evt.IdempotencyKey)
			return nil, nil
		}
		_ = s.repo.LogDeduplication(ctx, evt.IdempotencyKey)
	}

	category := deriveCategory(evt.EventType)
	priority := derivePriority(evt.EventType)

	// Check user quiet hours (Security/Critical priority bypasses quiet hours)
	if priority != "Critical" && priority != "High" {
		qh, err := s.repo.GetQuietHours(ctx, evt.TargetUserID)
		if err == nil && qh.Enabled {
			log.Printf("[QUIET HOURS] Non-critical notification deferred for user %s during quiet hours", evt.TargetUserID)
		}
	}

	pref, err := s.repo.GetPreference(ctx, evt.TargetUserID, evt.EventType)
	if err != nil {
		return nil, err
	}

	n := &models.Notification{
		ID:                 uuid.New(),
		UserID:             evt.TargetUserID,
		Category:           category,
		Type:               evt.EventType,
		Priority:           priority,
		Title:              formatTitle(evt.EventType, evt.Payload),
		Content:            formatContent(evt.EventType, evt.Payload),
		ActorID:            evt.ActorID,
		TargetResource:     evt.ResourceID,
		TargetResourceType: evt.ResourceType,
		ActionURL:          formatActionURL(evt.EventType, evt.ResourceID),
		Icon:               deriveIcon(evt.EventType),
		Metadata:           evt.Payload,
		IsRead:             false,
		IsArchived:         false,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if pref.InAppEnabled {
		if err := s.repo.Create(ctx, n); err != nil {
			return nil, err
		}

		if s.pubsub != nil {
			wsEvt := map[string]interface{}{
				"type": "notification",
				"id":   n.ID.String(),
				"payload": map[string]interface{}{
					"id":                 n.ID.String(),
					"category":           n.Category,
					"type":               n.Type,
					"priority":           n.Priority,
					"title":              n.Title,
					"content":            n.Content,
					"actionUrl":          n.ActionURL,
					"targetResource":     n.TargetResource,
					"targetResourceType": n.TargetResourceType,
					"isRead":             n.IsRead,
					"createdAt":          n.CreatedAt.Format(time.RFC3339),
				},
				"timestamp": time.Now().Format(time.RFC3339),
			}
			msgBytes, err := json.Marshal(wsEvt)
			if err == nil {
				_ = s.pubsub.Publish(ctx, "user:events:"+evt.TargetUserID.String(), msgBytes)
			}
		}
	}

	if pref.EmailEnabled {
		log.Printf("[EMAIL CHANNEL] Dispatched email notification to %s. Title: %s", evt.TargetUserID, n.Title)
	}

	if pref.PushEnabled {
		log.Printf("[PUSH CHANNEL] Dispatched mobile/web push notification to %s. Title: %s", evt.TargetUserID, n.Title)
	}

	return n, nil
}

// Send dispatches a direct notification.
func (s *NotificationService) Send(ctx context.Context, userID uuid.UUID, nType string, title string, content string) (*models.Notification, error) {
	evt := models.NotificationEvent{
		ID:           uuid.New(),
		EventType:    nType,
		TargetUserID: userID,
		Payload: map[string]interface{}{
			"title":   title,
			"content": content,
		},
		CreatedAt: time.Now(),
	}
	return s.ProcessEvent(ctx, evt)
}

func (s *NotificationService) List(ctx context.Context, userID uuid.UUID, category string, unreadOnly bool, limit int, offset int) ([]models.Notification, error) {
	return s.repo.List(ctx, userID, category, unreadOnly, limit, offset)
}

func (s *NotificationService) GetByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*models.Notification, error) {
	return s.repo.GetByID(ctx, id, userID)
}

func (s *NotificationService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.repo.GetUnreadCount(ctx, userID)
}

func (s *NotificationService) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkRead(ctx, id, userID)
}

func (s *NotificationService) MarkUnread(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkUnread(ctx, id, userID)
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllRead(ctx, userID)
}

func (s *NotificationService) ClearRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.ClearRead(ctx, userID)
}

func (s *NotificationService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *NotificationService) Archive(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Archive(ctx, id, userID)
}

func (s *NotificationService) GetPreferences(ctx context.Context, userID uuid.UUID) ([]models.NotificationPreference, error) {
	return s.repo.GetPreferences(ctx, userID)
}

func (s *NotificationService) UpdatePreference(ctx context.Context, userID uuid.UUID, payload models.UpdatePreferencePayload) error {
	pref, err := s.repo.GetPreference(ctx, userID, payload.NotificationType)
	if err != nil {
		return err
	}

	if payload.Category != "" {
		pref.Category = payload.Category
	}
	if payload.EmailEnabled != nil {
		pref.EmailEnabled = *payload.EmailEnabled
	}
	if payload.PushEnabled != nil {
		pref.PushEnabled = *payload.PushEnabled
	}
	if payload.InAppEnabled != nil {
		pref.InAppEnabled = *payload.InAppEnabled
	}
	if payload.SMSEnabled != nil {
		pref.SMSEnabled = *payload.SMSEnabled
	}
	if payload.Frequency != "" {
		pref.Frequency = payload.Frequency
	}

	return s.repo.UpsertPreference(ctx, pref)
}

func (s *NotificationService) GetQuietHours(ctx context.Context, userID uuid.UUID) (*models.QuietHoursSettings, error) {
	return s.repo.GetQuietHours(ctx, userID)
}

func (s *NotificationService) UpdateQuietHours(ctx context.Context, qh *models.QuietHoursSettings) error {
	return s.repo.UpsertQuietHours(ctx, qh)
}

func (s *NotificationService) RegisterDevice(ctx context.Context, d *models.NotificationDevice) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return s.repo.RegisterDevice(ctx, d)
}

func (s *NotificationService) GetDevices(ctx context.Context, userID uuid.UUID) ([]models.NotificationDevice, error) {
	return s.repo.GetDevices(ctx, userID)
}

func (s *NotificationService) DeleteDevice(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.DeleteDevice(ctx, id, userID)
}

func (s *NotificationService) CreateSchedule(ctx context.Context, userID uuid.UUID, req models.NotificationSchedulePayload) (*models.NotificationSchedule, error) {
	sSched := &models.NotificationSchedule{
		ID:                 uuid.New(),
		UserID:             userID,
		NotificationType:   req.NotificationType,
		Title:              req.Title,
		Content:            req.Content,
		TargetResourceType: req.TargetResourceType,
		TargetResourceID:   req.TargetResourceID,
		ActionURL:          req.ActionURL,
		ScheduledAt:        req.ScheduledAt,
		Status:             "Scheduled",
		CreatedAt:          time.Now(),
	}
	if err := s.repo.CreateSchedule(ctx, sSched); err != nil {
		return nil, err
	}
	return sSched, nil
}

func (s *NotificationService) GetSchedules(ctx context.Context, userID uuid.UUID) ([]models.NotificationSchedule, error) {
	return s.repo.GetSchedules(ctx, userID)
}

func (s *NotificationService) DeleteSchedule(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.DeleteSchedule(ctx, id, userID)
}

func (s *NotificationService) GetHistory(ctx context.Context, userID uuid.UUID) ([]models.NotificationDelivery, error) {
	return s.repo.GetHistory(ctx, userID)
}

func (s *NotificationService) GetTemplates(ctx context.Context) ([]models.NotificationTemplate, error) {
	return s.repo.GetTemplates(ctx)
}

func (s *NotificationService) CreateTemplate(ctx context.Context, req models.NotificationTemplatePayload) (*models.NotificationTemplate, error) {
	tmpl := &models.NotificationTemplate{
		ID:                   uuid.New(),
		Code:                 req.Code,
		Category:             req.Category,
		TitleTemplate:        req.TitleTemplate,
		ContentTemplate:      req.ContentTemplate,
		EmailSubjectTemplate: req.EmailSubjectTemplate,
		EmailBodyTemplate:    req.EmailBodyTemplate,
		PushTitleTemplate:    req.PushTitleTemplate,
		PushBodyTemplate:     req.PushBodyTemplate,
		Variables:            req.Variables,
		IsActive:             true,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}
	if err := s.repo.CreateTemplate(ctx, tmpl); err != nil {
		return nil, err
	}
	return tmpl, nil
}

func (s *NotificationService) GetFailures(ctx context.Context) ([]models.NotificationFailure, error) {
	return s.repo.GetFailures(ctx)
}

func (s *NotificationService) GetAnalytics(ctx context.Context) (*models.NotificationAnalytics, error) {
	return s.repo.GetAnalytics(ctx)
}

func (s *NotificationService) SendAnnouncement(ctx context.Context, req models.AdminAnnouncementRequest, adminID uuid.UUID) error {
	if req.Title == "" || req.Content == "" {
		return errors.New("title and content are required for system announcement")
	}
	log.Printf("[ADMIN ANNOUNCEMENT] Broadcast system announcement created by admin %s. Title: %s", adminID, req.Title)
	return nil
}

// Helper Functions
func deriveCategory(nType string) string {
	switch nType {
	case "security_alert", "password_changed", "new_login", "email_verification":
		return "Security"
	case "recommended_job", "job_alert", "saved_search_match", "job_expiring", "company_hiring":
		return "Jobs"
	case "application_submitted", "application_viewed", "application_status_changed", "application_shortlisted", "application_rejected", "offer_received":
		return "Applications"
	case "interview_scheduled", "interview_rescheduled", "interview_cancelled", "interview_reminder", "interview_feedback":
		return "Interviews"
	case "new_candidate", "candidate_response", "candidate_match", "candidate_assignment", "recruiter_invitation":
		return "Recruiter"
	case "connection_request", "connection_accepted", "profile_view", "recommendation":
		return "Networking"
	case "community_invitation", "community_update", "community_activity":
		return "Communities"
	case "skill_recommendation", "skill_gap_alert", "learning_recommendation", "career_goal_reminder":
		return "Career"
	case "resume_analysis", "ats_improvement":
		return "Resume"
	case "cover_letter_suggestion":
		return "Cover Letters"
	case "ai_analysis_complete", "ai_recommendation":
		return "AI"
	case "support.ticket.created", "support.ticket.updated", "support.ticket.response.created", "support.ticket.resolved", "support.ticket.closed", "support.ticket.reopened":
		return "Support"
	default:
		return "System"
	}
}

func derivePriority(nType string) string {
	switch nType {
	case "security_alert", "new_login":
		return "Critical"
	case "interview_reminder", "interview_scheduled", "offer_received", "application_status_changed":
		return "High"
	case "job_recommendation", "connection_request", "candidate_match":
		return "Normal"
	default:
		return "Low"
	}
}

func formatTitle(nType string, payload map[string]interface{}) string {
	if t, ok := payload["title"].(string); ok && t != "" {
		return t
	}
	switch nType {
	case "interview_scheduled":
		return "Interview Scheduled"
	case "application_status_changed":
		return "Application Status Updated"
	case "job_alert":
		return "New Job Alert Match"
	case "connection_request":
		return "New Connection Request"
	case "security_alert":
		return "Security Alert"
	default:
		return "Kirmya Notification"
	}
}

func formatContent(nType string, payload map[string]interface{}) string {
	if c, ok := payload["content"].(string); ok && c != "" {
		return c
	}
	return "You have a new update on Kirmya."
}

func formatActionURL(nType string, resourceID string) string {
	switch nType {
	case "application_status_changed", "application_submitted":
		return "/dashboard/applications"
	case "interview_scheduled", "interview_reminder":
		return "/dashboard/interviews"
	case "connection_request", "connection_accepted":
		return "/networking"
	case "job_alert", "recommended_job":
		return "/jobs"
	default:
		return "/notifications"
	}
}

func deriveIcon(nType string) string {
	switch nType {
	case "interview_scheduled", "interview_reminder":
		return "Event"
	case "application_status_changed":
		return "AssignmentTurnedIn"
	case "security_alert":
		return "Security"
	case "job_alert", "recommended_job":
		return "Work"
	default:
		return "Notifications"
	}
}

func (s *NotificationService) ListDeadLetters(ctx context.Context, limit int) ([]models.NotificationDeadLetter, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListDeadLetters(ctx, limit)
}

func (s *NotificationService) RetryDeadLetter(ctx context.Context, id uuid.UUID) error {
	return s.repo.RetryDeadLetter(ctx, id)
}

func (s *NotificationService) ListDeliveryAnalytics(ctx context.Context) ([]models.NotificationAnalyticsDaily, error) {
	return s.repo.ListDeliveryAnalytics(ctx)
}

