package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/trust_safety/models"
	"kirmya/internal/trust_safety/repository"
)

type TrustSafetyService interface {
	SubmitReport(ctx context.Context, reporterID uuid.UUID, targetType string, targetID uuid.UUID, title string, category string, description string, evidence []string) (*models.SafetyReport, error)
	GetUserReports(ctx context.Context, userID uuid.UUID) ([]models.SafetyReport, error)
	GetAdminReports(ctx context.Context, status string) ([]models.SafetyReport, error)
	GetReportByID(ctx context.Context, id uuid.UUID) (*models.SafetyReport, error)
	UpdateReportStatus(ctx context.Context, reportID uuid.UUID, status string, notes string, adminID *uuid.UUID) error

	BlockUser(ctx context.Context, blockerID uuid.UUID, blockedType string, blockedID uuid.UUID, reason string) error
	UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error
	GetUserBlocks(ctx context.Context, blockerID uuid.UUID) ([]models.UserBlock, error)
	IsBlocked(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) (bool, error)

	MuteEntity(ctx context.Context, userID uuid.UUID, mutedType string, mutedID uuid.UUID, durationDays int) error
	UnmuteEntity(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) error
	GetUserMutes(ctx context.Context, userID uuid.UUID) ([]models.UserMute, error)
	IsMuted(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) (bool, error)

	GetAdminCases(ctx context.Context, status string) ([]models.SafetyCase, error)
	GetCaseByID(ctx context.Context, id uuid.UUID) (*models.SafetyCase, error)
	ClaimCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID) error
	AssignCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, team string) error
	ApplyModerationAction(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, actionType string, level string, reason string, durationDays int) (*models.ModerationDecision, error)
	ApplyModerationDecision(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, actionType string, level string, reason string, policyVersion string, durationDays int) (*models.ModerationDecision, error)

	GetUserActiveRestrictions(ctx context.Context, userID uuid.UUID) ([]models.UserRestriction, error)
	CleanExpiredRestrictions(ctx context.Context, userID uuid.UUID) (int, error)

	SubmitAppeal(ctx context.Context, decisionID uuid.UUID, userID uuid.UUID, reason string, explanation string, evidence []string) (*models.SafetyAppeal, error)
	GetUserAppeals(ctx context.Context, userID uuid.UUID) ([]models.SafetyAppeal, error)
	GetAdminAppeals(ctx context.Context, status string) ([]models.SafetyAppeal, error)
	GetAppealByID(ctx context.Context, id uuid.UUID) (*models.SafetyAppeal, error)
	ResolveAppeal(ctx context.Context, appealID uuid.UUID, adminID uuid.UUID, status string, notes string) error

	SanitizeDescription(description string) string
	RedactReporterIdentity(report *models.SafetyReport) *models.SafetyReport
	EvaluateJobScamRisk(ctx context.Context, jobTitle string, jobDescription string, salaryRange string) (float64, string)
	EvaluateContentModeration(ctx context.Context, contentType string, content string, metadata map[string]string) (float64, []string, bool)
	LogSafetyEvent(ctx context.Context, eventType string, payload map[string]interface{}) string

	GetSafetyMetricsSummary(ctx context.Context) (*models.SafetyMetricsSummary, error)
	GetSafetyRules(ctx context.Context) ([]models.SafetyRule, error)
	UpdateSafetyRule(ctx context.Context, rule *models.SafetyRule) error

	GetSafetyPolicies(ctx context.Context) ([]models.SafetyPolicyItem, error)
	GetSafetyPolicyByID(ctx context.Context, id uuid.UUID) (*models.SafetyPolicyItem, error)
	CreateSafetyPolicy(ctx context.Context, payload models.CreatePolicyPayload) (*models.SafetyPolicyItem, error)
	UpdateSafetyPolicy(ctx context.Context, id uuid.UUID, payload models.UpdatePolicyPayload) (*models.SafetyPolicyItem, error)

	GetUserReputation(ctx context.Context, userID uuid.UUID) (*models.ReputationSignal, error)
	ReinstateUser(ctx context.Context, adminID uuid.UUID, payload models.ReinstateUserPayload) error

	LogEvidenceItem(ctx context.Context, caseID *uuid.UUID, reportID *uuid.UUID, source string, evidenceType string, contentPreview string) (*models.EvidenceItem, error)
	GetCaseEvidence(ctx context.Context, caseID uuid.UUID) ([]models.EvidenceItem, error)
	GetModeratorWorkloads(ctx context.Context) ([]models.ModeratorWorkload, error)
}

type trustSafetyService struct {
	repo repository.TrustSafetyRepository
}

func NewTrustSafetyService(repo repository.TrustSafetyRepository) TrustSafetyService {
	return &trustSafetyService{repo: repo}
}

func (s *trustSafetyService) SubmitReport(ctx context.Context, reporterID uuid.UUID, targetType string, targetID uuid.UUID, title string, category string, description string, evidence []string) (*models.SafetyReport, error) {
	description = s.SanitizeDescription(description)

	isDuplicate, err := s.repo.CheckReportDeduplication(ctx, reporterID, targetType, targetID, category)
	if err != nil {
		return nil, err
	}
	if isDuplicate {
		return nil, errors.New("DUPLICATE_REPORT: A report for this target and category has already been submitted.")
	}

	priority := "normal"
	if category == "threat" || category == "scam" || category == "phishing" || category == "fake_job" {
		priority = "high"
	}

	report := &models.SafetyReport{
		ID:           uuid.New(),
		ReporterID:   reporterID,
		TargetType:   targetType,
		TargetID:     targetID,
		TargetTitle:  title,
		Category:     category,
		Description:  description,
		EvidenceURLs: evidence,
		Status:       "submitted",
		Priority:     priority,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.repo.CreateReport(ctx, report); err != nil {
		return nil, err
	}

	caseObj := &models.SafetyCase{
		ID:               uuid.New(),
		CaseNumber:       fmt.Sprintf("CASE-%d", time.Now().UnixNano()%1000000),
		TargetType:       targetType,
		TargetID:         targetID,
		TargetTitle:      title,
		ReporterID:       &reporterID,
		Category:         category,
		Priority:         priority,
		RiskScore:        50.0,
		Status:           "new",
		AssignedTeam:     "General Safety",
		AISummary:        fmt.Sprintf("Report submitted under category %s: %s", category, description),
		AIRecommendation: "Human review required before enforcement.",
		AIConfidence:     0.85,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	_ = s.repo.CreateCase(ctx, caseObj)

	s.LogSafetyEvent(ctx, "trust.report_created", map[string]interface{}{
		"report_id":   report.ID.String(),
		"reporter_id": reporterID.String(),
		"target_type": targetType,
		"target_id":   targetID.String(),
		"category":    category,
	})

	return report, nil
}

func (s *trustSafetyService) GetUserReports(ctx context.Context, userID uuid.UUID) ([]models.SafetyReport, error) {
	reports, err := s.repo.GetUserReports(ctx, userID)
	if err != nil {
		return nil, err
	}

	var redacted []models.SafetyReport
	for _, r := range reports {
		redacted = append(redacted, *s.RedactReporterIdentity(&r))
	}
	return redacted, nil
}

func (s *trustSafetyService) GetAdminReports(ctx context.Context, status string) ([]models.SafetyReport, error) {
	return s.repo.GetAdminReports(ctx, status)
}

func (s *trustSafetyService) GetReportByID(ctx context.Context, id uuid.UUID) (*models.SafetyReport, error) {
	return s.repo.GetReportByID(ctx, id)
}

func (s *trustSafetyService) UpdateReportStatus(ctx context.Context, reportID uuid.UUID, status string, notes string, adminID *uuid.UUID) error {
	return s.repo.UpdateReportStatus(ctx, reportID, status, notes, adminID)
}

func (s *trustSafetyService) BlockUser(ctx context.Context, blockerID uuid.UUID, blockedType string, blockedID uuid.UUID, reason string) error {
	block := &models.UserBlock{
		ID:          uuid.New(),
		BlockerID:   blockerID,
		BlockedType: blockedType,
		BlockedID:   blockedID,
		Reason:      reason,
		Scope:       "all",
		CreatedAt:   time.Now(),
	}
	return s.repo.BlockUser(ctx, block)
}

func (s *trustSafetyService) UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	return s.repo.UnblockUser(ctx, blockerID, blockedID)
}

func (s *trustSafetyService) GetUserBlocks(ctx context.Context, blockerID uuid.UUID) ([]models.UserBlock, error) {
	return s.repo.GetUserBlocks(ctx, blockerID)
}

func (s *trustSafetyService) IsBlocked(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) (bool, error) {
	return s.repo.IsBlocked(ctx, blockerID, blockedID)
}

func (s *trustSafetyService) MuteEntity(ctx context.Context, userID uuid.UUID, mutedType string, mutedID uuid.UUID, durationDays int) error {
	var expiresAt *time.Time
	if durationDays > 0 {
		t := time.Now().AddDate(0, 0, durationDays)
		expiresAt = &t
	}

	mute := &models.UserMute{
		ID:        uuid.New(),
		UserID:    userID,
		MutedType: mutedType,
		MutedID:   mutedID,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}
	return s.repo.MuteEntity(ctx, mute)
}

func (s *trustSafetyService) UnmuteEntity(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) error {
	return s.repo.UnmuteEntity(ctx, userID, mutedID)
}

func (s *trustSafetyService) GetUserMutes(ctx context.Context, userID uuid.UUID) ([]models.UserMute, error) {
	return s.repo.GetUserMutes(ctx, userID)
}

func (s *trustSafetyService) IsMuted(ctx context.Context, userID uuid.UUID, mutedID uuid.UUID) (bool, error) {
	return s.repo.IsMuted(ctx, userID, mutedID)
}

func (s *trustSafetyService) GetAdminCases(ctx context.Context, status string) ([]models.SafetyCase, error) {
	return s.repo.GetAdminCases(ctx, status)
}

func (s *trustSafetyService) GetCaseByID(ctx context.Context, id uuid.UUID) (*models.SafetyCase, error) {
	return s.repo.GetCaseByID(ctx, id)
}

func (s *trustSafetyService) ClaimCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID) error {
	return s.repo.ClaimCase(ctx, caseID, adminID)
}

func (s *trustSafetyService) AssignCase(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, team string) error {
	return s.repo.AssignCase(ctx, caseID, adminID, team)
}

func (s *trustSafetyService) GetUserActiveRestrictions(ctx context.Context, userID uuid.UUID) ([]models.UserRestriction, error) {
	_, _ = s.CleanExpiredRestrictions(ctx, userID)
	restrictions, err := s.repo.GetUserActiveRestrictions(ctx, userID)
	if err != nil {
		return nil, err
	}
	var unexpired []models.UserRestriction
	now := time.Now()
	for _, r := range restrictions {
		if r.IsActive && (r.ExpiresAt == nil || r.ExpiresAt.After(now)) {
			unexpired = append(unexpired, r)
		}
	}
	return unexpired, nil
}

func (s *trustSafetyService) CleanExpiredRestrictions(ctx context.Context, userID uuid.UUID) (int, error) {
	restrictions, err := s.repo.GetUserActiveRestrictions(ctx, userID)
	if err != nil {
		return 0, err
	}

	cleanedCount := 0
	now := time.Now()
	for _, r := range restrictions {
		if r.IsActive && r.ExpiresAt != nil && (r.ExpiresAt.Before(now) || r.ExpiresAt.Equal(now)) {
			if err := s.repo.DeactivateRestriction(ctx, r.ID); err == nil {
				cleanedCount++
			}
		}
	}
	return cleanedCount, nil
}

func (s *trustSafetyService) SanitizeDescription(description string) string {
	re := regexp.MustCompile("<[^>]*>")
	cleaned := re.ReplaceAllString(description, "")
	cleaned = strings.TrimSpace(cleaned)
	runes := []rune(cleaned)
	if len(runes) > 4000 {
		return string(runes[:4000])
	}
	return cleaned
}

func (s *trustSafetyService) RedactReporterIdentity(report *models.SafetyReport) *models.SafetyReport {
	if report == nil {
		return nil
	}
	redacted := *report
	redacted.ReporterID = uuid.Nil
	redacted.ResolutionNotes = ""
	return &redacted
}

func (s *trustSafetyService) ApplyModerationAction(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, actionType string, level string, reason string, durationDays int) (*models.ModerationDecision, error) {
	return s.ApplyModerationDecision(ctx, caseID, adminID, actionType, level, reason, "1.0.0", durationDays)
}

func (s *trustSafetyService) ApplyModerationDecision(ctx context.Context, caseID uuid.UUID, adminID uuid.UUID, actionType string, level string, reason string, policyVersion string, durationDays int) (*models.ModerationDecision, error) {
	if actionType == "permanent_suspension" && adminID == uuid.Nil {
		return nil, errors.New("HUMAN_OVERVIEW_REQUIRED: Permanent suspension requires explicit human moderator authorization.")
	}

	if policyVersion == "" {
		policyVersion = "1.0.0"
	}

	var expiresAt *time.Time
	if durationDays > 0 {
		t := time.Now().AddDate(0, 0, durationDays)
		expiresAt = &t
	}

	decision := &models.ModerationDecision{
		ID:               uuid.New(),
		CaseID:           &caseID,
		AdminID:          adminID,
		TargetType:       "user",
		TargetID:         uuid.New(),
		ActionType:       actionType,
		EnforcementLevel: level,
		Reason:           reason,
		PolicyVersion:    policyVersion,
		DurationDays:     durationDays,
		ExpiresAt:        expiresAt,
		IsActive:         true,
		AIAssisted:       true,
		CreatedAt:        time.Now(),
	}

	if caseObj, err := s.repo.GetCaseByID(ctx, caseID); err == nil && caseObj != nil {
		decision.TargetType = caseObj.TargetType
		decision.TargetID = caseObj.TargetID
	}

	if err := s.repo.CreateModerationDecision(ctx, decision); err != nil {
		return nil, err
	}

	if actionType == "messaging_restriction" || actionType == "job_posting_restriction" || actionType == "application_restriction" || actionType == "temporary_suspension" {
		restriction := &models.UserRestriction{
			ID:               uuid.New(),
			UserID:           decision.TargetID,
			RestrictionScope: actionType,
			Reason:           reason,
			StartsAt:         time.Now(),
			ExpiresAt:        expiresAt,
			CreatedBy:        &adminID,
			IsActive:         true,
			CreatedAt:        time.Now(),
		}
		_ = s.repo.CreateRestriction(ctx, restriction)
	}

	s.LogSafetyEvent(ctx, "trust.user_restricted", map[string]interface{}{
		"decision_id":    decision.ID.String(),
		"case_id":        caseID.String(),
		"action_type":    actionType,
		"policy_version": policyVersion,
		"target_id":      decision.TargetID.String(),
	})

	return decision, nil
}

func (s *trustSafetyService) SubmitAppeal(ctx context.Context, decisionID uuid.UUID, userID uuid.UUID, reason string, explanation string, evidence []string) (*models.SafetyAppeal, error) {
	appeal := &models.SafetyAppeal{
		ID:           uuid.New(),
		DecisionID:   decisionID,
		UserID:       userID,
		Reason:       reason,
		Explanation:  explanation,
		EvidenceURLs: evidence,
		Status:       "submitted",
		SubmittedAt:  time.Now(),
	}

	if err := s.repo.CreateAppeal(ctx, appeal); err != nil {
		return nil, err
	}

	s.LogSafetyEvent(ctx, "trust.appeal_created", map[string]interface{}{
		"appeal_id":   appeal.ID.String(),
		"decision_id": decisionID.String(),
		"user_id":     userID.String(),
		"reason":      reason,
	})

	return appeal, nil
}

func (s *trustSafetyService) GetUserAppeals(ctx context.Context, userID uuid.UUID) ([]models.SafetyAppeal, error) {
	return s.repo.GetUserAppeals(ctx, userID)
}

func (s *trustSafetyService) GetAdminAppeals(ctx context.Context, status string) ([]models.SafetyAppeal, error) {
	return s.repo.GetAdminAppeals(ctx, status)
}

func (s *trustSafetyService) GetAppealByID(ctx context.Context, id uuid.UUID) (*models.SafetyAppeal, error) {
	return s.repo.GetAppealByID(ctx, id)
}

func (s *trustSafetyService) ResolveAppeal(ctx context.Context, appealID uuid.UUID, adminID uuid.UUID, status string, notes string) error {
	appeal, err := s.repo.GetAppealByID(ctx, appealID)
	if err != nil || appeal == nil {
		return errors.New("appeal not found")
	}

	// Enforce independent reviewer constraint: reviewerID != originalModeratorID
	if decision, err := s.repo.GetDecisionByID(ctx, appeal.DecisionID); err == nil && decision != nil {
		if decision.AdminID != uuid.Nil && decision.AdminID == adminID {
			return errors.New("INDEPENDENT_REVIEWER_REQUIRED: Appeal reviewer cannot be the original moderator who made the enforcement decision.")
		}
	}

	if err := s.repo.ResolveAppeal(ctx, appealID, status, notes, adminID); err != nil {
		return err
	}

	if status == "approved" {
		restrictions, err := s.repo.GetUserActiveRestrictions(ctx, appeal.UserID)
		if err == nil {
			for _, restriction := range restrictions {
				_ = s.repo.DeactivateRestriction(ctx, restriction.ID)
			}
		}
	}

	s.LogSafetyEvent(ctx, "trust.appeal_resolved", map[string]interface{}{
		"appeal_id":   appealID.String(),
		"reviewer_id": adminID.String(),
		"status":      status,
		"user_id":     appeal.UserID.String(),
	})

	return nil
}

func (s *trustSafetyService) EvaluateJobScamRisk(ctx context.Context, jobTitle string, jobDescription string, salaryRange string) (float64, string) {
	score := 10.0
	triggers := []string{}

	descLower := strings.ToLower(jobDescription)
	if strings.Contains(descLower, "wire transfer") || strings.Contains(descLower, "western union") || strings.Contains(descLower, "pay fee before starting") {
		score += 65.0
		triggers = append(triggers, "advance_payment_request")
	}
	if strings.Contains(descLower, "telegram") || strings.Contains(descLower, "whatsapp only") {
		score += 20.0
		triggers = append(triggers, "off_platform_communication")
	}

	if score > 100.0 {
		score = 100.0
	}
	return score, strings.Join(triggers, ", ")
}

func (s *trustSafetyService) EvaluateContentModeration(ctx context.Context, contentType string, content string, metadata map[string]string) (float64, []string, bool) {
	confidence := 0.0
	reasons := []string{}

	text := strings.ToLower(content)

	if strings.Contains(text, "http://") || strings.Contains(text, "bit.ly/") || strings.Contains(text, "tinyurl.com/") {
		confidence += 0.35
		reasons = append(reasons, "SUSPICIOUS_SHORT_URL")
	}

	if strings.Contains(text, "wire transfer") || strings.Contains(text, "western union") || strings.Contains(text, "gift card") || strings.Contains(text, "crypto deposit") {
		confidence += 0.50
		reasons = append(reasons, "ADVANCE_FEE_SCAM_KEYWORDS")
	}

	if strings.Contains(text, "contact on telegram") || strings.Contains(text, "whatsapp only") {
		confidence += 0.25
		reasons = append(reasons, "OFF_PLATFORM_REDIRECT")
	}

	if strings.Contains(text, "buy cheap") || strings.Contains(text, "guaranteed profit") || strings.Contains(text, "earn $10,000 daily") {
		confidence += 0.40
		reasons = append(reasons, "SPAM_PROMOTIONAL_TEXT")
	}

	if confidence > 1.0 {
		confidence = 1.0
	}

	flagged := confidence >= 0.50
	return confidence, reasons, flagged
}

func (s *trustSafetyService) LogSafetyEvent(ctx context.Context, eventType string, payload map[string]interface{}) string {
	correlationID := uuid.New().String()
	slog.Info("Safety Event Dispatched",
		slog.String("event_type", eventType),
		slog.String("correlation_id", correlationID),
		slog.Any("payload", payload),
	)
	return correlationID
}

func (s *trustSafetyService) GetSafetyMetricsSummary(ctx context.Context) (*models.SafetyMetricsSummary, error) {
	return s.repo.GetSafetyMetricsSummary(ctx)
}

func (s *trustSafetyService) GetSafetyRules(ctx context.Context) ([]models.SafetyRule, error) {
	return s.repo.GetSafetyRules(ctx)
}

func (s *trustSafetyService) UpdateSafetyRule(ctx context.Context, rule *models.SafetyRule) error {
	return s.repo.UpdateSafetyRule(ctx, rule)
}

func (s *trustSafetyService) GetSafetyPolicies(ctx context.Context) ([]models.SafetyPolicyItem, error) {
	return s.repo.GetSafetyPolicies(ctx)
}

func (s *trustSafetyService) GetSafetyPolicyByID(ctx context.Context, id uuid.UUID) (*models.SafetyPolicyItem, error) {
	return s.repo.GetSafetyPolicyByID(ctx, id)
}

func (s *trustSafetyService) CreateSafetyPolicy(ctx context.Context, payload models.CreatePolicyPayload) (*models.SafetyPolicyItem, error) {
	version := payload.Version
	if version == "" {
		version = "1.0.0"
	}

	item := &models.SafetyPolicyItem{
		ID:                  uuid.New(),
		Code:                payload.Code,
		Title:               payload.Title,
		Category:            payload.Category,
		Description:         payload.Description,
		Severity:            payload.Severity,
		EnforcementGuidance: payload.EnforcementGuidance,
		Version:             version,
		IsActive:            true,
	}

	if err := s.repo.CreateSafetyPolicy(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *trustSafetyService) UpdateSafetyPolicy(ctx context.Context, id uuid.UUID, payload models.UpdatePolicyPayload) (*models.SafetyPolicyItem, error) {
	item, err := s.repo.GetSafetyPolicyByID(ctx, id)
	if err != nil || item == nil {
		return nil, errors.New("policy item not found")
	}

	if payload.Title != "" {
		item.Title = payload.Title
	}
	if payload.Description != "" {
		item.Description = payload.Description
	}
	if payload.Severity != "" {
		item.Severity = payload.Severity
	}
	if payload.EnforcementGuidance != "" {
		item.EnforcementGuidance = payload.EnforcementGuidance
	}
	if payload.Version != "" {
		item.Version = payload.Version
	}
	if payload.IsActive != nil {
		item.IsActive = *payload.IsActive
	}

	if err := s.repo.UpdateSafetyPolicy(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *trustSafetyService) GetUserReputation(ctx context.Context, userID uuid.UUID) (*models.ReputationSignal, error) {
	return s.repo.GetUserReputation(ctx, userID)
}

func (s *trustSafetyService) ReinstateUser(ctx context.Context, adminID uuid.UUID, payload models.ReinstateUserPayload) error {
	userUUID, err := uuid.Parse(payload.UserID)
	if err != nil {
		return errors.New("invalid user_id format")
	}

	rep, err := s.repo.GetUserReputation(ctx, userUUID)
	if err != nil || rep == nil {
		rep = &models.ReputationSignal{UserID: userUUID, Score: 50.0}
	}

	rep.Score = 100.0
	rep.ReinstatementsCount++
	_ = s.repo.UpdateUserReputation(ctx, rep)

	if payload.LiftRestrictions {
		restrictions, err := s.repo.GetUserActiveRestrictions(ctx, userUUID)
		if err == nil {
			for _, r := range restrictions {
				_ = s.repo.DeactivateRestriction(ctx, r.ID)
			}
		}
	}

	s.LogSafetyEvent(ctx, "trust.user_reinstated", map[string]interface{}{
		"admin_id": adminID.String(),
		"user_id":  userUUID.String(),
		"reason":   payload.Reason,
	})

	return nil
}

func (s *trustSafetyService) LogEvidenceItem(ctx context.Context, caseID *uuid.UUID, reportID *uuid.UUID, source string, evidenceType string, contentPreview string) (*models.EvidenceItem, error) {
	item := &models.EvidenceItem{
		ID:               uuid.New(),
		CaseID:           caseID,
		ReportID:         reportID,
		Source:           source,
		EvidenceType:     evidenceType,
		ContentPreview:   contentPreview,
		AccessRestricted: false,
		CreatedAt:        time.Now(),
	}

	if err := s.repo.LogEvidenceItem(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *trustSafetyService) GetCaseEvidence(ctx context.Context, caseID uuid.UUID) ([]models.EvidenceItem, error) {
	return s.repo.GetCaseEvidence(ctx, caseID)
}

func (s *trustSafetyService) GetModeratorWorkloads(ctx context.Context) ([]models.ModeratorWorkload, error) {
	return s.repo.GetModeratorWorkloads(ctx)
}
