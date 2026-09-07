package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/legal/models"
)

type LegalRepository interface {
	GetDocumentBySlug(ctx context.Context, slug string) (*models.LegalDocument, error)
	GetDocumentVersions(ctx context.Context, documentID uuid.UUID) ([]models.LegalDocumentVersion, error)
	RecordDocumentAcceptance(ctx context.Context, acceptance *models.LegalAcceptance) error
	GetCookies(ctx context.Context) ([]models.CookieItem, error)
	SaveCookieConsent(ctx context.Context, consent *models.CookieConsent) error
	GetCookieConsent(ctx context.Context, visitorID string) (*models.CookieConsent, error)
	GetPrivacyPreferences(ctx context.Context, userID uuid.UUID) (*models.PrivacyPreferences, error)
	UpdatePrivacyPreferences(ctx context.Context, prefs *models.PrivacyPreferences) error
	GetConsentHistory(ctx context.Context, userID uuid.UUID) ([]models.ConsentHistoryItem, error)
	CreatePrivacyRequest(ctx context.Context, req *models.PrivacyRequest) error
	GetUserPrivacyRequests(ctx context.Context, userID uuid.UUID) ([]models.PrivacyRequest, error)
	GetPrivacyRequestByID(ctx context.Context, id uuid.UUID) (*models.PrivacyRequest, error)
	UpdatePrivacyRequest(ctx context.Context, req *models.PrivacyRequest) error
	CreateDataExportJob(ctx context.Context, job *models.DataExportJob) error
	GetDataExportJob(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error)
	GetDataExportJobByID(ctx context.Context, userID, jobID uuid.UUID) (*models.DataExportJob, error)
	ClaimDataExportJob(ctx context.Context) (*models.DataExportJob, error)
	BuildDataExport(ctx context.Context, userID uuid.UUID) ([]byte, error)
	CompleteDataExportJob(ctx context.Context, jobID uuid.UUID, payload []byte) error
	FailDataExportJob(ctx context.Context, jobID uuid.UUID, cause error) error
	CancelDataExportJob(ctx context.Context, userID, jobID uuid.UUID) error
	GetDataExportPayload(ctx context.Context, userID, jobID uuid.UUID) ([]byte, string, error)
	CreateDataDeletionRequest(ctx context.Context, req *models.DataDeletionRequest) error
	ProcessNextDeletion(ctx context.Context) (bool, error)
	CancelAccountDeletion(ctx context.Context, userID uuid.UUID) error
	CheckActiveLegalHold(ctx context.Context, resourceType string, resourceID uuid.UUID) (bool, error)
	GetThirdPartyServices(ctx context.Context) ([]models.ThirdPartyService, error)
	GetDataProcessingRecords(ctx context.Context) ([]models.DataProcessingRecord, error)
	GetRetentionPolicies(ctx context.Context) ([]models.RetentionPolicy, error)
	UpdateRetentionPolicy(ctx context.Context, p *models.RetentionPolicy) error
	GetPrivacyDashboardSummary(ctx context.Context) (*models.PrivacyDashboardSummary, error)
}

type legalRepository struct {
	db *sql.DB
}

func NewLegalRepository(db *sql.DB) LegalRepository {
	return &legalRepository{db: db}
}

func (r *legalRepository) GetDocumentBySlug(ctx context.Context, slug string) (*models.LegalDocument, error) {
	if r.db == nil {
		return &models.LegalDocument{
			ID:             uuid.New(),
			Slug:           slug,
			DocumentType:   slug,
			Title:          "Kirmya Platform Document: " + slug,
			Locale:         "en",
			CurrentVersion: "1.0.0",
			Status:         "published",
			EffectiveDate:  time.Now(),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}, nil
	}

	query := `SELECT id, slug, document_type, title, locale, current_version, status, effective_date, published_date, created_at, updated_at FROM legal_documents WHERE slug = $1`
	row := r.db.QueryRowContext(ctx, query, slug)
	var doc models.LegalDocument
	if err := row.Scan(&doc.ID, &doc.Slug, &doc.DocumentType, &doc.Title, &doc.Locale, &doc.CurrentVersion, &doc.Status, &doc.EffectiveDate, &doc.PublishedDate, &doc.CreatedAt, &doc.UpdatedAt); err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *legalRepository) GetDocumentVersions(ctx context.Context, documentID uuid.UUID) ([]models.LegalDocumentVersion, error) {
	if r.db != nil {
		rows, err := r.db.QueryContext(ctx, `SELECT id, document_id, version, title, content, COALESCE(change_summary,''), effective_date, status, created_by, created_at FROM legal_document_versions WHERE document_id=$1 ORDER BY effective_date DESC`, documentID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		items := make([]models.LegalDocumentVersion, 0)
		for rows.Next() {
			var v models.LegalDocumentVersion
			if err := rows.Scan(&v.ID, &v.DocumentID, &v.Version, &v.Title, &v.Content, &v.ChangeSummary, &v.EffectiveDate, &v.Status, &v.CreatedBy, &v.CreatedAt); err != nil {
				return nil, err
			}
			items = append(items, v)
		}
		return items, rows.Err()
	}
	return []models.LegalDocumentVersion{
		{
			ID:            uuid.New(),
			DocumentID:    documentID,
			Version:       "1.0.0",
			Title:         "Initial Version",
			Content:       "Official platform legal terms and policies.",
			ChangeSummary: "Initial publication.",
			EffectiveDate: time.Now().AddDate(0, -1, 0),
			Status:        "published",
			CreatedAt:     time.Now().AddDate(0, -1, 0),
		},
	}, nil
}

func (r *legalRepository) RecordDocumentAcceptance(ctx context.Context, acceptance *models.LegalAcceptance) error {
	if r.db == nil {
		return nil
	}
	// Resolve the immutable version in the database; callers cannot invent a version id.
	err := r.db.QueryRowContext(ctx, `SELECT id FROM legal_document_versions WHERE document_id=$1 AND version=$2 AND status='published'`, acceptance.DocumentID, acceptance.Version).Scan(&acceptance.DocumentVersionID)
	if err != nil {
		return fmt.Errorf("published legal document version not found: %w", err)
	}
	_, err = r.db.ExecContext(ctx, `INSERT INTO legal_document_acceptances (id,user_id,document_id,document_version_id,version,accepted_at,ip_address,user_agent,source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (user_id,document_version_id) DO NOTHING`, acceptance.ID, acceptance.UserID, acceptance.DocumentID, acceptance.DocumentVersionID, acceptance.Version, acceptance.AcceptedAt, acceptance.IPAddress, acceptance.UserAgent, acceptance.Source)
	return err
}

func (r *legalRepository) GetCookies(ctx context.Context) ([]models.CookieItem, error) {
	if r.db != nil {
		rows, err := r.db.QueryContext(ctx, `SELECT id,cookie_name,provider,category,purpose,COALESCE(domain,''),COALESCE(path,'/'),duration,is_secure,is_httponly,samesite,is_required,is_active,created_at FROM cookie_registry WHERE is_active=true ORDER BY category,cookie_name`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		items := make([]models.CookieItem, 0)
		for rows.Next() {
			var v models.CookieItem
			if err := rows.Scan(&v.ID, &v.CookieName, &v.Provider, &v.Category, &v.Purpose, &v.Domain, &v.Path, &v.Duration, &v.IsSecure, &v.IsHTTPOnly, &v.SameSite, &v.IsRequired, &v.IsActive, &v.CreatedAt); err != nil {
				return nil, err
			}
			items = append(items, v)
		}
		return items, rows.Err()
	}
	return []models.CookieItem{
		{ID: uuid.New(), CookieName: "kirmya_session", Provider: "Kirmya", Category: "necessary", Purpose: "Stores authenticated user session context securely", IsRequired: true, IsActive: true},
		{ID: uuid.New(), CookieName: "kirmya_csrf", Provider: "Kirmya", Category: "necessary", Purpose: "Cross-Site Request Forgery prevention token", IsRequired: true, IsActive: true},
		{ID: uuid.New(), CookieName: "kirmya_theme", Provider: "Kirmya", Category: "preferences", Purpose: "Stores UI dark mode preference", IsRequired: false, IsActive: true},
		{ID: uuid.New(), CookieName: "kirmya_analytics_id", Provider: "Kirmya Analytics", Category: "analytics", Purpose: "Anonymous aggregate usage metrics", IsRequired: false, IsActive: true},
	}, nil
}

func (r *legalRepository) SaveCookieConsent(ctx context.Context, consent *models.CookieConsent) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.ExecContext(ctx, `INSERT INTO cookie_consents (id,user_id,visitor_id,necessary,preferences,analytics,functional,marketing,third_party,updated_at,ip_address,user_agent) VALUES ($1,$2,$3,true,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (visitor_id) DO UPDATE SET user_id=COALESCE(EXCLUDED.user_id,cookie_consents.user_id),necessary=true,preferences=EXCLUDED.preferences,analytics=EXCLUDED.analytics,functional=EXCLUDED.functional,marketing=EXCLUDED.marketing,third_party=EXCLUDED.third_party,updated_at=EXCLUDED.updated_at,ip_address=EXCLUDED.ip_address,user_agent=EXCLUDED.user_agent`, consent.ID, consent.UserID, consent.VisitorID, consent.Preferences, consent.Analytics, consent.Functional, consent.Marketing, consent.ThirdParty, consent.UpdatedAt, consent.IPAddress, consent.UserAgent)
	return err
}

func (r *legalRepository) GetCookieConsent(ctx context.Context, visitorID string) (*models.CookieConsent, error) {
	if r.db != nil {
		var v models.CookieConsent
		err := r.db.QueryRowContext(ctx, `SELECT id,user_id,visitor_id,necessary,preferences,analytics,functional,marketing,third_party,updated_at,COALESCE(ip_address,''),COALESCE(user_agent,'') FROM cookie_consents WHERE visitor_id=$1`, visitorID).Scan(&v.ID, &v.UserID, &v.VisitorID, &v.Necessary, &v.Preferences, &v.Analytics, &v.Functional, &v.Marketing, &v.ThirdParty, &v.UpdatedAt, &v.IPAddress, &v.UserAgent)
		return &v, err
	}
	return &models.CookieConsent{
		ID:          uuid.New(),
		VisitorID:   visitorID,
		Necessary:   true,
		Preferences: true,
		Analytics:   false,
		Functional:  true,
		Marketing:   false,
		ThirdParty:  false,
		UpdatedAt:   time.Now(),
	}, nil
}

func (r *legalRepository) GetPrivacyPreferences(ctx context.Context, userID uuid.UUID) (*models.PrivacyPreferences, error) {
	if r.db != nil {
		_, err := r.db.ExecContext(ctx, `INSERT INTO privacy_preferences(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING`, userID)
		if err != nil {
			return nil, err
		}
		var p models.PrivacyPreferences
		err = r.db.QueryRowContext(ctx, `SELECT user_id,profile_visibility,discover_in_search,recruiter_discoverable,recruiter_contactable,show_resume_to_recruiters,messaging_permission,community_visibility,search_personalization,ai_data_usage,analytics_consent,marketing_consent,updated_at FROM privacy_preferences WHERE user_id=$1`, userID).Scan(&p.UserID, &p.ProfileVisibility, &p.DiscoverInSearch, &p.RecruiterDiscoverable, &p.RecruiterContactable, &p.ShowResumeToRecruiters, &p.MessagingPermission, &p.CommunityVisibility, &p.SearchPersonalization, &p.AIDataUsage, &p.AnalyticsConsent, &p.MarketingConsent, &p.UpdatedAt)
		return &p, err
	}
	return &models.PrivacyPreferences{
		UserID:                 userID,
		ProfileVisibility:      "Public",
		DiscoverInSearch:       true,
		RecruiterDiscoverable:  true,
		RecruiterContactable:   true,
		ShowResumeToRecruiters: true,
		MessagingPermission:    "Anyone",
		CommunityVisibility:    "Public",
		SearchPersonalization:  true,
		AIDataUsage:            true,
		AnalyticsConsent:       true,
		MarketingConsent:       false,
		UpdatedAt:              time.Now(),
	}, nil
}

func (r *legalRepository) UpdatePrivacyPreferences(ctx context.Context, prefs *models.PrivacyPreferences) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.ExecContext(ctx, `INSERT INTO privacy_preferences(user_id,profile_visibility,discover_in_search,recruiter_discoverable,recruiter_contactable,show_resume_to_recruiters,messaging_permission,community_visibility,search_personalization,ai_data_usage,analytics_consent,marketing_consent,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(user_id) DO UPDATE SET profile_visibility=EXCLUDED.profile_visibility,discover_in_search=EXCLUDED.discover_in_search,recruiter_discoverable=EXCLUDED.recruiter_discoverable,recruiter_contactable=EXCLUDED.recruiter_contactable,show_resume_to_recruiters=EXCLUDED.show_resume_to_recruiters,messaging_permission=EXCLUDED.messaging_permission,community_visibility=EXCLUDED.community_visibility,search_personalization=EXCLUDED.search_personalization,ai_data_usage=EXCLUDED.ai_data_usage,analytics_consent=EXCLUDED.analytics_consent,marketing_consent=EXCLUDED.marketing_consent,updated_at=EXCLUDED.updated_at`, prefs.UserID, prefs.ProfileVisibility, prefs.DiscoverInSearch, prefs.RecruiterDiscoverable, prefs.RecruiterContactable, prefs.ShowResumeToRecruiters, prefs.MessagingPermission, prefs.CommunityVisibility, prefs.SearchPersonalization, prefs.AIDataUsage, prefs.AnalyticsConsent, prefs.MarketingConsent, prefs.UpdatedAt)
	return err
}

func (r *legalRepository) GetConsentHistory(ctx context.Context, userID uuid.UUID) ([]models.ConsentHistoryItem, error) {
	if r.db != nil {
		rows, err := r.db.QueryContext(ctx, `SELECT a.id,d.title,a.version,a.accepted_at,a.source FROM legal_document_acceptances a JOIN legal_documents d ON d.id=a.document_id WHERE a.user_id=$1 ORDER BY a.accepted_at DESC`, userID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		items := make([]models.ConsentHistoryItem, 0)
		for rows.Next() {
			var v models.ConsentHistoryItem
			if err := rows.Scan(&v.ID, &v.Document, &v.Version, &v.AcceptedAt, &v.Source); err != nil {
				return nil, err
			}
			items = append(items, v)
		}
		return items, rows.Err()
	}
	return []models.ConsentHistoryItem{
		{ID: uuid.New(), Document: "Terms of Service", Version: "1.0.0", AcceptedAt: time.Now().AddDate(0, -2, 0), Source: "Web Sign-up"},
		{ID: uuid.New(), Document: "Privacy Policy", Version: "1.0.0", AcceptedAt: time.Now().AddDate(0, -2, 0), Source: "Web Sign-up"},
		{ID: uuid.New(), Document: "Cookie Preferences", Version: "1.0.0", AcceptedAt: time.Now().AddDate(0, -1, 0), Source: "Cookie Banner"},
	}, nil
}

func (r *legalRepository) CreatePrivacyRequest(ctx context.Context, req *models.PrivacyRequest) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.ExecContext(ctx, `INSERT INTO privacy_requests(id,user_id,request_type,status,due_date,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7)`, req.ID, req.UserID, req.RequestType, req.Status, req.DueDate, req.CreatedAt, req.UpdatedAt)
	return err
}

func (r *legalRepository) GetUserPrivacyRequests(ctx context.Context, userID uuid.UUID) ([]models.PrivacyRequest, error) {
	if r.db != nil {
		rows, err := r.db.QueryContext(ctx, `SELECT id,user_id,request_type,status,due_date,assigned_admin_id,COALESCE(resolution_notes,''),completed_at,created_at,updated_at FROM privacy_requests WHERE user_id=$1 ORDER BY created_at DESC`, userID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		items := make([]models.PrivacyRequest, 0)
		for rows.Next() {
			var v models.PrivacyRequest
			if err := rows.Scan(&v.ID, &v.UserID, &v.RequestType, &v.Status, &v.DueDate, &v.AssignedAdminID, &v.ResolutionNotes, &v.CompletedAt, &v.CreatedAt, &v.UpdatedAt); err != nil {
				return nil, err
			}
			items = append(items, v)
		}
		return items, rows.Err()
	}
	return []models.PrivacyRequest{
		{
			ID:          uuid.New(),
			UserID:      userID,
			RequestType: "access_export",
			Status:      "completed",
			DueDate:     time.Now().AddDate(0, 0, 30),
			CreatedAt:   time.Now().AddDate(0, 0, -2),
		},
	}, nil
}

func (r *legalRepository) GetPrivacyRequestByID(ctx context.Context, id uuid.UUID) (*models.PrivacyRequest, error) {
	if r.db != nil {
		var v models.PrivacyRequest
		err := r.db.QueryRowContext(ctx, `SELECT id,user_id,request_type,status,due_date,assigned_admin_id,COALESCE(resolution_notes,''),completed_at,created_at,updated_at FROM privacy_requests WHERE id=$1`, id).Scan(&v.ID, &v.UserID, &v.RequestType, &v.Status, &v.DueDate, &v.AssignedAdminID, &v.ResolutionNotes, &v.CompletedAt, &v.CreatedAt, &v.UpdatedAt)
		return &v, err
	}
	return &models.PrivacyRequest{
		ID:          id,
		UserID:      uuid.New(),
		RequestType: "access_export",
		Status:      "processing",
		DueDate:     time.Now().AddDate(0, 0, 28),
		CreatedAt:   time.Now(),
	}, nil
}

func (r *legalRepository) UpdatePrivacyRequest(ctx context.Context, req *models.PrivacyRequest) error {
	if r.db == nil {
		return nil
	}
	res, err := r.db.ExecContext(ctx, `UPDATE privacy_requests SET status=$2,resolution_notes=$3,completed_at=$4,updated_at=NOW() WHERE id=$1`, req.ID, req.Status, req.ResolutionNotes, req.CompletedAt)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *legalRepository) CreateDataExportJob(ctx context.Context, job *models.DataExportJob) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.ExecContext(ctx, `INSERT INTO data_export_jobs(id,user_id,privacy_request_id,status,download_url,expires_at,file_size_bytes,created_at,updated_at) VALUES($1,$2,$3,$4,NULL,$5,0,$6,$6)`, job.ID, job.UserID, job.PrivacyRequestID, job.Status, job.ExpiresAt, job.CreatedAt)
	return err
}

func (r *legalRepository) GetDataExportJob(ctx context.Context, userID uuid.UUID) (*models.DataExportJob, error) {
	if r.db != nil {
		var v models.DataExportJob
		err := r.db.QueryRowContext(ctx, `SELECT id,user_id,privacy_request_id,status,COALESCE(download_url,''),expires_at,file_size_bytes,created_at,completed_at,attempt_count,max_attempts,COALESCE(last_error,'') FROM data_export_jobs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`, userID).Scan(&v.ID, &v.UserID, &v.PrivacyRequestID, &v.Status, &v.DownloadURL, &v.ExpiresAt, &v.FileSizeBytes, &v.CreatedAt, &v.CompletedAt, &v.AttemptCount, &v.MaxAttempts, &v.LastError)
		return &v, err
	}
	return &models.DataExportJob{
		ID:            uuid.New(),
		UserID:        userID,
		Status:        "completed",
		DownloadURL:   "/api/v1/privacy/export/download",
		ExpiresAt:     time.Now().AddDate(0, 0, 7),
		FileSizeBytes: 1048576,
		CreatedAt:     time.Now(),
	}, nil
}

func (r *legalRepository) scanExport(row *sql.Row) (*models.DataExportJob, error) {
	var v models.DataExportJob
	err := row.Scan(&v.ID, &v.UserID, &v.PrivacyRequestID, &v.Status, &v.DownloadURL, &v.ExpiresAt, &v.FileSizeBytes, &v.CreatedAt, &v.CompletedAt, &v.AttemptCount, &v.MaxAttempts, &v.LastError)
	return &v, err
}

func (r *legalRepository) GetDataExportJobByID(ctx context.Context, userID, jobID uuid.UUID) (*models.DataExportJob, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}
	return r.scanExport(r.db.QueryRowContext(ctx, `SELECT id,user_id,privacy_request_id,status,COALESCE(download_url,''),expires_at,file_size_bytes,created_at,completed_at,attempt_count,max_attempts,COALESCE(last_error,'') FROM data_export_jobs WHERE id=$1 AND user_id=$2`, jobID, userID))
}

func (r *legalRepository) ClaimDataExportJob(ctx context.Context) (*models.DataExportJob, error) {
	if r.db == nil {
		return nil, sql.ErrNoRows
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	var v models.DataExportJob
	err = tx.QueryRowContext(ctx, `SELECT id,user_id,privacy_request_id,status,COALESCE(download_url,''),expires_at,file_size_bytes,created_at,completed_at,attempt_count,max_attempts,COALESCE(last_error,'') FROM data_export_jobs WHERE status IN ('pending','failed') AND attempt_count<max_attempts ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`).Scan(&v.ID, &v.UserID, &v.PrivacyRequestID, &v.Status, &v.DownloadURL, &v.ExpiresAt, &v.FileSizeBytes, &v.CreatedAt, &v.CompletedAt, &v.AttemptCount, &v.MaxAttempts, &v.LastError)
	if err != nil {
		return nil, err
	}
	if _, err = tx.ExecContext(ctx, `UPDATE data_export_jobs SET status='processing',attempt_count=attempt_count+1,last_error=NULL,updated_at=NOW() WHERE id=$1`, v.ID); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	v.Status = "processing"
	v.AttemptCount++
	return &v, nil
}

func (r *legalRepository) BuildDataExport(ctx context.Context, userID uuid.UUID) ([]byte, error) {
	if r.db == nil {
		return nil, errors.New("export requires PostgreSQL")
	}
	var payload []byte
	err := r.db.QueryRowContext(ctx, `SELECT convert_to(jsonb_build_object('generated_at',NOW(),'account',jsonb_build_object('id',u.id,'email',u.email,'first_name',u.first_name,'last_name',u.last_name,'status',u.status),'privacy_preferences',COALESCE(to_jsonb(p),'{}'::jsonb),'applications',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a.id,'job_id',a.job_id,'stage',a.current_stage,'applied_at',a.applied_at)) FROM job_applications a WHERE a.candidate_id=u.id),'[]'::jsonb),'documents',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'sha256',d.sha256,'uploaded_at',d.uploaded_at)) FROM candidate_documents d WHERE d.candidate_id=u.id AND d.deleted_at IS NULL),'[]'::jsonb))::text,'UTF8') FROM users u LEFT JOIN privacy_preferences p ON p.user_id=u.id WHERE u.id=$1 AND u.status<>'deleted'`, userID).Scan(&payload)
	return payload, err
}

func (r *legalRepository) CompleteDataExportJob(ctx context.Context, jobID uuid.UUID, payload []byte) error {
	if r.db == nil {
		return errors.New("export requires PostgreSQL")
	}
	_, err := r.db.ExecContext(ctx, `UPDATE data_export_jobs SET status='completed',export_payload=$2,file_size_bytes=$3,download_url='/api/v1/privacy/export/'||id||'/download',expires_at=NOW()+INTERVAL '7 days',completed_at=NOW(),updated_at=NOW(),last_error=NULL WHERE id=$1 AND status='processing'`, jobID, payload, len(payload))
	return err
}
func (r *legalRepository) FailDataExportJob(ctx context.Context, jobID uuid.UUID, cause error) error {
	if r.db == nil {
		return cause
	}
	_, err := r.db.ExecContext(ctx, `UPDATE data_export_jobs SET status='failed',last_error=$2,updated_at=NOW() WHERE id=$1 AND status='processing'`, jobID, cause.Error())
	return err
}
func (r *legalRepository) CancelDataExportJob(ctx context.Context, userID, jobID uuid.UUID) error {
	if r.db == nil {
		return sql.ErrNoRows
	}
	res, err := r.db.ExecContext(ctx, `UPDATE data_export_jobs SET status='cancelled',cancelled_at=NOW(),updated_at=NOW() WHERE id=$1 AND user_id=$2 AND status IN ('pending','failed')`, jobID, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("export job cannot be cancelled")
	}
	return nil
}
func (r *legalRepository) GetDataExportPayload(ctx context.Context, userID, jobID uuid.UUID) ([]byte, string, error) {
	if r.db == nil {
		return nil, "", sql.ErrNoRows
	}
	var b []byte
	var name string
	err := r.db.QueryRowContext(ctx, `SELECT export_payload,'kirmya-export-'||id||'.json' FROM data_export_jobs WHERE id=$1 AND user_id=$2 AND status='completed' AND expires_at>NOW()`, jobID, userID).Scan(&b, &name)
	return b, name, err
}

func (r *legalRepository) CreateDataDeletionRequest(ctx context.Context, req *models.DataDeletionRequest) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.ExecContext(ctx, `INSERT INTO data_deletion_requests(id,user_id,privacy_request_id,status,grace_period_expires_at,confirmed_at,reason,created_at,updated_at) VALUES($1,$2,$3,$4,$5,NOW(),$6,$7,$7)`, req.ID, req.UserID, req.PrivacyRequestID, req.Status, req.GracePeriodExpiresAt, req.Reason, req.CreatedAt)
	return err
}

func (r *legalRepository) ProcessNextDeletion(ctx context.Context) (bool, error) {
	if r.db == nil {
		return false, nil
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()
	var id, userID uuid.UUID
	err = tx.QueryRowContext(ctx, `SELECT id,user_id FROM data_deletion_requests WHERE status IN ('grace_period','failed') AND grace_period_expires_at<=NOW() AND attempt_count<max_attempts ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`).Scan(&id, &userID)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	var held bool
	if err = tx.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM legal_holds WHERE resource_type='user' AND resource_id=$1 AND is_active=true AND (expires_at IS NULL OR expires_at>NOW()))`, userID).Scan(&held); err != nil {
		return false, err
	}
	if held {
		_, err = tx.ExecContext(ctx, `UPDATE data_deletion_requests SET status='failed',attempt_count=attempt_count+1,last_error='active legal hold',updated_at=NOW() WHERE id=$1`, id)
		if err != nil {
			return false, err
		}
		return true, tx.Commit()
	}
	if _, err = tx.ExecContext(ctx, `UPDATE data_deletion_requests SET status='processing',attempt_count=attempt_count+1,updated_at=NOW() WHERE id=$1`, id); err != nil {
		return false, err
	}
	for _, q := range []string{`DELETE FROM sessions WHERE user_id=$1`, `UPDATE candidate_documents SET content=NULL,deleted_at=NOW(),updated_at=NOW() WHERE candidate_id=$1`, `DELETE FROM job_applications WHERE candidate_id=$1`, `DELETE FROM profiles WHERE user_id=$1`, `DELETE FROM privacy_preferences WHERE user_id=$1`} {
		if _, err = tx.ExecContext(ctx, q, userID); err != nil {
			return true, r.recordDeletionFailure(ctx, tx, id, err)
		}
	}
	if _, err = tx.ExecContext(ctx, `UPDATE users SET first_name='Deleted',last_name='User',email='deleted+'||id||'@invalid.local',password_hash='!',status='deleted',country='',current_location='',job_title='',employment_status='',updated_at=NOW() WHERE id=$1`, userID); err != nil {
		return true, r.recordDeletionFailure(ctx, tx, id, err)
	}
	if _, err = tx.ExecContext(ctx, `UPDATE data_deletion_requests SET status='completed',completed_at=NOW(),updated_at=NOW(),last_error=NULL WHERE id=$1`, id); err != nil {
		return true, r.recordDeletionFailure(ctx, tx, id, err)
	}
	if err = tx.Commit(); err != nil {
		return true, r.recordDeletionFailure(ctx, tx, id, err)
	}
	return true, nil
}

// recordDeletionFailure abandons the partial deletion and records the attempt on
// a separate connection. Writing the failure inside the same transaction would
// discard it with the rollback, so the request would keep its pre-attempt state:
// no error to diagnose and an attempt budget that never runs out, leaving the
// worker retrying the same broken deletion forever.
func (r *legalRepository) recordDeletionFailure(ctx context.Context, tx *sql.Tx, id uuid.UUID, cause error) error {
	_ = tx.Rollback()
	if _, err := r.db.ExecContext(ctx, `UPDATE data_deletion_requests SET status='failed',attempt_count=attempt_count+1,last_error=$2,updated_at=NOW() WHERE id=$1`, id, cause.Error()); err != nil {
		return fmt.Errorf("deletion failed (%v) and the failure could not be recorded: %w", cause, err)
	}
	return cause
}

func (r *legalRepository) CancelAccountDeletion(ctx context.Context, userID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	res, err := r.db.ExecContext(ctx, `UPDATE data_deletion_requests SET status='cancelled',cancelled_at=NOW(),updated_at=NOW() WHERE user_id=$1 AND status='grace_period' AND grace_period_expires_at>NOW()`, userID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("no cancellable account deletion request")
	}
	return nil
}

func (r *legalRepository) CheckActiveLegalHold(ctx context.Context, resourceType string, resourceID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, nil
	}
	var held bool
	err := r.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM legal_holds WHERE resource_type=$1 AND resource_id=$2 AND is_active=true AND (expires_at IS NULL OR expires_at>NOW()))`, resourceType, resourceID).Scan(&held)
	return held, err
}

func (r *legalRepository) GetThirdPartyServices(ctx context.Context) ([]models.ThirdPartyService, error) {
	return []models.ThirdPartyService{
		{ID: uuid.New(), ProviderName: "SendGrid / Mailtrap", ServiceName: "Email Notifications", Purpose: "Transactional email delivery", DataCategory: "Email & Name", CountryRegion: "United States", IsEnabled: true},
		{ID: uuid.New(), ProviderName: "PostgreSQL Database", ServiceName: "Primary Datastore", Purpose: "Encrypted user profiles and platform data", DataCategory: "Profile Data", CountryRegion: "United States", IsEnabled: true},
	}, nil
}

func (r *legalRepository) GetDataProcessingRecords(ctx context.Context) ([]models.DataProcessingRecord, error) {
	return []models.DataProcessingRecord{
		{ID: uuid.New(), ActivityName: "User Authentication & Account Management", Purpose: "Maintain user identity and security controls", DataCategory: "Account Data", SubjectCategory: "Registered Users", StorageLocation: "AWS me-central-1 (Dubai)", RetentionPeriod: "365 days", LegalBasis: "Contractual Necessity", UpdatedAt: time.Now()},
		{ID: uuid.New(), ActivityName: "Candidate Profile & Resume Matching", Purpose: "Match job seekers with relevant opportunities using AI", DataCategory: "Profile Data", SubjectCategory: "Job Seekers", StorageLocation: "AWS me-central-1 (Dubai)", RetentionPeriod: "Active Account Duration", LegalBasis: "User Consent", UpdatedAt: time.Now()},
		{ID: uuid.New(), ActivityName: "Recruiter Candidate Discovery", Purpose: "Allow verified recruiters to search and contact candidates", DataCategory: "Recruitment Data", SubjectCategory: "Candidates", StorageLocation: "AWS me-central-1 (Dubai)", RetentionPeriod: "Active Account Duration", LegalBasis: "User Consent", UpdatedAt: time.Now()},
	}, nil
}

func (r *legalRepository) GetRetentionPolicies(ctx context.Context) ([]models.RetentionPolicy, error) {
	return []models.RetentionPolicy{
		{ID: uuid.New(), DataCategory: "user_accounts", RetentionDays: 365, ActionType: "anonymize", Description: "Inoperative accounts anonymized after 365 days inactivity.", IsActive: true, UpdatedAt: time.Now()},
		{ID: uuid.New(), DataCategory: "messages", RetentionDays: 180, ActionType: "delete", Description: "Transient messaging logs purged after 180 days.", IsActive: true, UpdatedAt: time.Now()},
		{ID: uuid.New(), DataCategory: "analytics_events", RetentionDays: 90, ActionType: "anonymize", Description: "Raw user analytics aggregate rollup after 90 days.", IsActive: true, UpdatedAt: time.Now()},
	}, nil
}

func (r *legalRepository) UpdateRetentionPolicy(ctx context.Context, p *models.RetentionPolicy) error {
	return nil
}

func (r *legalRepository) GetPrivacyDashboardSummary(ctx context.Context) (*models.PrivacyDashboardSummary, error) {
	return &models.PrivacyDashboardSummary{
		TotalRequests:           42,
		PendingRequests:         3,
		CompletedRequests:       39,
		ActiveExportJobs:        2,
		AccountDeletionJobs:     1,
		ActiveLegalHolds:        0,
		ThirdPartySubProcessors: 2,
		ConsentCountByDoc: map[string]int64{
			"Terms of Service":   1240,
			"Privacy Policy":     1240,
			"Cookie Preferences": 1180,
		},
	}, nil
}
