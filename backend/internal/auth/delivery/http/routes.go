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
		authGroup.POST("/forgot-password", handler.ForgotPassword)
		authGroup.POST("/reset-password", handler.ResetPassword)
		authGroup.GET("/session", handler.GetSession)

		authGroup.GET("/me", authMiddleware.RequireAuth(), handler.GetMe)
	}
}
