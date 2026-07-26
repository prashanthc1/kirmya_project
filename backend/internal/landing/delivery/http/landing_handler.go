package http

import (
	"net/http"

	"kirmya/internal/landing/domain"
	"kirmya/internal/landing/service"

	"github.com/gin-gonic/gin"
)

type LandingHandler struct {
	svc service.LandingService
}

func NewLandingHandler(svc service.LandingService) *LandingHandler {
	return &LandingHandler{svc: svc}
}

// GetLandingContent handles GET /landing/content
func (h *LandingHandler) GetLandingContent(c *gin.Context) {
	content, err := h.svc.GetLandingContent(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, content)
}

// CreateTestimonial handles POST /landing/admin/testimonials
func (h *LandingHandler) CreateTestimonial(c *gin.Context) {
	var t domain.Testimonial
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid testimonial payload", "details": err.Error()})
		return
	}

	if err := h.svc.CreateTestimonial(c.Request.Context(), &t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Testimonial created successfully"})
}

// CreateFeaturedJob handles POST /landing/admin/featured-jobs
func (h *LandingHandler) CreateFeaturedJob(c *gin.Context) {
	var j domain.FeaturedJob
	if err := c.ShouldBindJSON(&j); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid featured job payload", "details": err.Error()})
		return
	}

	if err := h.svc.CreateFeaturedJob(c.Request.Context(), &j); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Featured job created successfully"})
}
