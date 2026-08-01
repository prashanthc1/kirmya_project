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
		resumes.GET("/:id", handler.GetResume)
		resumes.PUT("/:id", handler.UpdateResumeSections)
		resumes.DELETE("/:id", handler.DeleteResume)
		resumes.POST("/:id/duplicate", handler.DuplicateResume)
		resumes.PUT("/:id/default", handler.SetDefaultResume)
		resumes.GET("/:id/versions", handler.ListVersions)
	}
}
