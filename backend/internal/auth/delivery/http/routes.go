package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

// defaultGroupRequestsPerMinute and defaultGroupBurst are the production
// allowance for the credential endpoints. Callers pass zero to take them.
const (
	defaultGroupRequestsPerMinute = 5.0
	defaultGroupBurst             = 5.0

	// defaultSessionRequestsPerMinute and defaultSessionBurst size the separate
	// bucket in front of the session endpoints.
	//
	// These used to share the credential bucket, and that is what signed users
	// out on reload. Restoring a session costs two requests — POST /auth/refresh
	// then GET /auth/me — so five per minute is two and a half page loads for a
	// whole client IP. A third reload, a second tab, or any office or mobile
	// network behind one address answered 429, the web client read that as a
	// dead session and cleared it. CI never saw it because the integration
	// workflow raises the allowance to 60000.
	//
	// A generous budget is safe here in a way it would not be on login: these
	// endpoints spray nothing. /auth/refresh requires an unguessable token that
	// is single-use, and /auth/me requires a signed access token. The limit
	// exists to bound abuse, not to stop credential guessing.
	defaultSessionRequestsPerMinute = 120.0
	defaultSessionBurst             = 60.0
)

// RegisterRoutes mounts the credential endpoints. groupRequestsPerMinute and
// groupBurst size the group's per-IP bucket; zero for either takes the
// production default above. They exist so a browser test suite, which drives
// every project from one loopback address and therefore shares a single
// bucket, can be given room without the limiter being removed. The reset
// endpoints' own limiters below are not configurable: nothing legitimate
// needs to exceed them.
func RegisterRoutes(api *gin.RouterGroup, handler *AuthHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware, groupRequestsPerMinute, groupBurst float64) {
	RegisterRoutesWithSessionLimit(api, handler, authMiddleware, groupRequestsPerMinute, groupBurst, 0, 0)
}

// RegisterRoutesWithSessionLimit is RegisterRoutes with the session bucket sized
// explicitly. Zero for either session parameter takes the default above.
func RegisterRoutesWithSessionLimit(
	api *gin.RouterGroup,
	handler *AuthHandler,
	authMiddleware *authMiddlewarePkg.AuthMiddleware,
	groupRequestsPerMinute, groupBurst float64,
	sessionRequestsPerMinute, sessionBurst float64,
) {
	if groupRequestsPerMinute <= 0 {
		groupRequestsPerMinute = defaultGroupRequestsPerMinute
	}
	if groupBurst <= 0 {
		groupBurst = defaultGroupBurst
	}
	if sessionRequestsPerMinute <= 0 {
		sessionRequestsPerMinute = defaultSessionRequestsPerMinute
	}
	if sessionBurst <= 0 {
		sessionBurst = defaultSessionBurst
	}

	// A group's middleware is copied into each route as it is registered, so
	// these two sibling groups over the same prefix give the credential routes
	// and the session routes genuinely separate buckets — draining one cannot
	// drain the other.
	authGroup := api.Group("/auth")

	session := authGroup.Group("")
	session.Use(sharedMiddleware.RateLimiter(sessionRequestsPerMinute/60.0, sessionBurst))
	{
		// Restoring a session on page load, and ending one. Neither can be used
		// to guess a credential, and both are on the path of every reload.
		session.POST("/refresh", handler.Refresh)
		session.POST("/logout", handler.Logout)
		session.GET("/session", handler.GetSession)
		session.GET("/me", authMiddleware.RequireAuth(), handler.GetMe)
	}

	authGroup.Use(sharedMiddleware.RateLimiter(groupRequestsPerMinute/60.0, groupBurst))
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
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
	}
}
