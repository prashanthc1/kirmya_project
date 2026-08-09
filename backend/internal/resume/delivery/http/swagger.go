package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the resume module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerListResumes documents GET /api/v1/resumes.
//
// @Summary      List resumes
// @Description  Returns a list of resumes via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes [get]
func swaggerListResumes() {}

// swaggerCreateResume documents POST /api/v1/resumes.
//
// @Summary      Create resume
// @Description  Creates resume via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  CreateResumeRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes [post]
func swaggerCreateResume() {}

// swaggerGetResume documents GET /api/v1/resumes/{id}.
//
// @Summary      Get resume
// @Description  Returns resume via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id} [get]
func swaggerGetResume() {}

// swaggerUpdateResumeSections documents PUT /api/v1/resumes/{id}.
//
// @Summary      Update resume sections
// @Description  Updates resume sections via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  UpdateSectionsRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id} [put]
func swaggerUpdateResumeSections() {}

// swaggerDeleteResume documents DELETE /api/v1/resumes/{id}.
//
// @Summary      Delete resume
// @Description  Deletes resume via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id} [delete]
func swaggerDeleteResume() {}

// swaggerDuplicateResume documents POST /api/v1/resumes/{id}/duplicate.
//
// @Summary      Duplicate resume
// @Description  Duplicates resume via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/duplicate [post]
func swaggerDuplicateResume() {}

// swaggerSetDefaultResume documents PUT /api/v1/resumes/{id}/default.
//
// @Summary      Set default resume
// @Description  Sets default resume via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/default [put]
func swaggerSetDefaultResume() {}

// swaggerListVersions documents GET /api/v1/resumes/{id}/versions.
//
// @Summary      List versions
// @Description  Returns a list of versions via the Kirmya resume module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/versions [get]
func swaggerListVersions() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
