package http

import (
	"github.com/gin-gonic/gin"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *AuthHandler, authMiddleware *authMiddlewarePkg.AuthMiddleware) {
	authGroup := api.Group("/auth")
	authGroup.Use(sharedMiddleware.RateLimiter(5.0/60.0, 5.0))
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
