package service

import (
	"errors"
	"strings"
	"testing"
	"time"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/models"
	"kirmya/internal/auth/repository"
	"kirmya/internal/shared/authcookie"
)

// policyFixture is newResetFixture with the session policy pinned, so these
// tests assert against known lifetimes rather than whatever the environment
// happens to hold.
func policyFixture(t *testing.T) *resetFixture {
	t.Helper()
	f := newResetFixture(t)
	f.svc.policy = authcookie.Config{
		Name:          "refresh_token",
		Path:          "/api/v1/auth",
		TTL:           7 * 24 * time.Hour,
		RememberMeTTL: 30 * 24 * time.Hour,
		AccessTTL:     15 * time.Minute,
	}
	return f
}

func (f *resetFixture) signIn(t *testing.T, rememberMe bool) string {
	t.Helper()
	_, refresh, _, err := f.svc.Login(f.ctx, &dto.LoginRequest{
		Email:      fixtureEmail,
		Password:   fixtureOldPassword,
		RememberMe: rememberMe,
	}, "127.0.0.1", "go-test")
	if err != nil {
		t.Fatalf("login (rememberMe=%v): %v", rememberMe, err)
	}
	return refresh
}

// TestRememberMeSurvivesRotation is the regression this file exists for.
//
// Refresh used to build the replacement session with a hardcoded seven-day
// expiry. A user who ticked "Remember me" got their thirty-day session silently
// downgraded the first time the page reloaded — and because rotation happens on
// every reload, they never got anywhere near thirty days.
func TestRememberMeSurvivesRotation(t *testing.T) {
	f := policyFixture(t)

	refresh := f.signIn(t, true)
	original := f.sessionFor(t, refresh)

	if remaining := time.Until(original.ExpiresAt); remaining < 29*24*time.Hour {
		t.Fatalf("a Remember Me sign-in produced a %v session, want ~30 days", remaining)
	}

	// Three rotations, as three page loads would produce.
	for i := 0; i < 3; i++ {
		result, err := f.svc.Refresh(f.ctx, refresh, "127.0.0.1", "go-test")
		if err != nil {
			t.Fatalf("refresh %d: %v", i+1, err)
		}
		if !result.RememberMe {
			t.Fatalf("refresh %d dropped the Remember Me policy", i+1)
		}
		if !result.ExpiresAt.Equal(original.ExpiresAt) {
			t.Fatalf("refresh %d moved the session expiry from %v to %v",
				i+1, original.ExpiresAt, result.ExpiresAt)
		}
		refresh = result.RefreshToken
	}

	rotated := f.sessionFor(t, refresh)
	if !rotated.RememberMe {
		t.Error("the stored session lost its Remember Me flag")
	}
	if !rotated.ExpiresAt.Equal(original.ExpiresAt) {
		t.Errorf("stored expiry drifted: %v, want %v", rotated.ExpiresAt, original.ExpiresAt)
	}
}

// A normal session must not renew itself either. Rotation that recomputed the
// expiry made any session unbounded for anyone who kept using it, so the
// seven-day policy only applied to people who stopped visiting.
func TestNormalSessionIsNotExtendedByRefreshing(t *testing.T) {
	f := policyFixture(t)

	refresh := f.signIn(t, false)
	original := f.sessionFor(t, refresh)

	if remaining := time.Until(original.ExpiresAt); remaining > 8*24*time.Hour {
		t.Fatalf("a normal sign-in produced a %v session, want ~7 days", remaining)
	}

	result, err := f.svc.Refresh(f.ctx, refresh, "127.0.0.1", "go-test")
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if result.ExpiresAt.After(original.ExpiresAt) {
		t.Errorf("refreshing extended the session from %v to %v", original.ExpiresAt, result.ExpiresAt)
	}
	if result.RememberMe {
		t.Error("a normal sign-in came back marked Remember Me")
	}
}

// TestRefreshTokensAreStoredHashed: read access to the sessions table must not
// hand anyone a usable session.
func TestRefreshTokensAreStoredHashed(t *testing.T) {
	f := policyFixture(t)

	refresh := f.signIn(t, false)

	if _, err := f.repo.GetSessionByRefreshToken(f.ctx, refresh); !errors.Is(err, repository.ErrSessionNotFound) {
		t.Error("the raw refresh token matched a stored session; tokens are being stored in plaintext")
	}

	stored := f.sessionFor(t, refresh)
	if stored.RefreshToken == refresh {
		t.Error("the session row holds the bearer token itself")
	}
	if len(stored.RefreshToken) != 64 {
		t.Errorf("stored token is %d characters, want a 64-character SHA-256 hex digest", len(stored.RefreshToken))
	}
}

// An expired session must be refused however valid its token looks.
//
// The lifetime is set negative before signing in rather than by editing the
// stored row, so the session travels the same path a genuinely aged-out one
// does: written by Login with an expiry in the past, then read back by Refresh.
func TestExpiredSessionCannotRefresh(t *testing.T) {
	f := policyFixture(t)
	f.svc.policy.TTL = -time.Minute

	refresh := f.signIn(t, false)

	if _, err := f.svc.Refresh(f.ctx, refresh, "127.0.0.1", "go-test"); err == nil {
		t.Fatal("an expired session was refreshed")
	} else if !strings.Contains(err.Error(), "expired") {
		t.Errorf("expired session reported as %q, want an expiry message", err.Error())
	}
}

// After logout the token must be dead, and refreshing with it must not restore
// the session — the acceptance criterion "logout, then reload, still logged out".
func TestLogoutMakesTheRefreshTokenUnusable(t *testing.T) {
	f := policyFixture(t)

	refresh := f.signIn(t, false)

	if err := f.svc.Logout(f.ctx, refresh, "127.0.0.1"); err != nil {
		t.Fatalf("logout: %v", err)
	}

	if _, err := f.svc.Refresh(f.ctx, refresh, "127.0.0.1", "go-test"); err == nil {
		t.Fatal("a refresh token still worked after logout")
	}
}

// Logging out with a token that matches nothing is the outcome the caller
// wanted, not an error to report.
func TestLogoutWithAnUnknownTokenSucceeds(t *testing.T) {
	f := policyFixture(t)

	if err := f.svc.Logout(f.ctx, "not-a-real-token", "127.0.0.1"); err != nil {
		t.Errorf("logout with an unknown token returned %v, want nil", err)
	}
}

// The rotation must be atomic: the old session is revoked and the new one
// stored together, so a caller never ends up holding a spent cookie with no
// replacement.
func TestRotationRevokesTheOldSessionAndStoresTheNew(t *testing.T) {
	f := policyFixture(t)

	refresh := f.signIn(t, false)
	originalID := f.sessionFor(t, refresh).ID

	result, err := f.svc.Refresh(f.ctx, refresh, "127.0.0.1", "go-test")
	if err != nil {
		t.Fatalf("refresh: %v", err)
	}

	// Read the old session back after the rotation rather than reusing the
	// snapshot taken before it: the repository hands out copies, so the earlier
	// value could never show the revocation.
	before := f.sessionFor(t, refresh)
	if before.RevokedAt == nil {
		t.Error("the rotated session was not revoked")
	}
	if before.ID != originalID {
		t.Fatalf("read back a different session: %v, want %v", before.ID, originalID)
	}
	after := f.sessionFor(t, result.RefreshToken)
	if after.RevokedAt != nil {
		t.Error("the replacement session was stored already revoked")
	}
	if after.RotatedFrom == nil || *after.RotatedFrom != before.ID {
		t.Error("the replacement session does not link back to the one it replaced")
	}
}

// The access-token lifetime the API reports must be the one in the token.
func TestAccessTokenTTLMatchesThePolicy(t *testing.T) {
	f := policyFixture(t)

	if got := f.svc.AccessTokenTTL(); got != 15*time.Minute {
		t.Errorf("AccessTokenTTL = %v, want 15m", got)
	}

	token, err := f.svc.GenerateAccessToken(f.user.ID, f.user.Email, f.user.RoleID)
	if err != nil {
		t.Fatalf("generate: %v", err)
	}
	claims, err := f.svc.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("validate: %v", err)
	}

	remaining := time.Until(claims.ExpiresAt.Time)
	if remaining > 15*time.Minute || remaining < 14*time.Minute {
		t.Errorf("token expires in %v, want the configured 15m", remaining)
	}
}

// sessionFor reads back the session behind a raw refresh token, hashing it the
// way the service does.
func (f *resetFixture) sessionFor(t *testing.T, rawToken string) *models.Session {
	t.Helper()
	sess, err := f.repo.GetSessionByRefreshToken(f.ctx, hashToken(rawToken))
	if err != nil {
		t.Fatalf("read back session: %v", err)
	}
	return sess
}
