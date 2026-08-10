package service

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"html"
	"log/slog"
	"net/url"
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

type AuthService struct {
	repo *repository.AuthRepository

	// mail is safe to leave unconfigured: with no SMTP_HOST it reports itself
	// disabled and the verification token falls back to the API response, which
	// is how local development and the test suite worked before mail existed.
	mail       *mailer.Mailer
	appBaseURL string
}

// ponytail: the mailer is resolved from the environment here rather than passed
// in, so the existing call sites of NewAuthService stay untouched. Take it as a
// parameter the day a caller needs to inject a different transport.
func NewAuthService(repo *repository.AuthRepository) *AuthService {
	return &AuthService{
		repo:       repo,
		mail:       mailer.FromEnv(),
		appBaseURL: configPkg.AppBaseURL(),
	}
}

// Register checks duplicate email, hashes password with bcrypt cost 12, creates user & verification token.
func (s *AuthService) Register(ctx context.Context, req *dto.RegisterRequest, ipAddress string) (*models.User, string, error) {
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
		RoleID:           "user",
		Status:           "active",
		Country:          req.Country,
		CurrentLocation:  req.CurrentLocation,
		JobTitle:         req.JobTitle,
		EmploymentStatus: req.EmploymentStatus,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.repo.CreateUser(ctx, u); err != nil {
		return nil, "", err
	}

	// Create profile record
	_ = s.repo.CreateProfile(ctx, u)

	// Create email verification record
	verifyToken := uuid.New().String()
	ev := &models.EmailVerification{
		ID:        uuid.New(),
		UserID:    u.ID,
		Token:     verifyToken,
		ExpiresAt: time.Now().Add(24 * time.Hour),
		CreatedAt: time.Now(),
	}
	_ = s.repo.CreateEmailVerification(ctx, ev)

	// Audit Log
	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    u.ID,
		Action:    "USER_REGISTERED",
		IPAddress: ipAddress,
		CreatedAt: time.Now(),
	})

	// A mail server that is down must not cost the user their account: the row
	// is already committed, so a failed send is logged and the token is handed
	// back through the response instead, exactly as it was before SMTP existed.
	if s.sendVerificationEmail(u, verifyToken) {
		verifyToken = ""
	}

	return u, verifyToken, nil
}

// sendVerificationEmail delivers the verification link and reports whether the
// message actually left the building. A false return means the caller still has
// to surface the token some other way.
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
  <body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5">
    <p>Hi %s,</p>
    <p>Confirm this address to finish setting up your Kirmya account.</p>
    <p><a href="%s" style="background:#1a56db;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Verify my email</a></p>
    <p>Or paste this link into your browser:<br><span>%s</span></p>
    <p>The link expires in 24 hours. If you did not create this account you can ignore this message.</p>
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

// Legacy Register signature support for tests: Register(ctx, email, password)
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
	u, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	if u.Status == "locked" || u.Status == "suspended" {
		return "", "", nil, errors.New("account is locked or suspended. Please contact support")
	}

	// Password comparison
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
			ID:        uuid.New(),
			UserID:    u.ID,
			Action:    "LOGIN_FAILED_INVALID_CREDENTIALS",
			IPAddress: ipAddress,
			CreatedAt: time.Now(),
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
	refreshTokenStr := uuid.New().String()
	sess := &models.Session{
		ID:           uuid.New(),
		UserID:       u.ID,
		RefreshToken: refreshTokenStr,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		ExpiresAt:    time.Now().Add(sessionDuration),
		CreatedAt:    time.Now(),
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
		CreatedAt: time.Now(),
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
			CreatedAt: time.Now(),
		})
		return "", "", errors.New("security alert: session token reuse detected. All user sessions revoked")
	}

	if time.Now().After(sess.ExpiresAt) {
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

	newRefreshTokenStr := uuid.New().String()
	newSess := &models.Session{
		ID:           uuid.New(),
		UserID:       u.ID,
		RefreshToken: newRefreshTokenStr,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour),
		CreatedAt:    time.Now(),
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
			CreatedAt: time.Now(),
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

	if time.Now().After(ev.ExpiresAt) {
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
		CreatedAt: time.Now(),
	})

	return nil
}

// ResendVerification generates a new token.
func (s *AuthService) ResendVerification(ctx context.Context, email, ipAddress string) error {
	u, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return errors.New("user with this email does not exist")
	}

	if u.EmailVerified {
		return errors.New("email is already verified")
	}

	ev := &models.EmailVerification{
		ID:        uuid.New(),
		UserID:    u.ID,
		Token:     uuid.New().String(),
		ExpiresAt: time.Now().Add(24 * time.Hour),
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreateEmailVerification(ctx, ev); err != nil {
		return err
	}

	_ = s.repo.CreateAuditLog(ctx, &models.AuditLog{
		ID:        uuid.New(),
		UserID:    u.ID,
		Action:    "RESEND_VERIFICATION_SENT",
		IPAddress: ipAddress,
		CreatedAt: time.Now(),
	})

	// Resending is the whole point of this call, so unlike registration a failed
	// delivery is reported rather than swallowed — otherwise the caller is told
	// an email is on its way that nobody sent. With SMTP unconfigured the
	// endpoint keeps its previous behaviour of just minting a fresh token.
	if s.mail.Enabled() && !s.sendVerificationEmail(u, ev.Token) {
		return errors.New("could not send the verification email. Please try again shortly")
	}

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
		IsActive:  sess.RevokedAt == nil && time.Now().Before(sess.ExpiresAt),
	}, nil
}

// GenerateAccessToken builds a signed JWT.
func (s *AuthService) GenerateAccessToken(userID uuid.UUID, email, role string) (string, error) {
	claims := models.JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "kirmya-auth-service",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(configPkg.GetJWTSecretBytes())
}

// ValidateAccessToken parses signed JWT token.
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
