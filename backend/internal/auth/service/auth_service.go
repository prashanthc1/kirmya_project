package service

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"regexp"
	"time"

	"kirmya/internal/auth/models"
	"kirmya/internal/auth/repository"
	configPkg "kirmya/internal/shared/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo *repository.AuthRepository
}

func NewAuthService(repo *repository.AuthRepository) *AuthService {
	return &AuthService{repo: repo}
}

// Register checks password strength, hashes it, and registers a user profile.
func (s *AuthService) Register(ctx context.Context, email string, password string) (*models.UserAccount, error) {
	// 1. Password complexity validation
	if len(password) < 12 {
		return nil, errors.New("password must be at least 12 characters long")
	}
	
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*()_+=\[\]{}|;:',.<>?/~\-]`).MatchString(password)

	if !hasUpper || !hasLower || !hasNumber || !hasSpecial {
		return nil, errors.New("password must contain uppercase, lowercase, numbers, and special symbols")
	}

	// 2. Bcrypt hashing with cost 12
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, err
	}

	u := &models.UserAccount{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: string(hashBytes),
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err = s.repo.CreateUserAccount(ctx, u)
	if err != nil {
		return nil, err
	}

	return u, nil
}

// Login validates user credentials and issues short-lived JWT + long-lived Refresh token.
func (s *AuthService) Login(ctx context.Context, email string, password string) (string, string, *models.UserAccount, error) {
	u, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	if !u.IsActive {
		return "", "", nil, errors.New("account suspended")
	}

	// Bcrypt password comparison
	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	if err != nil {
		return "", "", nil, errors.New("invalid credentials")
	}

	// Generate tokens
	accessToken, err := s.GenerateAccessToken(u.ID, u.Email)
	if err != nil {
		return "", "", nil, err
	}

	refreshTokenStr := uuid.New().String()
	rt := &models.RefreshToken{
		ID:        uuid.New(),
		UserID:    u.ID,
		Token:     refreshTokenStr,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
		CreatedAt: time.Now(),
		IsRevoked: false,
	}

	err = s.repo.CreateRefreshToken(ctx, rt)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshTokenStr, u, nil
}

// Refresh handles token rotation. If token is revoked/reused, all tokens in family are revoked.
func (s *AuthService) Refresh(ctx context.Context, tokenStr string) (string, string, error) {
	rt, err := s.repo.GetRefreshToken(ctx, tokenStr)
	if err != nil {
		return "", "", errors.New("invalid refresh token")
	}

	// Token reuse detection (Breach Countermeasure)
	if rt.IsRevoked {
		_ = s.repo.RevokeAllUserTokens(ctx, rt.UserID)
		return "", "", errors.New("security alert: refresh token reused; all sessions revoked")
	}

	if time.Now().After(rt.ExpiresAt) {
		return "", "", errors.New("refresh token expired")
	}

	u, err := s.repo.GetUserByID(ctx, rt.UserID)
	if err != nil || !u.IsActive {
		return "", "", errors.New("user unavailable")
	}

	// Revoke current token
	err = s.repo.RevokeRefreshToken(ctx, rt.ID)
	if err != nil {
		return "", "", err
	}

	// Create rotated tokens
	accessToken, err := s.GenerateAccessToken(u.ID, u.Email)
	if err != nil {
		return "", "", err
	}

	newRefreshTokenStr := uuid.New().String()
	newRt := &models.RefreshToken{
		ID:        uuid.New(),
		UserID:    u.ID,
		Token:     newRefreshTokenStr,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		CreatedAt: time.Now(),
		IsRevoked: false,
	}

	err = s.repo.CreateRefreshToken(ctx, newRt)
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshTokenStr, nil
}

// Logout revokes the session refresh token.
func (s *AuthService) Logout(ctx context.Context, tokenStr string) error {
	rt, err := s.repo.GetRefreshToken(ctx, tokenStr)
	if err != nil {
		return nil // Graceful exit if already deleted/revoked
	}
	return s.repo.RevokeRefreshToken(ctx, rt.ID)
}

// GenerateAccessToken builds a signed JWT.
func (s *AuthService) GenerateAccessToken(userID uuid.UUID, email string) (string, error) {
	claims := models.JWTClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)), // 15 mins
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "kirmya-security-monolith",
			Subject:   userID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(configPkg.GetJWTSecretBytes())
}

// ValidateAccessToken parses and validates a signed JWT token.
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

// ComparePasswordSecurely uses constant time comparison to defend against timing attacks.
func ComparePasswordSecurely(hash, password string) bool {
	hasher := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return subtle.ConstantTimeCompare([]byte(fmt.Sprintf("%v", hasher == nil)), []byte("true")) == 1
}
