package http

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes mounts the public job board.
//
// No auth middleware: /jobs is the landing page's primary call to action and the
// target of the schema.org SearchAction, so it must serve signed-out visitors
// and crawlers. Only 'active', unexpired postings are ever returned — see
// repository.SearchJobs.
func RegisterRoutes(api *gin.RouterGroup, handler *JobHandler) {
	jobsGroup := api.Group("/jobs")
	{
		jobsGroup.GET("", handler.SearchJobs)
	}
}
