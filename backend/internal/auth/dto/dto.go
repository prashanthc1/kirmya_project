package dto

import (
	"time"

	"github.com/google/uuid"
)

// RegisterRequest represents payload for sign up supporting both snake_case & camelCase.
type RegisterRequest struct {
	FirstName              string `json:"firstName"`
	FirstNameSnake         string `json:"first_name"`
	LastName               string `json:"lastName"`
	LastNameSnake          string `json:"last_name"`
	Email                  string `json:"email" binding:"required,email"`
	Password               string `json:"password" binding:"required,min=12"`
	ConfirmPassword        string `json:"confirmPassword"`
	Country                string `json:"country"`
	CurrentLocation        string `json:"currentLocation"`
	LocationSnake          string `json:"location"`
	JobTitle               string `json:"jobTitle"`
	JobTitleSnake          string `json:"job_title"`
	EmploymentStatus       string `json:"employmentStatus"`
	ProfessionalStatusSnake string `json:"professional_status"`
	AcceptTerms            bool   `json:"acceptTerms"`
	AcceptTermsSnake       bool   `json:"accept_terms"`
	AcceptPrivacy          bool   `json:"acceptPrivacy"`
	AcceptPrivacySnake     bool   `json:"accept_privacy"`
	SubscribeCareerUpdates bool   `json:"subscribeCareerUpdates"`
}

// NormalizeFields ensures field values from both camelCase and snake_case inputs are populated.
func (r *RegisterRequest) NormalizeFields() {
	if r.FirstName == "" && r.FirstNameSnake != "" {
		r.FirstName = r.FirstNameSnake
	}
	if r.LastName == "" && r.LastNameSnake != "" {
		r.LastName = r.LastNameSnake
	}
	if r.CurrentLocation == "" && r.LocationSnake != "" {
		r.CurrentLocation = r.LocationSnake
	}
	if r.JobTitle == "" && r.JobTitleSnake != "" {
		r.JobTitle = r.JobTitleSnake
	}
	if r.EmploymentStatus == "" && r.ProfessionalStatusSnake != "" {
		r.EmploymentStatus = r.ProfessionalStatusSnake
	}
	if !r.AcceptTerms && r.AcceptTermsSnake {
		r.AcceptTerms = r.AcceptTermsSnake
	}
	if !r.AcceptPrivacy && r.AcceptPrivacySnake {
		r.AcceptPrivacy = r.AcceptPrivacySnake
	}
}

// RegisterResponseDTO returned upon successful registration.
type RegisterResponseDTO struct {
	Message                   string         `json:"message"`
	UserID                    uuid.UUID      `json:"user_id"`
	EmailVerificationRequired bool           `json:"email_verification_required"`
	VerificationToken         string         `json:"verificationToken,omitempty"`
	User                      UserProfileDTO `json:"user"`
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

// ForgotPasswordRequest contains email to request password reset.
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest contains token and new password for reset.
type ResetPasswordRequest struct {
	Token            string `json:"token" binding:"required"`
	Password         string `json:"password"`
	NewPassword      string `json:"new_password"`
	NewPasswordCamel string `json:"newPassword"`
}

// GetPassword returns whichever password field was populated.
func (r *ResetPasswordRequest) GetPassword() string {
	if r.Password != "" {
		return r.Password
	}
	if r.NewPassword != "" {
		return r.NewPassword
	}
	return r.NewPasswordCamel
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
