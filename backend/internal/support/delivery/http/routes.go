package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterPublicHelpRoutes(router *gin.RouterGroup, handler *SupportHandler) {
	if handler == nil {
		return
	}

	help := router.Group("/help")
	{
		help.GET("/categories", handler.GetCategories)
		help.GET("/articles", handler.GetArticles)
		help.GET("/articles/:slug", handler.GetArticleBySlug)
		help.POST("/articles/:id/feedback", handler.RecordArticleFeedback)
		help.GET("/faq", handler.GetArticles)
		help.GET("/known-issues", handler.GetArticles)
	}

	router.GET("/status", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "operational",
			"services": gin.H{
				"authentication": "operational",
				"jobs":           "operational",
				"applications":   "operational",
				"messaging":      "operational",
				"communities":    "operational",
				"notifications":  "operational",
				"search":         "operational",
				"ai":             "operational",
			},
		})
	})
}

func RegisterSupportRoutes(router *gin.RouterGroup, handler *SupportHandler) {
	if handler == nil {
		return
	}

	support := router.Group("/support")
	support.Use(sharedMiddleware.AuthRequired())
	{
		support.GET("/tickets", handler.GetUserTickets)
		support.POST("/tickets", handler.CreateTicket)
		support.GET("/tickets/:id", handler.GetTicketByID)
		support.GET("/tickets/:id/messages", handler.GetTicketMessages)
		support.POST("/tickets/:id/messages", handler.AddMessage)
		support.POST("/tickets/:id/close", handler.CloseTicket)
		support.POST("/tickets/:id/reopen", handler.ReopenTicket)
		support.POST("/tickets/:id/feedback", handler.RecordCSAT)
	}

	feedback := router.Group("/feedback")
	feedback.Use(sharedMiddleware.AuthRequired())
	{
		feedback.POST("", handler.CreateFeatureRequest)
		feedback.POST("/bugs", handler.CreateBugReport)
	}
}

func RegisterAdminSupportRoutes(router *gin.RouterGroup, handler *AdminSupportHandler, guard *authz.Guard, auth ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}

	adminSupport := router.Group("/admin/support")
	adminSupport.Use(sharedMiddleware.RequireAdmin())
	{
		adminSupport.GET("", guard.Require(adminDomain.PermSupportRead), handler.GetAnalyticsSummary)
		adminSupport.GET("/analytics", guard.Require(adminDomain.PermSupportRead), handler.GetAnalyticsSummary)
		adminSupport.GET("/sla", guard.Require(adminDomain.PermSupportRead), handler.GetAnalyticsSummary)
		adminSupport.GET("/tickets", guard.Require(adminDomain.PermSupportRead), handler.GetAdminTickets)
		adminSupport.GET("/tickets/:id", guard.Require(adminDomain.PermSupportRead), handler.GetTicketByID)
		adminSupport.GET("/tickets/:id/messages", guard.Require(adminDomain.PermSupportRead), handler.GetTicketMessages)
		adminSupport.POST("/tickets/:id/messages", guard.Require(adminDomain.PermSupportManage), handler.AddAgentMessageOrInternalNote)
		adminSupport.POST("/tickets/:id/notes", guard.Require(adminDomain.PermSupportManage), handler.AddAgentMessageOrInternalNote)
		adminSupport.POST("/tickets/:id/assign", guard.Require(adminDomain.PermSupportManage), handler.AssignTicket)
		adminSupport.POST("/tickets/:id/resolve", guard.Require(adminDomain.PermSupportManage), handler.ResolveTicket)
		adminSupport.GET("/articles", guard.Require(adminDomain.PermSupportRead), handler.GetAdminArticles)
		adminSupport.POST("/articles", guard.Require(adminDomain.PermSupportManage), handler.CreateArticle)
		adminSupport.GET("/feedback", guard.Require(adminDomain.PermSupportRead), handler.GetFeatureRequests)
		adminSupport.GET("/bugs", guard.Require(adminDomain.PermSupportRead), handler.GetBugReports)
	}
}
