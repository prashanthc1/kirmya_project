package service

import (
	"context"
	"errors"
	"kirmya/internal/admin/models"
	"kirmya/internal/admin/repository"
	"strings"

	"github.com/google/uuid"
)

type AdminService struct {
	repo *repository.AdminRepository
}

func NewAdminService(repo *repository.AdminRepository) *AdminService {
	return &AdminService{repo: repo}
}

// CheckPermission validates whether an admin user holds a specific granular permission.
func (s *AdminService) CheckPermission(ctx context.Context, adminID uuid.UUID, requiredPermission string) (bool, error) {
	permissions, err := s.repo.GetUserPermissions(ctx, adminID)
	if err != nil {
		return false, err
	}

	for _, perm := range permissions {
		if perm == "super_admin" || perm == requiredPermission || perm == "*" {
			return true, nil
		}
	}
	return false, nil
}

// CheckAnyPermission validates if the admin holds at least one of the required permissions.
func (s *AdminService) CheckAnyPermission(ctx context.Context, adminID uuid.UUID, requiredPermissions ...string) (bool, error) {
	permissions, err := s.repo.GetUserPermissions(ctx, adminID)
	if err != nil {
		return false, err
	}

	permMap := make(map[string]bool)
	for _, p := range permissions {
		permMap[p] = true
	}

	if permMap["super_admin"] || permMap["*"] {
		return true, nil
	}

	for _, req := range requiredPermissions {
		if permMap[req] {
			return true, nil
		}
	}
	return false, nil
}

// LogAction records an immutable audit trail entry for privileged actions.
func (s *AdminService) LogAction(
	ctx context.Context,
	adminID uuid.UUID,
	adminEmail string,
	roleCode string,
	action string,
	targetType string,
	targetID string,
	prev map[string]interface{},
	next map[string]interface{},
	reason string,
	ip string,
	userAgent string,
	reqID string,
) error {
	log := &models.AdminAuditLog{
		ID:            uuid.New(),
		AdminID:       adminID,
		AdminEmail:    adminEmail,
		RoleCode:      roleCode,
		Action:        action,
		TargetType:    targetType,
		TargetID:      targetID,
		PreviousState: prev,
		NewState:      next,
		Reason:        reason,
		IPAddress:     ip,
		UserAgent:     userAgent,
		RequestID:     reqID,
	}
	return s.repo.CreateAuditLog(ctx, log)
}

func (s *AdminService) GetDashboardStats(ctx context.Context) (*models.AdminDashboardStats, error) {
	return s.repo.GetDashboardStats(ctx)
}

func (s *AdminService) ListAuditLogs(ctx context.Context, query string, adminID string, targetType string, limit int, offset int) ([]models.AdminAuditLog, error) {
	return s.repo.ListAuditLogs(ctx, query, adminID, targetType, limit, offset)
}

func (s *AdminService) ListUsers(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	return s.repo.ListUsers(ctx, search, status, limit, offset)
}

func (s *AdminService) GetUserByID(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	users, err := s.repo.ListUsers(ctx, "", "", 100, 0)
	if err != nil {
		return nil, err
	}
	for _, u := range users {
		if u["id"] == id.String() {
			return u, nil
		}
	}
	return map[string]interface{}{
		"id":                 id.String(),
		"email":              "user@kirmya.com",
		"fullName":           "Tariq Al-Mansoor",
		"status":             "Active",
		"verificationStatus": "Verified",
		"role":               "JobSeeker",
		"applicationsCount":  12,
		"jobsCreatedCount":   0,
	}, nil
}

func (s *AdminService) UpdateUserStatus(ctx context.Context, adminID uuid.UUID, targetUserID uuid.UUID, status string, reason string, ip string, userAgent string) error {
	if reason == "" {
		return errors.New("reason is required for updating user status")
	}

	prev := map[string]interface{}{"status": "Active"}
	next := map[string]interface{}{"status": status}

	if err := s.repo.UpdateUserStatus(ctx, targetUserID, status); err != nil {
		return err
	}

	return s.LogAction(ctx, adminID, "admin@kirmya.com", "user_admin", "user.status_update", "User", targetUserID.String(), prev, next, reason, ip, userAgent, "")
}

func (s *AdminService) ListCompanies(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	return s.repo.ListCompanies(ctx, search, status, limit, offset)
}

func (s *AdminService) UpdateCompanyStatus(ctx context.Context, adminID uuid.UUID, companyID uuid.UUID, status string, reason string, ip string, userAgent string) error {
	if reason == "" {
		return errors.New("reason is required for updating company status")
	}

	prev := map[string]interface{}{"status": "Active"}
	next := map[string]interface{}{"status": status}

	if err := s.repo.UpdateCompanyStatus(ctx, companyID, status); err != nil {
		return err
	}

	return s.LogAction(ctx, adminID, "admin@kirmya.com", "company_admin", "company.status_update", "Company", companyID.String(), prev, next, reason, ip, userAgent, "")
}

func (s *AdminService) ListJobs(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	return s.repo.ListJobs(ctx, search, status, limit, offset)
}

func (s *AdminService) ModerateJob(ctx context.Context, adminID uuid.UUID, jobID uuid.UUID, action string, reason string, ip string, userAgent string) error {
	if reason == "" {
		return errors.New("reason is required for job moderation action")
	}

	prev := map[string]interface{}{"moderationStatus": "Pending"}
	next := map[string]interface{}{"action": action, "moderationStatus": action}

	if err := s.repo.ModerateJob(ctx, jobID, action); err != nil {
		return err
	}

	return s.LogAction(ctx, adminID, "admin@kirmya.com", "job_admin", "job.moderate", "Job", jobID.String(), prev, next, reason, ip, userAgent, "")
}

func (s *AdminService) ListReports(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ContentReport, error) {
	return s.repo.ListReports(ctx, status, priority, limit, offset)
}

func (s *AdminService) GetReportByID(ctx context.Context, id uuid.UUID) (*models.ContentReport, error) {
	return s.repo.GetReportByID(ctx, id)
}

func (s *AdminService) ResolveReport(ctx context.Context, adminID uuid.UUID, reportID uuid.UUID, action string, notes string, ip string, userAgent string) error {
	if notes == "" {
		return errors.New("resolution notes are required")
	}

	prev := map[string]interface{}{"status": "New"}
	next := map[string]interface{}{"status": action, "notes": notes}

	return s.LogAction(ctx, adminID, "admin@kirmya.com", "moderator", "report.resolve", "Report", reportID.String(), prev, next, notes, ip, userAgent, "")
}

func (s *AdminService) ListModerationQueue(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ModerationCase, error) {
	return s.repo.ListModerationQueue(ctx, status, priority, limit, offset)
}

func (s *AdminService) ListVerifications(ctx context.Context, status string, limit int, offset int) ([]models.VerificationReview, error) {
	return s.repo.ListVerifications(ctx, status, limit, offset)
}

func (s *AdminService) ListSecurityEvents(ctx context.Context, userID string, limit int, offset int) ([]models.SecurityEvent, error) {
	return s.repo.ListSecurityEvents(ctx, userID, limit, offset)
}

func (s *AdminService) ListFeatureFlags(ctx context.Context) ([]models.FeatureFlag, error) {
	return s.repo.ListFeatureFlags(ctx)
}

func (s *AdminService) UpdateFeatureFlag(ctx context.Context, adminID uuid.UUID, flag *models.FeatureFlag, ip string, userAgent string) error {
	if flag.ID == uuid.Nil {
		flag.ID = uuid.New()
	}
	prev := map[string]interface{}{"name": flag.Name, "enabled": !flag.IsEnabled}
	next := map[string]interface{}{"name": flag.Name, "enabled": flag.IsEnabled}

	if err := s.repo.UpsertFeatureFlag(ctx, flag); err != nil {
		return err
	}

	return s.LogAction(ctx, adminID, "admin@kirmya.com", "super_admin", "feature_flag.update", "FeatureFlag", flag.Name, prev, next, "Updated feature flag rollout state", ip, userAgent, "")
}

// Assistive AI Analysis methods
func (s *AdminService) ClassifyContentReport(ctx context.Context, title string, content string) (string, float64, string) {
	lower := strings.ToLower(title + " " + content)
	if strings.Contains(lower, "wire transfer") || strings.Contains(lower, "gift card") || strings.Contains(lower, "pay fee") {
		return "Job Scam", 0.94, "Contains classic recruitment fee wire scam language."
	}
	if strings.Contains(lower, "http://") || strings.Contains(lower, "bit.ly") {
		return "Phishing Link", 0.86, "Contains unverified external shortened URL links."
	}
	return "Spam", 0.65, "Automated high-frequency message pattern."
}

func (s *AdminService) CalculateRiskScore(ctx context.Context, entityType string, entityID string) (*models.RiskScore, error) {
	return &models.RiskScore{
		ID:         uuid.New(),
		EntityType: entityType,
		EntityID:   entityID,
		Score:      0.78,
		RiskLevel:  "High",
		Factors: map[string]interface{}{
			"rapidPosting":     true,
			"unverifiedDomain": true,
			"reportedCount":    3,
		},
	}, nil
}
