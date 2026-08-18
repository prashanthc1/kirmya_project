package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/security/models"
	"kirmya/internal/security/repository"
)

func TestSecurityService(t *testing.T) {
	repo := repository.NewSecurityRepository(nil)
	svc := NewSecurityService(repo)
	ctx := context.Background()

	t.Run("GetSecurityOverview returns overview metadata", func(t *testing.T) {
		userID := uuid.New()
		ov, err := svc.GetSecurityOverview(ctx, userID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if ov.SecurityScore < 0 || ov.SecurityScore > 100 {
			t.Errorf("invalid security score: %d", ov.SecurityScore)
		}
	})

	t.Run("EvaluatePasswordPolicy checks all policy constraints", func(t *testing.T) {
		shortRes := svc.EvaluatePasswordPolicy("Short1!")
		if shortRes.IsValid || shortRes.HasMinLength {
			t.Error("expected short password to fail length check")
		}

		noUpperRes := svc.EvaluatePasswordPolicy("validpassword123!")
		if noUpperRes.IsValid || noUpperRes.HasUppercase {
			t.Error("expected missing uppercase to fail policy")
		}

		noSpecialRes := svc.EvaluatePasswordPolicy("ValidPassword123")
		if noSpecialRes.IsValid || noSpecialRes.HasSpecialChar {
			t.Error("expected missing special char to fail policy")
		}

		validRes := svc.EvaluatePasswordPolicy("StrongP@ssw0rd123!")
		if !validRes.IsValid {
			t.Errorf("expected valid password, got feedback: %v", validRes.Feedback)
		}
		if validRes.Score < 80 {
			t.Errorf("expected high score for strong password, got %d", validRes.Score)
		}
	})

	t.Run("ChangePassword validates policy requirements", func(t *testing.T) {
		userID := uuid.New()
		err := svc.ChangePassword(ctx, userID, "OldPass123!", "short")
		if err == nil {
			t.Error("expected error for short password, got nil")
		}

		err = svc.ChangePassword(ctx, userID, "OldPass123!", "ValidSecretPassword123!")
		if err != nil {
			t.Errorf("unexpected error for valid password: %v", err)
		}
	})

	t.Run("BruteForce protection locks account after max attempts", func(t *testing.T) {
		identifier := "user@example.com"
		_ = svc.ResetFailedLogin(ctx, identifier)

		for i := 1; i <= 4; i++ {
			count, isLocked, _, err := svc.RecordFailedLogin(ctx, identifier)
			if err != nil {
				t.Fatalf("unexpected error on attempt %d: %v", i, err)
			}
			if isLocked || count != i {
				t.Errorf("attempt %d: count=%d, isLocked=%v", i, count, isLocked)
			}
		}

		count, isLocked, lockedUntil, err := svc.RecordFailedLogin(ctx, identifier)
		if err != nil {
			t.Fatalf("unexpected error on 5th attempt: %v", err)
		}
		if !isLocked || count != 5 {
			t.Errorf("expected account to be locked out on 5th attempt, got count=%d, locked=%v", count, isLocked)
		}
		if lockedUntil.Before(time.Now()) {
			t.Error("expected future lockedUntil timestamp")
		}

		locked, _, _ := svc.IsLockedOut(ctx, identifier)
		if !locked {
			t.Error("expected IsLockedOut to return true")
		}

		_ = svc.ResetFailedLogin(ctx, identifier)
		locked, _, _ = svc.IsLockedOut(ctx, identifier)
		if locked {
			t.Error("expected IsLockedOut to return false after reset")
		}
	})

	t.Run("SetupMFA generates TOTP secret and recovery codes", func(t *testing.T) {
		userID := uuid.New()
		res, err := svc.SetupMFA(ctx, userID)
		if err != nil {
			t.Fatalf("unexpected MFA setup error: %v", err)
		}
		if res.Secret == "" {
			t.Error("expected non-empty TOTP secret")
		}
		if len(res.RecoveryCodes) != 8 {
			t.Errorf("expected 8 recovery codes, got %d", len(res.RecoveryCodes))
		}
	})

	t.Run("VerifyAndEnableMFA validates code length and enables MFA", func(t *testing.T) {
		userID := uuid.New()
		err := svc.VerifyAndEnableMFA(ctx, userID, "123")
		if err == nil {
			t.Error("expected error for invalid code length")
		}

		err = svc.VerifyAndEnableMFA(ctx, userID, "123456")
		if err != nil {
			t.Errorf("unexpected error on MFA verification: %v", err)
		}

		status, _ := repo.GetMFAStatus(ctx, userID)
		if !status {
			t.Error("expected MFA status to be enabled")
		}

		_ = svc.DisableMFA(ctx, userID)
		status, _ = repo.GetMFAStatus(ctx, userID)
		if status {
			t.Error("expected MFA status to be disabled")
		}
	})

	t.Run("Session management and IDOR prevention", func(t *testing.T) {
		userA := uuid.New()
		userB := uuid.New()

		sessA := &models.SessionItem{
			ID:        uuid.New(),
			UserID:    userA,
			IPAddress: "10.0.0.1",
			UserAgent: "BrowserA",
		}
		_ = repo.CreateSession(ctx, sessA)

		// User B attempts to revoke User A's session -> IDOR check fails
		err := svc.RevokeSession(ctx, userB, sessA.ID)
		if err == nil {
			t.Error("expected IDOR error when user B tries to revoke user A session")
		}

		// User A revokes own session -> succeeds
		err = svc.RevokeSession(ctx, userA, sessA.ID)
		if err != nil {
			t.Errorf("unexpected error on owner session revocation: %v", err)
		}
	})

	t.Run("Trusted Device management and IDOR prevention", func(t *testing.T) {
		userA := uuid.New()
		userB := uuid.New()

		dev, err := svc.RegisterDevice(ctx, userA, models.DeviceItem{
			DeviceID: "dev-laptop-1",
			Platform: "macOS",
			Browser:  "Safari",
		})
		if err != nil {
			t.Fatalf("unexpected device registration error: %v", err)
		}

		// User B attempts to modify User A's device -> IDOR error
		err = svc.UpdateDeviceTrustStatus(ctx, userB, dev.ID, "revoked")
		if err == nil {
			t.Error("expected IDOR error when modifying another user's device")
		}

		err = svc.RemoveDevice(ctx, userB, dev.ID)
		if err == nil {
			t.Error("expected IDOR error when removing another user's device")
		}

		// User A modifies own device -> succeeds
		err = svc.UpdateDeviceTrustStatus(ctx, userA, dev.ID, "revoked")
		if err != nil {
			t.Errorf("unexpected error on device trust update: %v", err)
		}
	})

	t.Run("CreateAPIKey and IDOR revocation prevention", func(t *testing.T) {
		userA := uuid.New()
		userB := uuid.New()

		keyRes, err := svc.CreateAPIKey(ctx, userA, models.CreateAPIKeyPayload{
			Name:   "CLI Token",
			Scopes: "jobs.read",
		})
		if err != nil {
			t.Fatalf("unexpected API key error: %v", err)
		}

		// User B tries to revoke User A's API key -> IDOR error
		err = svc.RevokeAPIKey(ctx, userB, keyRes.APIKey.ID)
		if err == nil {
			t.Error("expected IDOR error when revoking another user's API key")
		}

		// User A revokes own key -> succeeds
		err = svc.RevokeAPIKey(ctx, userA, keyRes.APIKey.ID)
		if err != nil {
			t.Errorf("unexpected error on API key revocation: %v", err)
		}
	})

	t.Run("Privacy settings upsert, export request and account deletion", func(t *testing.T) {
		userID := uuid.New()

		settings, err := svc.UpdatePrivacySettings(ctx, userID, models.PrivacySettingsPayload{
			ProfileVisibility:    "private",
			DataSharingOptIn:     false,
			AnalyticsOptIn:       false,
			PersonalizationOptIn: true,
			SearchEngineIndexing: false,
		})
		if err != nil {
			t.Fatalf("unexpected privacy settings error: %v", err)
		}
		if settings.ProfileVisibility != "private" || settings.DataSharingOptIn {
			t.Errorf("privacy settings mismatch: %+v", settings)
		}

		exportReq, err := svc.RequestDataExport(ctx, userID)
		if err != nil {
			t.Fatalf("unexpected data export error: %v", err)
		}
		if exportReq.Status != "processing" {
			t.Errorf("expected export status 'processing', got '%s'", exportReq.Status)
		}

		delReq, err := svc.RequestAccountDeletion(ctx, userID, "Moving to another service", "SecretPass123!")
		if err != nil {
			t.Fatalf("unexpected account deletion request error: %v", err)
		}
		if delReq.Status != "pending" {
			t.Errorf("expected deletion status 'pending', got '%s'", delReq.Status)
		}

		status, err := svc.GetAccountDeletionStatus(ctx, userID)
		if err != nil {
			t.Fatalf("unexpected error getting deletion status: %v", err)
		}
		if status.ID != delReq.ID {
			t.Errorf("deletion request ID mismatch")
		}

		err = svc.CancelAccountDeletion(ctx, userID)
		if err != nil {
			t.Fatalf("unexpected error cancelling account deletion: %v", err)
		}
	})

	t.Run("GetAdminSecuritySummary metrics", func(t *testing.T) {
		summary, err := svc.GetAdminSecuritySummary(ctx)
		if err != nil {
			t.Fatalf("unexpected summary error: %v", err)
		}
		if summary.TotalEvents < 0 {
			t.Errorf("invalid total events count: %d", summary.TotalEvents)
		}
	})

	t.Run("LogSecurityEvent generates correlation ID and redacts sensitive fields", func(t *testing.T) {
		userID := uuid.New()
		details := map[string]interface{}{
			"user_email":       "test@kirmya.com",
			"current_password": "supersecretpassword123",
			"access_token":     "Bearer eyJhbGci...",
			"credit_card":      "4111111111111111",
		}

		detail, err := svc.LogSecurityEvent(ctx, &userID, "login.failure", "auto", "192.168.1.100", "Mozilla/5.0", "Dubai", details)
		if err != nil {
			t.Fatalf("unexpected error logging security event: %v", err)
		}

		if detail.CorrelationID == "" || len(detail.CorrelationID) < 10 {
			t.Errorf("expected non-empty correlation ID, got %s", detail.CorrelationID)
		}
		if detail.RiskLevel != "High" {
			t.Errorf("expected computed severity 'High' for login.failure, got %s", detail.RiskLevel)
		}
		if detail.SafeDetails["current_password"] != "***REDACTED***" {
			t.Errorf("expected current_password to be redacted, got %v", detail.SafeDetails["current_password"])
		}
		if detail.SafeDetails["access_token"] != "***REDACTED***" {
			t.Errorf("expected access_token to be redacted, got %v", detail.SafeDetails["access_token"])
		}
		if detail.SafeDetails["credit_card"] != "***REDACTED***" {
			t.Errorf("expected credit_card to be redacted, got %v", detail.SafeDetails["credit_card"])
		}
		if detail.SafeDetails["user_email"] != "test@kirmya.com" {
			t.Errorf("expected non-sensitive field user_email to be preserved, got %v", detail.SafeDetails["user_email"])
		}
	})

	t.Run("EvaluateAccountRisk computes score and triggers alert when score > 50", func(t *testing.T) {
		userID := uuid.New()
		// Low risk test
		lowScore, err := svc.EvaluateAccountRisk(ctx, userID, 1, 0, 0, 0, false)
		if err != nil {
			t.Fatalf("unexpected risk scoring error: %v", err)
		}
		if lowScore.Score != 15 || lowScore.RiskLevel != "Normal" {
			t.Errorf("expected score 15 Normal, got score=%d level=%s", lowScore.Score, lowScore.RiskLevel)
		}

		// High risk test (> 50)
		highScore, err := svc.EvaluateAccountRisk(ctx, userID, 3, 1, 1, 1, true)
		if err != nil {
			t.Fatalf("unexpected risk scoring error: %v", err)
		}
		// 3*15 + 1*20 + 1*25 + 1*30 + 35 = 45+20+25+30+35 = 155 -> capped at 100
		if highScore.Score != 100 || highScore.RiskLevel != "Critical" {
			t.Errorf("expected score 100 Critical, got score=%d level=%s", highScore.Score, highScore.RiskLevel)
		}
		if len(highScore.Factors) == 0 {
			t.Error("expected non-empty risk factors")
		}

		// Verify that a SecurityAlert was created
		alerts, err := svc.GetSecurityAlerts(ctx, "New", "")
		if err != nil {
			t.Fatalf("unexpected error getting alerts: %v", err)
		}
		if len(alerts) == 0 {
			t.Error("expected automated SecurityAlert when risk score > 50")
		}
	})

	t.Run("EvaluateSecurityRules enforces rule thresholds", func(t *testing.T) {
		triggered, action, err := svc.EvaluateSecurityRules(ctx, "login_failure_threshold", 6, 300)
		if err != nil {
			t.Fatalf("unexpected error evaluating security rule: %v", err)
		}
		if !triggered {
			t.Error("expected rule to trigger when candidate count (6) >= threshold (5)")
		}
		if action != "temporary_restrict" {
			t.Errorf("expected action 'temporary_restrict', got %s", action)
		}

		triggered, _, _ = svc.EvaluateSecurityRules(ctx, "login_failure_threshold", 2, 300)
		if triggered {
			t.Error("expected rule NOT to trigger when count (2) < threshold (5)")
		}
	})

	t.Run("DetectBotActivity computes confidence score and flags bot traffic", func(t *testing.T) {
		signal, err := svc.DetectBotActivity(ctx, "10.0.0.99", "Mozilla/5.0 (compatible; Python-urllib/3.8; Headless)", 35, "/api/v1/auth/register")
		if err != nil {
			t.Fatalf("unexpected error detecting bot activity: %v", err)
		}
		if !signal.IsBot {
			t.Errorf("expected IsBot=true for headless python crawler with burst rate 35, got score=%d", signal.BotConfidenceScore)
		}
		if signal.BotConfidenceScore < 60 {
			t.Errorf("expected high bot confidence score, got %d", signal.BotConfidenceScore)
		}

		signals, err := svc.GetBotSignals(ctx)
		if err != nil || len(signals) == 0 {
			t.Error("expected logged bot signals")
		}
	})

	t.Run("DetectFraud flags fake jobs and mass application abuse", func(t *testing.T) {
		fraudAlert, err := svc.DetectFraud(ctx, "job_posting", "job-999", "fake_job", map[string]interface{}{
			"salary":           600000.0,
			"suspicious_links": true,
		})
		if err != nil {
			t.Fatalf("unexpected error detecting fraud: %v", err)
		}
		if fraudAlert.Score < 80 {
			t.Errorf("expected high fraud score for fake job posting, got %d", fraudAlert.Score)
		}
		if len(fraudAlert.Reasons) < 2 {
			t.Errorf("expected multiple fraud reasons, got %v", fraudAlert.Reasons)
		}

		fraudAlerts, err := svc.GetFraudAlerts(ctx)
		if err != nil || len(fraudAlerts) == 0 {
			t.Error("expected logged fraud alerts")
		}
	})

	t.Run("Alert lifecycle transitions and resolution", func(t *testing.T) {
		userID := uuid.New()

		// Trigger an alert via account risk
		_, _ = svc.EvaluateAccountRisk(ctx, userID, 4, 1, 0, 0, false)

		alerts, err := svc.GetSecurityAlerts(ctx, "New", "")
		if err != nil || len(alerts) == 0 {
			t.Fatalf("expected active alerts to test transitions")
		}

		targetAlert := alerts[0]

		// Transition to Investigating
		investigating := "Investigating"
		adminID := uuid.New()
		updated, err := svc.UpdateSecurityAlertStatus(ctx, targetAlert.ID, models.UpdateSecurityAlertPayload{
			Status:          &investigating,
			AssignedAdminID: &adminID,
		})
		if err != nil {
			t.Fatalf("unexpected error updating alert status: %v", err)
		}
		if updated.Status != "Investigating" || updated.AssignedAdminID == nil {
			t.Errorf("alert status mismatch: %+v", updated)
		}

		// Resolve alert
		resolved, err := svc.ResolveSecurityAlert(ctx, targetAlert.ID, models.ResolveAlertPayload{
			ResolutionNotes: "Triaged by SOC team. User verified identity.",
			Status:          "Resolved",
		})
		if err != nil {
			t.Fatalf("unexpected error resolving alert: %v", err)
		}
		if resolved.Status != "Resolved" || resolved.ResolvedAt == nil || resolved.ResolutionNotes == "" {
			t.Errorf("resolved alert mismatch: %+v", resolved)
		}
	})
}

