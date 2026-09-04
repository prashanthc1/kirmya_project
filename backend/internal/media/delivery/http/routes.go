package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *FileHandler) {
	filesGroup := api.Group("/files")
	{
		// Viewing files (supports inline streaming with public visibility, JWT bearer, or query token)
		filesGroup.GET("/:id/view", handler.ViewFile)

		// Protected endpoints
		protected := filesGroup.Group("")
		protected.Use(sharedMiddleware.AuthRequired())
		{
			protected.POST("/upload", handler.Upload)
			protected.POST("/presign", handler.PresignUpload)
			protected.GET("/:id", handler.GetMetadata)
			protected.GET("/:id/download", handler.DownloadFile)
			protected.GET("/:id/signed-url", handler.GetSignedURL)
			protected.DELETE("/:id", handler.Delete)
		}
	}
}
