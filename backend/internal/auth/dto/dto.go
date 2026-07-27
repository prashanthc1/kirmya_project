package dto

import (
	"time"

	"github.com/google/uuid"
)

// RegisterRequest represents payload for sign up.
type RegisterRequest struct {
	FirstName              string `json:"firstName" binding:"required"`
	LastName               string `json:"lastName" binding:"required"`
	Email                  string `json:"email" binding:"required,email"`
	Password               string `json:"password" binding:"required,min=8"`
	ConfirmPassword        string `json:"confirmPassword" binding:"required"`
	Country                string `json:"country"`
	CurrentLocation        string `json:"currentLocation"`
	JobTitle               string `json:"jobTitle"`
	EmploymentStatus       string `json:"employmentStatus"`
	AcceptTerms            bool   `json:"acceptTerms" binding:"required"`
	AcceptPrivacy          bool   `json:"acceptPrivacy" binding:"required"`
	SubscribeCareerUpdates bool   `json:"subscribeCareerUpdates"`
}

// LoginRequest represents payload for sign in.
type LoginRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required"`
	RememberMe bool   `json:"rememberMe"`
}

// VerifyEmailRequest contains token for email verification.
type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

// ResendVerificationRequest payload to resend email verification.
type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// UserProfileDTO represents non-sensitive public user information.
type UserProfileDTO struct {
	ID               uuid.UUID `json:"id"`
	UUID             uuid.UUID `json:"uuid"`
	FirstName        string    `json:"firstName"`
	LastName         string    `json:"lastName"`
	Email            string    `json:"email"`
	EmailVerified    bool      `json:"emailVerified"`
	RoleID           string    `json:"roleId"`
	Status           string    `json:"status"`
	Country          string    `json:"country"`
	CurrentLocation  string    `json:"currentLocation"`
	JobTitle         string    `json:"jobTitle"`
	EmploymentStatus string    `json:"employmentStatus"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// AuthResponseDTO returned upon successful login.
type AuthResponseDTO struct {
	AccessToken      string         `json:"access_token"`
	AccessTokenCamel string         `json:"accessToken,omitempty"`
	ExpiresIn        int64          `json:"expires_in"`
	User             UserProfileDTO `json:"user"`
	Message          string         `json:"message,omitempty"`
}

// UserMeDTO returned for GET /api/v1/auth/me.
type UserMeDTO struct {
	User               UserProfileDTO `json:"user"`
	Permissions        []string       `json:"permissions"`
	NotificationsCount int            `json:"notificationsCount"`
}

// SessionDTO returned for GET /api/v1/auth/session.
type SessionDTO struct {
	ID        uuid.UUID `json:"id"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
	ExpiresAt time.Time `json:"expiresAt"`
	IsActive  bool      `json:"isActive"`
}
