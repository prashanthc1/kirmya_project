package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *ResumeHandler) {
	resumes := api.Group("/resumes")
	resumes.Use(sharedMiddleware.AuthRequired())
	{
		resumes.GET("", handler.ListResumes)
		resumes.POST("", handler.CreateResume)
		resumes.POST("/import", handler.ImportResume)
		resumes.GET("/templates", handler.GetTemplates)
		resumes.GET("/:id", handler.GetResume)
		resumes.PUT("/:id", handler.UpdateResumeSections)
		resumes.DELETE("/:id", handler.DeleteResume)
		resumes.POST("/:id/duplicate", handler.DuplicateResume)
		resumes.POST("/:id/default", handler.SetDefaultResume)
		resumes.GET("/:id/versions", handler.ListVersions)
		resumes.POST("/:id/analyze", handler.AnalyzeResume)
		resumes.POST("/:id/optimize", handler.OptimizeResume)
		resumes.POST("/:id/tailor", handler.TailorResume)
		resumes.POST("/:id/preview", handler.PreviewResume)
		resumes.GET("/:id/download", handler.DownloadResume)
		resumes.POST("/:id/share", handler.ShareResume)
		resumes.DELETE("/:id/share", handler.DeleteShare)
		resumes.GET("/:id/analytics", handler.GetAnalytics)
	}
}
