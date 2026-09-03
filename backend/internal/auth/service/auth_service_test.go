package service

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/models"
	"kirmya/internal/auth/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuthRegisterPasswordComplexity(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	// Case 1: Short password
	req1 := &dto.RegisterRequest{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "test1@kirmya.ae",
		Password:        "Short1!",
		ConfirmPassword: "Short1!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, _, err := svc.Register(context.Background(), req1, "127.0.0.1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be at least 12 characters")

	// Case 2: Missing special character
	req2 := &dto.RegisterRequest{
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "test2@kirmya.ae",
		Password:        "NoSpecialChar123",
		ConfirmPassword: "NoSpecialChar123",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, _, err = svc.Register(context.Background(), req2, "127.0.0.1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must contain at least one special character")

	// Case 3: Valid registration
	reqValid := &dto.RegisterRequest{
		FirstName:       "Jane",
		LastName:        "Doe",
		Email:           "jane@kirmya.ae",
		Password:        "SecureP@ssw0rd123!",
		ConfirmPassword: "SecureP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	user, verifyToken, err := svc.Register(context.Background(), reqValid, "127.0.0.1")
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.NotEmpty(t, verifyToken)
	assert.Equal(t, "jane@kirmya.ae", user.Email)
}

func TestLoginAndRefreshFlow(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	reqValid := &dto.RegisterRequest{
		FirstName:       "Alex",
		LastName:        "Smith",
		Email:           "alex@kirmya.ae",
		Password:        "SecureP@ssw0rd123!",
		ConfirmPassword: "SecureP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, verifyToken, err := svc.Register(context.Background(), reqValid, "127.0.0.1")
	assert.NoError(t, err)

	// Verify Email
	err = svc.VerifyEmail(context.Background(), verifyToken, "127.0.0.1")
	assert.NoError(t, err)

	// Login
	loginReq := &dto.LoginRequest{
		Email:      "alex@kirmya.ae",
		Password:   "SecureP@ssw0rd123!",
		RememberMe: true,
	}
	accToken, refToken, user, err := svc.Login(context.Background(), loginReq, "127.0.0.1", "UnitTestAgent/1.0")
	assert.NoError(t, err)
	assert.NotEmpty(t, accToken)
	assert.NotEmpty(t, refToken)
	assert.Equal(t, "alex@kirmya.ae", user.Email)

	// Token validation
	claims, err := svc.ValidateAccessToken(accToken)
	assert.NoError(t, err)
	assert.Equal(t, user.ID, claims.UserID)

	// Token refresh
	newAccToken, newRefToken, err := svc.Refresh(context.Background(), refToken, "127.0.0.1", "UnitTestAgent/1.0")
	assert.NoError(t, err)
	assert.NotEmpty(t, newAccToken)
	assert.NotEmpty(t, newRefToken)
}

func TestTokenGenerationAndValidation(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	userID := uuid.New()
	email := "developer@kirmya.ae"

	token, err := svc.GenerateAccessToken(userID, email, "user")
	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	claims, err := svc.ValidateAccessToken(token)
	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, email, claims.Email)
}

func TestEmailNormalizationAndDuplicateProtection(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	req := &dto.RegisterRequest{
		FirstName:       "Sam",
		LastName:        "Fisher",
		Email:           "  Sam.Fisher@Kirmya.AE  ",
		Password:        "SecureP@ssw0rd123!",
		ConfirmPassword: "SecureP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}

	user, _, err := svc.Register(context.Background(), req, "127.0.0.1")
	assert.NoError(t, err)
	assert.Equal(t, "sam.fisher@kirmya.ae", user.Email)
	assert.Equal(t, "user", user.RoleID, "Role must default to standard user")

	// Verify email
	_ = repo.UpdateUserEmailVerified(context.Background(), user.ID)

	// Login with different case & spaces
	loginReq := &dto.LoginRequest{
		Email:    "  SAM.FISHER@kirmya.ae ",
		Password: "SecureP@ssw0rd123!",
	}
	accToken, _, loggedUser, err := svc.Login(context.Background(), loginReq, "127.0.0.1", "UnitTest")
	assert.NoError(t, err)
	assert.NotEmpty(t, accToken)
	assert.Equal(t, "sam.fisher@kirmya.ae", loggedUser.Email)

	// Duplicate registration attempt with altered casing must fail
	dupReq := &dto.RegisterRequest{
		FirstName:       "Sam",
		LastName:        "Fisher",
		Email:           "SAM.fisher@kirmya.ae",
		Password:        "AnotherP@ssw0rd123!",
		ConfirmPassword: "AnotherP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	_, _, dupErr := svc.Register(context.Background(), dupReq, "127.0.0.1")
	assert.Error(t, dupErr)
	assert.Contains(t, dupErr.Error(), "already exists")
}

func TestForgotPasswordAndResetFlow(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	req := &dto.RegisterRequest{
		FirstName:       "Bruce",
		LastName:        "Wayne",
		Email:           "bruce@wayne.com",
		Password:        "InitialP@ssw0rd123!",
		ConfirmPassword: "InitialP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	user, _, err := svc.Register(context.Background(), req, "127.0.0.1")
	assert.NoError(t, err)

	// Forgot password request (generic safe response)
	err = svc.ForgotPassword(context.Background(), &dto.ForgotPasswordRequest{
		Email: "bruce@wayne.com",
	}, "127.0.0.1", "UnitTest")
	assert.NoError(t, err)

	// Direct token test: verify invalid token fails
	invalidReset := &dto.ResetPasswordRequest{
		Token:       "invalid-non-existent-token",
		NewPassword: "BrandNewP@ssw0rd123!",
	}
	assert.Error(t, svc.ResetPassword(context.Background(), invalidReset, "127.0.0.1"))

	// Create a known raw token and hash for testing reset execution
	testRawToken := "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
	_ = repo.CreatePasswordReset(context.Background(), &models.PasswordReset{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: hashToken(testRawToken),
		ExpiresAt: time.Now().UTC().Add(1 * time.Hour),
		CreatedAt: time.Now().UTC(),
	})

	// Execute valid reset
	validReset := &dto.ResetPasswordRequest{
		Token:       testRawToken,
		NewPassword: "BrandNewP@ssw0rd123!",
	}
	err = svc.ResetPassword(context.Background(), validReset, "127.0.0.1")
	assert.NoError(t, err)

	// Replay attempt with same token must fail
	err = svc.ResetPassword(context.Background(), validReset, "127.0.0.1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already been used")

	// Old password must fail login
	_, _, _, oldErr := svc.Login(context.Background(), &dto.LoginRequest{
		Email:    "bruce@wayne.com",
		Password: "InitialP@ssw0rd123!",
	}, "127.0.0.1", "UnitTest")
	assert.Error(t, oldErr)

	// New password must succeed login
	_, _, _, newErr := svc.Login(context.Background(), &dto.LoginRequest{
		Email:    "bruce@wayne.com",
		Password: "BrandNewP@ssw0rd123!",
	}, "127.0.0.1", "UnitTest")
	assert.NoError(t, newErr)
}

func TestDisabledAccountRejection(t *testing.T) {
	repo := repository.NewAuthRepository(nil)
	svc := NewAuthService(repo)

	req := &dto.RegisterRequest{
		FirstName:       "Locked",
		LastName:        "User",
		Email:           "locked@kirmya.ae",
		Password:        "SecureP@ssw0rd123!",
		ConfirmPassword: "SecureP@ssw0rd123!",
		AcceptTerms:     true,
		AcceptPrivacy:   true,
	}
	user, _, err := svc.Register(context.Background(), req, "127.0.0.1")
	assert.NoError(t, err)

	// Suspend account
	user.Status = "suspended"
	_ = repo.UpdateUser(context.Background(), user)

	// Login must be blocked
	_, _, _, loginErr := svc.Login(context.Background(), &dto.LoginRequest{
		Email:    "locked@kirmya.ae",
		Password: "SecureP@ssw0rd123!",
	}, "127.0.0.1", "UnitTest")
	assert.Error(t, loginErr)
	assert.Contains(t, loginErr.Error(), "suspended")
}
