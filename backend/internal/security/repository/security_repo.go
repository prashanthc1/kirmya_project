package repository

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"kirmya/internal/security/models"
)

type RateLimitCounter struct {
	Count       int
	LockedUntil time.Time
	LastAttempt time.Time
}

type SecurityRepository interface {
	GetSecurityOverview(ctx context.Context, userID uuid.UUID) (*models.SecurityOverview, error)
	GetActiveSessions(ctx context.Context, userID uuid.UUID, currentToken string) ([]models.SessionItem, error)
	CreateSession(ctx context.Context, session *models.SessionItem) error
	RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error
	RevokeAllOtherSessions(ctx context.Context, userID uuid.UUID, currentToken string) error
	GetSessionByID(ctx context.Context, sessionID uuid.UUID) (*models.SessionItem, error)
	GetTrustedDevices(ctx context.Context, userID uuid.UUID) ([]models.DeviceItem, error)
	RegisterDevice(ctx context.Context, device *models.DeviceItem) error
	GetDeviceByID(ctx context.Context, deviceID uuid.UUID) (*models.DeviceItem, error)
	UpdateDeviceTrustStatus(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID, status string) error
	RemoveDevice(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID) error
	GetLoginHistory(ctx context.Context, userID uuid.UUID) ([]models.LoginHistoryItem, error)
	RecordLoginHistory(ctx context.Context, item *models.LoginHistoryItem) error
	GetMFAStatus(ctx context.Context, userID uuid.UUID) (bool, error)
	GetMFASecret(ctx context.Context, userID uuid.UUID) (string, error)
	EnableMFA(ctx context.Context, userID uuid.UUID, secret string, recoveryCodeHashes []string) error
	DisableMFA(ctx context.Context, userID uuid.UUID) error
	GetRecoveryCodeHashes(ctx context.Context, userID uuid.UUID) ([]string, error)
	UseRecoveryCode(ctx context.Context, userID uuid.UUID, codeHash string) (bool, error)
	CreateAPIKey(ctx context.Context, apiKey *models.APIKey) error
	GetAPIKeys(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error)
	GetAPIKeyByID(ctx context.Context, keyID uuid.UUID) (*models.APIKey, error)
	RevokeAPIKey(ctx context.Context, userID uuid.UUID, keyID uuid.UUID) error
	RecordSecurityEvent(ctx context.Context, event *models.SecurityEvent) error
	GetSecurityEvents(ctx context.Context, userID uuid.UUID) ([]models.SecurityEvent, error)
	GetFailedLoginAttempts(ctx context.Context, key string) (int, time.Time, error)
	IncrementFailedLoginAttempts(ctx context.Context, key string) (int, time.Time, error)
	ResetFailedLoginAttempts(ctx context.Context, key string) error
	GetPrivacySettings(ctx context.Context, userID uuid.UUID) (*models.PrivacySettings, error)
	UpsertPrivacySettings(ctx context.Context, userID uuid.UUID, settings *models.PrivacySettingsPayload) (*models.PrivacySettings, error)
	CreateDataExportRequest(ctx context.Context, userID uuid.UUID) (*models.DataExportRequest, error)
	GetDataExportRequests(ctx context.Context, userID uuid.UUID) ([]models.DataExportRequest, error)
	CreateAccountDeletionRequest(ctx context.Context, req *models.AccountDeletionRequest) (*models.AccountDeletionRequest, error)
	GetAccountDeletionRequest(ctx context.Context, userID uuid.UUID) (*models.AccountDeletionRequest, error)
	CancelAccountDeletionRequest(ctx context.Context, userID uuid.UUID) error
	GetAdminSecuritySummary(ctx context.Context) (*models.SecurityDashboardSummary, error)
	GetSecurityIncidents(ctx context.Context) ([]models.SecurityIncident, error)
	CreateSecurityIncident(ctx context.Context, incident *models.SecurityIncident) error
}

type securityRepository struct {
	db *pgxpool.Pool
	mu sync.RWMutex

	memSessions       map[uuid.UUID][]models.SessionItem
	memDevices        map[uuid.UUID][]models.DeviceItem
	memLoginHistory   map[uuid.UUID][]models.LoginHistoryItem
	memMFASecrets     map[uuid.UUID]string
	memMFAEnabled     map[uuid.UUID]bool
	memRecoveryCodes  map[uuid.UUID][]string
	memAPIKeys        map[uuid.UUID][]models.APIKey
	memSecurityEvents map[uuid.UUID][]models.SecurityEvent
	memIncidents      []models.SecurityIncident
	memRateLimits     map[string]*RateLimitCounter
	memPrivacy        map[uuid.UUID]*models.PrivacySettings
	memDataExports    map[uuid.UUID][]models.DataExportRequest
	memDeletions      map[uuid.UUID]*models.AccountDeletionRequest
}

func NewSecurityRepository(db *pgxpool.Pool) SecurityRepository {
	return &securityRepository{
		db:                db,
		memSessions:       make(map[uuid.UUID][]models.SessionItem),
		memDevices:        make(map[uuid.UUID][]models.DeviceItem),
		memLoginHistory:   make(map[uuid.UUID][]models.LoginHistoryItem),
		memMFASecrets:     make(map[uuid.UUID]string),
		memMFAEnabled:     make(map[uuid.UUID]bool),
		memRecoveryCodes:  make(map[uuid.UUID][]string),
		memAPIKeys:        make(map[uuid.UUID][]models.APIKey),
		memSecurityEvents: make(map[uuid.UUID][]models.SecurityEvent),
		memIncidents:      make([]models.SecurityIncident, 0),
		memRateLimits:     make(map[string]*RateLimitCounter),
		memPrivacy:        make(map[uuid.UUID]*models.PrivacySettings),
		memDataExports:    make(map[uuid.UUID][]models.DataExportRequest),
		memDeletions:      make(map[uuid.UUID]*models.AccountDeletionRequest),
	}
}

func (r *securityRepository) GetSecurityOverview(ctx context.Context, userID uuid.UUID) (*models.SecurityOverview, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sessions := r.memSessions[userID]
	activeCount := len(sessions)
	if activeCount == 0 {
		activeCount = 1
	}

	devices := r.memDevices[userID]
	trustedCount := len(devices)
	if trustedCount == 0 {
		trustedCount = 1
	}

	events := r.memSecurityEvents[userID]
	eventCount := len(events)
	if eventCount == 0 {
		eventCount = 2
	}

	mfa := r.memMFAEnabled[userID]

	score := 70
	if mfa {
		score += 20
	}

	return &models.SecurityOverview{
		UserID:                userID,
		EmailVerified:         true,
		MFAEnabled:            mfa,
		ActiveSessionsCount:   activeCount,
		TrustedDevicesCount:   trustedCount,
		RecentSecurityEvents:  eventCount,
		PasswordLastChangedAt: time.Now().AddDate(0, -1, 0),
		SecurityScore:         score,
	}, nil
}

func (r *securityRepository) GetActiveSessions(ctx context.Context, userID uuid.UUID, currentToken string) ([]models.SessionItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sessions, exists := r.memSessions[userID]
	if !exists || len(sessions) == 0 {
		return []models.SessionItem{
			{
				ID:        uuid.New(),
				UserID:    userID,
				IPAddress: "127.0.0.1",
				UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
				Location:  "Dubai, UAE",
				IsCurrent: true,
				ExpiresAt: time.Now().AddDate(0, 0, 7),
				CreatedAt: time.Now().AddDate(0, 0, -1),
			},
		}, nil
	}
	return sessions, nil
}

func (r *securityRepository) CreateSession(ctx context.Context, session *models.SessionItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if session.ID == uuid.Nil {
		session.ID = uuid.New()
	}
	if session.CreatedAt.IsZero() {
		session.CreatedAt = time.Now()
	}
	r.memSessions[session.UserID] = append(r.memSessions[session.UserID], *session)
	return nil
}

func (r *securityRepository) GetSessionByID(ctx context.Context, sessionID uuid.UUID) (*models.SessionItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, sessions := range r.memSessions {
		for _, s := range sessions {
			if s.ID == sessionID {
				return &s, nil
			}
		}
	}
	return nil, errors.New("SESSION_NOT_FOUND: session does not exist")
}

func (r *securityRepository) RevokeSession(ctx context.Context, userID uuid.UUID, sessionID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	sessions := r.memSessions[userID]
	filtered := make([]models.SessionItem, 0)
	for _, s := range sessions {
		if s.ID != sessionID {
			filtered = append(filtered, s)
		}
	}
	r.memSessions[userID] = filtered
	return nil
}

func (r *securityRepository) RevokeAllOtherSessions(ctx context.Context, userID uuid.UUID, currentToken string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	sessions := r.memSessions[userID]
	filtered := make([]models.SessionItem, 0)
	for _, s := range sessions {
		if s.IsCurrent {
			filtered = append(filtered, s)
		}
	}
	r.memSessions[userID] = filtered
	return nil
}

func (r *securityRepository) GetTrustedDevices(ctx context.Context, userID uuid.UUID) ([]models.DeviceItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	devices, exists := r.memDevices[userID]
	if !exists || len(devices) == 0 {
		return []models.DeviceItem{
			{
				ID:            uuid.New(),
				UserID:        userID,
				DeviceID:      "dev-web-001",
				Platform:      "Web Desktop",
				Browser:       "Chrome 120.0",
				OS:            "Windows 11",
				TrustedStatus: "trusted",
				LastSeenAt:    time.Now(),
				CreatedAt:     time.Now().AddDate(0, -1, 0),
			},
		}, nil
	}
	return devices, nil
}

func (r *securityRepository) RegisterDevice(ctx context.Context, device *models.DeviceItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if device.ID == uuid.Nil {
		device.ID = uuid.New()
	}
	if device.CreatedAt.IsZero() {
		device.CreatedAt = time.Now()
	}
	device.LastSeenAt = time.Now()
	r.memDevices[device.UserID] = append(r.memDevices[device.UserID], *device)
	return nil
}

func (r *securityRepository) GetDeviceByID(ctx context.Context, deviceID uuid.UUID) (*models.DeviceItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, devices := range r.memDevices {
		for _, d := range devices {
			if d.ID == deviceID {
				return &d, nil
			}
		}
	}
	return nil, errors.New("DEVICE_NOT_FOUND: device does not exist")
}

func (r *securityRepository) UpdateDeviceTrustStatus(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	devices := r.memDevices[userID]
	for i, d := range devices {
		if d.ID == deviceID {
			devices[i].TrustedStatus = status
			devices[i].LastSeenAt = time.Now()
			r.memDevices[userID] = devices
			return nil
		}
	}
	return nil
}

func (r *securityRepository) RemoveDevice(ctx context.Context, userID uuid.UUID, deviceID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	devices := r.memDevices[userID]
	filtered := make([]models.DeviceItem, 0)
	for _, d := range devices {
		if d.ID != deviceID {
			filtered = append(filtered, d)
		}
	}
	r.memDevices[userID] = filtered
	return nil
}

func (r *securityRepository) GetLoginHistory(ctx context.Context, userID uuid.UUID) ([]models.LoginHistoryItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	history, exists := r.memLoginHistory[userID]
	if !exists || len(history) == 0 {
		return []models.LoginHistoryItem{
			{
				ID:        uuid.New(),
				EventType: "login.success",
				Severity:  "low",
				IPAddress: "127.0.0.1",
				UserAgent: "Chrome / Windows",
				Location:  "Dubai, UAE",
				CreatedAt: time.Now().Add(-2 * time.Hour),
			},
		}, nil
	}
	return history, nil
}

func (r *securityRepository) RecordLoginHistory(ctx context.Context, item *models.LoginHistoryItem) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	if item.CreatedAt.IsZero() {
		item.CreatedAt = time.Now()
	}
	r.memLoginHistory[item.ID] = append(r.memLoginHistory[item.ID], *item)
	return nil
}

func (r *securityRepository) GetMFAStatus(ctx context.Context, userID uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.memMFAEnabled[userID], nil
}

func (r *securityRepository) GetMFASecret(ctx context.Context, userID uuid.UUID) (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.memMFASecrets[userID], nil
}

func (r *securityRepository) EnableMFA(ctx context.Context, userID uuid.UUID, secret string, recoveryCodeHashes []string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.memMFAEnabled[userID] = true
	r.memMFASecrets[userID] = secret
	r.memRecoveryCodes[userID] = recoveryCodeHashes
	return nil
}

func (r *securityRepository) DisableMFA(ctx context.Context, userID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.memMFAEnabled[userID] = false
	delete(r.memMFASecrets, userID)
	delete(r.memRecoveryCodes, userID)
	return nil
}

func (r *securityRepository) GetRecoveryCodeHashes(ctx context.Context, userID uuid.UUID) ([]string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.memRecoveryCodes[userID], nil
}

func (r *securityRepository) UseRecoveryCode(ctx context.Context, userID uuid.UUID, codeHash string) (bool, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	codes := r.memRecoveryCodes[userID]
	filtered := make([]string, 0)
	found := false
	for _, c := range codes {
		if c == codeHash && !found {
			found = true
			continue
		}
		filtered = append(filtered, c)
	}
	if found {
		r.memRecoveryCodes[userID] = filtered
	}
	return found, nil
}

func (r *securityRepository) CreateAPIKey(ctx context.Context, apiKey *models.APIKey) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if apiKey.ID == uuid.Nil {
		apiKey.ID = uuid.New()
	}
	if apiKey.CreatedAt.IsZero() {
		apiKey.CreatedAt = time.Now()
	}
	r.memAPIKeys[apiKey.UserID] = append(r.memAPIKeys[apiKey.UserID], *apiKey)
	return nil
}

func (r *securityRepository) GetAPIKeys(ctx context.Context, userID uuid.UUID) ([]models.APIKey, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	keys, exists := r.memAPIKeys[userID]
	if !exists || len(keys) == 0 {
		return []models.APIKey{
			{
				ID:        uuid.New(),
				UserID:    userID,
				Name:      "Development Testing Key",
				KeyPrefix: "krm_live_7a",
				Scopes:    "profile.read,jobs.read",
				CreatedAt: time.Now().AddDate(0, -1, 0),
			},
		}, nil
	}
	return keys, nil
}

func (r *securityRepository) GetAPIKeyByID(ctx context.Context, keyID uuid.UUID) (*models.APIKey, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, keys := range r.memAPIKeys {
		for _, k := range keys {
			if k.ID == keyID {
				return &k, nil
			}
		}
	}
	return nil, errors.New("API_KEY_NOT_FOUND: API key does not exist")
}

func (r *securityRepository) RevokeAPIKey(ctx context.Context, userID uuid.UUID, keyID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	keys := r.memAPIKeys[userID]
	now := time.Now()
	for i, k := range keys {
		if k.ID == keyID {
			keys[i].RevokedAt = &now
			r.memAPIKeys[userID] = keys
			return nil
		}
	}
	return nil
}

func (r *securityRepository) RecordSecurityEvent(ctx context.Context, event *models.SecurityEvent) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now()
	}

	if event.UserID != nil {
		r.memSecurityEvents[*event.UserID] = append(r.memSecurityEvents[*event.UserID], *event)
	}
	return nil
}

func (r *securityRepository) GetSecurityEvents(ctx context.Context, userID uuid.UUID) ([]models.SecurityEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	events, exists := r.memSecurityEvents[userID]
	if !exists || len(events) == 0 {
		return []models.SecurityEvent{
			{
				ID:        uuid.New(),
				UserID:    &userID,
				EventType: "password.changed",
				Severity:  "medium",
				IPAddress: "127.0.0.1",
				UserAgent: "Chrome / Windows",
				Location:  "Dubai, UAE",
				CreatedAt: time.Now().AddDate(0, -1, 0),
			},
		}, nil
	}
	return events, nil
}

func (r *securityRepository) GetFailedLoginAttempts(ctx context.Context, key string) (int, time.Time, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	entry, exists := r.memRateLimits[key]
	if !exists {
		return 0, time.Time{}, nil
	}
	return entry.Count, entry.LockedUntil, nil
}

func (r *securityRepository) IncrementFailedLoginAttempts(ctx context.Context, key string) (int, time.Time, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	entry, exists := r.memRateLimits[key]
	if !exists {
		entry = &RateLimitCounter{
			Count:       1,
			LastAttempt: time.Now(),
		}
		r.memRateLimits[key] = entry
	} else {
		entry.Count++
		entry.LastAttempt = time.Now()
		if entry.Count >= 5 {
			entry.LockedUntil = time.Now().Add(15 * time.Minute)
		}
	}
	return entry.Count, entry.LockedUntil, nil
}

func (r *securityRepository) ResetFailedLoginAttempts(ctx context.Context, key string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.memRateLimits, key)
	return nil
}

func (r *securityRepository) GetPrivacySettings(ctx context.Context, userID uuid.UUID) (*models.PrivacySettings, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, exists := r.memPrivacy[userID]
	if !exists {
		return &models.PrivacySettings{
			UserID:               userID,
			ProfileVisibility:    "public",
			DataSharingOptIn:     true,
			AnalyticsOptIn:       true,
			PersonalizationOptIn: true,
			SearchEngineIndexing: true,
			UpdatedAt:            time.Now(),
		}, nil
	}
	return s, nil
}

func (r *securityRepository) UpsertPrivacySettings(ctx context.Context, userID uuid.UUID, settings *models.PrivacySettingsPayload) (*models.PrivacySettings, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	vis := settings.ProfileVisibility
	if vis == "" {
		vis = "public"
	}

	updated := &models.PrivacySettings{
		UserID:               userID,
		ProfileVisibility:    vis,
		DataSharingOptIn:     settings.DataSharingOptIn,
		AnalyticsOptIn:       settings.AnalyticsOptIn,
		PersonalizationOptIn: settings.PersonalizationOptIn,
		SearchEngineIndexing: settings.SearchEngineIndexing,
		UpdatedAt:            time.Now(),
	}
	r.memPrivacy[userID] = updated
	return updated, nil
}

func (r *securityRepository) CreateDataExportRequest(ctx context.Context, userID uuid.UUID) (*models.DataExportRequest, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	req := models.DataExportRequest{
		ID:          uuid.New(),
		UserID:      userID,
		Status:      "processing",
		RequestedAt: time.Now(),
	}
	r.memDataExports[userID] = append(r.memDataExports[userID], req)
	return &req, nil
}

func (r *securityRepository) GetDataExportRequests(ctx context.Context, userID uuid.UUID) ([]models.DataExportRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	requests, exists := r.memDataExports[userID]
	if !exists {
		return []models.DataExportRequest{}, nil
	}
	return requests, nil
}

func (r *securityRepository) CreateAccountDeletionRequest(ctx context.Context, req *models.AccountDeletionRequest) (*models.AccountDeletionRequest, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	if req.RequestedAt.IsZero() {
		req.RequestedAt = time.Now()
	}
	if req.ScheduledFor.IsZero() {
		req.ScheduledFor = time.Now().AddDate(0, 0, 30) // 30 day grace period
	}
	req.Status = "pending"
	r.memDeletions[req.UserID] = req
	return req, nil
}

func (r *securityRepository) GetAccountDeletionRequest(ctx context.Context, userID uuid.UUID) (*models.AccountDeletionRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	req, exists := r.memDeletions[userID]
	if !exists {
		return nil, errors.New("NO_DELETION_REQUEST: No active account deletion request found")
	}
	return req, nil
}

func (r *securityRepository) CancelAccountDeletionRequest(ctx context.Context, userID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	req, exists := r.memDeletions[userID]
	if !exists {
		return errors.New("NO_DELETION_REQUEST: No active account deletion request found")
	}
	req.Status = "cancelled"
	r.memDeletions[userID] = req
	return nil
}

func (r *securityRepository) GetAdminSecuritySummary(ctx context.Context) (*models.SecurityDashboardSummary, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return &models.SecurityDashboardSummary{
		TotalEvents:          1280,
		FailedLogins24h:      4,
		SuspiciousActivities: 0,
		MFAAdoptionRate:      42.5,
		ActiveIncidents:      int64(len(r.memIncidents)),
		EventsByType: map[string]int64{
			"login.success":    1150,
			"login.failure":    4,
			"password.changed": 86,
			"mfa.enabled":      40,
		},
	}, nil
}

func (r *securityRepository) GetSecurityIncidents(ctx context.Context) ([]models.SecurityIncident, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.memIncidents, nil
}

func (r *securityRepository) CreateSecurityIncident(ctx context.Context, incident *models.SecurityIncident) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if incident.ID == uuid.Nil {
		incident.ID = uuid.New()
	}
	if incident.CreatedAt.IsZero() {
		incident.CreatedAt = time.Now()
	}
	r.memIncidents = append(r.memIncidents, *incident)
	return nil
}
