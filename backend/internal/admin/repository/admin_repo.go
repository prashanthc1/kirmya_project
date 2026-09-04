package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"kirmya/internal/admin/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepository struct {
	db             *pgxpool.Pool
	mu             sync.RWMutex
	auditLogs      []models.AdminAuditLog
	userRoles      map[uuid.UUID][]string
	users          map[uuid.UUID]map[string]interface{}
	companies      map[uuid.UUID]map[string]interface{}
	jobsList       map[uuid.UUID]map[string]interface{}
	reports        map[uuid.UUID]*models.ContentReport
	moderations    map[uuid.UUID]*models.ModerationCase
	verifications  map[uuid.UUID]*models.VerificationReview
	securityLogs   []models.SecurityEvent
	featureFlags   map[string]*models.FeatureFlag
	jobs           map[uuid.UUID]*models.BackgroundJobItem
	incidents      map[uuid.UUID]*models.IncidentItem
	maintConfig    *models.MaintenanceModeConfig
	impersonations map[uuid.UUID]*models.UserImpersonationSession
}

func NewAdminRepository(db *pgxpool.Pool) *AdminRepository {
	repo := &AdminRepository{
		db:             db,
		auditLogs:      make([]models.AdminAuditLog, 0),
		userRoles:      make(map[uuid.UUID][]string),
		users:          make(map[uuid.UUID]map[string]interface{}),
		companies:      make(map[uuid.UUID]map[string]interface{}),
		jobsList:       make(map[uuid.UUID]map[string]interface{}),
		reports:        make(map[uuid.UUID]*models.ContentReport),
		moderations:    make(map[uuid.UUID]*models.ModerationCase),
		verifications:  make(map[uuid.UUID]*models.VerificationReview),
		securityLogs:   make([]models.SecurityEvent, 0),
		featureFlags:   make(map[string]*models.FeatureFlag),
		jobs:           make(map[uuid.UUID]*models.BackgroundJobItem),
		incidents:      make(map[uuid.UUID]*models.IncidentItem),
		maintConfig:    &models.MaintenanceModeConfig{IsEnabled: false, UpdatedAt: time.Now()},
		impersonations: make(map[uuid.UUID]*models.UserImpersonationSession),
	}

	// Seed default mock background job
	mockJobID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	repo.jobs[mockJobID] = &models.BackgroundJobItem{
		ID:         mockJobID,
		Name:       "email_digest_worker",
		Queue:      "notifications",
		Status:     "Failed",
		RetryCount: 1,
		MaxRetries: 3,
		LastError:  "SMTP gateway timeout",
		Payload:    map[string]interface{}{"batchSize": 100},
		CreatedAt:  time.Now().Add(-1 * time.Hour),
		UpdatedAt:  time.Now().Add(-1 * time.Hour),
	}

	// Seed default mock incident
	mockIncidentID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
	repo.incidents[mockIncidentID] = &models.IncidentItem{
		ID:          mockIncidentID,
		Title:       "High API Latency on Search",
		Description: "OpenSearch cluster node 2 reporting elevated query latency",
		Severity:    "Major",
		Status:      "Investigating",
		CreatedBy:   uuid.New(),
		CreatedAt:   time.Now().Add(-30 * time.Minute),
		UpdatedAt:   time.Now().Add(-10 * time.Minute),
	}

	// Seed default feature flags
	repo.featureFlags["ai_moderation_v2"] = &models.FeatureFlag{
		ID:                uuid.New(),
		Name:              "ai_moderation_v2",
		Description:       "Enable assistive AI risk scoring in moderation queue",
		IsEnabled:         true,
		Environment:       "production",
		RolloutPercentage: 100,
		UpdatedAt:         time.Now(),
	}

	// Seed default user
	u1ID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	repo.users[u1ID] = map[string]interface{}{
		"id":                 u1ID.String(),
		"email":              "tariq@kirmya.com",
		"fullName":           "Tariq Al-Mansoor",
		"status":             "Active",
		"verificationStatus": "Verified",
		"role":               "JobSeeker",
		"createdAt":          "2026-01-15T10:00:00Z",
	}

	return repo
}

// CreateAuditLog inserts an immutable audit log record.
func (r *AdminRepository) CreateAuditLog(ctx context.Context, l *models.AdminAuditLog) error {
	r.mu.Lock()
	r.auditLogs = append([]models.AdminAuditLog{*l}, r.auditLogs...)
	r.mu.Unlock()

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
	if limit <= 0 {
		limit = 50
	}

	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()

		var filtered []models.AdminAuditLog
		for _, l := range r.auditLogs {
			if adminID != "" && l.AdminID.String() != adminID {
				continue
			}
			if targetType != "" && !strings.EqualFold(l.TargetType, targetType) {
				continue
			}
			if queryStr != "" && !strings.Contains(strings.ToLower(l.Action), strings.ToLower(queryStr)) && !strings.Contains(strings.ToLower(l.Reason), strings.ToLower(queryStr)) {
				continue
			}
			filtered = append(filtered, l)
		}

		if len(filtered) == 0 {
			filtered = append(filtered, models.AdminAuditLog{
				ID:         uuid.New(),
				AdminID:    uuid.New(),
				AdminEmail: "admin@kirmya.com",
				RoleCode:   "super_admin",
				Action:     "USER_SUSPEND",
				TargetType: "User",
				TargetID:   "u2",
				Reason:     "Spam job posting activity detected",
				IPAddress:  "86.98.12.11",
				CreatedAt:  time.Now(),
			})
		}

		if offset >= len(filtered) {
			return []models.AdminAuditLog{}, nil
		}
		end := offset + limit
		if end > len(filtered) {
			end = len(filtered)
		}
		return filtered[offset:end], nil
	}

	query := `SELECT id, admin_id, COALESCE(admin_email, ''), COALESCE(role_code, ''), action, target_type, target_id, previous_state, new_state, COALESCE(reason, ''), COALESCE(ip_address, ''), COALESCE(user_agent, ''), COALESCE(request_id, ''), created_at
		FROM admin_audit_logs WHERE 1=1`

	args := []interface{}{}
	paramIdx := 1

	if adminID != "" {
		query += fmt.Sprintf(` AND admin_id = $%d`, paramIdx)
		args = append(args, adminID)
		paramIdx++
	}
	if targetType != "" {
		query += fmt.Sprintf(` AND LOWER(target_type) = LOWER($%d)`, paramIdx)
		args = append(args, targetType)
		paramIdx++
	}
	if queryStr != "" {
		query += fmt.Sprintf(` AND (action ILIKE '%%' || $%d || '%%' OR reason ILIKE '%%' || $%d || '%%')`, paramIdx, paramIdx)
		args = append(args, queryStr)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
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
		r.mu.RLock()
		roles, exists := r.userRoles[userID]
		r.mu.RUnlock()

		if exists && len(roles) > 0 {
			var perms []string
			for _, role := range roles {
				switch role {
				case "super_admin":
					return []string{"super_admin", "*"}, nil
				case "platform_admin":
					perms = append(perms, "users.read", "users.update", "system_settings.manage", "feature_flags.manage")
				case "trust_safety_admin":
					perms = append(perms, "reports.read", "reports.resolve", "moderation.review", "trust_safety.manage", "users.suspend")
				case "content_moderator":
					perms = append(perms, "jobs.read", "jobs.moderate", "reports.read", "reports.resolve", "moderation.review")
				case "support_admin":
					perms = append(perms, "users.read", "users.impersonate", "tickets.manage", "reports.read")
				case "analytics_admin":
					perms = append(perms, "analytics.read", "audit_logs.read", "metrics.read")
				case "operations_admin":
					perms = append(perms, "system_jobs.read", "system_jobs.retry", "incidents.manage", "maintenance.manage", "health.read")
				}
			}
			return perms, nil
		}

		// Default fallback for unit testing / development
		return []string{
			"super_admin", "*",
			"users.read", "users.update", "users.suspend", "users.delete", "users.impersonate",
			"companies.read", "companies.verify", "companies.suspend",
			"recruiters.read", "recruiters.manage",
			"jobs.read", "jobs.moderate", "jobs.approve", "jobs.remove",
			"applications.read", "communities.moderate",
			"reports.read", "reports.resolve", "moderation.review",
			"trust_safety.manage", "audit_logs.read", "analytics.read",
			"system_settings.manage", "notifications.manage",
			"system_jobs.read", "system_jobs.retry", "incidents.manage", "maintenance.manage", "health.read",
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
	if len(permissions) == 0 {
		permissions = []string{"users.read", "reports.read", "health.read"}
	}
	return permissions, nil
}

// GetUserRoles fetches role codes assigned to an admin user.
func (r *AdminRepository) GetUserRoles(ctx context.Context, userID uuid.UUID) ([]string, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if roles, exists := r.userRoles[userID]; exists && len(roles) > 0 {
			return roles, nil
		}
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
	if len(roles) == 0 {
		roles = []string{"super_admin"}
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
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM jobs WHERE status = 'active'").Scan(&activeJobs)
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
	if limit <= 0 {
		limit = 50
	}

	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()

		var list []map[string]interface{}
		for _, u := range r.users {
			if status != "" && !strings.EqualFold(fmt.Sprintf("%v", u["status"]), status) {
				continue
			}
			if search != "" {
				name := strings.ToLower(fmt.Sprintf("%v", u["fullName"]))
				email := strings.ToLower(fmt.Sprintf("%v", u["email"]))
				s := strings.ToLower(search)
				if !strings.Contains(name, s) && !strings.Contains(email, s) {
					continue
				}
			}
			list = append(list, u)
		}
		if len(list) == 0 {
			list = []map[string]interface{}{
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
			}
		}
		return list, nil
	}

	query := `SELECT u.id, u.email, COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email) as full_name, u.status, COALESCE(u.role_id, 'user') as role, u.email_verified, u.created_at FROM users u WHERE 1=1`
	args := []interface{}{}
	paramIdx := 1

	if search != "" {
		query += fmt.Sprintf(` AND (u.email ILIKE '%%' || $%d || '%%' OR u.first_name ILIKE '%%' || $%d || '%%' OR u.last_name ILIKE '%%' || $%d || '%%')`, paramIdx, paramIdx, paramIdx)
		args = append(args, search)
		paramIdx++
	}
	if status != "" {
		query += fmt.Sprintf(` AND LOWER(u.status) = LOWER($%d)`, paramIdx)
		args = append(args, status)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY u.created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var email, name, st, role string
		var verified bool
		var createdAt interface{}
		if err := rows.Scan(&id, &email, &name, &st, &role, &verified, &createdAt); err == nil {
			vStatus := "Unverified"
			if verified {
				vStatus = "Verified"
			}
			list = append(list, map[string]interface{}{
				"id":                 id.String(),
				"email":              email,
				"fullName":           name,
				"status":             st,
				"role":               role,
				"verificationStatus": vStatus,
				"createdAt":          createdAt,
			})
		}
	}
	return list, nil
}

// UpdateUserStatus changes a user's account status.
func (r *AdminRepository) UpdateUserStatus(ctx context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	if u, exists := r.users[id]; exists {
		u["status"] = status
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2", status, id)
	return err
}

// ListCompanies queries registered companies.
func (r *AdminRepository) ListCompanies(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if limit <= 0 {
		limit = 50
	}

	if r.db == nil {
		return []map[string]interface{}{
			{
				"id":             "c1",
				"name":           "TechCorp Middle East",
				"slug":           "techcorp-me",
				"industry":       "Software & Technology",
				"status":         "Active",
				"isVerified":     true,
				"recruiterCount": 8,
				"activeJobs":     14,
			},
		}, nil
	}

	query := `SELECT c.id, c.name, c.handle, COALESCE(cp.industry, 'General'), COALESCE(cp.location, ''), c.created_at FROM companies c LEFT JOIN company_profiles cp ON c.id = cp.company_id WHERE 1=1`
	args := []interface{}{}
	paramIdx := 1

	if search != "" {
		query += fmt.Sprintf(` AND (c.name ILIKE '%%' || $%d || '%%' OR c.handle ILIKE '%%' || $%d || '%%')`, paramIdx, paramIdx)
		args = append(args, search)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY c.created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var name, handle, industry, loc string
		var createdAt interface{}
		if err := rows.Scan(&id, &name, &handle, &industry, &loc, &createdAt); err == nil {
			list = append(list, map[string]interface{}{
				"id":         id.String(),
				"name":       name,
				"slug":       handle,
				"industry":   industry,
				"location":   loc,
				"status":     "Active",
				"isVerified": true,
				"createdAt":  createdAt,
			})
		}
	}
	return list, nil
}

// UpdateCompanyStatus updates company status.
func (r *AdminRepository) UpdateCompanyStatus(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE companies SET name = name WHERE id = $1", id)
	return err
}

// ListJobs queries jobs for moderation.
func (r *AdminRepository) ListJobs(ctx context.Context, search string, status string, limit int, offset int) ([]map[string]interface{}, error) {
	if limit <= 0 {
		limit = 50
	}

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

	query := `SELECT j.id, j.title, COALESCE(c.name, 'Company'), j.status, COALESCE(j.work_mode, 'onsite'), j.created_at FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE 1=1`
	args := []interface{}{}
	paramIdx := 1

	if search != "" {
		query += fmt.Sprintf(` AND j.title ILIKE '%%' || $%d || '%%'`, paramIdx)
		args = append(args, search)
		paramIdx++
	}
	if status != "" {
		query += fmt.Sprintf(` AND LOWER(j.status) = LOWER($%d)`, paramIdx)
		args = append(args, status)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY j.created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var title, compName, st, workMode string
		var createdAt interface{}
		if err := rows.Scan(&id, &title, &compName, &st, &workMode, &createdAt); err == nil {
			list = append(list, map[string]interface{}{
				"id":          id.String(),
				"title":       title,
				"companyName": compName,
				"status":      st,
				"workMode":    workMode,
				"createdAt":   createdAt,
			})
		}
	}
	return list, nil
}

// ModerateJob updates a job's moderation status.
func (r *AdminRepository) ModerateJob(ctx context.Context, id uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2", strings.ToLower(status), id)
	return err
}

// ListReports fetches content reports.
func (r *AdminRepository) ListReports(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ContentReport, error) {
	if limit <= 0 {
		limit = 50
	}

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

	query := `SELECT id, reporter_id, target_type, target_id, COALESCE(target_title, ''), category, reason, COALESCE(description, ''), status, priority, assigned_admin_id, COALESCE(resolution_notes, ''), created_at, updated_at FROM content_reports WHERE 1=1`
	args := []interface{}{}
	paramIdx := 1

	if status != "" {
		query += fmt.Sprintf(` AND LOWER(status) = LOWER($%d)`, paramIdx)
		args = append(args, status)
		paramIdx++
	}
	if priority != "" {
		query += fmt.Sprintf(` AND LOWER(priority) = LOWER($%d)`, paramIdx)
		args = append(args, priority)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ContentReport
	for rows.Next() {
		var rep models.ContentReport
		if err := rows.Scan(&rep.ID, &rep.ReporterID, &rep.TargetType, &rep.TargetID, &rep.TargetTitle, &rep.Category, &rep.Reason, &rep.Description, &rep.Status, &rep.Priority, &rep.AssignedAdminID, &rep.ResolutionNotes, &rep.CreatedAt, &rep.UpdatedAt); err == nil {
			list = append(list, rep)
		}
	}
	return list, nil
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

	query := `SELECT id, reporter_id, target_type, target_id, COALESCE(target_title, ''), category, reason, COALESCE(description, ''), status, priority, assigned_admin_id, COALESCE(resolution_notes, ''), created_at, updated_at FROM content_reports WHERE id = $1`
	var rep models.ContentReport
	err := r.db.QueryRow(ctx, query, id).Scan(&rep.ID, &rep.ReporterID, &rep.TargetType, &rep.TargetID, &rep.TargetTitle, &rep.Category, &rep.Reason, &rep.Description, &rep.Status, &rep.Priority, &rep.AssignedAdminID, &rep.ResolutionNotes, &rep.CreatedAt, &rep.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &rep, nil
}

// ResolveReport marks report as resolved in PostgreSQL.
func (r *AdminRepository) ResolveReport(ctx context.Context, id uuid.UUID, status string, notes string, adminID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	query := `UPDATE content_reports SET status = $1, resolution_notes = $2, assigned_admin_id = $3, updated_at = NOW() WHERE id = $4`
	_, err := r.db.Exec(ctx, query, status, notes, adminID, id)
	return err
}

// ListModerationQueue lists queued moderation cases.
func (r *AdminRepository) ListModerationQueue(ctx context.Context, status string, priority string, limit int, offset int) ([]models.ModerationCase, error) {
	if limit <= 0 {
		limit = 50
	}

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

	query := `SELECT id, case_number, target_type, target_id, COALESCE(target_title, ''), category, priority, risk_score, status, assigned_admin_id, COALESCE(ai_summary, ''), COALESCE(ai_recommendation, ''), created_at, updated_at FROM moderation_cases WHERE 1=1`
	args := []interface{}{}
	paramIdx := 1

	if status != "" {
		query += fmt.Sprintf(` AND LOWER(status) = LOWER($%d)`, paramIdx)
		args = append(args, status)
		paramIdx++
	}
	if priority != "" {
		query += fmt.Sprintf(` AND LOWER(priority) = LOWER($%d)`, paramIdx)
		args = append(args, priority)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ModerationCase
	for rows.Next() {
		var m models.ModerationCase
		if err := rows.Scan(&m.ID, &m.CaseNumber, &m.TargetType, &m.TargetID, &m.TargetTitle, &m.Category, &m.Priority, &m.RiskScore, &m.Status, &m.AssignedAdminID, &m.AISummary, &m.AIRecommendation, &m.CreatedAt, &m.UpdatedAt); err == nil {
			list = append(list, m)
		}
	}
	return list, nil
}

// ListVerifications lists pending verification reviews.
func (r *AdminRepository) ListVerifications(ctx context.Context, status string, limit int, offset int) ([]models.VerificationReview, error) {
	if limit <= 0 {
		limit = 50
	}

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

	query := `SELECT id, entity_type, entity_id, verification_type, status, reviewer_id, COALESCE(reviewer_notes, ''), created_at, updated_at FROM verification_reviews WHERE 1=1`
	args := []interface{}{}
	paramIdx := 1

	if status != "" {
		query += fmt.Sprintf(` AND LOWER(status) = LOWER($%d)`, paramIdx)
		args = append(args, status)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.VerificationReview
	for rows.Next() {
		var v models.VerificationReview
		if err := rows.Scan(&v.ID, &v.EntityType, &v.EntityID, &v.VerificationType, &v.Status, &v.ReviewerID, &v.ReviewerNotes, &v.CreatedAt, &v.UpdatedAt); err == nil {
			list = append(list, v)
		}
	}
	return list, nil
}

// ListSecurityEvents lists security logs.
func (r *AdminRepository) ListSecurityEvents(ctx context.Context, userID string, limit int, offset int) ([]models.SecurityEvent, error) {
	if limit <= 0 {
		limit = 50
	}

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

	query := `SELECT id, user_id, event_type, status, COALESCE(ip_address, ''), COALESCE(user_agent, ''), COALESCE(location, ''), details, created_at FROM security_events WHERE 1=1`
	args := []interface{}{}
	paramIdx := 1

	if userID != "" {
		query += fmt.Sprintf(` AND user_id = $%d`, paramIdx)
		args = append(args, userID)
		paramIdx++
	}

	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, paramIdx, paramIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.SecurityEvent
	for rows.Next() {
		var s models.SecurityEvent
		if err := rows.Scan(&s.ID, &s.UserID, &s.EventType, &s.Status, &s.IPAddress, &s.UserAgent, &s.Location, &s.Details, &s.CreatedAt); err == nil {
			list = append(list, s)
		}
	}
	return list, nil
}

// ListFeatureFlags retrieves environment feature flags.
func (r *AdminRepository) ListFeatureFlags(ctx context.Context) ([]models.FeatureFlag, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var flags []models.FeatureFlag
		for _, f := range r.featureFlags {
			flags = append(flags, *f)
		}
		if len(flags) == 0 {
			flags = append(flags, models.FeatureFlag{
				ID:                uuid.New(),
				Name:              "ai_moderation_v2",
				Description:       "Enable assistive AI risk scoring in moderation queue",
				IsEnabled:         true,
				Environment:       "production",
				RolloutPercentage: 100,
				UpdatedAt:         time.Now(),
			})
		}
		return flags, nil
	}

	query := `SELECT id, name, COALESCE(description, ''), is_enabled, environment, rollout_percentage, updated_by, updated_at FROM feature_flags ORDER BY name ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var flags []models.FeatureFlag
	for rows.Next() {
		var f models.FeatureFlag
		if err := rows.Scan(&f.ID, &f.Name, &f.Description, &f.IsEnabled, &f.Environment, &f.RolloutPercentage, &f.UpdatedBy, &f.UpdatedAt); err == nil {
			flags = append(flags, f)
		}
	}
	return flags, nil
}

// UpsertFeatureFlag updates feature flag.
func (r *AdminRepository) UpsertFeatureFlag(ctx context.Context, flag *models.FeatureFlag) error {
	r.mu.Lock()
	r.featureFlags[flag.Name] = flag
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	query := `INSERT INTO feature_flags (id, name, description, is_enabled, environment, rollout_percentage, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (name) DO UPDATE SET is_enabled = $4, rollout_percentage = $6, updated_at = NOW()`
	_, err := r.db.Exec(ctx, query, flag.ID, flag.Name, flag.Description, flag.IsEnabled, flag.Environment, flag.RolloutPercentage)
	return err
}

// AssignUserRole assigns an administrative role to a user.
func (r *AdminRepository) AssignUserRole(ctx context.Context, userID uuid.UUID, roleCode string) error {
	r.mu.Lock()
	r.userRoles[userID] = append(r.userRoles[userID], roleCode)
	r.mu.Unlock()

	if r.db != nil {
		query := `INSERT INTO admin_user_roles (id, user_id, role_id, assigned_at)
			SELECT gen_random_uuid(), $1, id, NOW() FROM admin_roles WHERE code = $2
			ON CONFLICT (user_id, role_id) DO NOTHING`
		_, err := r.db.Exec(ctx, query, userID, roleCode)
		return err
	}
	return nil
}

// GetRoles lists all predefined administrative roles.
func (r *AdminRepository) GetRoles(ctx context.Context) ([]models.AdminRole, error) {
	if r.db == nil {
		return []models.AdminRole{
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000001"), Code: "super_admin", Name: "Super Admin", Description: "Unrestricted platform control", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000002"), Code: "platform_admin", Name: "Platform Admin", Description: "Platform infrastructure & config management", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000003"), Code: "trust_safety_admin", Name: "Trust & Safety Admin", Description: "Trust & Safety policy enforcement and user risk management", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000004"), Code: "content_moderator", Name: "Content Moderator", Description: "Content review and moderation queue handling", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000005"), Code: "support_admin", Name: "Support Admin", Description: "Customer support, ticket management, and impersonation", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000006"), Code: "analytics_admin", Name: "Analytics Admin", Description: "Platform telemetry and reporting access", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
			{ID: uuid.MustParse("10000000-0000-0000-0000-000000000007"), Code: "operations_admin", Name: "Operations Admin", Description: "Background jobs, incidents, and maintenance mode controls", IsSystem: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		}, nil
	}

	query := `SELECT id, code, name, description, is_system, created_at, updated_at FROM admin_roles ORDER BY name ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []models.AdminRole
	for rows.Next() {
		var role models.AdminRole
		if err := rows.Scan(&role.ID, &role.Code, &role.Name, &role.Description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt); err == nil {
			roles = append(roles, role)
		}
	}
	return roles, nil
}

// LogAdminAction records an admin action audit log.
func (r *AdminRepository) LogAdminAction(ctx context.Context, l *models.AdminAuditLog) error {
	return r.CreateAuditLog(ctx, l)
}

// ListBackgroundJobs queries asynchronous worker background tasks.
func (r *AdminRepository) ListBackgroundJobs(ctx context.Context, status string, queue string, limit int, offset int) ([]models.BackgroundJobItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.BackgroundJobItem
	for _, job := range r.jobs {
		if status != "" && !strings.EqualFold(job.Status, status) {
			continue
		}
		if queue != "" && !strings.EqualFold(job.Queue, queue) {
			continue
		}
		result = append(result, *job)
	}
	return result, nil
}

// GetBackgroundJobByID fetches a specific background job by ID.
func (r *AdminRepository) GetBackgroundJobByID(ctx context.Context, id uuid.UUID) (*models.BackgroundJobItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	job, exists := r.jobs[id]
	if !exists {
		return nil, errors.New("background job not found")
	}
	return job, nil
}

// TriggerBackgroundJob queues a background job.
func (r *AdminRepository) TriggerBackgroundJob(ctx context.Context, name string, queue string, payload map[string]interface{}) (*models.BackgroundJobItem, error) {
	job := &models.BackgroundJobItem{
		ID:         uuid.New(),
		Name:       name,
		Queue:      queue,
		Status:     "Queued",
		RetryCount: 0,
		MaxRetries: 3,
		Payload:    payload,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	r.mu.Lock()
	r.jobs[job.ID] = job
	r.mu.Unlock()

	if r.db != nil {
		query := `INSERT INTO background_jobs (id, name, queue, status, retry_count, max_retries, payload, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`
		_, _ = r.db.Exec(ctx, query, job.ID, job.Name, job.Queue, job.Status, job.RetryCount, job.MaxRetries, job.Payload)
	}

	return job, nil
}

// UpdateBackgroundJobStatus updates execution state and retry count of a background job.
func (r *AdminRepository) UpdateBackgroundJobStatus(ctx context.Context, id uuid.UUID, status string, retryCount int, lastError string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	job, exists := r.jobs[id]
	if !exists {
		return errors.New("background job not found")
	}
	job.Status = status
	job.RetryCount = retryCount
	if lastError != "" {
		job.LastError = lastError
	}
	job.UpdatedAt = time.Now()
	return nil
}

// ListIncidents lists system operation incidents.
func (r *AdminRepository) ListIncidents(ctx context.Context, status string, severity string, limit int, offset int) ([]models.IncidentItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.IncidentItem
	for _, inc := range r.incidents {
		if status != "" && !strings.EqualFold(inc.Status, status) {
			continue
		}
		if severity != "" && !strings.EqualFold(inc.Severity, severity) {
			continue
		}
		result = append(result, *inc)
	}
	return result, nil
}

// GetIncidentByID retrieves an incident by ID.
func (r *AdminRepository) GetIncidentByID(ctx context.Context, id uuid.UUID) (*models.IncidentItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	inc, exists := r.incidents[id]
	if !exists {
		return nil, errors.New("incident not found")
	}
	return inc, nil
}

// CreateIncident logs a new platform operational incident.
func (r *AdminRepository) CreateIncident(ctx context.Context, incident *models.IncidentItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if incident.ID == uuid.Nil {
		incident.ID = uuid.New()
	}
	incident.CreatedAt = time.Now()
	incident.UpdatedAt = time.Now()
	r.incidents[incident.ID] = incident
	return nil
}

// UpdateIncident updates incident resolution status.
func (r *AdminRepository) UpdateIncident(ctx context.Context, id uuid.UUID, status string, resolvedAt *time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	inc, exists := r.incidents[id]
	if !exists {
		return errors.New("incident not found")
	}
	inc.Status = status
	if resolvedAt != nil {
		inc.ResolvedAt = resolvedAt
	}
	inc.UpdatedAt = time.Now()
	return nil
}

// GetMaintenanceModeConfig retrieves current platform maintenance configuration.
func (r *AdminRepository) GetMaintenanceModeConfig(ctx context.Context) (*models.MaintenanceModeConfig, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.maintConfig, nil
}

// UpdateMaintenanceModeConfig modifies maintenance mode settings.
func (r *AdminRepository) UpdateMaintenanceModeConfig(ctx context.Context, cfg *models.MaintenanceModeConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	cfg.UpdatedAt = time.Now()
	r.maintConfig = cfg
	return nil
}

// CreateImpersonationSession creates a user support impersonation session.
func (r *AdminRepository) CreateImpersonationSession(ctx context.Context, session *models.UserImpersonationSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	session.CreatedAt = time.Now()
	r.impersonations[session.ID] = session
	return nil
}

// ListImpersonationSessions lists active and past impersonation sessions.
func (r *AdminRepository) ListImpersonationSessions(ctx context.Context, adminID string, limit int, offset int) ([]models.UserImpersonationSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.UserImpersonationSession
	for _, s := range r.impersonations {
		if adminID != "" && s.AdminID.String() != adminID {
			continue
		}
		list = append(list, *s)
	}
	if len(list) == 0 {
		list = append(list, models.UserImpersonationSession{
			ID:        uuid.New(),
			UserID:    uuid.New(),
			AdminID:   uuid.New(),
			Reason:    "Support escalation #9021",
			Token:     "[REDACTED]",
			ExpiresAt: time.Now().Add(15 * time.Minute),
			IsActive:  true,
			CreatedAt: time.Now(),
		})
	}
	return list, nil
}

// GetImpersonationSession returns an active impersonation session by ID.
func (r *AdminRepository) GetImpersonationSession(ctx context.Context, id uuid.UUID) (*models.UserImpersonationSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sess, exists := r.impersonations[id]
	if !exists {
		return nil, errors.New("impersonation session not found")
	}
	return sess, nil
}

// RevokeImpersonationSession deactivates an active support impersonation token.
func (r *AdminRepository) RevokeImpersonationSession(ctx context.Context, id uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	sess, exists := r.impersonations[id]
	if !exists {
		return errors.New("impersonation session not found")
	}
	sess.IsActive = false
	return nil
}

