package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// defaultGroupRequestsPerMinute and defaultGroupBurst are the production
// allowance for the whole /auth group. Callers pass zero to take them.
const (
	defaultGroupRequestsPerMinute = 5.0
	defaultGroupBurst             = 5.0
)

// RegisterRoutes mounts the credential endpoints. groupRequestsPerMinute and
// groupBurst size the group's per-IP bucket; zero for either takes the
// production default above. They exist so a browser test suite, which drives
// every project from one loopback address and therefore shares a single
// bucket, can be given room without the limiter being removed. The reset
// endpoints' own limiters below are not configurable: nothing legitimate
// needs to exceed them.
func RegisterRoutes(api *gin.RouterGroup, handler *AuthHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware, groupRequestsPerMinute, groupBurst float64) {
	if groupRequestsPerMinute <= 0 {
		groupRequestsPerMinute = defaultGroupRequestsPerMinute
	}
	if groupBurst <= 0 {
		groupBurst = defaultGroupBurst
	}
	authGroup := api.Group("/auth")
	authGroup.Use(sharedMiddleware.RateLimiter(groupRequestsPerMinute/60.0, groupBurst))
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
		authGroup.POST("/refresh", handler.Refresh)
		authGroup.POST("/logout", handler.Logout)
		authGroup.POST("/verify-email", handler.VerifyEmail)
		authGroup.POST("/resend-verification", handler.ResendVerification)
		// The password reset endpoints carry a second, tighter limiter on top
		// of the group's. Each RateLimiter is its own per-IP bucket, so this
		// stops a burst of reset traffic from also consuming the allowance that
		// login and registration share, and caps reset attempts over a longer
		// window than the group's per-minute bucket can express.
		//
		// Neither limiter can protect a specific mailbox, since an attacker
		// distributing requests across addresses passes both. That is the
		// per-account throttle in AuthService.ForgotPassword, and the two are
		// meant to be read together.
		authGroup.POST("/forgot-password",
			sharedMiddleware.RateLimiter(5.0/900.0, 5.0), handler.ForgotPassword)
		authGroup.POST("/reset-password",
			sharedMiddleware.RateLimiter(10.0/900.0, 10.0), handler.ResetPassword)
		authGroup.GET("/session", handler.GetSession)

		authGroup.GET("/me", authMiddleware.RequireAuth(), handler.GetMe)
	}
}
