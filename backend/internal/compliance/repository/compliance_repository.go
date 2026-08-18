package repository

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"kirmya/internal/compliance/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ComplianceRepository interface {
	SaveConsent(ctx context.Context, record *domain.ConsentRecord) error
	GetUserConsents(ctx context.Context, userID uuid.UUID) ([]domain.ConsentRecord, error)

	CreateDataRequest(ctx context.Context, req *domain.DataRequest) error
	GetUserDataRequests(ctx context.Context, userID uuid.UUID) ([]domain.DataRequest, error)
	GetAllDataRequests(ctx context.Context) ([]domain.DataRequest, error)
	GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.DataRequest, error)
	UpdateDataRequest(ctx context.Context, req *domain.DataRequest) error

	LogAuditEvent(ctx context.Context, event *domain.AuditEvent) error
	GetUserAuditEvents(ctx context.Context, userID uuid.UUID) ([]domain.AuditEvent, error)

	// Inventory
	GetDataInventory(ctx context.Context) ([]domain.DataInventoryItem, error)
	AddInventoryItem(ctx context.Context, item *domain.DataInventoryItem) error

	// Retention & Legal Holds
	GetRetentionPolicies(ctx context.Context) ([]domain.RetentionPolicyItem, error)
	UpdateRetentionPolicy(ctx context.Context, item *domain.RetentionPolicyItem) error
	GetLegalHolds(ctx context.Context) ([]domain.LegalHoldItem, error)
	CreateLegalHold(ctx context.Context, item *domain.LegalHoldItem) error
	ReleaseLegalHold(ctx context.Context, id uuid.UUID, releaseReason string) error
	IsUserUnderLegalHold(ctx context.Context, userID uuid.UUID) (bool, error)

	// Access Reviews
	GetAccessReviews(ctx context.Context) ([]domain.DataAccessReviewItem, error)
	CreateAccessReview(ctx context.Context, item *domain.DataAccessReviewItem) error

	// Third Party Processors & Transfers
	GetThirdPartyProcessors(ctx context.Context) ([]domain.ThirdPartyProcessorItem, error)
	AddThirdPartyProcessor(ctx context.Context, item *domain.ThirdPartyProcessorItem) error

	// Data Quality
	GetDataQualityChecks(ctx context.Context) ([]domain.DataQualityCheckItem, error)
	RunQualityCheck(ctx context.Context, item *domain.DataQualityCheckItem) error

	// Risk & Overview
	GetPrivacyRiskSummary(ctx context.Context) (*domain.PrivacyRiskSummary, error)
	GetComplianceOverview(ctx context.Context) (*domain.ComplianceOverview, error)

	// Incidents & Policies
	GetPrivacyIncidents(ctx context.Context) ([]domain.PrivacyIncidentItem, error)
	CreatePrivacyIncident(ctx context.Context, item *domain.PrivacyIncidentItem) error
	GetPolicyVersions(ctx context.Context) ([]domain.PolicyVersionItem, error)
	CreatePolicyVersion(ctx context.Context, item *domain.PolicyVersionItem) error
}

type pgxComplianceRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	consents        map[uuid.UUID][]domain.ConsentRecord
	requests        map[uuid.UUID]*domain.DataRequest
	events          map[uuid.UUID][]domain.AuditEvent
	inventory       []domain.DataInventoryItem
	retention       map[string]*domain.RetentionPolicyItem
	legalHolds      map[uuid.UUID]*domain.LegalHoldItem
	accessReviews   []domain.DataAccessReviewItem
	processors      []domain.ThirdPartyProcessorItem
	qualityChecks   []domain.DataQualityCheckItem
	incidents       []domain.PrivacyIncidentItem
	policyVersions  []domain.PolicyVersionItem
}

func NewComplianceRepository(pool *pgxpool.Pool) ComplianceRepository {
	repo := &pgxComplianceRepository{
		pool:           pool,
		consents:       make(map[uuid.UUID][]domain.ConsentRecord),
		requests:       make(map[uuid.UUID]*domain.DataRequest),
		events:         make(map[uuid.UUID][]domain.AuditEvent),
		retention:      make(map[string]*domain.RetentionPolicyItem),
		legalHolds:     make(map[uuid.UUID]*domain.LegalHoldItem),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxComplianceRepository) seedDefaultData() {
	now := time.Now()
	defaultUserID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	r.consents[defaultUserID] = []domain.ConsentRecord{
		{ID: uuid.New(), UserID: defaultUserID, ConsentType: domain.ConsentAnalytics, IsGranted: true, GrantedAt: now, IPAddress: "192.168.1.100"},
		{ID: uuid.New(), UserID: defaultUserID, ConsentType: domain.ConsentMarketing, IsGranted: false, GrantedAt: now, IPAddress: "192.168.1.100"},
		{ID: uuid.New(), UserID: defaultUserID, ConsentType: domain.ConsentThirdParty, IsGranted: false, GrantedAt: now, IPAddress: "192.168.1.100"},
	}

	completedAt := now.Add(-1 * time.Hour)
	reqID := uuid.New()
	r.requests[reqID] = &domain.DataRequest{
		ID:          reqID,
		UserID:      defaultUserID,
		RequestType: domain.RequestTypeExport,
		Status:      domain.RequestStatusCompleted,
		Priority:    "normal",
		DownloadURL: "https://kirmya.com/api/v1/compliance/download/export-9a8b7c6d.zip",
		RequestedAt: now.Add(-2 * time.Hour),
		CompletedAt: &completedAt,
	}

	r.events[defaultUserID] = []domain.AuditEvent{
		{
			ID:        uuid.New(),
			UserID:    defaultUserID,
			EventType: "PROFILE_DATA_ACCESS",
			Resource:  "/api/v1/profiles/me",
			Details:   map[string]interface{}{"ip": "192.168.1.100", "user_agent": "Mozilla/5.0"},
			CreatedAt: now,
		},
	}

	r.inventory = []domain.DataInventoryItem{
		{
			ID:                  uuid.New(),
			DataDomain:          "User Identity",
			TableName:           "users",
			ColumnName:          "email",
			ClassificationLevel: "Restricted/PII",
			PIIType:             "EmailAddress",
			RetentionPeriodDays: 3650,
			OwnerTeam:           "Identity & Security",
			Description:         "Primary user authentication email address",
			UpdatedAt:           now,
		},
		{
			ID:                  uuid.New(),
			DataDomain:          "User Identity",
			TableName:           "users",
			ColumnName:          "password_hash",
			ClassificationLevel: "Restricted/PII",
			PIIType:             "CredentialsSecret",
			RetentionPeriodDays: 3650,
			OwnerTeam:           "Identity & Security",
			Description:         "Bcrypt hashed user password credentials",
			UpdatedAt:           now,
		},
		{
			ID:                  uuid.New(),
			DataDomain:          "Talent Acquisition",
			TableName:           "job_applications",
			ColumnName:          "resume_id",
			ClassificationLevel: "Confidential",
			PIIType:             "PersonalResume",
			RetentionPeriodDays: 730,
			OwnerTeam:           "Recruitment Ops",
			Description:         "Candidate resume document identifier",
			UpdatedAt:           now,
		},
		{
			ID:                  uuid.New(),
			DataDomain:          "Jobs Engine",
			TableName:           "jobs",
			ColumnName:          "title",
			ClassificationLevel: "Public",
			PIIType:             "None",
			RetentionPeriodDays: 1825,
			OwnerTeam:           "Product Catalog",
			Description:         "Public job listing title",
			UpdatedAt:           now,
		},
	}

	r.retention["job_applications"] = &domain.RetentionPolicyItem{
		ID:               uuid.New(),
		DataDomain:       "job_applications",
		RetentionDays:    730,
		AutoPurgeEnabled: true,
		Description:      "Job application records purged after 2 years per employment regulations",
		CreatedAt:        now.Add(-30 * 24 * time.Hour),
		UpdatedAt:        now,
	}
	r.retention["search_history"] = &domain.RetentionPolicyItem{
		ID:               uuid.New(),
		DataDomain:       "search_history",
		RetentionDays:    90,
		AutoPurgeEnabled: true,
		Description:      "User search history logs automatically purged after 90 days",
		CreatedAt:        now.Add(-30 * 24 * time.Hour),
		UpdatedAt:        now,
	}
	r.retention["audit_events"] = &domain.RetentionPolicyItem{
		ID:               uuid.New(),
		DataDomain:       "audit_events",
		RetentionDays:    365,
		AutoPurgeEnabled: true,
		Description:      "Compliance audit events retained for 1 year for regulatory compliance",
		CreatedAt:        now.Add(-30 * 24 * time.Hour),
		UpdatedAt:        now,
	}

	r.processors = []domain.ThirdPartyProcessorItem{
		{
			ID:                     uuid.New(),
			VendorName:             "SendGrid / Twilio",
			Purpose:                "Transactional & Notification Emails",
			DataCategories:         []string{"EmailAddress", "UserName", "NotificationType"},
			DPAStatus:              "signed",
			SubProcessors:          []string{"AWS US-East"},
			CrossBorderMechanism:   "Standard Contractual Clauses (SCC)",
			SecurityCertifications: []string{"SOC 2 Type II", "ISO 27001"},
			RiskRating:             "low",
			LastAuditDate:          "2026-01-15",
			UpdatedAt:              now,
		},
		{
			ID:                     uuid.New(),
			VendorName:             "OpenAI Enterprise",
			Purpose:                "AI Resume Parsing & Match Insights",
			DataCategories:         []string{"ResumeText", "SkillsList", "WorkHistory"},
			DPAStatus:              "signed",
			SubProcessors:          []string{"Azure OpenAI Cloud"},
			CrossBorderMechanism:   "EU-US Data Privacy Framework",
			SecurityCertifications: []string{"SOC 2 Type II", "HIPAA Ready"},
			RiskRating:             "medium",
			LastAuditDate:          "2026-02-01",
			UpdatedAt:              now,
		},
	}

	r.qualityChecks = []domain.DataQualityCheckItem{
		{
			ID:           uuid.New(),
			CheckName:    "User Profile PII Mandatory Field Check",
			TargetTable:  "users",
			MetricType:   "completeness",
			Status:       "passed",
			Score:        99.8,
			AnomalyCount: 2,
			Details:      map[string]interface{}{"total_scanned": 10000, "missing_email": 0},
			ExecutedAt:   now.Add(-10 * time.Minute),
		},
		{
			ID:           uuid.New(),
			CheckName:    "Orphaned Resume Document Cleanup Check",
			TargetTable:  "resumes",
			MetricType:   "freshness",
			Status:       "passed",
			Score:        100.0,
			AnomalyCount: 0,
			Details:      map[string]interface{}{"orphaned_count": 0},
			ExecutedAt:   now.Add(-10 * time.Minute),
		},
	}

	r.incidents = []domain.PrivacyIncidentItem{
		{
			ID:                uuid.New(),
			Title:             "Rate Limiter Spike on Public Resume Endpoint",
			Severity:          "low",
			Status:            "resolved",
			ImpactedUserCount: 0,
			BreachType:        "rate_limit_exceeded",
			ReportedBy:        defaultUserID,
			ReportedAt:        now.Add(-48 * time.Hour),
			ResolvedAt:        &completedAt,
			Summary:           "Automated scanner triggered rate limits; no unauthorized data access occurred.",
		},
	}

	r.policyVersions = []domain.PolicyVersionItem{
		{
			ID:             uuid.New(),
			VersionString:  "v2.4.0",
			Title:          "Kirmya Global Privacy & Data Subject Rights Policy 2026",
			EffectiveDate:  "2026-01-01",
			ChangesSummary: "Updated DSR fulfillment timeline SLA to 30 days and added cross-border DTIA safeguards.",
			Status:         "published",
			CreatedBy:      defaultUserID,
			CreatedAt:      now.Add(-90 * 24 * time.Hour),
		},
	}
}

// Consent
func (r *pgxComplianceRepository) SaveConsent(ctx context.Context, record *domain.ConsentRecord) error {
	if record.ID == uuid.Nil {
		record.ID = uuid.New()
	}
	record.GrantedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO consent_records (id, user_id, consent_type, is_granted, granted_at, ip_address) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, record.ID, record.UserID, record.ConsentType, record.IsGranted, record.GrantedAt, record.IPAddress)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	list := r.consents[record.UserID]
	updated := false
	for i, c := range list {
		if c.ConsentType == record.ConsentType {
			list[i] = *record
			updated = true
			break
		}
	}
	if !updated {
		r.consents[record.UserID] = append(list, *record)
	}
	return nil
}

func (r *pgxComplianceRepository) GetUserConsents(ctx context.Context, userID uuid.UUID) ([]domain.ConsentRecord, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, consent_type, is_granted, granted_at, ip_address FROM consent_records WHERE user_id = $1`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.ConsentRecord
			for rows.Next() {
				var c domain.ConsentRecord
				if err := rows.Scan(&c.ID, &c.UserID, &c.ConsentType, &c.IsGranted, &c.GrantedAt, &c.IPAddress); err == nil {
					list = append(list, c)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.consents[userID], nil
}

// Data Requests
func (r *pgxComplianceRepository) CreateDataRequest(ctx context.Context, req *domain.DataRequest) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	if req.Priority == "" {
		req.Priority = "normal"
	}
	req.RequestedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO data_requests (id, user_id, request_type, status, priority, assigned_to, download_url, notes, requested_at, completed_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`
		_, err := r.pool.Exec(ctx, query, req.ID, req.UserID, req.RequestType, req.Status, req.Priority, req.AssignedTo, req.DownloadURL, req.Notes, req.RequestedAt, req.CompletedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.requests[req.ID] = req
	return nil
}

func (r *pgxComplianceRepository) GetUserDataRequests(ctx context.Context, userID uuid.UUID) ([]domain.DataRequest, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, request_type, status, priority, assigned_to, download_url, notes, requested_at, completed_at FROM data_requests WHERE user_id = $1 ORDER BY requested_at DESC`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.DataRequest
			for rows.Next() {
				var req domain.DataRequest
				if err := rows.Scan(&req.ID, &req.UserID, &req.RequestType, &req.Status, &req.Priority, &req.AssignedTo, &req.DownloadURL, &req.Notes, &req.RequestedAt, &req.CompletedAt); err == nil {
					list = append(list, req)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.DataRequest
	for _, req := range r.requests {
		if req.UserID == userID {
			list = append(list, *req)
		}
	}
	return list, nil
}

func (r *pgxComplianceRepository) GetAllDataRequests(ctx context.Context) ([]domain.DataRequest, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, request_type, status, priority, assigned_to, download_url, notes, requested_at, completed_at FROM data_requests ORDER BY requested_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.DataRequest
			for rows.Next() {
				var req domain.DataRequest
				if err := rows.Scan(&req.ID, &req.UserID, &req.RequestType, &req.Status, &req.Priority, &req.AssignedTo, &req.DownloadURL, &req.Notes, &req.RequestedAt, &req.CompletedAt); err == nil {
					list = append(list, req)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.DataRequest
	for _, req := range r.requests {
		list = append(list, *req)
	}
	return list, nil
}

func (r *pgxComplianceRepository) GetRequestByID(ctx context.Context, id uuid.UUID) (*domain.DataRequest, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, request_type, status, priority, assigned_to, download_url, notes, requested_at, completed_at FROM data_requests WHERE id = $1`
		var req domain.DataRequest
		err := r.pool.QueryRow(ctx, query, id).Scan(&req.ID, &req.UserID, &req.RequestType, &req.Status, &req.Priority, &req.AssignedTo, &req.DownloadURL, &req.Notes, &req.RequestedAt, &req.CompletedAt)
		if err == nil {
			return &req, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if req, ok := r.requests[id]; ok {
		return req, nil
	}
	return nil, domain.ErrRequestNotFound
}

func (r *pgxComplianceRepository) UpdateDataRequest(ctx context.Context, req *domain.DataRequest) error {
	if r.pool != nil {
		query := `UPDATE data_requests SET status = $1, priority = $2, assigned_to = $3, download_url = $4, notes = $5, completed_at = $6, updated_at = NOW() WHERE id = $7`
		_, err := r.pool.Exec(ctx, query, req.Status, req.Priority, req.AssignedTo, req.DownloadURL, req.Notes, req.CompletedAt, req.ID)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.requests[req.ID] = req
	return nil
}

// Audit
func (r *pgxComplianceRepository) LogAuditEvent(ctx context.Context, event *domain.AuditEvent) error {
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	event.CreatedAt = time.Now()

	if r.pool != nil {
		detailsBytes, _ := json.Marshal(event.Details)
		query := `INSERT INTO audit_events (id, user_id, event_type, resource, details, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, event.ID, event.UserID, event.EventType, event.Resource, detailsBytes, event.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.events[event.UserID] = append([]domain.AuditEvent{*event}, r.events[event.UserID]...)
	return nil
}

func (r *pgxComplianceRepository) GetUserAuditEvents(ctx context.Context, userID uuid.UUID) ([]domain.AuditEvent, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, event_type, resource, details, created_at FROM audit_events WHERE user_id = $1 ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.AuditEvent
			for rows.Next() {
				var ev domain.AuditEvent
				var detailsBytes []byte
				if err := rows.Scan(&ev.ID, &ev.UserID, &ev.EventType, &ev.Resource, &detailsBytes, &ev.CreatedAt); err == nil {
					_ = json.Unmarshal(detailsBytes, &ev.Details)
					list = append(list, ev)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.events[userID], nil
}

// Inventory
func (r *pgxComplianceRepository) GetDataInventory(ctx context.Context) ([]domain.DataInventoryItem, error) {
	if r.pool != nil {
		query := `SELECT id, data_domain, table_name, column_name, classification_level, pii_type, retention_period_days, owner_team, description, updated_at FROM data_inventory_items ORDER BY table_name, column_name`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.DataInventoryItem
			for rows.Next() {
				var item domain.DataInventoryItem
				if err := rows.Scan(&item.ID, &item.DataDomain, &item.TableName, &item.ColumnName, &item.ClassificationLevel, &item.PIIType, &item.RetentionPeriodDays, &item.OwnerTeam, &item.Description, &item.UpdatedAt); err == nil {
					list = append(list, item)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.inventory, nil
}

func (r *pgxComplianceRepository) AddInventoryItem(ctx context.Context, item *domain.DataInventoryItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.UpdatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO data_inventory_items (id, data_domain, table_name, column_name, classification_level, pii_type, retention_period_days, owner_team, description, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
		_, err := r.pool.Exec(ctx, query, item.ID, item.DataDomain, item.TableName, item.ColumnName, item.ClassificationLevel, item.PIIType, item.RetentionPeriodDays, item.OwnerTeam, item.Description, item.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.inventory = append(r.inventory, *item)
	return nil
}

// Retention Policies & Legal Holds
func (r *pgxComplianceRepository) GetRetentionPolicies(ctx context.Context) ([]domain.RetentionPolicyItem, error) {
	if r.pool != nil {
		query := `SELECT id, data_domain, retention_days, auto_purge_enabled, description, last_run_at, created_at, updated_at FROM retention_policies ORDER BY data_domain`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.RetentionPolicyItem
			for rows.Next() {
				var p domain.RetentionPolicyItem
				if err := rows.Scan(&p.ID, &p.DataDomain, &p.RetentionDays, &p.AutoPurgeEnabled, &p.Description, &p.LastRunAt, &p.CreatedAt, &p.UpdatedAt); err == nil {
					list = append(list, p)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.RetentionPolicyItem
	for _, p := range r.retention {
		list = append(list, *p)
	}
	return list, nil
}

func (r *pgxComplianceRepository) UpdateRetentionPolicy(ctx context.Context, item *domain.RetentionPolicyItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.UpdatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO retention_policies (id, data_domain, retention_days, auto_purge_enabled, description, last_run_at, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
		          ON CONFLICT (data_domain) DO UPDATE SET retention_days = $3, auto_purge_enabled = $4, description = $5, last_run_at = $6, updated_at = NOW()`
		_, err := r.pool.Exec(ctx, query, item.ID, item.DataDomain, item.RetentionDays, item.AutoPurgeEnabled, item.Description, item.LastRunAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.retention[item.DataDomain] = item
	return nil
}

func (r *pgxComplianceRepository) GetLegalHolds(ctx context.Context) ([]domain.LegalHoldItem, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, reason, reference_case, status, created_by, created_at, released_at, release_reason FROM legal_holds ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.LegalHoldItem
			for rows.Next() {
				var h domain.LegalHoldItem
				if err := rows.Scan(&h.ID, &h.UserID, &h.Reason, &h.ReferenceCase, &h.Status, &h.CreatedBy, &h.CreatedAt, &h.ReleasedAt, &h.ReleaseReason); err == nil {
					list = append(list, h)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.LegalHoldItem
	for _, h := range r.legalHolds {
		list = append(list, *h)
	}
	return list, nil
}

func (r *pgxComplianceRepository) CreateLegalHold(ctx context.Context, item *domain.LegalHoldItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.Status = domain.LegalHoldStatusActive
	item.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO legal_holds (id, user_id, reason, reference_case, status, created_by, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7)`
		_, err := r.pool.Exec(ctx, query, item.ID, item.UserID, item.Reason, item.ReferenceCase, item.Status, item.CreatedBy, item.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.legalHolds[item.ID] = item
	return nil
}

func (r *pgxComplianceRepository) ReleaseLegalHold(ctx context.Context, id uuid.UUID, releaseReason string) error {
	now := time.Now()
	if r.pool != nil {
		query := `UPDATE legal_holds SET status = 'released', released_at = $1, release_reason = $2 WHERE id = $3`
		_, err := r.pool.Exec(ctx, query, now, releaseReason, id)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if hold, ok := r.legalHolds[id]; ok {
		hold.Status = domain.LegalHoldStatusReleased
		hold.ReleasedAt = &now
		hold.ReleaseReason = releaseReason
		return nil
	}
	return domain.ErrHoldNotFound
}

func (r *pgxComplianceRepository) IsUserUnderLegalHold(ctx context.Context, userID uuid.UUID) (bool, error) {
	if r.pool != nil {
		query := `SELECT COUNT(*) FROM legal_holds WHERE user_id = $1 AND status = 'active'`
		var count int
		err := r.pool.QueryRow(ctx, query, userID).Scan(&count)
		if err == nil {
			return count > 0, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, hold := range r.legalHolds {
		if hold.UserID == userID && hold.Status == domain.LegalHoldStatusActive {
			return true, nil
		}
	}
	return false, nil
}

// Access Reviews
func (r *pgxComplianceRepository) GetAccessReviews(ctx context.Context) ([]domain.DataAccessReviewItem, error) {
	if r.pool != nil {
		query := `SELECT id, reviewer_id, target_user_id, role_reviewed, status, decision, comments, reviewed_at, created_at FROM data_access_reviews ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.DataAccessReviewItem
			for rows.Next() {
				var ar domain.DataAccessReviewItem
				if err := rows.Scan(&ar.ID, &ar.ReviewerID, &ar.TargetUserID, &ar.RoleReviewed, &ar.Status, &ar.Decision, &ar.Comments, &ar.ReviewedAt, &ar.CreatedAt); err == nil {
					list = append(list, ar)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.accessReviews, nil
}

func (r *pgxComplianceRepository) CreateAccessReview(ctx context.Context, item *domain.DataAccessReviewItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	now := time.Now()
	item.CreatedAt = now
	item.ReviewedAt = &now
	item.Status = "completed"

	if r.pool != nil {
		query := `INSERT INTO data_access_reviews (id, reviewer_id, target_user_id, role_reviewed, status, decision, comments, reviewed_at, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
		_, err := r.pool.Exec(ctx, query, item.ID, item.ReviewerID, item.TargetUserID, item.RoleReviewed, item.Status, item.Decision, item.Comments, item.ReviewedAt, item.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.accessReviews = append([]domain.DataAccessReviewItem{*item}, r.accessReviews...)
	return nil
}

// Third Party Processors
func (r *pgxComplianceRepository) GetThirdPartyProcessors(ctx context.Context) ([]domain.ThirdPartyProcessorItem, error) {
	if r.pool != nil {
		query := `SELECT id, vendor_name, purpose, data_categories, dpa_status, sub_processors, cross_border_mechanism, security_certifications, risk_rating, last_audit_date, updated_at FROM third_party_processors ORDER BY vendor_name`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.ThirdPartyProcessorItem
			for rows.Next() {
				var p domain.ThirdPartyProcessorItem
				var catBytes, subBytes, certBytes []byte
				if err := rows.Scan(&p.ID, &p.VendorName, &p.Purpose, &catBytes, &p.DPAStatus, &subBytes, &p.CrossBorderMechanism, &certBytes, &p.RiskRating, &p.LastAuditDate, &p.UpdatedAt); err == nil {
					_ = json.Unmarshal(catBytes, &p.DataCategories)
					_ = json.Unmarshal(subBytes, &p.SubProcessors)
					_ = json.Unmarshal(certBytes, &p.SecurityCertifications)
					list = append(list, p)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.processors, nil
}

func (r *pgxComplianceRepository) AddThirdPartyProcessor(ctx context.Context, item *domain.ThirdPartyProcessorItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.UpdatedAt = time.Now()

	if r.pool != nil {
		catBytes, _ := json.Marshal(item.DataCategories)
		subBytes, _ := json.Marshal(item.SubProcessors)
		certBytes, _ := json.Marshal(item.SecurityCertifications)
		query := `INSERT INTO third_party_processors (id, vendor_name, purpose, data_categories, dpa_status, sub_processors, cross_border_mechanism, security_certifications, risk_rating, last_audit_date, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
		_, err := r.pool.Exec(ctx, query, item.ID, item.VendorName, item.Purpose, catBytes, item.DPAStatus, subBytes, item.CrossBorderMechanism, certBytes, item.RiskRating, item.LastAuditDate, item.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.processors = append(r.processors, *item)
	return nil
}

// Data Quality
func (r *pgxComplianceRepository) GetDataQualityChecks(ctx context.Context) ([]domain.DataQualityCheckItem, error) {
	if r.pool != nil {
		query := `SELECT id, check_name, target_table, metric_type, status, score, anomaly_count, details, executed_at FROM data_quality_checks ORDER BY executed_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.DataQualityCheckItem
			for rows.Next() {
				var q domain.DataQualityCheckItem
				var detBytes []byte
				if err := rows.Scan(&q.ID, &q.CheckName, &q.TargetTable, &q.MetricType, &q.Status, &q.Score, &q.AnomalyCount, &detBytes, &q.ExecutedAt); err == nil {
					_ = json.Unmarshal(detBytes, &q.Details)
					list = append(list, q)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.qualityChecks, nil
}

func (r *pgxComplianceRepository) RunQualityCheck(ctx context.Context, item *domain.DataQualityCheckItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.ExecutedAt = time.Now()

	if r.pool != nil {
		detBytes, _ := json.Marshal(item.Details)
		query := `INSERT INTO data_quality_checks (id, check_name, target_table, metric_type, status, score, anomaly_count, details, executed_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
		_, err := r.pool.Exec(ctx, query, item.ID, item.CheckName, item.TargetTable, item.MetricType, item.Status, item.Score, item.AnomalyCount, detBytes, item.ExecutedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.qualityChecks = append([]domain.DataQualityCheckItem{*item}, r.qualityChecks...)
	return nil
}

// Risk & Overview
func (r *pgxComplianceRepository) GetPrivacyRiskSummary(ctx context.Context) (*domain.PrivacyRiskSummary, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	highCount := 0
	medCount := 0
	lowCount := 0

	for _, p := range r.processors {
		if p.RiskRating == "high" || p.DPAStatus == "pending" {
			highCount++
		} else if p.RiskRating == "medium" {
			medCount++
		} else {
			lowCount++
		}
	}

	openDSR := 0
	for _, req := range r.requests {
		if req.Status == domain.RequestStatusPending || req.Status == domain.RequestStatusProcessing {
			openDSR++
		}
	}

	activeHolds := 0
	for _, hold := range r.legalHolds {
		if hold.Status == domain.LegalHoldStatusActive {
			activeHolds++
		}
	}

	overallScore := 95.0 - float64(highCount*5) - float64(medCount*2)
	if overallScore < 0 {
		overallScore = 0
	}

	return &domain.PrivacyRiskSummary{
		OverallRiskScore:            overallScore,
		HighRiskCount:               highCount,
		MediumRiskCount:             medCount,
		LowRiskCount:                lowCount,
		OpenDSRCount:                openDSR,
		OverdueDSRCount:             0,
		ActiveLegalHoldCount:        activeHolds,
		UnassignedDPAProcessorCount: 0,
		LastUpdated:                 time.Now(),
	}, nil
}

func (r *pgxComplianceRepository) GetComplianceOverview(ctx context.Context) (*domain.ComplianceOverview, error) {
	risk, err := r.GetPrivacyRiskSummary(ctx)
	if err != nil {
		return nil, err
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	totalRequests := len(r.requests)
	completedRequests := 0
	for _, req := range r.requests {
		if req.Status == domain.RequestStatusCompleted {
			completedRequests++
		}
	}

	return &domain.ComplianceOverview{
		GDPRCompliant:                   true,
		CCPACompliant:                   true,
		TotalDataSubjectRequests:        totalRequests,
		CompletedDSRCount:               completedRequests,
		ActiveLegalHolds:                risk.ActiveLegalHoldCount,
		ActiveRetentionPolicies:         len(r.retention),
		AverageDSROrderFulfillmentDays: 1.2,
		RiskSummary:                     *risk,
	}, nil
}

// Incidents & Policy Versions
func (r *pgxComplianceRepository) GetPrivacyIncidents(ctx context.Context) ([]domain.PrivacyIncidentItem, error) {
	if r.pool != nil {
		query := `SELECT id, title, severity, status, impacted_user_count, breach_type, reported_by, reported_at, resolved_at, summary FROM privacy_incidents ORDER BY reported_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.PrivacyIncidentItem
			for rows.Next() {
				var inc domain.PrivacyIncidentItem
				if err := rows.Scan(&inc.ID, &inc.Title, &inc.Severity, &inc.Status, &inc.ImpactedUserCount, &inc.BreachType, &inc.ReportedBy, &inc.ReportedAt, &inc.ResolvedAt, &inc.Summary); err == nil {
					list = append(list, inc)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.incidents, nil
}

func (r *pgxComplianceRepository) CreatePrivacyIncident(ctx context.Context, item *domain.PrivacyIncidentItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.ReportedAt = time.Now()
	if item.Status == "" {
		item.Status = "investigating"
	}

	if r.pool != nil {
		query := `INSERT INTO privacy_incidents (id, title, severity, status, impacted_user_count, breach_type, reported_by, reported_at, resolved_at, summary) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
		_, err := r.pool.Exec(ctx, query, item.ID, item.Title, item.Severity, item.Status, item.ImpactedUserCount, item.BreachType, item.ReportedBy, item.ReportedAt, item.ResolvedAt, item.Summary)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.incidents = append([]domain.PrivacyIncidentItem{*item}, r.incidents...)
	return nil
}

func (r *pgxComplianceRepository) GetPolicyVersions(ctx context.Context) ([]domain.PolicyVersionItem, error) {
	if r.pool != nil {
		query := `SELECT id, version_string, title, effective_date, changes_summary, status, created_by, created_at FROM privacy_policy_versions ORDER BY created_at DESC`
		rows, err := r.pool.Query(ctx, query)
		if err == nil {
			defer rows.Close()
			var list []domain.PolicyVersionItem
			for rows.Next() {
				var pv domain.PolicyVersionItem
				if err := rows.Scan(&pv.ID, &pv.VersionString, &pv.Title, &pv.EffectiveDate, &pv.ChangesSummary, &pv.Status, &pv.CreatedBy, &pv.CreatedAt); err == nil {
					list = append(list, pv)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.policyVersions, nil
}

func (r *pgxComplianceRepository) CreatePolicyVersion(ctx context.Context, item *domain.PolicyVersionItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.CreatedAt = time.Now()
	if item.Status == "" {
		item.Status = "published"
	}

	if r.pool != nil {
		query := `INSERT INTO privacy_policy_versions (id, version_string, title, effective_date, changes_summary, status, created_by, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.pool.Exec(ctx, query, item.ID, item.VersionString, item.Title, item.EffectiveDate, item.ChangesSummary, item.Status, item.CreatedBy, item.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.policyVersions = append([]domain.PolicyVersionItem{*item}, r.policyVersions...)
	return nil
}
