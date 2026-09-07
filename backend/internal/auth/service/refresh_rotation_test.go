package service

import (
	"strings"
	"testing"

	"kirmya/internal/auth/dto"
)

// TestConcurrentRefreshDoesNotRevokeEverySession covers the second refresh of a
// page load, which presents the cookie the first one has already rotated. That
// used to look exactly like a stolen token and revoked every session the account
// had, so a reload could sign the user out. It must be refused without taking
// the rest of the account down with it.
func TestConcurrentRefreshDoesNotRevokeEverySession(t *testing.T) {
	f := newResetFixture(t)

	_, firstRefresh, _, err := f.svc.Login(f.ctx, &dto.LoginRequest{Email: fixtureEmail, Password: fixtureOldPassword}, "127.0.0.1", "go-test")
	if err != nil {
		t.Fatalf("login: %v", err)
	}

	_, rotated, err := f.svc.Refresh(f.ctx, firstRefresh, "127.0.0.1", "go-test")
	if err != nil {
		t.Fatalf("first refresh: %v", err)
	}

	// The same cookie again, as the second in-flight request would send it.
	if _, _, err = f.svc.Refresh(f.ctx, firstRefresh, "127.0.0.1", "go-test"); err == nil {
		t.Fatal("a rotated refresh token was accepted a second time")
	} else if strings.Contains(err.Error(), "reuse detected") {
		t.Fatalf("a concurrent refresh was treated as token theft: %v", err)
	}

	// The token the first refresh issued must still work; the account was not
	// signed out by the race.
	if _, _, err = f.svc.Refresh(f.ctx, rotated, "127.0.0.1", "go-test"); err != nil {
		t.Fatalf("the rotated session was revoked by the concurrent refresh: %v", err)
	}
}
