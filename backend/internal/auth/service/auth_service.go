package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"html"
	"log/slog"
	"net/url"
	"os"
	"strings"
	"time"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/models"
	"kirmya/internal/auth/repository"
	"kirmya/internal/auth/validators"
	configPkg "kirmya/internal/shared/config"
	"kirmya/internal/shared/mailer"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// emailSender is the slice of the mailer this service uses. It is an interface
// rather than *mailer.Mailer so a test can observe the message that was sent —
// which is the only way to exercise the password reset flow end to end with the
// token the service actually generated, rather than one the test inserted into
// the repository itself.
type emailSender interface {
	Enabled() bool
	Send(to, subject, htmlBody string) error
}

type AuthService struct {
	repo       *repository.AuthRepository
	mail       emailSender
	appBaseURL string
}

func NewAuthService(repo *repository.AuthRepository) *AuthService {
	return &AuthService{
		repo:       repo,
		mail:       mailer.FromEnv(),
		appBaseURL: configPkg.AppBaseURL(),
	}
}

// Password reset policy.
const (
	// passwordResetTTL is how long a reset link stays redeemable. Short enough
	// that a link sitting in a mailbox is not a standing key to the account,
	// long enough that a user who reads mail on another device still makes it.
	// The email copy is generated from this value rather than restating it, so
	// changing the constant cannot leave the message telling users something
	// untrue.
	passwordResetTTL = time.Hour

	// A user may be sent this many links per window. The IP rate limiter caps
	// how fast one source can ask; this caps how much mail one account can be
	// made to receive no matter how many sources ask.
	maxResetsPerUser  = 3
	resetThrottleSpan = time.Hour
)

// isProductionEnv reports whether this process is running in production, which
// decides whether a reset link may be written to a log.
func isProductionEnv() bool {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	return env == "production" || env == "prod"
}

// humanDuration renders a reset lifetime the way the email should read it.
func humanDuration(d time.Duration) string {
	switch {
	case d >= time.Hour && d%time.Hour == 0:
		if hours := int(d / time.Hour); hours == 1 {
			return "1 hour"
		} else {
			return fmt.Sprintf("%d hours", hours)
		}
	default:
		return fmt.Sprintf("%d minutes", int(d/time.Minute))
	}
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func generateSecureToken(byteLen int) (string, error) {
	b := make([]byte, byteLen)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// Register checks duplicate email, hashes password with bcrypt cost 12, creates user & verification token.
func (s *AuthService) Register(ctx context.Context, req *dto.RegisterRequest, ipAddress string) (*models.User, string, error) {
	req.NormalizeFields()
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if err := validators.ValidateRegisterInput(req); err != nil {
		return nil, "", err
	}

	// Check existing email
	existing, _ := s.repo.GetUserByEmail(ctx, req.Email)
	if existing != nil {
		return nil, "", errors.New("an account with this email already exists")
	}

	// Bcrypt hash with cost 12
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return nil, "", err
	}

	userID := uuid.New()
	userUUID := uuid.New()

	u := &models.User{
		ID:               userID,
		UUID:             userUUID,
		FirstName:        req.FirstName,
		LastName:         req.LastName,
		Email:            req.Email,
		PasswordHash:     string(hashBytes),
		EmailVerified:    false,
		RoleID:           "user", // Strictly enforce default role to prevent privilege escalation
		Status:           "active",
		Country:          req.Country,
		CurrentLocation:  req.CurrentLocation,
		JobTitle:         req.JobTitle,
		EmploymentStatus: req.EmploymentStatus,
		CreatedAt:        time.Now().UTC(),
		UpdatedAt:        time.Now().UTC(),
	}

	if err := s.repo.CreateUser(ctx, u); err != nil {
		return nil, "", err
	}

	// Create profile record
	_ = s.repo.CreateProfile(ctx, u)

	// Create email verification record
	verifyToken, err := generateSecureToken(32)
	if err != nil {
		verifyToken = uuid.New().String()
	}

	ev := &models.EmailVerification{
		ID:        uuid.New(),
		UserID:    u.ID,
		Token:     verifyToken,
		ExpiresAt: time.Now().UTC().Add(24 * time.Hour),
		CreatedAt: time.Now().UTC(),
	}
	_ = s.repo.CreateEmailVerification(ctx, ev)

	// Audit Log
	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    u.ID,
		Action:    "USER_REGISTERED",
		IPAddress: ipAddress,
		CreatedAt: time.Now().UTC(),
	})

	if s.sendVerificationEmail(u, verifyToken) {
		verifyToken = ""
	}

	return u, verifyToken, nil
}

// sendVerificationEmail delivers the verification link and reports whether message was sent.
func (s *AuthService) sendVerificationEmail(u *models.User, token string) bool {
	if !s.mail.Enabled() {
		slog.Warn("SMTP is not configured; the email verification token is returned in the API response instead of being mailed",
			slog.String("user_id", u.ID.String()))
		return false
	}

	link := fmt.Sprintf("%s/auth/verify-email?token=%s", s.appBaseURL, url.QueryEscape(token))
	name := u.FirstName
	if name == "" {
		name = "there"
	}

	body := fmt.Sprintf(`<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.6;padding:24px;background:#f5f5f7">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e5ea">
      <h2 style="font-size:22px;font-weight:700;margin-top:0;color:#1d1d1f">Confirm your Kirmya email</h2>
      <p style="font-size:15px;color:#3a3a3c">Hi %s,</p>
      <p style="font-size:15px;color:#3a3a3c">Please verify your email address to complete your registration and activate your account.</p>
      <div style="margin:28px 0">
        <a href="%s" style="background:#0071e3;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Verify Email Address</a>
      </div>
      <p style="font-size:13px;color:#86868b">Or copy and paste this link into your browser:<br><span style="color:#0071e3;word-break:break-all">%s</span></p>
      <p style="font-size:13px;color:#86868b;margin-bottom:0">This link expires in 24 hours. If you did not create this account, please ignore this email.</p>
    </div>
  </body>
</html>`, html.EscapeString(name), link, html.EscapeString(link))

	if err := s.mail.Send(u.Email, "Verify your Kirmya email address", body); err != nil {
		slog.Error("Failed to send the email verification message",
			slog.String("user_id", u.ID.String()),
			slog.String("error", err.Error()))
		return false
	}

	slog.Info("Email verification message sent", slog.String("user_id", u.ID.String()))
	return true
}

// sendPasswordResetEmail delivers the reset link.
func (s *AuthService) sendPasswordResetEmail(u *models.User, token string) bool {
	link := fmt.Sprintf("%s/reset-password?token=%s", s.appBaseURL, url.QueryEscape(token))

	if !s.mail.Enabled() {
		// Without SMTP there is no way to deliver the link, which would leave
		// the flow untestable on a fresh checkout. Outside production the link
		// is logged so a developer can complete the reset; in production it
		// never is — a reset link in a log file is a live credential, readable
		// by anyone with log access.
		if isProductionEnv() {
			slog.Error("SMTP is not configured; password reset email could not be delivered",
				slog.String("user_id", u.ID.String()))
		} else {
			slog.Warn("SMTP is not configured; password reset link logged for local development only",
				slog.String("user_id", u.ID.String()),
				slog.String("reset_link", link))
		}
		return false
	}
	name := u.FirstName
	if name == "" {
		name = "there"
	}

	body := fmt.Sprintf(`<!doctype html>
<html>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.6;padding:24px;background:#f5f5f7">
    <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e5ea">
      <h2 style="font-size:22px;font-weight:700;margin-top:0;color:#1d1d1f">Reset your Kirmya password</h2>
      <p style="font-size:15px;color:#3a3a3c">Hi %s,</p>
      <p style="font-size:15px;color:#3a3a3c">We received a request to reset your password. Click the button below to choose a new secure password.</p>
      <div style="margin:28px 0">
        <a href="%s" style="background:#0071e3;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Reset Password</a>
      </div>
      <p style="font-size:13px;color:#86868b">Or copy and paste this link into your browser:<br><span style="color:#0071e3;word-break:break-all">%s</span></p>
      <p style="font-size:13px;color:#86868b;margin-bottom:0">This link expires in %s. If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  </body>
</html>`, html.EscapeString(name), link, html.EscapeString(link), humanDuration(passwordResetTTL))

	if err := s.mail.Send(u.Email, "Reset your Kirmya password", body); err != nil {
		slog.Error("Failed to send password reset email",
			slog.String("user_id", u.ID.String()),
			slog.String("error", err.Error()))
		return false
	}

	slog.Info("Password reset email sent", slog.String("user_id", u.ID.String()))
	return true
}

// Legacy Register signature support for tests.
func (s *AuthService) RegisterSimple(ctx context.Context, email string, password string) (*models.User, error) {
	req := &dto.RegisterRequest{
		FirstName:       "User",
		LastName:        "Account",
		Email:           email,
		Password:        password,
		ConfirmPassword: password,
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	user, _, err := s.Register(ctx, req, "127.0.0.1")
	return user, err
}

// Login validates credentials, status, creates session & tokens.
func (s *AuthService) Login(ctx context.Context, req *dto.LoginRequest, ipAddress, userAgent string) (string, string, *models.User, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	u, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	if u.Status == "locked" || u.Status == "suspended" || u.Status == "disabled" {
		return "", "", nil, errors.New("account is locked or suspended. Please contact support")
	}

	// Password comparison
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
			ID:        uuid.New(),
			UserID:    u.ID,
			Action:    "LOGIN_FAILED_INVALID_CREDENTIALS",
			IPAddress: ipAddress,
			CreatedAt: time.Now().UTC(),
		})
		return "", "", nil, errors.New("invalid email or password")
	}

	// Expiry calculation based on RememberMe
	sessionDuration := 7 * 24 * time.Hour
	if req.RememberMe {
		sessionDuration = 30 * 24 * time.Hour
	}

	// Generate Access Token (15 mins)
	accessToken, err := s.GenerateAccessToken(u.ID, u.Email, u.RoleID)
	if err != nil {
		return "", "", nil, err
	}

	// Generate Refresh Token
	refreshTokenStr, err := generateSecureToken(32)
	if err != nil {
		refreshTokenStr = uuid.New().String()
	}

	sess := &models.Session{
		ID:           uuid.New(),
		UserID:       u.ID,
		RefreshToken: refreshTokenStr,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		ExpiresAt:    time.Now().UTC().Add(sessionDuration),
		CreatedAt:    time.Now().UTC(),
	}

	if err := s.repo.CreateSession(ctx, sess); err != nil {
		return "", "", nil, err
	}

	// Audit Log
	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    u.ID,
		Action:    "LOGIN_SUCCESS",
		IPAddress: ipAddress,
		CreatedAt: time.Now().UTC(),
	})

	return accessToken, refreshTokenStr, u, nil
}

// Refresh handles token rotation and reuse detection.
func (s *AuthService) Refresh(ctx context.Context, tokenStr, ipAddress, userAgent string) (string, string, error) {
	sess, err := s.repo.GetSessionByRefreshToken(ctx, tokenStr)
	if err != nil {
		return "", "", errors.New("invalid or expired session")
	}

	// Reuse detection: if revoked session token is presented
	if sess.RevokedAt != nil {
		_ = s.repo.RevokeAllUserSessions(ctx, sess.UserID)
		_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
			ID:        uuid.New(),
			UserID:    sess.UserID,
			Action:    "REFRESH_TOKEN_REUSE_DETECTED_ALL_SESSIONS_REVOKED",
			IPAddress: ipAddress,
			CreatedAt: time.Now().UTC(),
		})
		return "", "", errors.New("security alert: session token reuse detected. All user sessions revoked")
	}

	if time.Now().UTC().After(sess.ExpiresAt) {
		return "", "", errors.New("session expired. Please sign in again")
	}

	u, err := s.repo.GetUserByID(ctx, sess.UserID)
	if err != nil || u.Status != "active" {
		return "", "", errors.New("user account unavailable")
	}

	// Revoke current session
	_ = s.repo.RevokeSession(ctx, sess.ID)

	// Issue rotated refresh token
	newAccessToken, err := s.GenerateAccessToken(u.ID, u.Email, u.RoleID)
	if err != nil {
		return "", "", err
	}

	newRefreshTokenStr, err := generateSecureToken(32)
	if err != nil {
		newRefreshTokenStr = uuid.New().String()
	}

	newSess := &models.Session{
		ID:           uuid.New(),
		UserID:       u.ID,
		RefreshToken: newRefreshTokenStr,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		ExpiresAt:    time.Now().UTC().Add(7 * 24 * time.Hour),
		CreatedAt:    time.Now().UTC(),
	}

	if err := s.repo.CreateSession(ctx, newSess); err != nil {
		return "", "", err
	}

	return newAccessToken, newRefreshTokenStr, nil
}

// Logout revokes session.
func (s *AuthService) Logout(ctx context.Context, tokenStr, ipAddress string) error {
	sess, err := s.repo.GetSessionByRefreshToken(ctx, tokenStr)
	if err == nil {
		_ = s.repo.RevokeSession(ctx, sess.ID)
		_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
			ID:        uuid.New(),
			UserID:    sess.UserID,
			Action:    "LOGOUT_SUCCESS",
			IPAddress: ipAddress,
			CreatedAt: time.Now().UTC(),
		})
	}
	return nil
}

// VerifyEmail processes token confirmation.
func (s *AuthService) VerifyEmail(ctx context.Context, token, ipAddress string) error {
	ev, err := s.repo.GetEmailVerification(ctx, token)
	if err != nil {
		return errors.New("invalid or expired verification link")
	}

	if time.Now().UTC().After(ev.ExpiresAt) {
		return errors.New("verification token has expired")
	}

	if err := s.repo.UpdateUserEmailVerified(ctx, ev.UserID); err != nil {
		return err
	}

	_ = s.repo.DeleteEmailVerification(ctx, ev.ID)
	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    ev.UserID,
		Action:    "EMAIL_VERIFIED",
		IPAddress: ipAddress,
		CreatedAt: time.Now().UTC(),
	})

	return nil
}

// ResendVerification generates a new token and delivers verification email.
func (s *AuthService) ResendVerification(ctx context.Context, email, ipAddress string) error {
	normEmail := strings.ToLower(strings.TrimSpace(email))
	u, err := s.repo.GetUserByEmail(ctx, normEmail)
	if err != nil {
		// Generic return to prevent account enumeration
		return nil
	}

	if u.EmailVerified {
		return nil
	}

	tokenStr, err := generateSecureToken(32)
	if err != nil {
		tokenStr = uuid.New().String()
	}

	ev := &models.EmailVerification{
		ID:        uuid.New(),
		UserID:    u.ID,
		Token:     tokenStr,
		ExpiresAt: time.Now().UTC().Add(24 * time.Hour),
		CreatedAt: time.Now().UTC(),
	}

	if err := s.repo.CreateEmailVerification(ctx, ev); err != nil {
		return err
	}

	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    u.ID,
		Action:    "RESEND_VERIFICATION_SENT",
		IPAddress: ipAddress,
		CreatedAt: time.Now().UTC(),
	})

	_ = s.sendVerificationEmail(u, ev.Token)
	return nil
}

// ErrPasswordResetThrottled is recorded internally when an account has already
// been sent its allowance of reset links. It never reaches the caller: the
// endpoint answers identically either way, or it would become an oracle for
// which addresses have accounts.
var ErrPasswordResetThrottled = errors.New("too many password reset requests for this account")

// accountEligibleForReset reports whether a reset link should be issued.
//
// Login already refuses locked, suspended and disabled accounts, so mailing one
// a reset link only invites a user to set a password they still cannot sign in
// with — and, for an account disabled in response to abuse, hands its holder a
// working link to a mailbox they may still control.
func accountEligibleForReset(u *models.User) bool {
	switch strings.ToLower(strings.TrimSpace(u.Status)) {
	case "locked", "suspended", "disabled", "deleted", "banned":
		return false
	}
	return true
}

// ForgotPassword issues a single-use, time-limited reset token and emails it.
//
// Every failure path returns nil. An unknown address, an ineligible account and
// a throttled one must be indistinguishable from success to the caller, because
// the response to this endpoint is otherwise a membership test against the user
// table that anyone can run.
func (s *AuthService) ForgotPassword(ctx context.Context, req *dto.ForgotPasswordRequest, ipAddress, userAgent string) error {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	u, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil || u == nil {
		// Prevent user enumeration: always return nil
		return nil
	}

	if !accountEligibleForReset(u) {
		slog.Warn("Password reset requested for an ineligible account",
			slog.String("user_id", u.ID.String()),
			slog.String("status", u.Status))
		return nil
	}

	// Per-account throttle. The IP limiter in front of this route does nothing
	// about many sources aimed at one mailbox, which is how reset endpoints get
	// used to bury someone in mail.
	since := time.Now().UTC().Add(-resetThrottleSpan)
	if recent, countErr := s.repo.CountRecentPasswordResets(ctx, u.ID, since); countErr == nil && recent >= maxResetsPerUser {
		slog.Warn("Password reset throttled for account",
			slog.String("user_id", u.ID.String()),
			slog.Int("recent_requests", recent))
		_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
			ID:        uuid.New(),
			UserID:    u.ID,
			Action:    "FORGOT_PASSWORD_THROTTLED",
			IPAddress: ipAddress,
			CreatedAt: time.Now().UTC(),
		})
		return nil
	}

	rawToken, err := generateSecureToken(32)
	if err != nil {
		// uuid.New() is a v4 UUID: 122 bits from the same source, but only 122,
		// and it is not what the security of this token is meant to rest on. If
		// the system CSPRNG is unavailable, issue nothing rather than quietly
		// dropping to a weaker token.
		slog.Error("Password reset token generation failed",
			slog.String("user_id", u.ID.String()),
			slog.String("error", err.Error()))
		return nil
	}

	// Retire any link already outstanding for this user. Issuing a new one has
	// to invalidate the old, or every reset ever requested stays redeemable for
	// its full lifetime.
	if invErr := s.repo.InvalidateUserPasswordResets(ctx, u.ID); invErr != nil {
		slog.Error("Could not invalidate previous password resets",
			slog.String("user_id", u.ID.String()),
			slog.String("error", invErr.Error()))
		return nil
	}

	pr := &models.PasswordReset{
		ID:        uuid.New(),
		UserID:    u.ID,
		TokenHash: hashToken(rawToken),
		ExpiresAt: time.Now().UTC().Add(passwordResetTTL),
		IPAddress: ipAddress,
		UserAgent: userAgent,
		CreatedAt: time.Now().UTC(),
	}

	if err := s.repo.CreatePasswordReset(ctx, pr); err != nil {
		return err
	}

	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    u.ID,
		Action:    "FORGOT_PASSWORD_REQUESTED",
		IPAddress: ipAddress,
		CreatedAt: time.Now().UTC(),
	})

	_ = s.sendPasswordResetEmail(u, rawToken)
	return nil
}

// ResetPassword redeems a reset token and sets a new password.
//
// The order matters: the token is validated, then consumed, and only a request
// that successfully consumed it goes on to change the password. Consuming first
// is what makes two requests racing on one link resolve to a single reset.
func (s *AuthService) ResetPassword(ctx context.Context, req *dto.ResetPasswordRequest, ipAddress string) error {
	pwd := req.GetPassword()
	if err := validators.ValidatePasswordPolicy(pwd); err != nil {
		return err
	}

	tokenHash := hashToken(req.Token)
	pr, err := s.repo.GetPasswordResetByTokenHash(ctx, tokenHash)
	if err != nil {
		// Deliberately one message for "no such token" and for a database
		// failure: the caller learns nothing about which tokens exist.
		return errors.New("invalid or expired reset token")
	}

	if pr.UsedAt != nil {
		return errors.New("this password reset link has already been used")
	}

	if time.Now().UTC().After(pr.ExpiresAt) {
		return errors.New("password reset token has expired. Please request a new one")
	}

	// The account must still be one that may sign in. A suspended account that
	// resets its password is a suspended account with a password the platform
	// did not choose to grant.
	if u, userErr := s.repo.GetUserByID(ctx, pr.UserID); userErr == nil && u != nil && !accountEligibleForReset(u) {
		slog.Warn("Password reset attempted on an ineligible account",
			slog.String("user_id", u.ID.String()),
			slog.String("status", u.Status))
		return errors.New("this account cannot be reset. Please contact support")
	}

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(pwd), 12)
	if err != nil {
		return err
	}

	// Consume the token before writing the password. MarkPasswordResetUsed
	// updates only where used_at is still null and reports whether it won, so
	// of two concurrent redemptions of the same link exactly one proceeds.
	if err := s.repo.MarkPasswordResetUsed(ctx, pr.ID); err != nil {
		if errors.Is(err, repository.ErrPasswordResetAlreadyUsed) {
			return errors.New("this password reset link has already been used")
		}
		return errors.New("could not complete password reset. Please request a new link")
	}

	if err := s.repo.UpdateUserPasswordHash(ctx, pr.UserID, string(hashBytes)); err != nil {
		return err
	}

	// Revoke every session so a password reset ends any access an attacker
	// already had. Refresh tokens are session-backed and die here; an access
	// token already issued is a stateless JWT and stays valid for the remainder
	// of its 15-minute lifetime, since nothing on the request path consults the
	// session table. Closing that window means checking revocation on every
	// authenticated request, which is a change to the authentication
	// architecture rather than to this flow.
	_ = s.repo.RevokeAllUserSessions(ctx, pr.UserID)

	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    pr.UserID,
		Action:    "PASSWORD_RESET_SUCCESS",
		IPAddress: ipAddress,
		CreatedAt: time.Now().UTC(),
	})

	return nil
}

// GetUserMe returns current user details and permissions.
func (s *AuthService) GetUserMe(ctx context.Context, userID uuid.UUID) (*dto.UserMeDTO, error) {
	u, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user profile not found")
	}

	userDTO := dto.UserProfileDTO{
		ID:               u.ID,
		UUID:             u.UUID,
		FirstName:        u.FirstName,
		LastName:         u.LastName,
		Email:            u.Email,
		EmailVerified:    u.EmailVerified,
		RoleID:           u.RoleID,
		Status:           u.Status,
		Country:          u.Country,
		CurrentLocation:  u.CurrentLocation,
		JobTitle:         u.JobTitle,
		EmploymentStatus: u.EmploymentStatus,
		CreatedAt:        u.CreatedAt,
		UpdatedAt:        u.UpdatedAt,
	}

	permissions := []string{
		"profile:read", "profile:write", "messaging:access", "jobs:browse", "network:connect",
	}
	if u.RoleID == "admin" {
		permissions = append(permissions, "admin:access", "users:manage")
	}

	return &dto.UserMeDTO{
		User:               userDTO,
		Permissions:        permissions,
		NotificationsCount: 3,
	}, nil
}

// GetSessionInfo returns session metadata.
func (s *AuthService) GetSessionInfo(ctx context.Context, tokenStr string) (*dto.SessionDTO, error) {
	sess, err := s.repo.GetSessionByRefreshToken(ctx, tokenStr)
	if err != nil {
		return nil, errors.New("active session not found")
	}

	return &dto.SessionDTO{
		ID:        sess.ID,
		IPAddress: sess.IPAddress,
		UserAgent: sess.UserAgent,
		ExpiresAt: sess.ExpiresAt,
		IsActive:  sess.RevokedAt == nil && time.Now().UTC().Before(sess.ExpiresAt),
	}, nil
}

// GenerateAccessToken builds a signed JWT with HS256.
func (s *AuthService) GenerateAccessToken(userID uuid.UUID, email, role string) (string, error) {
	claims := models.JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().UTC().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			NotBefore: jwt.NewNumericDate(time.Now().UTC()),
			Issuer:    "kirmya-auth-service",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(configPkg.GetJWTSecretBytes())
}

// ValidateAccessToken parses and validates signed JWT token.
func (s *AuthService) ValidateAccessToken(tokenStr string) (*models.JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &models.JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return configPkg.GetJWTSecretBytes(), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*models.JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

// ComparePasswordSecurely defends against timing attacks.
func ComparePasswordSecurely(hash, password string) bool {
	hasher := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return subtle.ConstantTimeCompare([]byte(fmt.Sprintf("%v", hasher == nil)), []byte("true")) == 1
}
