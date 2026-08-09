package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *CoverLetterHandler) {
	letters := api.Group("/cover-letters")
	letters.Use(sharedMiddleware.AuthRequired())
	{
		letters.GET("", handler.ListCoverLetters)
		letters.POST("", handler.CreateCoverLetter)
		letters.GET("/templates", handler.GetTemplates)
		letters.GET("/:id", handler.GetCoverLetter)
		letters.PUT("/:id", handler.UpdateCoverLetter)
		letters.DELETE("/:id", handler.DeleteCoverLetter)
		letters.POST("/:id/duplicate", handler.DuplicateCoverLetter)
		letters.POST("/:id/generate", handler.GenerateCoverLetter)
		letters.POST("/:id/rewrite", handler.RewriteCoverLetter)
		letters.POST("/:id/tailor", handler.TailorCoverLetter)
		letters.POST("/:id/preview", handler.PreviewCoverLetter)
		letters.GET("/:id/download", handler.DownloadCoverLetter)
		letters.POST("/:id/share", handler.ShareCoverLetter)
		letters.DELETE("/:id/share", handler.DeleteShare)
		letters.GET("/:id/versions", handler.ListVersions)
		letters.POST("/:id/versions", handler.CreateVersion)
		letters.GET("/:id/analytics", handler.GetAnalytics)
	}
}
