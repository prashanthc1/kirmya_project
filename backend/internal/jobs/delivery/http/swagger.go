package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/jobs/models"
)

// swaggerSearchJobs documents GET /api/v1/jobs.
//
// @Summary      Search open jobs
// @Description  Searches the platform-wide job board backed by the jobs table. Only active, unexpired postings are returned; drafts, paused, closed and expired roles are never exposed. Public endpoint; no authentication required, since this backs the landing page call to action and the schema.org SearchAction.
// @Tags         Jobs
// @Produce      json
// @Param        q                 query     string  false  "Free text matched against title, description, department, company name and skills"
// @Param        location          query     string  false  "Substring match on the posting location"
// @Param        work_mode         query     string  false  "Work mode"  Enums(onsite, hybrid, remote)
// @Param        employment_type   query     string  false  "Employment type"  Enums(Full-time, Part-time, Contract, Internship, Temporary)
// @Param        experience_level  query     string  false  "Experience level"  Enums(Entry, Mid, Senior, Lead, Executive)
// @Param        sort              query     string  false  "Result ordering; defaults to featured first, then most recently published"  Enums(newest, title, salary)
// @Param        page              query     int     false  "Page number (1-based)"  default(1)
// @Param        limit             query     int     false  "Items per page (max 100)"  default(20)
// @Success      200               {object}  models.JobListPage
// @Failure      500               {object}  swagger.ErrorResponse
// @Failure      503               {object}  swagger.ErrorResponse  "The job listing store is unavailable"
// @Router       /api/v1/jobs [get]
func swaggerSearchJobs() {}

// swaggerGetJobByID documents GET /api/v1/jobs/{id}.
//
// @Summary      Get job posting details
// @Description  Retrieves complete job posting description, requirements, salary band, and company profile
// @Tags         Jobs
// @Produce      json
// @Param        id   path      string  true  "Job ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/jobs/{id} [get]
func swaggerGetJobByID() {}

var (
	_ swagger.ErrorResponse
	_ models.JobListPage
)
