package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"kirmya/internal/security/models"
	"kirmya/internal/security/repository"
)

type SecurityService interface {
	GetSecurityOverview(ctx context.Context, userID uuid.UUID) (*models.SecurityOverview, error)
	EvaluatePasswordPolicy(password string) *models.PasswordPolicyResult
	ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword string, newPassword string) error
	RecordFailedLogin(ctx context.Context, identifier string) (int, bool, time.Time, error)
	ResetFailedLogin(ctx context.Context, identifier string) error
	IsLockedOut(ctx context.Context, identifier string) (bool, time.Time, error)
	SetupMFA(ctx context.Context, userID uuid.UUID) (*models.MFASetupResponse, error)
	VerifyAndEnableMFA(ctx context.Context, userID uuid.UUID, code string) error
	DisableMFA(ctx context.Context, userID uuid.UUID) error
	VerifyMFACodeOrRecovery(ctx context.Context, userID uuid.UUID, code string) (bool, error)
	GetActiveSessions(ctx context.Context, userID uuid.UUID, currentToken string) ([]models.SessionItem, error)
	RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error
	RevokeAllOtherSessions(ctx context.Context, userID uuid.UUID, currentToken string) error
	GetTrustedDevices(ctx context.Context, userID uuid.UUID) ([]models.DeviceItem, error)
	RegisterDevice(ctx context.Context, userID uuid.UUID, device models.DeviceItem) (*models.DeviceItem, error)
	UpdateDeviceTrustStatus(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID, status string) error
	RemoveDevice(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID) error
	DetectSuspiciousLogin(ctx context.Context, userID uuid.UUID, ip string, userAgent string, location string) (bool, string, error)
	GetLoginHistory(ctx context.Context, userID uuid.UUID) ([]models.LoginHistoryItem, error)
	CreateAPIKey(ctx context.Context, userID uuid.UUID, payload models.CreateAPIKeyPayload) (*models.CreateAPIKeyResponse, error)
	GetAPIKeys(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error)
	RevokeAPIKey(ctx context.Context, userID uuid.UUID, keyID uuid.UUID) error
	GetSecurityEvents(ctx context.Context, userID uuid.UUID) ([]models.SecurityEvent, error)
	GetPrivacySettings(ctx context.Context, userID uuid.UUID) (*models.PrivacySettings, error)
	UpdatePrivacySettings(ctx context.Context, userID uuid.UUID, payload models.PrivacySettingsPayload) (*models.PrivacySettings, error)
	RequestDataExport(ctx context.Context, userID uuid.UUID) (*models.DataExportRequest, error)
	GetDataExports(ctx context.Context, userID uuid.UUID) ([]models.DataExportRequest, error)
	RequestAccountDeletion(ctx context.Context, userID uuid.UUID, reason string, confirmPassword string) (*models.AccountDeletionRequest, error)
	GetAccountDeletionStatus(ctx context.Context, userID uuid.UUID) (*models.AccountDeletionRequest, error)
	CancelAccountDeletion(ctx context.Context, userID uuid.UUID) error
	GetAdminSecuritySummary(ctx context.Context) (*models.SecurityDashboardSummary, error)
	GetSecurityIncidents(ctx context.Context) ([]models.SecurityIncident, error)
	CreateSecurityIncident(ctx context.Context, incident *models.SecurityIncident) error

	// Threat Detection, Risk Scoring & Abuse Protection
	LogSecurityEvent(ctx context.Context, userID *uuid.UUID, eventType string, severity string, ip string, userAgent string, location string, details map[string]interface{}) (*models.SecurityEventDetail, error)
	EvaluateAccountRisk(ctx context.Context, userID uuid.UUID, failedLogins int, rapidProfileEdits int, rateLimitTriggers int, spamReports int, isBot bool) (*models.AccountRiskScore, error)
	GetAccountRiskScore(ctx context.Context, userID uuid.UUID) (*models.AccountRiskScore, error)
	GetAccountRiskScores(ctx context.Context) ([]models.AccountRiskScore, error)
	EvaluateSecurityRules(ctx context.Context, ruleID string, candidateCount int, windowSeconds int) (bool, string, error)
	GetSecurityRules(ctx context.Context) ([]models.SecurityRule, error)
	UpdateSecurityRule(ctx context.Context, ruleID string, payload models.UpdateSecurityRulePayload) (*models.SecurityRule, error)
	GetSecurityAlerts(ctx context.Context, status string, severity string) ([]models.SecurityAlert, error)
	GetSecurityAlertByID(ctx context.Context, alertID uuid.UUID) (*models.SecurityAlert, error)
	UpdateSecurityAlertStatus(ctx context.Context, alertID uuid.UUID, payload models.UpdateSecurityAlertPayload) (*models.SecurityAlert, error)
	ResolveSecurityAlert(ctx context.Context, alertID uuid.UUID, payload models.ResolveAlertPayload) (*models.SecurityAlert, error)
	DetectBotActivity(ctx context.Context, ip string, userAgent string, burstRate int, endpoint string) (*models.BotDetectionSignal, error)
	GetBotSignals(ctx context.Context) ([]models.BotDetectionSignal, error)
	DetectFraud(ctx context.Context, entityType string, entityID string, fraudType string, metrics map[string]interface{}) (*models.FraudAlert, error)
	GetFraudAlerts(ctx context.Context) ([]models.FraudAlert, error)
}

type securityService struct {
	repo repository.SecurityRepository
}

func NewSecurityService(repo repository.SecurityRepository) SecurityService {
	return &securityService{repo: repo}
}

func (s *securityService) GetSecurityOverview(ctx context.Context, userID uuid.UUID) (*models.SecurityOverview, error) {
	return s.repo.GetSecurityOverview(ctx, userID)
}

func (s *securityService) EvaluatePasswordPolicy(password string) *models.PasswordPolicyResult {
	res := &models.PasswordPolicyResult{
		Feedback: make([]string, 0),
	}

	if len(password) >= 12 {
		res.HasMinLength = true
		res.Score += 20
		if len(password) >= 16 {
			res.Score += 10
		}
	} else {
		res.Feedback = append(res.Feedback, "Password must be at least 12 characters long.")
	}

	for _, r := range password {
		if unicode.IsUpper(r) {
			res.HasUppercase = true
		} else if unicode.IsLower(r) {
			res.HasLowercase = true
		} else if unicode.IsDigit(r) {
			res.HasNumber = true
		} else if unicode.IsPunct(r) || unicode.IsSymbol(r) {
			res.HasSpecialChar = true
		}
	}

	if res.HasUppercase {
		res.Score += 20
	} else {
		res.Feedback = append(res.Feedback, "Include at least one uppercase letter.")
	}

	if res.HasLowercase {
		res.Score += 20
	} else {
		res.Feedback = append(res.Feedback, "Include at least one lowercase letter.")
	}

	if res.HasNumber {
		res.Score += 15
	} else {
		res.Feedback = append(res.Feedback, "Include at least one numerical digit.")
	}

	if res.HasSpecialChar {
		res.Score += 15
	} else {
		res.Feedback = append(res.Feedback, "Include at least one special character.")
	}

	res.IsValid = res.HasMinLength && res.HasUppercase && res.HasLowercase && res.HasNumber && res.HasSpecialChar
	return res
}

func (s *securityService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword string, newPassword string) error {
	policyResult := s.EvaluatePasswordPolicy(newPassword)
	if !policyResult.IsValid {
		return fmt.Errorf("INVALID_PASSWORD: %s", strings.Join(policyResult.Feedback, " "))
	}

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}

	if err := s.repo.UpdateUserPasswordHash(ctx, userID, string(hashBytes)); err != nil {
		return err
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    &userID,
		EventType: "login.password_changed",
		Severity:  "medium",
		Location:  "Web Dashboard",
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)
	return nil
}

func (s *securityService) RecordFailedLogin(ctx context.Context, identifier string) (int, bool, time.Time, error) {
	count, lockedUntil, err := s.repo.IncrementFailedLoginAttempts(ctx, identifier)
	if err != nil {
		return 0, false, time.Time{}, err
	}

	isLocked := count >= 5
	if isLocked {
		event := &models.SecurityEvent{
			ID:        uuid.New(),
			EventType: "brute_force_lockout_triggered",
			Severity:  "high",
			Details:   fmt.Sprintf("Identifier %s temporarily locked out due to %d failed login attempts", identifier, count),
			CreatedAt: time.Now(),
		}
		_ = s.repo.RecordSecurityEvent(ctx, event)
	}

	return count, isLocked, lockedUntil, nil
}

func (s *securityService) ResetFailedLogin(ctx context.Context, identifier string) error {
	return s.repo.ResetFailedLoginAttempts(ctx, identifier)
}

func (s *securityService) IsLockedOut(ctx context.Context, identifier string) (bool, time.Time, error) {
	_, lockedUntil, err := s.repo.GetFailedLoginAttempts(ctx, identifier)
	if err != nil {
		return false, time.Time{}, err
	}
	if !lockedUntil.IsZero() && lockedUntil.After(time.Now()) {
		return true, lockedUntil, nil
	}
	return false, time.Time{}, nil
}

func (s *securityService) SetupMFA(ctx context.Context, userID uuid.UUID) (*models.MFASetupResponse, error) {
	buf := make([]byte, 10)
	_, _ = rand.Read(buf)
	secret := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(buf)

	qrURI := fmt.Sprintf("otpauth://totp/Kirmya:user?secret=%s&issuer=Kirmya", secret)

	recoveryCodes := make([]string, 8)
	for i := 0; i < 8; i++ {
		codeBuf := make([]byte, 4)
		_, _ = rand.Read(codeBuf)
		recoveryCodes[i] = fmt.Sprintf("REC-%X", codeBuf)
	}

	return &models.MFASetupResponse{
		Secret:        secret,
		QRCodeURI:     qrURI,
		RecoveryCodes: recoveryCodes,
	}, nil
}

func (s *securityService) VerifyAndEnableMFA(ctx context.Context, userID uuid.UUID, code string) error {
	if len(code) != 6 {
		return errors.New("INVALID_MFA_CODE: TOTP verification code must be 6 digits.")
	}

	hashes := make([]string, 8)
	for i := 0; i < 8; i++ {
		h := sha256.Sum256([]byte(fmt.Sprintf("REC-%d", i)))
		hashes[i] = hex.EncodeToString(h[:])
	}

	err := s.repo.EnableMFA(ctx, userID, "SECRET_ENABLED", hashes)
	if err != nil {
		return err
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    &userID,
		EventType: "security.mfa.enabled",
		Severity:  "medium",
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)
	return nil
}

func (s *securityService) DisableMFA(ctx context.Context, userID uuid.UUID) error {
	err := s.repo.DisableMFA(ctx, userID)
	if err != nil {
		return err
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    &userID,
		EventType: "security.mfa.disabled",
		Severity:  "high",
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)
	return nil
}

func (s *securityService) VerifyMFACodeOrRecovery(ctx context.Context, userID uuid.UUID, code string) (bool, error) {
	if len(code) == 6 {
		// Mock TOTP verification
		return true, nil
	}

	if strings.HasPrefix(code, "REC-") {
		h := sha256.Sum256([]byte(code))
		codeHash := hex.EncodeToString(h[:])
		valid, err := s.repo.UseRecoveryCode(ctx, userID, codeHash)
		if err != nil {
			return false, err
		}
		return valid, nil
	}

	return false, errors.New("INVALID_MFA_FORMAT: Expected 6-digit TOTP code or recovery code starting with REC-")
}

func (s *securityService) GetActiveSessions(ctx context.Context, userID uuid.UUID, currentToken string) ([]models.SessionItem, error) {
	return s.repo.GetActiveSessions(ctx, userID, currentToken)
}

func (s *securityService) RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	// IDOR check
	sess, err := s.repo.GetSessionByID(ctx, sessionID)
	if err == nil && sess != nil && sess.UserID != userID {
		return errors.New("FORBIDDEN_IDOR: Cannot revoke session belonging to another user account")
	}
	return s.repo.RevokeSession(ctx, userID, sessionID)
}

func (s *securityService) RevokeAllOtherSessions(ctx context.Context, userID uuid.UUID, currentToken string) error {
	return s.repo.RevokeAllOtherSessions(ctx, userID, currentToken)
}

func (s *securityService) GetTrustedDevices(ctx context.Context, userID uuid.UUID) ([]models.DeviceItem, error) {
	return s.repo.GetTrustedDevices(ctx, userID)
}

func (s *securityService) RegisterDevice(ctx context.Context, userID uuid.UUID, device models.DeviceItem) (*models.DeviceItem, error) {
	device.UserID = userID
	device.TrustedStatus = "trusted"
	err := s.repo.RegisterDevice(ctx, &device)
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (s *securityService) UpdateDeviceTrustStatus(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID, status string) error {
	// IDOR check
	dev, err := s.repo.GetDeviceByID(ctx, deviceID)
	if err == nil && dev != nil && dev.UserID != userID {
		return errors.New("FORBIDDEN_IDOR: Cannot modify device belonging to another user account")
	}
	return s.repo.UpdateDeviceTrustStatus(ctx, userID, deviceID, status)
}

func (s *securityService) RemoveDevice(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID) error {
	// IDOR check
	dev, err := s.repo.GetDeviceByID(ctx, deviceID)
	if err == nil && dev != nil && dev.UserID != userID {
		return errors.New("FORBIDDEN_IDOR: Cannot remove device belonging to another user account")
	}
	return s.repo.RemoveDevice(ctx, userID, deviceID)
}

func (s *securityService) DetectSuspiciousLogin(ctx context.Context, userID uuid.UUID, ip string, userAgent string, location string) (bool, string, error) {
	history, err := s.repo.GetLoginHistory(ctx, userID)
	if err != nil {
		return false, "", err
	}

	isSuspicious := false
	reason := ""
	if len(history) > 0 {
		last := history[0]
		if last.Location != "" && location != "" && last.Location != location {
			isSuspicious = true
			reason = fmt.Sprintf("Unusual login location detected: %s (previous: %s)", location, last.Location)
		}
	}

	if isSuspicious {
		event := &models.SecurityEvent{
			ID:        uuid.New(),
			UserID:    &userID,
			EventType: "suspicious_login_detected",
			Severity:  "high",
			IPAddress: ip,
			UserAgent: userAgent,
			Location:  location,
			Details:   reason,
			CreatedAt: time.Now(),
		}
		_ = s.repo.RecordSecurityEvent(ctx, event)
	}

	return isSuspicious, reason, nil
}

func (s *securityService) GetLoginHistory(ctx context.Context, userID uuid.UUID) ([]models.LoginHistoryItem, error) {
	return s.repo.GetLoginHistory(ctx, userID)
}

func (s *securityService) CreateAPIKey(ctx context.Context, userID uuid.UUID, payload models.CreateAPIKeyPayload) (*models.CreateAPIKeyResponse, error) {
	rawSecretBuf := make([]byte, 24)
	_, _ = rand.Read(rawSecretBuf)
	rawSecret := "krm_live_" + hex.EncodeToString(rawSecretBuf)

	hasher := sha256.New()
	hasher.Write([]byte(rawSecret))
	keyHash := hex.EncodeToString(hasher.Sum(nil))
	_ = keyHash

	keyPrefix := rawSecret[:12]

	scopes := payload.Scopes
	if scopes == "" {
		scopes = "profile.read,jobs.read"
	}

	apiKey := &models.APIKey{
		ID:        uuid.New(),
		UserID:    userID,
		Name:      payload.Name,
		KeyPrefix: keyPrefix,
		Scopes:    scopes,
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreateAPIKey(ctx, apiKey); err != nil {
		return nil, err
	}

	return &models.CreateAPIKeyResponse{
		APIKey: *apiKey,
		Secret: rawSecret,
	}, nil
}

func (s *securityService) GetAPIKeys(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error) {
	return s.repo.GetAPIKeys(ctx, userID)
}

func (s *securityService) RevokeAPIKey(ctx context.Context, userID uuid.UUID, keyID uuid.UUID) error {
	// IDOR check
	key, err := s.repo.GetAPIKeyByID(ctx, keyID)
	if err == nil && key != nil && key.UserID != userID {
		return errors.New("FORBIDDEN_IDOR: Cannot revoke API key belonging to another user account")
	}
	return s.repo.RevokeAPIKey(ctx, userID, keyID)
}

func (s *securityService) GetSecurityEvents(ctx context.Context, userID uuid.UUID) ([]models.SecurityEvent, error) {
	return s.repo.GetSecurityEvents(ctx, userID)
}

func (s *securityService) GetPrivacySettings(ctx context.Context, userID uuid.UUID) (*models.PrivacySettings, error) {
	return s.repo.GetPrivacySettings(ctx, userID)
}

func (s *securityService) UpdatePrivacySettings(ctx context.Context, userID uuid.UUID, payload models.PrivacySettingsPayload) (*models.PrivacySettings, error) {
	res, err := s.repo.UpsertPrivacySettings(ctx, userID, &payload)
	if err != nil {
		return nil, err
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    &userID,
		EventType: "privacy_settings_updated",
		Severity:  "low",
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)
	return res, nil
}

func (s *securityService) RequestDataExport(ctx context.Context, userID uuid.UUID) (*models.DataExportRequest, error) {
	req, err := s.repo.CreateDataExportRequest(ctx, userID)
	if err != nil {
		return nil, err
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    &userID,
		EventType: "gdpr_data_export_requested",
		Severity:  "medium",
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)
	return req, nil
}

func (s *securityService) GetDataExports(ctx context.Context, userID uuid.UUID) ([]models.DataExportRequest, error) {
	return s.repo.GetDataExportRequests(ctx, userID)
}

func (s *securityService) RequestAccountDeletion(ctx context.Context, userID uuid.UUID, reason string, confirmPassword string) (*models.AccountDeletionRequest, error) {
	if confirmPassword == "" {
		return nil, errors.New("INVALID_REQUEST: Confirmation password required for account deletion")
	}

	req := &models.AccountDeletionRequest{
		ID:           uuid.New(),
		UserID:       userID,
		Reason:       reason,
		ScheduledFor: time.Now().AddDate(0, 0, 30),
		RequestedAt:  time.Now(),
	}

	res, err := s.repo.CreateAccountDeletionRequest(ctx, req)
	if err != nil {
		return nil, err
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    &userID,
		EventType: "account_deletion_requested",
		Severity:  "high",
		Details:   fmt.Sprintf("Account deletion scheduled for 30 days grace period. Reason: %s", reason),
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)
	return res, nil
}

func (s *securityService) GetAccountDeletionStatus(ctx context.Context, userID uuid.UUID) (*models.AccountDeletionRequest, error) {
	return s.repo.GetAccountDeletionRequest(ctx, userID)
}

func (s *securityService) CancelAccountDeletion(ctx context.Context, userID uuid.UUID) error {
	err := s.repo.CancelAccountDeletionRequest(ctx, userID)
	if err != nil {
		return err
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    &userID,
		EventType: "account_deletion_cancelled",
		Severity:  "medium",
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)
	return nil
}

func (s *securityService) GetAdminSecuritySummary(ctx context.Context) (*models.SecurityDashboardSummary, error) {
	return s.repo.GetAdminSecuritySummary(ctx)
}

func (s *securityService) GetSecurityIncidents(ctx context.Context) ([]models.SecurityIncident, error) {
	return s.repo.GetSecurityIncidents(ctx)
}

func (s *securityService) CreateSecurityIncident(ctx context.Context, incident *models.SecurityIncident) error {
	incident.ID = uuid.New()
	incident.CreatedAt = time.Now()
	incident.Status = "open"
	return s.repo.CreateSecurityIncident(ctx, incident)
}

func sanitizeDetails(details map[string]interface{}) map[string]interface{} {
	if details == nil {
		return map[string]interface{}{}
	}
	sanitized := make(map[string]interface{})
	sensitiveKeys := []string{
		"password", "current_password", "new_password", "confirm_password",
		"token", "access_token", "refresh_token", "authorization",
		"secret", "mfa_secret", "private_key", "api_key",
		"credit_card", "card_number", "cvv", "ssn",
	}

	for k, v := range details {
		kLower := strings.ToLower(k)
		isSensitive := false
		for _, sk := range sensitiveKeys {
			if strings.Contains(kLower, sk) {
				isSensitive = true
				break
			}
		}
		if isSensitive {
			sanitized[k] = "***REDACTED***"
		} else {
			sanitized[k] = v
		}
	}
	return sanitized
}

func calculateSeverity(eventType string) string {
	switch strings.ToLower(eventType) {
	case "fake_job", "mass_messaging", "mass_application", "bot_detected", "fraud_alert":
		return "Critical"
	case "login.failure", "rate_limit_exceeded", "suspicious_login", "account_deletion", "brute_force_lockout_triggered":
		return "High"
	case "password.changed", "mfa.enabled", "mfa.disabled", "account_risk_exceeded":
		return "Medium"
	case "login.success", "session.revoked", "api_key.created":
		return "Low"
	default:
		return "Informational"
	}
}

func (s *securityService) LogSecurityEvent(ctx context.Context, userID *uuid.UUID, eventType string, severity string, ip string, userAgent string, location string, details map[string]interface{}) (*models.SecurityEventDetail, error) {
	if severity == "" || strings.EqualFold(severity, "auto") {
		severity = calculateSeverity(eventType)
	}

	safeDetails := sanitizeDetails(details)

	corrID := fmt.Sprintf("sec-corr-%d-%s", time.Now().UnixNano(), uuid.New().String()[:8])

	actorID := "anonymous"
	if userID != nil && *userID != uuid.Nil {
		actorID = userID.String()
	} else if ip != "" {
		actorID = ip
	}

	event := &models.SecurityEvent{
		ID:        uuid.New(),
		UserID:    userID,
		EventType: eventType,
		Severity:  severity,
		IPAddress: ip,
		UserAgent: userAgent,
		Location:  location,
		CreatedAt: time.Now(),
	}
	_ = s.repo.RecordSecurityEvent(ctx, event)

	eventDetail := &models.SecurityEventDetail{
		ID:            uuid.New(),
		CorrelationID: corrID,
		ActorID:       actorID,
		TargetEntity:  eventType,
		RiskLevel:     severity,
		RiskScore:     50,
		SafeDetails:   safeDetails,
		CreatedAt:     time.Now(),
	}
	_ = s.repo.LogSecurityEventDetail(ctx, eventDetail)

	return eventDetail, nil
}

func (s *securityService) EvaluateAccountRisk(ctx context.Context, userID uuid.UUID, failedLogins int, rapidProfileEdits int, rateLimitTriggers int, spamReports int, isBot bool) (*models.AccountRiskScore, error) {
	score := 0
	factors := make([]string, 0)

	if failedLogins > 0 {
		add := failedLogins * 15
		score += add
		factors = append(factors, fmt.Sprintf("Failed login attempts (count: %d)", failedLogins))
	}
	if rapidProfileEdits > 0 {
		add := rapidProfileEdits * 20
		score += add
		factors = append(factors, fmt.Sprintf("Rapid profile edits (count: %d)", rapidProfileEdits))
	}
	if rateLimitTriggers > 0 {
		add := rateLimitTriggers * 25
		score += add
		factors = append(factors, fmt.Sprintf("Rate limit triggers (count: %d)", rateLimitTriggers))
	}
	if spamReports > 0 {
		add := spamReports * 30
		score += add
		factors = append(factors, fmt.Sprintf("Abuse/spam reports (count: %d)", spamReports))
	}
	if isBot {
		score += 35
		factors = append(factors, "Bot activity signal detected")
	}

	if score > 100 {
		score = 100
	}

	riskLevel := "Normal"
	if score >= 90 {
		riskLevel = "Critical"
	} else if score >= 75 {
		riskLevel = "High"
	} else if score >= 50 {
		riskLevel = "Medium"
	} else if score >= 25 {
		riskLevel = "Low"
	}

	riskScore := &models.AccountRiskScore{
		UserID:          userID,
		Score:           score,
		RiskLevel:       riskLevel,
		Factors:         factors,
		LastEvaluatedAt: time.Now(),
	}

	_ = s.repo.UpdateAccountRiskScore(ctx, riskScore)

	if score > 50 {
		alert := &models.SecurityAlert{
			ID:           uuid.New(),
			Title:        fmt.Sprintf("High Account Risk Triggered for User %s", userID),
			Severity:     riskLevel,
			RiskScore:    score,
			Category:     "Account Risk",
			TriggerEvent: "account_risk_threshold_exceeded",
			Status:       "New",
			CreatedAt:    time.Now(),
		}
		_ = s.repo.CreateSecurityAlert(ctx, alert)
	}

	return riskScore, nil
}

func (s *securityService) GetAccountRiskScore(ctx context.Context, userID uuid.UUID) (*models.AccountRiskScore, error) {
	return s.repo.GetAccountRiskScore(ctx, userID)
}

func (s *securityService) GetAccountRiskScores(ctx context.Context) ([]models.AccountRiskScore, error) {
	return s.repo.GetAccountRiskScores(ctx)
}

func (s *securityService) EvaluateSecurityRules(ctx context.Context, ruleID string, candidateCount int, windowSeconds int) (bool, string, error) {
	rule, err := s.repo.GetSecurityRuleByID(ctx, ruleID)
	if err != nil {
		return false, "log", err
	}

	if !rule.IsEnabled {
		return false, rule.Action, nil
	}

	if candidateCount >= rule.ThresholdCount {
		return true, rule.Action, nil
	}

	return false, rule.Action, nil
}

func (s *securityService) GetSecurityRules(ctx context.Context) ([]models.SecurityRule, error) {
	return s.repo.GetSecurityRules(ctx)
}

func (s *securityService) UpdateSecurityRule(ctx context.Context, ruleID string, payload models.UpdateSecurityRulePayload) (*models.SecurityRule, error) {
	rule, err := s.repo.GetSecurityRuleByID(ctx, ruleID)
	if err != nil {
		return nil, err
	}

	if payload.ThresholdCount != nil {
		rule.ThresholdCount = *payload.ThresholdCount
	}
	if payload.TimeWindowSeconds != nil {
		rule.TimeWindowSeconds = *payload.TimeWindowSeconds
	}
	if payload.Action != nil {
		rule.Action = *payload.Action
	}
	if payload.IsEnabled != nil {
		rule.IsEnabled = *payload.IsEnabled
	}

	rule.UpdatedBy = "admin"
	if err := s.repo.UpdateSecurityRule(ctx, rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *securityService) GetSecurityAlerts(ctx context.Context, status string, severity string) ([]models.SecurityAlert, error) {
	return s.repo.GetSecurityAlerts(ctx, status, severity)
}

func (s *securityService) GetSecurityAlertByID(ctx context.Context, alertID uuid.UUID) (*models.SecurityAlert, error) {
	return s.repo.GetSecurityAlertByID(ctx, alertID)
}

func (s *securityService) UpdateSecurityAlertStatus(ctx context.Context, alertID uuid.UUID, payload models.UpdateSecurityAlertPayload) (*models.SecurityAlert, error) {
	alert, err := s.repo.GetSecurityAlertByID(ctx, alertID)
	if err != nil {
		return nil, err
	}

	if payload.Status != nil {
		st := *payload.Status
		validStates := map[string]bool{
			"New": true, "Investigating": true, "Mitigated": true, "Resolved": true, "False Positive": true, "Escalated": true,
		}
		if !validStates[st] {
			return nil, fmt.Errorf("INVALID_ALERT_STATUS: Status '%s' is not valid", st)
		}
		alert.Status = st
		if st == "Resolved" || st == "False Positive" {
			now := time.Now()
			alert.ResolvedAt = &now
		}
	}

	if payload.AssignedAdminID != nil {
		alert.AssignedAdminID = payload.AssignedAdminID
	}

	if payload.ResolutionNotes != nil {
		alert.ResolutionNotes = *payload.ResolutionNotes
	}

	if err := s.repo.UpdateSecurityAlert(ctx, alert); err != nil {
		return nil, err
	}

	return alert, nil
}

func (s *securityService) ResolveSecurityAlert(ctx context.Context, alertID uuid.UUID, payload models.ResolveAlertPayload) (*models.SecurityAlert, error) {
	st := payload.Status
	if st == "" {
		st = "Resolved"
	}
	return s.UpdateSecurityAlertStatus(ctx, alertID, models.UpdateSecurityAlertPayload{
		Status:          &st,
		ResolutionNotes: &payload.ResolutionNotes,
	})
}

func (s *securityService) DetectBotActivity(ctx context.Context, ip string, userAgent string, burstRate int, endpoint string) (*models.BotDetectionSignal, error) {
	confidence := 0
	uaLower := strings.ToLower(userAgent)

	if burstRate > 30 {
		confidence += 50
	} else if burstRate > 10 {
		confidence += 25
	}

	botKeywords := []string{"headless", "bot", "crawler", "spider", "python", "curl", "postman", "phantom", "selenium"}
	for _, kw := range botKeywords {
		if strings.Contains(uaLower, kw) {
			confidence += 40
			break
		}
	}

	if strings.Contains(endpoint, "register") || strings.Contains(endpoint, "login") || strings.Contains(endpoint, "export") {
		confidence += 15
	}

	if confidence > 100 {
		confidence = 100
	}

	isBot := confidence >= 60

	signal := &models.BotDetectionSignal{
		ID:                 uuid.New(),
		IPAddress:          ip,
		UserAgent:          userAgent,
		BurstRate:          burstRate,
		EndpointPattern:    endpoint,
		BotConfidenceScore: confidence,
		IsBot:              isBot,
		CreatedAt:          time.Now(),
	}

	_ = s.repo.LogBotSignal(ctx, signal)

	if isBot {
		alert := &models.SecurityAlert{
			ID:           uuid.New(),
			Title:        fmt.Sprintf("Automated Bot Traffic Detected from IP %s", ip),
			Severity:     "Critical",
			RiskScore:    confidence,
			Category:     "Bot Abuse",
			TriggerEvent: "bot_activity_detected",
			Status:       "New",
			CreatedAt:    time.Now(),
		}
		_ = s.repo.CreateSecurityAlert(ctx, alert)
	}

	return signal, nil
}

func (s *securityService) GetBotSignals(ctx context.Context) ([]models.BotDetectionSignal, error) {
	return s.repo.GetBotSignals(ctx)
}

func (s *securityService) DetectFraud(ctx context.Context, entityType string, entityID string, fraudType string, metrics map[string]interface{}) (*models.FraudAlert, error) {
	score := 50
	reasons := make([]string, 0)

	switch fraudType {
	case "fake_job":
		if salary, ok := metrics["salary"].(float64); ok && salary > 300000 {
			score += 30
			reasons = append(reasons, "Unusually high compensation structure (> $300k)")
		}
		if hasSuspiciousLinks, ok := metrics["suspicious_links"].(bool); ok && hasSuspiciousLinks {
			score += 20
			reasons = append(reasons, "External unverified link references in description")
		}
	case "mass_application":
		if appsPerMin, ok := metrics["apps_per_minute"].(int); ok && appsPerMin > 20 {
			score += 40
			reasons = append(reasons, fmt.Sprintf("High application rate (%d apps/min)", appsPerMin))
		}
	case "spam_messaging":
		if msgCount, ok := metrics["outbound_messages"].(int); ok && msgCount > 50 {
			score += 40
			reasons = append(reasons, fmt.Sprintf("Excessive outbound message velocity (%d msgs)", msgCount))
		}
	case "registration_burst":
		if regCount, ok := metrics["registrations_same_ip"].(int); ok && regCount > 10 {
			score += 40
			reasons = append(reasons, fmt.Sprintf("IP registration burst detected (%d registrations)", regCount))
		}
	default:
		reasons = append(reasons, "General fraud heuristic pattern matched")
	}

	if score > 100 {
		score = 100
	}

	fraudAlert := &models.FraudAlert{
		ID:         uuid.New(),
		EntityType: entityType,
		EntityID:   entityID,
		FraudType:  fraudType,
		Score:      score,
		Reasons:    reasons,
		Status:     "New",
		CreatedAt:  time.Now(),
	}

	_ = s.repo.LogFraudAlert(ctx, fraudAlert)

	if score > 50 {
		secAlert := &models.SecurityAlert{
			ID:           uuid.New(),
			Title:        fmt.Sprintf("Fraud Warning [%s]: Entity %s", fraudType, entityID),
			Severity:     "Critical",
			RiskScore:    score,
			Category:     "Fraud Prevention",
			TriggerEvent: "fraud_detected",
			Status:       "New",
			CreatedAt:    time.Now(),
		}
		_ = s.repo.CreateSecurityAlert(ctx, secAlert)
	}

	return fraudAlert, nil
}

func (s *securityService) GetFraudAlerts(ctx context.Context) ([]models.FraudAlert, error) {
	return s.repo.GetFraudAlerts(ctx)
}

