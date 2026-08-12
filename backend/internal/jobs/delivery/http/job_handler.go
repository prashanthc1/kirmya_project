package http

import (
	"errors"
	"net/http"
	"strconv"

	"kirmya/internal/jobs/models"
	"kirmya/internal/jobs/repository"
	"kirmya/internal/jobs/service"

	"github.com/gin-gonic/gin"
)

type JobHandler struct {
	svc service.JobService
}

func NewJobHandler(svc service.JobService) *JobHandler {
	return &JobHandler{svc: svc}
}

func atoiOr(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return n
}

// SearchJobs handles GET /jobs — the public, platform-wide job board.
//
// Public on purpose: this is the destination of the landing page's primary
// call to action and of the schema.org SearchAction, both of which have to work
// for signed-out visitors and for crawlers.
func (h *JobHandler) SearchJobs(c *gin.Context) {
	q := models.JobSearchQuery{
		Query:           c.Query("q"),
		Location:        c.Query("location"),
		WorkMode:        c.Query("work_mode"),
		EmploymentType:  c.Query("employment_type"),
		ExperienceLevel: c.Query("experience_level"),
		Sort:            c.Query("sort"),
		Page:            atoiOr(c.Query("page"), 1),
		Limit:           atoiOr(c.Query("limit"), 20),
	}

	page, err := h.svc.SearchJobs(c.Request.Context(), q)
	if err != nil {
		if errors.Is(err, repository.ErrNoDatabase) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "job listings are unavailable"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, page)
}
