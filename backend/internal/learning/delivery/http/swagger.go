package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/learning/domain"
)

// This file carries the OpenAPI (swagger) contract for the learning module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetCourses documents GET /api/v1/learning/courses.
//
// @Summary      Get courses
// @Description  Returns courses via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/courses [get]
func swaggerGetCourses() {}

// swaggerGetCourseByID documents GET /api/v1/learning/courses/{id}.
//
// @Summary      Get course by ID
// @Description  Returns course by ID via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/courses/{id} [get]
func swaggerGetCourseByID() {}

// swaggerGetLearningPaths documents GET /api/v1/learning/paths.
//
// @Summary      Get learning paths
// @Description  Returns learning paths via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/paths [get]
func swaggerGetLearningPaths() {}

// swaggerEnroll documents POST /api/v1/learning/enroll.
//
// @Summary      Enroll
// @Description  Enrolls in via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/enroll [post]
func swaggerEnroll() {}

// swaggerUpdateProgress documents POST /api/v1/learning/progress.
//
// @Summary      Update progress
// @Description  Updates progress via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  domain.UpdateProgressRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/progress [post]
func swaggerUpdateProgress() {}

// swaggerGetUserProgress documents GET /api/v1/learning/progress.
//
// @Summary      Get user progress
// @Description  Returns user progress via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/progress [get]
func swaggerGetUserProgress() {}

// swaggerGetCertificates documents GET /api/v1/learning/certificates.
//
// @Summary      Get certificates
// @Description  Returns certificates via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/certificates [get]
func swaggerGetCertificates() {}

// swaggerSubmitSkillAssessment documents POST /api/v1/learning/assessment.
//
// @Summary      Submit skill assessment
// @Description  Submits skill assessment via the Kirmya learning module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  domain.SubmitAssessmentRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/learning/assessment [post]
func swaggerSubmitSkillAssessment() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.SubmitAssessmentRequest
	_ swagger.ErrorResponse
)
