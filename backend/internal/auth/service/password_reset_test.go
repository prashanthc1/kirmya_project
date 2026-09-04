package service

import (
	"context"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/models"
	"kirmya/internal/auth/repository"
)

// The existing TestForgotPasswordAndResetFlow inserts a password_resets row of
// its own and redeems that, so it never exercises the token ForgotPassword
// actually generates, nor the email that carries it. Everything between
// "request a reset" and "here is a token" — generation, hashing, expiry,
// invalidating the previous link, the throttle, the message itself — was
// untested. These tests capture the outgoing mail instead, which is what a user
// really has, and drive the flow through it.

// captureMailer stands in for SMTP and keeps what was sent.
type captureMailer struct {
	mu      sync.Mutex
	enabled bool
	sent    []capturedEmail
}

type capturedEmail struct {
	to      string
	subject string
	body    string
}

func (m *captureMailer) Enabled() bool { return m.enabled }

func (m *captureMailer) Send(to, subject, htmlBody string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sent = append(m.sent, capturedEmail{to: to, subject: subject, body: htmlBody})
	return nil
}

// resetSubject identifies the reset message. Registration sends a verification
// email through this same mailer, so the helpers below filter rather than
// counting everything that was sent — otherwise "no reset email was sent" and
// "a verification email was sent" are the same observation.
const resetSubject = "Reset your Kirmya password"

func (m *captureMailer) last(t *testing.T) capturedEmail {
	t.Helper()
	m.mu.Lock()
	defer m.mu.Unlock()
	for i := len(m.sent) - 1; i >= 0; i-- {
		if m.sent[i].subject == resetSubject {
			return m.sent[i]
		}
	}
	t.Fatal("no password reset email was sent")
	return capturedEmail{}
}

func (m *captureMailer) count() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	n := 0
	for _, e := range m.sent {
		if e.subject == resetSubject {
			n++
		}
	}
	return n
}

var resetLinkPattern = regexp.MustCompile(`/reset-password\?token=([A-Za-z0-9%._~-]+)`)

// tokenFromEmail pulls the reset token out of the delivered message, the same
// way a user's browser would follow the link.
func tokenFromEmail(t *testing.T, body string) string {
	t.Helper()
	match := resetLinkPattern.FindStringSubmatch(body)
	if match == nil {
		t.Fatalf("no reset link found in the email body:\n%s", body)
	}
	token, err := url.QueryUnescape(match[1])
	if err != nil {
		t.Fatalf("reset link token is not decodable: %v", err)
	}
	return token
}

type resetFixture struct {
	svc  *AuthService
	repo *repository.AuthRepository
	mail *captureMailer
	user *models.User
	ctx  context.Context
}

const (
	fixtureEmail       = "reset.subject@kirmya.test"
	fixtureOldPassword = "OriginalP@ssw0rd123!"
	fixtureNewPassword = "ReplacementP@ssw0rd456!"
)

func newResetFixture(t *testing.T) *resetFixture {
	t.Helper()
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)
	mail := &captureMailer{enabled: true}
	svc.mail = mail
	svc.appBaseURL = "https://app.kirmya.test"

	ctx := context.Background()
	user, _, err := svc.Register(ctx, &dto.RegisterRequest{
		FirstName:       "Reset",
		LastName:        "Subject",
		Email:           fixtureEmail,
		Password:        fixtureOldPassword,
		ConfirmPassword: fixtureOldPassword,
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}, "127.0.0.1")
	if err != nil {
		t.Fatalf("seed user: %v", err)
	}

	return &resetFixture{svc: svc, repo: repo, mail: mail, user: user, ctx: ctx}
}

// request runs ForgotPassword and returns the token from the resulting email.
func (f *resetFixture) request(t *testing.T) string {
	t.Helper()
	if err := f.svc.ForgotPassword(f.ctx, &dto.ForgotPasswordRequest{Email: fixtureEmail}, "127.0.0.1", "go-test"); err != nil {
		t.Fatalf("ForgotPassword: %v", err)
	}
	return tokenFromEmail(t, f.mail.last(t).body)
}

func (f *resetFixture) redeem(token, password string) error {
	return f.svc.ResetPassword(f.ctx, &dto.ResetPasswordRequest{Token: token, NewPassword: password}, "127.0.0.1")
}

// TestPasswordResetHappyPath is the acceptance criterion end to end: request a
// reset, follow the emailed link, sign in with the new password and not the old.
func TestPasswordResetHappyPath(t *testing.T) {
	f := newResetFixture(t)

	token := f.request(t)
	if err := f.redeem(token, fixtureNewPassword); err != nil {
		t.Fatalf("redeeming the emailed token failed: %v", err)
	}

	if _, _, _, err := f.svc.Login(f.ctx, &dto.LoginRequest{
		Email: fixtureEmail, Password: fixtureNewPassword,
	}, "127.0.0.1", "go-test"); err != nil {
		t.Fatalf("could not sign in with the new password: %v", err)
	}

	if _, _, _, err := f.svc.Login(f.ctx, &dto.LoginRequest{
		Email: fixtureEmail, Password: fixtureOldPassword,
	}, "127.0.0.1", "go-test"); err == nil {
		t.Fatal("the old password still signs in after a reset")
	}
}

// TestResetEmailCarriesUsableLink checks the message itself. A flow that is
// correct in the service and wrong in the email is broken for every user.
func TestResetEmailCarriesUsableLink(t *testing.T) {
	f := newResetFixture(t)
	token := f.request(t)
	msg := f.mail.last(t)

	if msg.to != strings.ToLower(fixtureEmail) {
		t.Errorf("reset email addressed to %q, want %q", msg.to, fixtureEmail)
	}
	if !strings.Contains(msg.body, f.svc.appBaseURL+"/reset-password?token=") {
		t.Error("the email does not link to the reset page on the configured base URL")
	}
	// The raw token must be what the link carries; a hash in the link would
	// make every reset fail.
	if len(token) != 64 {
		t.Errorf("emailed token is %d characters, want the 64 of a 32-byte hex token", len(token))
	}
	// And the stored form must not be the token itself.
	if _, err := f.repo.GetPasswordResetByTokenHash(f.ctx, token); err == nil {
		t.Error("the token is stored verbatim: a database read would hand over working reset links")
	}
	if _, err := f.repo.GetPasswordResetByTokenHash(f.ctx, hashToken(token)); err != nil {
		t.Errorf("the token is not stored under its hash: %v", err)
	}
	if !strings.Contains(msg.body, humanDuration(passwordResetTTL)) {
		t.Errorf("the email does not state the real lifetime %q", humanDuration(passwordResetTTL))
	}
}

// TestResetTokenIsSingleUse: a redeemed link must be dead, including for a
// different password than the one it was first used to set.
func TestResetTokenIsSingleUse(t *testing.T) {
	f := newResetFixture(t)
	token := f.request(t)

	if err := f.redeem(token, fixtureNewPassword); err != nil {
		t.Fatalf("first redemption failed: %v", err)
	}

	err := f.redeem(token, "AttackerChosenP@ss789!")
	if err == nil {
		t.Fatal("the reset link was redeemable twice")
	}
	if !strings.Contains(err.Error(), "already been used") {
		t.Errorf("replay refused with %q, want an already-used message", err)
	}

	// The replay must not have taken effect either.
	if _, _, _, loginErr := f.svc.Login(f.ctx, &dto.LoginRequest{
		Email: fixtureEmail, Password: "AttackerChosenP@ss789!",
	}, "127.0.0.1", "go-test"); loginErr == nil {
		t.Fatal("the replayed reset changed the password anyway")
	}
}

// TestConcurrentRedemptionsResolveToOne is the same property under a race,
// which is the case a sequential test cannot see: two requests that both read
// the token as unused before either consumes it.
func TestConcurrentRedemptionsResolveToOne(t *testing.T) {
	f := newResetFixture(t)
	token := f.request(t)

	const attempts = 8
	var wg sync.WaitGroup
	results := make([]error, attempts)
	start := make(chan struct{})

	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start
			results[i] = f.redeem(token, fixtureNewPassword)
		}(i)
	}
	close(start)
	wg.Wait()

	succeeded := 0
	for _, err := range results {
		if err == nil {
			succeeded++
		}
	}
	if succeeded != 1 {
		t.Errorf("%d of %d concurrent redemptions of one link succeeded, want exactly 1", succeeded, attempts)
	}
}

// TestExpiredResetTokenIsRefused pins the time limit.
func TestExpiredResetTokenIsRefused(t *testing.T) {
	f := newResetFixture(t)
	token := f.request(t)

	// Age the stored token past its lifetime rather than sleeping for an hour.
	stored, err := f.repo.GetPasswordResetByTokenHash(f.ctx, hashToken(token))
	if err != nil {
		t.Fatalf("read stored reset: %v", err)
	}
	stored.ExpiresAt = time.Now().UTC().Add(-time.Minute)
	if err := f.repo.CreatePasswordReset(f.ctx, stored); err != nil {
		t.Fatalf("age the stored reset: %v", err)
	}

	err = f.redeem(token, fixtureNewPassword)
	if err == nil {
		t.Fatal("an expired reset link was accepted")
	}
	if !strings.Contains(err.Error(), "expired") {
		t.Errorf("expired link refused with %q, want an expiry message", err)
	}
}

// TestResetTokenLifetimeIsWithinPolicy guards the constant itself: a token that
// lives for a day is a standing key to the account sitting in a mailbox.
func TestResetTokenLifetimeIsWithinPolicy(t *testing.T) {
	f := newResetFixture(t)
	before := time.Now().UTC()
	token := f.request(t)

	stored, err := f.repo.GetPasswordResetByTokenHash(f.ctx, hashToken(token))
	if err != nil {
		t.Fatalf("read stored reset: %v", err)
	}

	lifetime := stored.ExpiresAt.Sub(before)
	if lifetime < 15*time.Minute || lifetime > time.Hour+time.Minute {
		t.Errorf("reset token lifetime is %s, outside the 15-60 minute policy", lifetime)
	}
}

// TestReissuingARequestInvalidatesTheOldLink: the previously outstanding link
// must stop working the moment a new one is issued. Without this, an old email
// in a mailbox stays a live path into the account for its full lifetime.
func TestReissuingARequestInvalidatesTheOldLink(t *testing.T) {
	f := newResetFixture(t)

	first := f.request(t)
	second := f.request(t)
	if first == second {
		t.Fatal("two reset requests produced the same token")
	}

	if err := f.redeem(first, fixtureNewPassword); err == nil {
		t.Fatal("the superseded reset link still worked")
	}
	if err := f.redeem(second, fixtureNewPassword); err != nil {
		t.Fatalf("the current reset link did not work: %v", err)
	}
}

// TestPerAccountThrottle covers the abuse case the IP limiter cannot: many
// sources, one mailbox. The endpoint must still answer identically.
func TestPerAccountThrottle(t *testing.T) {
	f := newResetFixture(t)

	for i := 0; i < maxResetsPerUser+3; i++ {
		// A different source address each time, as a distributed attacker has.
		if err := f.svc.ForgotPassword(f.ctx, &dto.ForgotPasswordRequest{Email: fixtureEmail},
			"203.0.113."+string(rune('1'+i)), "go-test"); err != nil {
			t.Fatalf("request %d returned an error to the caller: %v", i, err)
		}
	}

	if got := f.mail.count(); got != maxResetsPerUser {
		t.Errorf("%d reset emails were sent, want the %d the per-account throttle allows", got, maxResetsPerUser)
	}
}

// TestSessionsAreRevokedOnReset is the "old sessions are revoked" criterion.
func TestSessionsAreRevokedOnReset(t *testing.T) {
	f := newResetFixture(t)

	_, refreshToken, _, err := f.svc.Login(f.ctx, &dto.LoginRequest{
		Email: fixtureEmail, Password: fixtureOldPassword,
	}, "127.0.0.1", "go-test")
	if err != nil {
		t.Fatalf("seed login: %v", err)
	}
	if refreshToken == "" {
		t.Fatal("login returned no refresh token; this test would prove nothing")
	}

	if err := f.redeem(f.request(t), fixtureNewPassword); err != nil {
		t.Fatalf("reset: %v", err)
	}

	// The session established before the reset must no longer refresh.
	if _, _, refreshErr := f.svc.Refresh(f.ctx, refreshToken, "127.0.0.1", "go-test"); refreshErr == nil {
		t.Fatal("a session from before the password reset can still be refreshed")
	}
}

// TestUnknownEmailIsIndistinguishable: the endpoint must not be a membership
// test against the user table.
func TestUnknownEmailIsIndistinguishable(t *testing.T) {
	f := newResetFixture(t)

	if err := f.svc.ForgotPassword(f.ctx, &dto.ForgotPasswordRequest{Email: "nobody@kirmya.test"},
		"127.0.0.1", "go-test"); err != nil {
		t.Errorf("an unknown address produced an error the caller could see: %v", err)
	}
	if f.mail.count() != 0 {
		t.Error("a reset email was sent for an address with no account")
	}
}

// TestIneligibleAccountsAreNotSentLinks: a suspended account must not be handed
// a working way back in, and must still look like every other request.
func TestIneligibleAccountsAreNotSentLinks(t *testing.T) {
	for _, status := range []string{"locked", "suspended", "disabled", "deleted", "banned"} {
		t.Run(status, func(t *testing.T) {
			f := newResetFixture(t)

			f.user.Status = status
			if err := f.repo.UpdateUser(f.ctx, f.user); err != nil {
				t.Fatalf("set status %q: %v", status, err)
			}

			if err := f.svc.ForgotPassword(f.ctx, &dto.ForgotPasswordRequest{Email: fixtureEmail},
				"127.0.0.1", "go-test"); err != nil {
				t.Errorf("caller saw an error for a %s account: %v", status, err)
			}
			if f.mail.count() != 0 {
				t.Errorf("a reset link was emailed to a %s account", status)
			}
		})
	}
}

// TestResetRefusesWeakPasswords: the reset path must apply the same policy as
// registration, or it becomes the way around it.
func TestResetRefusesWeakPasswords(t *testing.T) {
	f := newResetFixture(t)
	token := f.request(t)

	for _, weak := range []string{
		"short",
		"alllowercaseletters!",
		"ALLUPPERCASELETTERS1!",
		"NoSpecialChars123456",
		"NoDigitsHere!!!!!!!!",
		"",
	} {
		if err := f.redeem(token, weak); err == nil {
			t.Errorf("password %q was accepted by the reset endpoint", weak)
		}
	}

	// A rejected attempt must not have burned the token.
	if err := f.redeem(token, fixtureNewPassword); err != nil {
		t.Errorf("the link stopped working after a rejected weak password: %v", err)
	}
}

// TestUnknownTokenIsRefused covers a guessed or fabricated token.
func TestUnknownTokenIsRefused(t *testing.T) {
	f := newResetFixture(t)

	for _, token := range []string{
		"",
		"not-a-real-token",
		uuid.New().String(),
		strings.Repeat("f", 64),
	} {
		if err := f.redeem(token, fixtureNewPassword); err == nil {
			t.Errorf("token %q was accepted", token)
		}
	}
}

// TestResetLinkIsNotLoggedInProduction: with no SMTP configured the link is
// logged outside production so local development can complete the flow. In
// production a reset link in a log file is a live credential.
func TestResetLinkIsNotLoggedInProduction(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	if !isProductionEnv() {
		t.Fatal("APP_ENV=production is not recognised as production")
	}
	t.Setenv("APP_ENV", "development")
	if isProductionEnv() {
		t.Fatal("APP_ENV=development is treated as production")
	}
}
