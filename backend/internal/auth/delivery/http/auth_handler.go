package http

import (
	"net/http"
	"strings"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(s *service.AuthService) *AuthHandler {
	return &AuthHandler{service: s}
}

// Register handles POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var payload dto.RegisterRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	u, verifyToken, err := h.service.Register(c.Request.Context(), &payload, ipAddress)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
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

	c.JSON(http.StatusCreated, gin.H{
		"message":           "Registration successful. Please check your email to verify your account.",
		"user":              userDTO,
		"verificationToken": verifyToken, // Provided for automated testing / dev flow
	})
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var payload dto.LoginRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	accessToken, refreshToken, u, err := h.service.Login(c.Request.Context(), &payload, ipAddress, userAgent)
	if err != nil {
		if strings.Contains(err.Error(), "locked") || strings.Contains(err.Error(), "suspended") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Set HttpOnly, Secure, SameSite=Strict cookie for refresh token
	cookieMaxAge := 7 * 24 * 3600
	if payload.RememberMe {
		cookieMaxAge = 30 * 24 * 3600
	}

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", refreshToken, cookieMaxAge, "/api/v1/auth", "", true, true)

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

	c.JSON(http.StatusOK, dto.AuthResponseDTO{
		AccessToken:      accessToken,
		AccessTokenCamel: accessToken,
		ExpiresIn:        86400,
		User:             userDTO,
		Message:          "Login successful",
	})
}

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	tokenStr, err := c.Cookie("refresh_token")
	if err != nil || tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing refresh token cookie"})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	newAccessToken, newRefreshToken, err := h.service.Refresh(c.Request.Context(), tokenStr, ipAddress, userAgent)
	if err != nil {
		c.SetCookie("refresh_token", "", -1, "/api/v1/auth", "", true, true)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", newRefreshToken, 7*24*3600, "/api/v1/auth", "", true, true)

	c.JSON(http.StatusOK, gin.H{"accessToken": newAccessToken})
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	tokenStr, err := c.Cookie("refresh_token")
	if err == nil && tokenStr != "" {
		_ = h.service.Logout(c.Request.Context(), tokenStr, c.ClientIP())
	}

	c.SetCookie("refresh_token", "", -1, "/api/v1/auth", "", true, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// VerifyEmail handles POST /api/v1/auth/verify-email
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var payload dto.VerifyEmailRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.VerifyEmail(c.Request.Context(), payload.Token, c.ClientIP()); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email address successfully verified. You may now sign in."})
}

// ResendVerification handles POST /api/v1/auth/resend-verification
func (h *AuthHandler) ResendVerification(c *gin.Context) {
	var payload dto.ResendVerificationRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.ResendVerification(c.Request.Context(), payload.Email, c.ClientIP()); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification email resent successfully."})
}

// GetMe handles GET /api/v1/auth/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	res, err := h.service.GetUserMe(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetSession handles GET /api/v1/auth/session
func (h *AuthHandler) GetSession(c *gin.Context) {
	tokenStr, err := c.Cookie("refresh_token")
	if err != nil || tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Active session not found"})
		return
	}

	sessDTO, err := h.service.GetSessionInfo(c.Request.Context(), tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sessDTO)
}
