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
