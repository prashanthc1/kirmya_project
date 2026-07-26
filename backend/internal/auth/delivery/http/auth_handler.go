package http

import (
	"net/http"
	"kirmya/internal/auth/models"
	"kirmya/internal/auth/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service *service.AuthService
}

func NewAuthHandler(s *service.AuthService) *AuthHandler {
	return &AuthHandler{service: s}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var payload models.RegisterRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u, err := h.service.Register(c.Request.Context(), payload.Email, payload.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, u)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var payload models.LoginRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, refreshToken, user, err := h.service.Login(c.Request.Context(), payload.Email, payload.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Set SameSite Strict on the refresh token cookie
	c.SetSameSite(http.SameSiteStrictMode)
	
	// Secure = true, HttpOnly = true, SameSite = Strict
	// Path "/api/v1/auth" encapsulates and targets auth routes only, preventing ambient leakage
	c.SetCookie("refresh_token", refreshToken, 7*24*3600, "/api/v1/auth", "", false, true)

	c.JSON(http.StatusOK, models.LoginResponse{
		AccessToken: accessToken,
		User:        *user,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	tokenStr, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing refresh token cookie"})
		return
	}

	accessToken, newRefreshToken, err := h.service.Refresh(c.Request.Context(), tokenStr)
	if err != nil {
		// Clear invalid/reused tokens
		c.SetCookie("refresh_token", "", -1, "/api/v1/auth", "", false, true)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Set rotated token
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("refresh_token", newRefreshToken, 7*24*3600, "/api/v1/auth", "", false, true)

	c.JSON(http.StatusOK, gin.H{"accessToken": accessToken})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	tokenStr, err := c.Cookie("refresh_token")
	if err == nil && tokenStr != "" {
		_ = h.service.Logout(c.Request.Context(), tokenStr)
	}

	// Revoke cookie
	c.SetCookie("refresh_token", "", -1, "/api/v1/auth", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
