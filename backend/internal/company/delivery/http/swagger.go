package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/company/models"
)

// This file carries the OpenAPI (swagger) contract for the company directory module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerListDirectory documents GET /api/v1/companies.
//
// @Summary      List directory
// @Description  Returns a list of directory via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies [get]
func swaggerListDirectory() {}

// swaggerGetFeaturedCompanies documents GET /api/v1/companies/featured.
//
// @Summary      Get featured companies
// @Description  Returns featured companies via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/featured [get]
func swaggerGetFeaturedCompanies() {}

// swaggerGetPopularCompanies documents GET /api/v1/companies/popular.
//
// @Summary      Get popular companies
// @Description  Returns popular companies via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/popular [get]
func swaggerGetPopularCompanies() {}

// swaggerGetRecommendations documents GET /api/v1/companies/recommended.
//
// @Summary      Get recommendations
// @Description  Returns recommendations via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/recommended [get]
func swaggerGetRecommendations() {}

// swaggerSearchCompanies documents GET /api/v1/companies/search.
//
// @Summary      Search companies
// @Description  Searches companies via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/search [get]
func swaggerSearchCompanies() {}

// swaggerGetIndustries documents GET /api/v1/companies/industries.
//
// @Summary      Get industries
// @Description  Returns industries via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/industries [get]
func swaggerGetIndustries() {}

// swaggerGetByHandle documents GET /api/v1/companies/handle/{handle}.
//
// @Summary      Get by handle
// @Description  Returns by handle via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        handle  path  string  true  "Handle"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/handle/{handle} [get]
func swaggerGetByHandle() {}

// swaggerGetCompanyJobs documents GET /api/v1/companies/{id}/jobs.
//
// @Summary      Get company jobs
// @Description  Returns company jobs via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/{id}/jobs [get]
func swaggerGetCompanyJobs() {}

// swaggerGetCompanyEmployees documents GET /api/v1/companies/{id}/employees.
//
// @Summary      Get company employees
// @Description  Returns company employees via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/{id}/employees [get]
func swaggerGetCompanyEmployees() {}

// swaggerGetCompanyLeaders documents GET /api/v1/companies/{id}/leaders.
//
// @Summary      Get company leaders
// @Description  Returns company leaders via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/{id}/leaders [get]
func swaggerGetCompanyLeaders() {}

// swaggerGetCompanyLocations documents GET /api/v1/companies/{id}/locations.
//
// @Summary      Get company locations
// @Description  Returns company locations via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/{id}/locations [get]
func swaggerGetCompanyLocations() {}

// swaggerGetCompanyDepartments documents GET /api/v1/companies/{id}/departments.
//
// @Summary      Get company departments
// @Description  Returns company departments via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/{id}/departments [get]
func swaggerGetCompanyDepartments() {}

// swaggerGetCompanyGallery documents GET /api/v1/companies/{id}/gallery.
//
// @Summary      Get company gallery
// @Description  Returns company gallery via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/companies/{id}/gallery [get]
func swaggerGetCompanyGallery() {}

// swaggerRegisterCompany documents POST /api/v1/companies.
//
// @Summary      Register company
// @Description  Registers company via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        request  body  models.RegisterCompanyPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies [post]
func swaggerRegisterCompany() {}

// swaggerUpdateProfile documents PUT /api/v1/companies/{id}.
//
// @Summary      Update profile
// @Description  Updates profile via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  models.UpdateProfilePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/{id} [put]
func swaggerUpdateProfile() {}

// swaggerFollowCompany documents POST /api/v1/companies/follow.
//
// @Summary      Follow company
// @Description  Follows company via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/follow [post]
func swaggerFollowCompany() {}

// swaggerListMyCompanies documents GET /api/v1/companies/mine.
//
// @Summary      List the caller's companies
// @Description  Returns the companies the signed-in user owns or is an approved member of, each with the roles and effective permissions that membership carries. Companies where the caller holds nothing are omitted, and a pending association request is not a membership.
// @Tags         Organizations
// @Produce      json
// @Success      200  {array}   models.CompanyMembership
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/mine [get]
func swaggerListMyCompanies() {}

// swaggerFollowCompany2 documents POST /api/v1/companies/{id}/follow.
//
// @Summary      Follow company
// @Description  Follows company via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/follow [post]
func swaggerFollowCompany2() {}

// swaggerUnfollowCompany documents DELETE /api/v1/companies/follow.
//
// @Summary      Unfollow company
// @Description  Unfollows company via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/follow [delete]
func swaggerUnfollowCompany() {}

// swaggerSaveCompany documents POST /api/v1/companies/save.
//
// @Summary      Save company
// @Description  Saves company via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/save [post]
func swaggerSaveCompany() {}

// swaggerUnsaveCompany documents DELETE /api/v1/companies/save.
//
// @Summary      Unsave company
// @Description  Removes the saved company via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/save [delete]
func swaggerUnsaveCompany() {}

// swaggerReportCompany documents POST /api/v1/companies/{id}/report.
//
// @Summary      Report company
// @Description  Reports company via the Kirmya company directory module. Requires a valid Bearer access token.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  models.ReportCompanyPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/report [post]
func swaggerReportCompany() {}

// Verification is documented in swagger_management.go, against the routes that
// actually serve it: POST /api/v1/companies/{id}/verification to submit, and
// PUT /api/v1/admin/company-verifications/{verificationId} for the
// administrator's decision. The company itself never sets its own badge.

// swaggerGetByHandle2 documents GET /api/v1/company/{slug}.
//
// @Summary      Get by handle
// @Description  Returns by handle via the Kirmya company directory module. Public endpoint; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Param        slug  path  string  true  "Slug"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/company/{slug} [get]
func swaggerGetByHandle2() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ models.ReportCompanyPayload
	_ swagger.ErrorResponse
)
