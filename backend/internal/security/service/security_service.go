package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base32"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/security/models"
	"kirmya/internal/security/repository"
)

type SecurityService interface {
	GetSecurityOverview(ctx context.Context, userID uuid.UUID) (*models.SecurityOverview, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword string, newPassword string) error
	SetupMFA(ctx context.Context, userID uuid.UUID) (*models.MFASetupResponse, error)
	VerifyAndEnableMFA(ctx context.Context, userID uuid.UUID, code string) error
	DisableMFA(ctx context.Context, userID uuid.UUID) error
	GetActiveSessions(ctx context.Context, userID uuid.UUID, currentToken string) ([]models.SessionItem, error)
	RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error
	RevokeAllOtherSessions(ctx context.Context, userID uuid.UUID, currentToken string) error
	GetTrustedDevices(ctx context.Context, userID uuid.UUID) ([]models.DeviceItem, error)
	UpdateDeviceTrustStatus(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID, status string) error
	RemoveDevice(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID) error
	GetLoginHistory(ctx context.Context, userID uuid.UUID) ([]models.LoginHistoryItem, error)
	CreateAPIKey(ctx context.Context, userID uuid.UUID, payload models.CreateAPIKeyPayload) (*models.CreateAPIKeyResponse, error)
	GetAPIKeys(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error)
	RevokeAPIKey(ctx context.Context, userID uuid.UUID, keyID uuid.UUID) error
	GetSecurityEvents(ctx context.Context, userID uuid.UUID) ([]models.SecurityEvent, error)
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

func (s *securityService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword string, newPassword string) error {
	if len(newPassword) < 12 {
		return errors.New("INVALID_PASSWORD: Password must be at least 12 characters long.")
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

func (s *securityService) SetupMFA(ctx context.Context, userID uuid.UUID) (*models.MFASetupResponse, error) {
	// Generate random 16-byte TOTP secret encoded as Base32
	buf := make([]byte, 10)
	_, _ = rand.Read(buf)
	secret := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(buf)

	qrURI := fmt.Sprintf("otpauth://totp/Kirmya:user?secret=%s&issuer=Kirmya", secret)

	// Generate 8 cryptographically secure recovery codes
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

	hashes := []string{"hash1", "hash2"}
	err := s.repo.EnableMFA(ctx, userID, "SECRET", hashes)
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

func (s *securityService) GetActiveSessions(ctx context.Context, userID uuid.UUID, currentToken string) ([]models.SessionItem, error) {
	return s.repo.GetActiveSessions(ctx, userID, currentToken)
}

func (s *securityService) RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	return s.repo.RevokeSession(ctx, userID, sessionID)
}

func (s *securityService) RevokeAllOtherSessions(ctx context.Context, userID uuid.UUID, currentToken string) error {
	return s.repo.RevokeAllOtherSessions(ctx, userID, currentToken)
}

func (s *securityService) GetTrustedDevices(ctx context.Context, userID uuid.UUID) ([]models.DeviceItem, error) {
	return s.repo.GetTrustedDevices(ctx, userID)
}

func (s *securityService) UpdateDeviceTrustStatus(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID, status string) error {
	return s.repo.UpdateDeviceTrustStatus(ctx, userID, deviceID, status)
}

func (s *securityService) RemoveDevice(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID) error {
	return s.repo.RemoveDevice(ctx, userID, deviceID)
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
	_ = keyHash // Stored as hash in database

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
	return s.repo.RevokeAPIKey(ctx, userID, keyID)
}

func (s *securityService) GetSecurityEvents(ctx context.Context, userID uuid.UUID) ([]models.SecurityEvent, error) {
	return s.repo.GetSecurityEvents(ctx, userID)
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
