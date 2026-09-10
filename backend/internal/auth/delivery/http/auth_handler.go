package http

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"kirmya/internal/auth/dto"
	"kirmya/internal/auth/service"
	"kirmya/internal/shared/authcookie"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	service *service.AuthService

	// cookie is the one refresh-cookie policy this handler writes through.
	// Login, refresh and logout used to each build their own SetCookie call and
	// their attributes drifted, so a cookie set with SameSite=Strict was cleared
	// with no SameSite at all.
	cookie authcookie.Config
}

// NewAuthHandler builds the handler against the session policy the service
// already resolved, so the cookie's Max-Age and the session row's expiry are the
// same number rather than two constants maintained in parallel.
func NewAuthHandler(s *service.AuthService) *AuthHandler {
	return &AuthHandler{service: s, cookie: s.SessionPolicy()}
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
		// Only a caller-fixable rejection is a bad request. Reporting a database
		// timeout or any other server fault as 400 told the caller its details
		// were wrong and hid a real outage behind a validation message.
		var rejected *service.RegistrationRejectedError
		if errors.As(err, &rejected) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		slog.Error("registration failed", slog.String("error", err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration could not be completed"})
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

	c.JSON(http.StatusCreated, dto.RegisterResponseDTO{
		Message:                   "Registration successful. Please check your email to verify your account.",
		UserID:                    u.ID,
		EmailVerificationRequired: true,
		VerificationToken:         verifyToken,
		User:                      userDTO,
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
		// An account refused for its standing answers exactly as a wrong
		// password does: 401, same words. It used to be a 403 carrying "account
		// is locked or suspended", selected by searching the error text for the
		// word "locked" - which told an unauthenticated caller that an address
		// has an account and what has been done to it, one guess at a time.
		//
		// The distinction is kept where it is useful and safe: the audit trail
		// records the real reason and the status.
		var ineligible *service.AccountNotEligibleError
		if errors.As(err, &ineligible) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		// Only a credential or account-state rejection is a 401. A lookup that
		// failed or a session that could not be stored is a server fault, and
		// answering 401 told a caller with correct credentials otherwise.
		var rejected *service.LoginRejectedError
		if errors.As(err, &rejected) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		slog.Error("login failed", slog.String("error", err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Sign-in could not be completed"})
		return
	}

	// The cookie expires exactly when the session row does, and both come from
	// the Remember Me policy the request asked for.
	h.cookie.Set(c, refreshToken, time.Now().UTC().Add(h.cookie.Lifetime(payload.RememberMe)))

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
		// The real lifetime of the token in this response. It was hardcoded to
		// 86400 while the token expired in fifteen minutes, so any client that
		// scheduled a refresh against it woke up almost a day too late.
		ExpiresIn: int64(h.service.AccessTokenTTL().Seconds()),
		User:      userDTO,
		Message:   "Login successful",
	})
}

// Refresh handles POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	tokenStr := h.cookie.Read(c)
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing refresh token cookie"})
		return
	}

	result, err := h.service.Refresh(c.Request.Context(), tokenStr, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		// A refresh that lost a race against another in-flight refresh from the
		// same page load must not clear the cookie: the winning request already
		// replaced it, and deleting it here would sign the user out of the very
		// reload that was supposed to keep them signed in. 409 tells the client
		// to retry rather than to give up on the session.
		if errors.Is(err, service.ErrSessionRotationRaced) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		h.cookie.Clear(c)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// The rotated cookie inherits the session's absolute expiry rather than
	// starting a fresh lifetime, so a Remember Me session keeps its own clock and
	// no session renews itself forever.
	h.cookie.Set(c, result.RefreshToken, result.ExpiresAt)

	c.JSON(http.StatusOK, gin.H{
		"accessToken": result.AccessToken,
		"expiresIn":   int(h.service.AccessTokenTTL().Seconds()),
	})
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	tokenStr := h.cookie.Read(c)

	// The cookie is cleared whatever happens on the server, so the browser stops
	// presenting a token it can no longer use. But a revocation that failed is
	// not a successful logout: the session is still live for anyone holding that
	// token, and saying "logged out" would be false.
	if tokenStr != "" {
		if err := h.service.Logout(c.Request.Context(), tokenStr, c.ClientIP()); err != nil {
			h.cookie.Clear(c)
			slog.Error("logout could not revoke the session", slog.String("error", err.Error()))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Sign-out could not be completed. Please try again."})
			return
		}
	}

	h.cookie.Clear(c)
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

// ForgotPassword handles POST /api/v1/auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var payload dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()
	_ = h.service.ForgotPassword(c.Request.Context(), &payload, ipAddress, userAgent)

	c.JSON(http.StatusOK, gin.H{
		"message": "If an account exists for this email address, password reset instructions have been sent.",
	})
}

// ResetPassword handles POST /api/v1/auth/reset-password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var payload dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset token is required"})
		return
	}

	pwd := payload.GetPassword()
	if pwd == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password is required"})
		return
	}

	ipAddress := c.ClientIP()
	if err := h.service.ResetPassword(c.Request.Context(), &payload, ipAddress); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Your password has been successfully reset. You can now sign in with your new credentials.",
	})
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
		// An account that may no longer authenticate has ended its session, and
		// 401 is what says so: the client clears its state and returns to
		// sign-in. Answering 404 here would read as "profile missing" and leave
		// a signed-in shell over an account that may not sign in.
		if errors.Is(err, service.ErrAccountNotEligible) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Your session has ended. Please sign in again.",
				"code":  "ACCOUNT_NOT_ELIGIBLE",
			})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// GetSession handles GET /api/v1/auth/session
func (h *AuthHandler) GetSession(c *gin.Context) {
	tokenStr := h.cookie.Read(c)
	if tokenStr == "" {
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
