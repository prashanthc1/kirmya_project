package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// User represents a user account record in PostgreSQL.
type User struct {
	ID               uuid.UUID `json:"id"`
	UUID             uuid.UUID `json:"uuid"`
	FirstName        string    `json:"firstName"`
	LastName         string    `json:"lastName"`
	Email            string    `json:"email"`
	PasswordHash     string    `json:"-"`
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

// UserAccount model alias for backward compatibility.
type UserAccount = User

// Session tracks active refresh tokens and user sessions.
type Session struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"userId"`
	RefreshToken string     `json:"refreshToken"`
	IPAddress    string     `json:"ipAddress"`
	UserAgent    string     `json:"userAgent"`
	ExpiresAt    time.Time  `json:"expiresAt"`
	RevokedAt    *time.Time `json:"revokedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// RefreshToken alias for Session for legacy references.
type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
	IsRevoked bool      `json:"isRevoked"`
}

// EmailVerification stores email confirmation tokens.
type EmailVerification struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}

// AuditLog tracks security actions.
type AuditLog struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Action    string    `json:"action"`
	IPAddress string    `json:"ipAddress"`
	CreatedAt time.Time `json:"createdAt"`
}

// JWTClaims encapsulates JWT custom payload.
type JWTClaims struct {
	UserID uuid.UUID `json:"userId"`
	Email  string    `json:"email"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}
