package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the public job board and job details.
func RegisterRoutes(api *gin.RouterGroup, handler *JobHandler) {
	jobsGroup := api.Group("/jobs")
	{
		jobsGroup.GET("", handler.SearchJobs)
		jobsGroup.GET("/:id", handler.GetJobByID)
	}
}
