package http

import (
	"github.com/gin-gonic/gin"
	"kirmya/internal/admin/authz"
	adminDomain "kirmya/internal/admin/domain"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *LandingHandler, newsletter *NewsletterHandler, guard *authz.Guard, newsletterRequestsPerMinute, newsletterBurst float64) {
	landingGroup := api.Group("/landing")
	{
		landingGroup.GET("/content", handler.GetLandingContent)
		landingGroup.POST("/admin/testimonials", sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin(),
			guard.Require(adminDomain.PermAnnouncements), handler.CreateTestimonial)
		landingGroup.POST("/admin/featured-jobs", sharedMiddleware.AuthRequired(), sharedMiddleware.RequireAdmin(),
			guard.Require(adminDomain.PermAnnouncements), handler.CreateFeaturedJob)
	}

	if newsletter == nil {
		return
	}

	// Public, and rate limited on its own bucket: this endpoint takes an
	// address from anyone, so it is the obvious thing to point a script at.
	// The allowance is generous enough for a person mistyping their address a
	// few times and far below what a list-stuffing script needs.
	if newsletterRequestsPerMinute <= 0 {
		newsletterRequestsPerMinute = 10
	}
	if newsletterBurst <= 0 {
		newsletterBurst = 5
	}
	newsletterGroup := api.Group("/newsletter")
	newsletterGroup.Use(sharedMiddleware.RateLimiter(newsletterRequestsPerMinute/60.0, newsletterBurst))
	{
		newsletterGroup.POST("/subscribe", newsletter.Subscribe)
		newsletterGroup.POST("/unsubscribe", newsletter.Unsubscribe)
	}
}
