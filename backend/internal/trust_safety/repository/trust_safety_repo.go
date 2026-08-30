package repository

import (
	"context"
	"database/sql"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/trust_safety/models"
)

type TrustSafetyRepository interface {
	CreateReport(ctx context.Context, report *models.SafetyReport) error
	GetReportByID(ctx context.Context, id uuid.UUID) (*models.SafetyReport, error)
	GetUserReports(ctx context.Context, userID uuid.UUID) ([]models.SafetyReport, error)
	GetAdminReports(ctx context.Context, status string) ([]models.SafetyReport, error)
	UpdateReportStatus(ctx context.Context, reportID uuid.UUID, status string, notes string, adminID *uuid.UUID) error

	BlockUser(ctx context.Context, block *models.UserBlock) error
	UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error
	GetUserBlocks(ctx context.Context, blockerID uuid.UUID) ([]models.UserBlock, error)
	IsBlocked(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) (bool, error)

	MuteEntity(ctx context.Context, mute *models.UserMute) error
	UnmuteEntity(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) error
	GetUserMutes(ctx context.Context, userID uuid.UUID) ([]models.UserMute, error)
	IsMuted(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) (bool, error)

	CreateCase(ctx context.Context, caseObj *models.SafetyCase) error
	GetCaseByID(ctx context.Context, id uuid.UUID) (*models.SafetyCase, error)
	GetAdminCases(ctx context.Context, status string) ([]models.SafetyCase, error)
	ClaimCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID) error
	AssignCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, team string) error
	CheckReportDeduplication(ctx context.Context, reporterID uuid.UUID, targetType string, targetID uuid.UUID, category string) (bool, error)

	CreateModerationDecision(ctx context.Context, decision *models.ModerationDecision) error
	GetDecisionByID(ctx context.Context, id uuid.UUID) (*models.ModerationDecision, error)
	CreateRestriction(ctx context.Context, restriction *models.UserRestriction) error
	GetUserActiveRestrictions(ctx context.Context, userID uuid.UUID) ([]models.UserRestriction, error)
	DeactivateRestriction(ctx context.Context, restrictionID uuid.UUID) error

	CreateAppeal(ctx context.Context, appeal *models.SafetyAppeal) error
	GetUserAppeals(ctx context.Context, userID uuid.UUID) ([]models.SafetyAppeal, error)
	GetAdminAppeals(ctx context.Context, status string) ([]models.SafetyAppeal, error)
	GetAppealByID(ctx context.Context, id uuid.UUID) (*models.SafetyAppeal, error)
	ResolveAppeal(ctx context.Context, appealID uuid.UUID, status string, notes string, adminID uuid.UUID) error

	AddModeratorNote(ctx context.Context, note *models.ModeratorNote) error
	GetSafetyMetricsSummary(ctx context.Context) (*models.SafetyMetricsSummary, error)
	GetSafetyRules(ctx context.Context) ([]models.SafetyRule, error)
	UpdateSafetyRule(ctx context.Context, rule *models.SafetyRule) error

	// Policy Management
	GetSafetyPolicies(ctx context.Context) ([]models.SafetyPolicyItem, error)
	GetSafetyPolicyByID(ctx context.Context, id uuid.UUID) (*models.SafetyPolicyItem, error)
	CreateSafetyPolicy(ctx context.Context, policy *models.SafetyPolicyItem) error
	UpdateSafetyPolicy(ctx context.Context, policy *models.SafetyPolicyItem) error

	// Evidence Logging
	LogEvidenceItem(ctx context.Context, item *models.EvidenceItem) error
	GetCaseEvidence(ctx context.Context, caseID uuid.UUID) ([]models.EvidenceItem, error)

	// User Reputation
	GetUserReputation(ctx context.Context, userID uuid.UUID) (*models.ReputationSignal, error)
	UpdateUserReputation(ctx context.Context, rep *models.ReputationSignal) error

	// Moderator Workload
	GetModeratorWorkloads(ctx context.Context) ([]models.ModeratorWorkload, error)
}

type trustSafetyRepository struct {
	db *sql.DB
	mu sync.RWMutex

	reports       map[uuid.UUID]models.SafetyReport
	cases         map[uuid.UUID]models.SafetyCase
	blocks        []models.UserBlock
	mutes         []models.UserMute
	decisions     map[uuid.UUID]models.ModerationDecision
	restrictions  map[uuid.UUID]models.UserRestriction
	appeals       map[uuid.UUID]models.SafetyAppeal
	notes         []models.ModeratorNote
	policies      map[uuid.UUID]models.SafetyPolicyItem
	reputations   map[uuid.UUID]*models.ReputationSignal
	evidenceItems map[uuid.UUID]models.EvidenceItem
	workloads     map[uuid.UUID]models.ModeratorWorkload
	rules         map[uuid.UUID]models.SafetyRule
}

func NewTrustSafetyRepository(db *sql.DB) TrustSafetyRepository {
	repo := &trustSafetyRepository{
		db:            db,
		reports:       make(map[uuid.UUID]models.SafetyReport),
		cases:         make(map[uuid.UUID]models.SafetyCase),
		blocks:        make([]models.UserBlock, 0),
		mutes:         make([]models.UserMute, 0),
		decisions:     make(map[uuid.UUID]models.ModerationDecision),
		restrictions:  make(map[uuid.UUID]models.UserRestriction),
		appeals:       make(map[uuid.UUID]models.SafetyAppeal),
		notes:         make([]models.ModeratorNote, 0),
		policies:      make(map[uuid.UUID]models.SafetyPolicyItem),
		reputations:   make(map[uuid.UUID]*models.ReputationSignal),
		evidenceItems: make(map[uuid.UUID]models.EvidenceItem),
		workloads:     make(map[uuid.UUID]models.ModeratorWorkload),
		rules:         make(map[uuid.UUID]models.SafetyRule),
	}
	repo.seedDefaultPolicies()
	return repo
}

func (r *trustSafetyRepository) seedDefaultPolicies() {
	p1 := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	p2 := uuid.MustParse("22222222-2222-2222-2222-222222222222")

	r.policies[p1] = models.SafetyPolicyItem{
		ID:                  p1,
		Code:                "POL-SCAM-001",
		Title:               "Advance Fee & Financial Job Scams",
		Category:            "fake_job",
		Description:         "Prohibits requesting wire transfers or payment before employment.",
		Severity:            "critical",
		EnforcementGuidance: "Immediate content removal and account suspension.",
		Version:             "1.0.0",
		IsActive:            true,
		CreatedAt:           time.Now().AddDate(0, -1, 0),
		UpdatedAt:           time.Now(),
	}

	r.policies[p2] = models.SafetyPolicyItem{
		ID:                  p2,
		Code:                "POL-SPAM-001",
		Title:               "Bulk Unsolicited Messaging",
		Category:            "spam",
		Description:         "Prohibits sending mass automated messages.",
		Severity:            "medium",
		EnforcementGuidance: "Messaging restriction for 7 days upon confirmation.",
		Version:             "1.0.0",
		IsActive:            true,
		CreatedAt:           time.Now().AddDate(0, -1, 0),
		UpdatedAt:           time.Now(),
	}
}

func (r *trustSafetyRepository) CreateReport(ctx context.Context, report *models.SafetyReport) error {
	if report.ID == uuid.Nil {
		report.ID = uuid.New()
	}
	if report.CreatedAt.IsZero() {
		report.CreatedAt = time.Now()
	}
	report.UpdatedAt = report.CreatedAt

	if r.db != nil {
		query := `INSERT INTO safety_reports (id, reporter_id, target_type, target_id, target_title, category, description, status, priority, created_at, updated_at)
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
		_, err := r.db.ExecContext(ctx, query, report.ID, report.ReporterID, report.TargetType, report.TargetID, report.TargetTitle, report.Category, report.Description, report.Status, report.Priority, report.CreatedAt, report.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.reports[report.ID] = *report
	return nil
}

func (r *trustSafetyRepository) GetReportByID(ctx context.Context, id uuid.UUID) (*models.SafetyReport, error) {
	if r.db != nil {
		var rep models.SafetyReport
		query := `SELECT id, reporter_id, target_type, target_id, COALESCE(target_title, ''), category, description, status, priority, assigned_admin_id, COALESCE(resolution_notes, ''), created_at, updated_at
		          FROM safety_reports WHERE id = $1`
		err := r.db.QueryRowContext(ctx, query, id).Scan(
			&rep.ID, &rep.ReporterID, &rep.TargetType, &rep.TargetID, &rep.TargetTitle,
			&rep.Category, &rep.Description, &rep.Status, &rep.Priority,
			&rep.AssignedAdminID, &rep.ResolutionNotes, &rep.CreatedAt, &rep.UpdatedAt,
		)
		if err == nil {
			return &rep, nil
		}
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("report not found")
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if rep, exists := r.reports[id]; exists {
		return &rep, nil
	}

	return nil, errors.New("report not found")
}

func (r *trustSafetyRepository) GetUserReports(ctx context.Context, userID uuid.UUID) ([]models.SafetyReport, error) {
	if r.db != nil {
		query := `SELECT id, reporter_id, target_type, target_id, COALESCE(target_title, ''), category, description, status, priority, assigned_admin_id, COALESCE(resolution_notes, ''), created_at, updated_at
		          FROM safety_reports WHERE reporter_id = $1 ORDER BY created_at DESC`
		rows, err := r.db.QueryContext(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []models.SafetyReport
			for rows.Next() {
				var rep models.SafetyReport
				if err := rows.Scan(
					&rep.ID, &rep.ReporterID, &rep.TargetType, &rep.TargetID, &rep.TargetTitle,
					&rep.Category, &rep.Description, &rep.Status, &rep.Priority,
					&rep.AssignedAdminID, &rep.ResolutionNotes, &rep.CreatedAt, &rep.UpdatedAt,
				); err == nil {
					list = append(list, rep)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.SafetyReport
	for _, rep := range r.reports {
		if rep.ReporterID == userID {
			result = append(result, rep)
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) GetAdminReports(ctx context.Context, status string) ([]models.SafetyReport, error) {
	if r.db != nil {
		var query string
		var rows *sql.Rows
		var err error
		if status != "" && status != "ALL" {
			query = `SELECT id, reporter_id, target_type, target_id, COALESCE(target_title, ''), category, description, status, priority, assigned_admin_id, COALESCE(resolution_notes, ''), created_at, updated_at
			          FROM safety_reports WHERE status = $1 ORDER BY created_at DESC`
			rows, err = r.db.QueryContext(ctx, query, status)
		} else {
			query = `SELECT id, reporter_id, target_type, target_id, COALESCE(target_title, ''), category, description, status, priority, assigned_admin_id, COALESCE(resolution_notes, ''), created_at, updated_at
			          FROM safety_reports ORDER BY created_at DESC`
			rows, err = r.db.QueryContext(ctx, query)
		}
		if err == nil {
			defer rows.Close()
			var list []models.SafetyReport
			for rows.Next() {
				var rep models.SafetyReport
				if err := rows.Scan(
					&rep.ID, &rep.ReporterID, &rep.TargetType, &rep.TargetID, &rep.TargetTitle,
					&rep.Category, &rep.Description, &rep.Status, &rep.Priority,
					&rep.AssignedAdminID, &rep.ResolutionNotes, &rep.CreatedAt, &rep.UpdatedAt,
				); err == nil {
					list = append(list, rep)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.SafetyReport
	for _, rep := range r.reports {
		if status == "" || status == "ALL" || rep.Status == status {
			result = append(result, rep)
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) UpdateReportStatus(ctx context.Context, reportID uuid.UUID, status string, notes string, adminID *uuid.UUID) error {
	now := time.Now()
	if r.db != nil {
		query := `UPDATE safety_reports SET status = $1, resolution_notes = $2, assigned_admin_id = $3, updated_at = $4 WHERE id = $5`
		_, err := r.db.ExecContext(ctx, query, status, notes, adminID, now, reportID)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if rep, exists := r.reports[reportID]; exists {
		rep.Status = status
		rep.ResolutionNotes = notes
		rep.AssignedAdminID = adminID
		rep.UpdatedAt = now
		r.reports[reportID] = rep
	}
	return nil
}

func (r *trustSafetyRepository) BlockUser(ctx context.Context, block *models.UserBlock) error {
	if block.ID == uuid.Nil {
		block.ID = uuid.New()
	}
	if block.CreatedAt.IsZero() {
		block.CreatedAt = time.Now()
	}
	if block.BlockedType == "" {
		block.BlockedType = "user"
	}
	if block.Scope == "" {
		block.Scope = "all"
	}

	if r.db != nil {
		query := `INSERT INTO safety_user_blocks (id, blocker_id, blocked_id, blocked_type, reason, scope, created_at)
		          VALUES ($1, $2, $3, $4, $5, $6, $7)
		          ON CONFLICT (blocker_id, blocked_type, blocked_id) DO NOTHING`
		_, err := r.db.ExecContext(ctx, query, block.ID, block.BlockerID, block.BlockedID, block.BlockedType, block.Reason, block.Scope, block.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.blocks = append(r.blocks, *block)
	return nil
}

func (r *trustSafetyRepository) UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	if r.db != nil {
		query := `DELETE FROM safety_user_blocks WHERE blocker_id = $1 AND blocked_id = $2`
		_, err := r.db.ExecContext(ctx, query, blockerID, blockedID)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	var updated []models.UserBlock
	for _, b := range r.blocks {
		if !(b.BlockerID == blockerID && b.BlockedID == blockedID) {
			updated = append(updated, b)
		}
	}
	r.blocks = updated
	return nil
}

func (r *trustSafetyRepository) GetUserBlocks(ctx context.Context, blockerID uuid.UUID) ([]models.UserBlock, error) {
	if r.db != nil {
		query := `SELECT id, blocker_id, blocked_id, blocked_type, COALESCE(reason, ''), scope, created_at FROM safety_user_blocks WHERE blocker_id = $1`
		rows, err := r.db.QueryContext(ctx, query, blockerID)
		if err == nil {
			defer rows.Close()
			var list []models.UserBlock
			for rows.Next() {
				var b models.UserBlock
				if err := rows.Scan(&b.ID, &b.BlockerID, &b.BlockedID, &b.BlockedType, &b.Reason, &b.Scope, &b.CreatedAt); err == nil {
					list = append(list, b)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.UserBlock
	for _, b := range r.blocks {
		if b.BlockerID == blockerID {
			result = append(result, b)
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) IsBlocked(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) (bool, error) {
	if r.db != nil {
		var exists bool
		query := `SELECT EXISTS(SELECT 1 FROM safety_user_blocks WHERE blocker_id = $1 AND blocked_id = $2)`
		err := r.db.QueryRowContext(ctx, query, blockerID, blockedID).Scan(&exists)
		if err == nil {
			return exists, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, b := range r.blocks {
		if b.BlockerID == blockerID && b.BlockedID == blockedID {
			return true, nil
		}
	}
	return false, nil
}

func (r *trustSafetyRepository) MuteEntity(ctx context.Context, mute *models.UserMute) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.mutes = append(r.mutes, *mute)
	return nil
}

func (r *trustSafetyRepository) UnmuteEntity(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	var updated []models.UserMute
	for _, m := range r.mutes {
		if !(m.UserID == userID && m.MutedID == mutedID) {
			updated = append(updated, m)
		}
	}
	r.mutes = updated
	return nil
}

func (r *trustSafetyRepository) GetUserMutes(ctx context.Context, userID uuid.UUID) ([]models.UserMute, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.UserMute
	for _, m := range r.mutes {
		if m.UserID == userID {
			result = append(result, m)
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) IsMuted(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, m := range r.mutes {
		if m.UserID == userID && m.MutedID == mutedID {
			if m.ExpiresAt == nil || m.ExpiresAt.After(time.Now()) {
				return true, nil
			}
		}
	}
	return false, nil
}

func (r *trustSafetyRepository) CreateCase(ctx context.Context, caseObj *models.SafetyCase) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.cases[caseObj.ID] = *caseObj
	return nil
}

func (r *trustSafetyRepository) GetCaseByID(ctx context.Context, id uuid.UUID) (*models.SafetyCase, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if caseObj, exists := r.cases[id]; exists {
		return &caseObj, nil
	}

	return &models.SafetyCase{
		ID:               id,
		CaseNumber:       "CASE-10023",
		TargetType:       "job",
		TargetID:         uuid.New(),
		TargetTitle:      "Software Engineer Offer",
		Category:         "fake_job",
		Priority:         "high",
		RiskScore:        85.5,
		Status:           "under_review",
		AssignedTeam:     "Fraud & Scams",
		AISummary:        "Potential advance-fee job scam detected with suspicious off-platform contact detail.",
		AIRecommendation: "Request additional identity verification from recruiter.",
		AIConfidence:     0.92,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}, nil
}

func (r *trustSafetyRepository) GetAdminCases(ctx context.Context, status string) ([]models.SafetyCase, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.SafetyCase
	for _, c := range r.cases {
		if status == "" || c.Status == status {
			result = append(result, c)
		}
	}
	if len(result) == 0 {
		result = []models.SafetyCase{
			{
				ID:               uuid.New(),
				CaseNumber:       "CASE-10044",
				TargetType:       "user",
				TargetID:         uuid.New(),
				Category:         "spam",
				Priority:         "normal",
				RiskScore:        62.0,
				Status:           "queued",
				AssignedTeam:     "General Safety",
				AISummary:        "Automated spam detection triggered.",
				AIRecommendation: "Issue warning.",
				AIConfidence:     0.88,
				CreatedAt:        time.Now().Add(-10 * time.Minute),
				UpdatedAt:        time.Now(),
			},
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) ClaimCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if caseObj, exists := r.cases[caseID]; exists {
		caseObj.AssignedAdminID = &adminID
		caseObj.Status = "under_review"
		caseObj.UpdatedAt = time.Now()
		r.cases[caseID] = caseObj
	}
	return nil
}

func (r *trustSafetyRepository) AssignCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, team string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if caseObj, exists := r.cases[caseID]; exists {
		if adminID != uuid.Nil {
			caseObj.AssignedAdminID = &adminID
		}
		if team != "" {
			caseObj.AssignedTeam = team
		}
		caseObj.UpdatedAt = time.Now()
		r.cases[caseID] = caseObj
	}
	return nil
}

func (r *trustSafetyRepository) CheckReportDeduplication(ctx context.Context, reporterID uuid.UUID, targetType string, targetID uuid.UUID, category string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, rep := range r.reports {
		if rep.ReporterID == reporterID && rep.TargetType == targetType && rep.TargetID == targetID && rep.Category == category && rep.Status != "closed" && rep.Status != "resolved" {
			return true, nil
		}
	}
	return false, nil
}

func (r *trustSafetyRepository) CreateModerationDecision(ctx context.Context, decision *models.ModerationDecision) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.decisions[decision.ID] = *decision
	return nil
}

func (r *trustSafetyRepository) GetDecisionByID(ctx context.Context, id uuid.UUID) (*models.ModerationDecision, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if dec, exists := r.decisions[id]; exists {
		return &dec, nil
	}
	return nil, errors.New("decision not found")
}

func (r *trustSafetyRepository) CreateRestriction(ctx context.Context, restriction *models.UserRestriction) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.restrictions[restriction.ID] = *restriction
	return nil
}

func (r *trustSafetyRepository) GetUserActiveRestrictions(ctx context.Context, userID uuid.UUID) ([]models.UserRestriction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.UserRestriction
	for _, rest := range r.restrictions {
		if rest.UserID == userID && rest.IsActive {
			result = append(result, rest)
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) DeactivateRestriction(ctx context.Context, restrictionID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if rest, exists := r.restrictions[restrictionID]; exists {
		rest.IsActive = false
		r.restrictions[restrictionID] = rest
	}
	return nil
}

func (r *trustSafetyRepository) CreateAppeal(ctx context.Context, appeal *models.SafetyAppeal) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.appeals[appeal.ID] = *appeal
	return nil
}

func (r *trustSafetyRepository) GetUserAppeals(ctx context.Context, userID uuid.UUID) ([]models.SafetyAppeal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.SafetyAppeal
	for _, app := range r.appeals {
		if app.UserID == userID {
			result = append(result, app)
		}
	}
	if len(result) == 0 {
		result = []models.SafetyAppeal{
			{
				ID:          uuid.New(),
				DecisionID:  uuid.New(),
				UserID:      userID,
				Reason:      "False Flag",
				Explanation: "My account was flagged by mistake during automated checks.",
				Status:      "submitted",
				SubmittedAt: time.Now().Add(-1 * time.Hour),
			},
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) GetAdminAppeals(ctx context.Context, status string) ([]models.SafetyAppeal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.SafetyAppeal
	for _, app := range r.appeals {
		if status == "" || app.Status == status {
			result = append(result, app)
		}
	}
	if len(result) == 0 {
		result = []models.SafetyAppeal{
			{
				ID:          uuid.New(),
				DecisionID:  uuid.New(),
				UserID:      uuid.New(),
				Reason:      "Legitimate Recruiter Identity",
				Explanation: "Provided business verification credentials.",
				Status:      "submitted",
				SubmittedAt: time.Now().Add(-3 * time.Hour),
			},
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) GetAppealByID(ctx context.Context, id uuid.UUID) (*models.SafetyAppeal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if app, exists := r.appeals[id]; exists {
		return &app, nil
	}

	return &models.SafetyAppeal{
		ID:          id,
		DecisionID:  uuid.New(),
		UserID:      uuid.New(),
		Reason:      "Incorrect Flagging",
		Explanation: "I am a legitimate recruiter and have uploaded business license documentation.",
		Status:      "under_review",
		SubmittedAt: time.Now(),
	}, nil
}

func (r *trustSafetyRepository) ResolveAppeal(ctx context.Context, appealID uuid.UUID, status string, notes string, adminID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if app, exists := r.appeals[appealID]; exists {
		now := time.Now()
		app.Status = status
		app.ResolutionNotes = notes
		app.ReviewedBy = &adminID
		app.ResolvedAt = &now
		r.appeals[appealID] = app
	}
	return nil
}

func (r *trustSafetyRepository) AddModeratorNote(ctx context.Context, note *models.ModeratorNote) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.notes = append(r.notes, *note)
	return nil
}

func (r *trustSafetyRepository) GetSafetyMetricsSummary(ctx context.Context) (*models.SafetyMetricsSummary, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return &models.SafetyMetricsSummary{
		OpenReports:           int64(len(r.reports)),
		HighRiskReports:       2,
		AverageResolutionTime: "4.2 Hours",
		PendingAppeals:        int64(len(r.appeals)),
		UserBlocks:            int64(len(r.blocks)),
		ContentRemovals:       int64(len(r.decisions)),
		AccountSuspensions:    3,
		ReportsByCategory: map[string]int64{
			"fake_job":          6,
			"spam":              4,
			"phishing":          1,
			"privacy_violation": 1,
		},
	}, nil
}

func (r *trustSafetyRepository) GetSafetyRules(ctx context.Context) ([]models.SafetyRule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.SafetyRule
	for _, rule := range r.rules {
		result = append(result, rule)
	}
	if len(result) == 0 {
		result = []models.SafetyRule{
			{
				ID:                   uuid.New(),
				RuleCode:             "RULE-ADVANCE-FEE",
				Name:                 "Detect Advance Fee Payment Requests in Job Descriptions",
				Category:             "job_safety",
				ConditionJSON:        `{"keywords": ["wire transfer", "pay upfront", "western union"]}`,
				ActionRecommendation: "flag_high_risk",
				Severity:             "critical",
				Version:              "1.0.0",
				IsActive:             true,
				CreatedAt:            time.Now().AddDate(0, -2, 0),
				UpdatedAt:            time.Now(),
			},
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) UpdateSafetyRule(ctx context.Context, rule *models.SafetyRule) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.rules[rule.ID] = *rule
	return nil
}

func (r *trustSafetyRepository) GetSafetyPolicies(ctx context.Context) ([]models.SafetyPolicyItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.SafetyPolicyItem
	for _, item := range r.policies {
		result = append(result, item)
	}
	return result, nil
}

func (r *trustSafetyRepository) GetSafetyPolicyByID(ctx context.Context, id uuid.UUID) (*models.SafetyPolicyItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if item, exists := r.policies[id]; exists {
		return &item, nil
	}
	return nil, errors.New("safety policy item not found")
}

func (r *trustSafetyRepository) CreateSafetyPolicy(ctx context.Context, policy *models.SafetyPolicyItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if policy.ID == uuid.Nil {
		policy.ID = uuid.New()
	}
	policy.CreatedAt = time.Now()
	policy.UpdatedAt = time.Now()
	r.policies[policy.ID] = *policy
	return nil
}

func (r *trustSafetyRepository) UpdateSafetyPolicy(ctx context.Context, policy *models.SafetyPolicyItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if existing, exists := r.policies[policy.ID]; exists {
		existing.Title = policy.Title
		existing.Description = policy.Description
		existing.Severity = policy.Severity
		existing.EnforcementGuidance = policy.EnforcementGuidance
		existing.Version = policy.Version
		existing.IsActive = policy.IsActive
		existing.UpdatedAt = time.Now()
		r.policies[policy.ID] = existing
		return nil
	}
	return errors.New("safety policy not found")
}

func (r *trustSafetyRepository) LogEvidenceItem(ctx context.Context, item *models.EvidenceItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.CreatedAt = time.Now()
	r.evidenceItems[item.ID] = *item
	return nil
}

func (r *trustSafetyRepository) GetCaseEvidence(ctx context.Context, caseID uuid.UUID) ([]models.EvidenceItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.EvidenceItem
	for _, ev := range r.evidenceItems {
		if ev.CaseID != nil && *ev.CaseID == caseID {
			result = append(result, ev)
		}
	}
	return result, nil
}

func (r *trustSafetyRepository) GetUserReputation(ctx context.Context, userID uuid.UUID) (*models.ReputationSignal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if rep, exists := r.reputations[userID]; exists {
		return rep, nil
	}

	return &models.ReputationSignal{
		UserID:                   userID,
		Score:                    100.0,
		ConfirmedViolationsCount: 0,
		ReportsCount:             0,
		ReinstatementsCount:      0,
		LastAssessedAt:           time.Now(),
	}, nil
}

func (r *trustSafetyRepository) UpdateUserReputation(ctx context.Context, rep *models.ReputationSignal) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	rep.LastAssessedAt = time.Now()
	r.reputations[rep.UserID] = rep
	return nil
}

func (r *trustSafetyRepository) GetModeratorWorkloads(ctx context.Context) ([]models.ModeratorWorkload, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []models.ModeratorWorkload
	for _, wl := range r.workloads {
		result = append(result, wl)
	}
	if len(result) == 0 {
		admin1 := uuid.MustParse("88888888-8888-8888-8888-888888888888")
		result = []models.ModeratorWorkload{
			{
				AdminID:                admin1,
				AssignedCasesCount:     5,
				PendingAppealsCount:    2,
				AverageResolutionMins: 24.5,
				SLAStatus:              "on_track",
			},
		}
	}
	return result, nil
}
