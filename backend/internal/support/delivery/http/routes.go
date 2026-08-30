package http

import (
	"github.com/gin-gonic/gin"
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

func RegisterAdminSupportRoutes(router *gin.RouterGroup, handler *AdminSupportHandler, auth ...*authMiddlewarePkg.AuthMiddleware) {
	if handler == nil {
		return
	}

	adminSupport := router.Group("/admin/support")
	if len(auth) > 0 && auth[0] != nil {
		adminSupport.Use(auth[0].RequireAuth(), auth[0].RequireRole("admin", "super_admin"))
	} else {
		adminSupport.Use(sharedMiddleware.AuthRequired())
	}
	{
		adminSupport.GET("", handler.GetAnalyticsSummary)
		adminSupport.GET("/analytics", handler.GetAnalyticsSummary)
		adminSupport.GET("/sla", handler.GetAnalyticsSummary)
		adminSupport.GET("/tickets", handler.GetAdminTickets)
		adminSupport.GET("/tickets/:id", handler.GetTicketByID)
		adminSupport.GET("/tickets/:id/messages", handler.GetTicketMessages)
		adminSupport.POST("/tickets/:id/messages", handler.AddAgentMessageOrInternalNote)
		adminSupport.POST("/tickets/:id/notes", handler.AddAgentMessageOrInternalNote)
		adminSupport.POST("/tickets/:id/assign", handler.AssignTicket)
		adminSupport.POST("/tickets/:id/resolve", handler.ResolveTicket)
		adminSupport.GET("/articles", handler.GetAdminArticles)
		adminSupport.POST("/articles", handler.CreateArticle)
		adminSupport.GET("/feedback", handler.GetFeatureRequests)
		adminSupport.GET("/bugs", handler.GetBugReports)
	}
}
