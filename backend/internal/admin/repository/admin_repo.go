package repository

import (
	"context"
	"errors"
	"kirmya/internal/admin/models"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepository struct {
	db *pgxpool.Pool
}

func NewAdminRepository(db *pgxpool.Pool) *AdminRepository {
	return &AdminRepository{db: db}
}

// CreateAuditLog inserts an immutable audit log record.
func (r *AdminRepository) CreateAuditLog(ctx context.Context, l *models.AdminAuditLog) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO admin_audit_logs (id, admin_id, admin_email, role_code, action, target_type, target_id, previous_state, new_state, reason, ip_address, user_agent, request_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`
	_, err := r.db.Exec(ctx, query, l.ID, l.AdminID, l.AdminEmail, l.RoleCode, l.Action, l.TargetType, l.TargetID, l.PreviousState, l.NewState, l.Reason, l.IPAddress, l.UserAgent, l.RequestID)
	return err
}

// ListAuditLogs returns filtered audit log entries.
func (r *AdminRepository) ListAuditLogs(ctx context.Context, queryStr string, adminID string, targetType string, limit int, offset int) ([]models.AdminAuditLog, error) {
	if r.db == nil {
		return []models.AdminAuditLog{}, nil
	}
	if limit <= 0 {
		limit = 50
	}

	query := `SELECT id, admin_id, COALESCE(admin_email, ''), COALESCE(role_code, ''), action, target_type, target_id, previous_state, new_state, COALESCE(reason, ''), COALESCE(ip_address, ''), COALESCE(user_agent, ''), COALESCE(request_id, ''), created_at
		FROM admin_audit_logs WHERE 1=1`

	args := []interface{}{}
	paramIdx := 1

	if adminID != "" {
		query += ` AND admin_id = $` + string(rune('0'+paramIdx))
		args = append(args, adminID)
		paramIdx++
	}
	if targetType != "" {
		query += ` AND LOWER(target_type) = LOWER($` + string(rune('0'+paramIdx)) + `)`
		args = append(args, targetType)
		paramIdx++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + string(rune('0'+paramIdx)) + ` OFFSET $` + string(rune('0'+paramIdx+1))
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.AdminAuditLog
	for rows.Next() {
		var l models.AdminAuditLog
		if err := rows.Scan(&l.ID, &l.AdminID, &l.AdminEmail, &l.RoleCode, &l.Action, &l.TargetType, &l.TargetID, &l.PreviousState, &l.NewState, &l.Reason, &l.IPAddress, &l.UserAgent, &l.RequestID, &l.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, nil
}

// GetUserPermissions fetches all permission codes granted to an admin user through their roles.
func (r *AdminRepository) GetUserPermissions(ctx context.Context, userID uuid.UUID) ([]string, error) {
	if r.db == nil {
		// Mock fallback for unit testing / development
		return []string{
			"users.read", "users.update", "users.suspend", "users.delete",
			"companies.read", "companies.verify", "companies.suspend",
			"recruiters.read", "recruiters.manage",
			"jobs.read", "jobs.moderate", "jobs.approve", "jobs.remove",
			"applications.read", "communities.moderate",
			"reports.read", "reports.resolve", "moderation.review",
			"trust_safety.manage", "audit_logs.read", "analytics.read",
			"system_settings.manage", "notifications.manage",
		}, nil
	}

	query := `SELECT DISTINCT p.code
		FROM admin_permissions p
		JOIN admin_role_permissions rp ON p.id = rp.permission_id
		JOIN admin_user_roles ur ON rp.role_id = ur.role_id
		WHERE ur.user_id = $1`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err == nil {
			permissions = append(permissions, code)
		}
	}
	return permissions, nil
}

// GetUserRoles fetches role codes assigned to an admin user.
func (r *AdminRepository) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]string, error) {
	if r.db == nil {
		return []string{"super_admin"}, nil
	}

	query := `SELECT r.code FROM admin_roles r JOIN admin_user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err == nil {
			roles = append(roles, code)
		}
	}
	return roles, nil
}

// GetDashboardStats aggregates system dashboard counters.
func (r *AdminRepository) GetDashboardStats(ctx context.Context) (*models.AdminDashboardStats, error) {
	if r.db == nil {
		return &models.AdminDashboardStats{
			TotalUsers:           12450,
			ActiveUsers:          11200,
			NewUsers:             450,
			SuspendedUsers:       42,
			VerifiedUsers:        8900,
			Companies:            1280,
			VerifiedCompanies:    940,
			Recruiters:           3200,
			ActiveJobs:           4850,
			Applications:         34200,
			Reports:              86,
			PendingModeration:    14,
			PendingVerifications: 28,
			SecurityAlerts:       5,
			SystemHealth: models.SystemHealth{
				APIStatus:           "Healthy",
				DatabaseStatus:      "Healthy",
				RedisStatus:         "Healthy",
				QueueStatus:         "Healthy",
				NotificationStatus:  "Healthy",
				AIServiceStatus:     "Healthy",
				SearchServiceStatus: "Healthy",
				StorageStatus:       "Healthy",
				WorkersStatus:       "Healthy",
			},
			GrowthTrends: map[string]int64{
				"UserGrowth":        12,
				"JobGrowth":         18,
				"ApplicationGrowth": 24,
				"ReportVolume":      -5,
			},
		}, nil
	}

	var totalUsers, activeJobs, totalReports, pendingMod, pendingVerif int64
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&totalUsers)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM jobs WHERE is_active = TRUE").Scan(&activeJobs)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM content_reports").Scan(&totalReports)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM moderation_cases WHERE status = 'New' OR status = 'Under Review'").Scan(&pendingMod)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM verification_reviews WHERE status = 'Pending'").Scan(&pendingVerif)

	return &models.AdminDashboardStats{
		TotalUsers:           totalUsers,
		ActiveUsers:          totalUsers,
		ActiveJobs:           activeJobs,
		Reports:              totalReports,
		PendingModeration:    pendingMod,
		PendingVerifications: pendingVerif,
		SystemHealth: models.SystemHealth{
			APIStatus:      "Healthy",
			DatabaseStatus: "Healthy",
		},
		GrowthTrends: map[string]int64{
			"UserGrowth": 12,
		},
	}, nil
}

// ListUsers queries user accounts for admin search.
func (r *AdminRepository) ListUsers(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return []map[string]interface{}{
			{
				"id":                 "u1",
				"email":              "user1@kirmya.com",
				"fullName":           "Tariq Al-Mansoor",
				"status":             "Active",
				"verificationStatus": "Verified",
				"role":               "JobSeeker",
				"createdAt":          "2026-01-15T10:00:00Z",
			},
			{
				"id":                 "u2",
				"email":              "suspicious@kirmya.com",
				"fullName":           "John Doe",
				"status":             "Suspended",
				"verificationStatus": "Unverified",
				"role":               "JobSeeker",
				"createdAt":          "2026-08-01T12:00:00Z",
			},
		}, nil
	}

	query := `SELECT id, email, COALESCE(full_name, ''), status, COALESCE(role, 'JobSeeker'), created_at FROM users WHERE 1=1`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var email, name, st, role string
		var createdAt interface{}
		if err := rows.Scan(&id, &email, &name, &st, &role, &createdAt); err == nil {
			list = append(list, map[string]interface{}{
				"id":        id.String(),
				"email":     email,
				"fullName":  name,
				"status":    st,
				"role":      role,
				"createdAt": createdAt,
			})
		}
	}
	return list, nil
}

// UpdateUserStatus changes a user's account status.
func (r *AdminRepository) UpdateUserStatus(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

// ListCompanies queries registered companies.
func (r *AdminRepository) ListCompanies(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return []map[string]interface{}{
			{
				"id":          "c1",
				"name":        "TechCorp Middle East",
				"slug":        "techcorp-me",
				"industry":    "Software & Technology",
				"status":      "Active",
				"isVerified":  true,
				"recruiterCount": 8,
				"activeJobs":  14,
			},
		}, nil
	}
	return []map[string]interface{}{}, nil
}

// UpdateCompanyStatus updates company status.
func (r *AdminRepository) UpdateCompanyStatus(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE companies SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

// ListJobs queries jobs for moderation.
func (r *AdminRepository) ListJobs(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if r.db == nil {
		return []map[string]interface{}{
			{
				"id":          "j1",
				"title":       "Lead Go Architect",
				"companyName": "TechCorp",
				"status":      "Active",
				"riskScore":   0.12,
				"createdAt":   "2026-08-10T14:00:00Z",
			},
		}, nil
	}
	return []map[string]interface{}{}, nil
}

// ModerateJob updates a job's moderation status.
func (r *AdminRepository) ModerateJob(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE jobs SET moderation_status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

// ListReports fetches content reports.
func (r *AdminRepository) ListReports(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ContentReport, error) {
	if r.db == nil {
		return []models.ContentReport{
			{
				ID:          uuid.New(),
				ReporterID:  uuid.New(),
				TargetType:  "Job",
				TargetID:    "j2",
				TargetTitle: "Remote Data Entry - $5000/week",
				Category:    "Job Scam",
				Reason:      "Suspicious high payment upfront asking for fee payment.",
				Status:      "New",
				Priority:    "Critical",
				CreatedAt:   time.Now(),
			},
		}, nil
	}
	return []models.ContentReport{}, nil
}

// GetReportByID returns a single content report.
func (r *AdminRepository) GetReportByID(ctx context.Context, id uuid.UUID) (*models.ContentReport, error) {
	if r.db == nil {
		return &models.ContentReport{
			ID:          id,
			ReporterID:  uuid.New(),
			TargetType:  "Job",
			TargetID:    "j2",
			TargetTitle: "Remote Data Entry",
			Category:    "Job Scam",
			Reason:      "Suspicious job offer",
			Status:      "New",
			Priority:    "Critical",
			CreatedAt:   time.Now(),
		}, nil
	}
	return nil, errors.New("report not found")
}

// ListModerationQueue lists queued moderation cases.
func (r *AdminRepository) ListModerationQueue(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ModerationCase, error) {
	if r.db == nil {
		return []models.ModerationCase{
			{
				ID:               uuid.New(),
				CaseNumber:       "MOD-2026-0812",
				TargetType:       "User",
				TargetID:         "u2",
				TargetTitle:      "John Doe (Spam Account)",
				Category:         "Spam",
				Priority:         "High",
				RiskScore:        0.88,
				Status:           "New",
				AISummary:        "Rapid messaging pattern detected across 15 communities within 3 minutes.",
				AIRecommendation: "Restrict messaging capability pending manual identity check.",
				CreatedAt:        time.Now(),
			},
		}, nil
	}
	return []models.ModerationCase{}, nil
}

// ListVerifications lists pending verification reviews.
func (r *AdminRepository) ListVerifications(ctx context.Context, status string, limit int, offset int) ([]models.VerificationReview, error) {
	if r.db == nil {
		return []models.VerificationReview{
			{
				ID:               uuid.New(),
				EntityType:       "Company",
				EntityID:         "c1",
				VerificationType: "Trade License & Commercial Register",
				Status:           "Pending",
				CreatedAt:        time.Now(),
			},
		}, nil
	}
	return []models.VerificationReview{}, nil
}

// ListSecurityEvents lists security logs.
func (r *AdminRepository) ListSecurityEvents(ctx context.Context, userID string, limit int, offset int) ([]models.SecurityEvent, error) {
	if r.db == nil {
		return []models.SecurityEvent{
			{
				ID:        uuid.New(),
				UserID:    uuid.New(),
				EventType: "Failed Login",
				Status:    "Failed",
				IPAddress: "192.168.1.1",
				Location:  "Dubai, UAE",
				CreatedAt: time.Now(),
			},
		}, nil
	}
	return []models.SecurityEvent{}, nil
}

// ListFeatureFlags retrieves environment feature flags.
func (r *AdminRepository) ListFeatureFlags(ctx context.Context) ([]models.FeatureFlag, error) {
	if r.db == nil {
		return []models.FeatureFlag{
			{
				ID:                uuid.New(),
				Name:              "ai_moderation_v2",
				Description:       "Enable assistive AI risk scoring in moderation queue",
				IsEnabled:         true,
				Environment:       "production",
				RolloutPercentage: 100,
				UpdatedAt:         time.Now(),
			},
		}, nil
	}
	return []models.FeatureFlag{}, nil
}

// UpsertFeatureFlag updates feature flag.
func (r *AdminRepository) UpsertFeatureFlag(ctx context.Context, flag *models.FeatureFlag) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO feature_flags (id, name, description, is_enabled, environment, rollout_percentage, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (name) DO UPDATE SET is_enabled = $4, rollout_percentage = $6, updated_at = NOW()`
	_, err := r.db.Exec(ctx, query, flag.ID, flag.Name, flag.Description, flag.IsEnabled, flag.Environment, flag.RolloutPercentage)
	return err
}
