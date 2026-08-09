package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/onboarding/domain"
)

// This file carries the OpenAPI (swagger) contract for the onboarding module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetProgress documents GET /api/v1/onboarding.
//
// @Summary      Get progress
// @Description  Returns progress via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding [get]
func swaggerGetProgress() {}

// swaggerStartOnboarding documents POST /api/v1/onboarding/start.
//
// @Summary      Start onboarding
// @Description  Starts onboarding via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/start [post]
func swaggerStartOnboarding() {}

// swaggerSaveProgress documents PUT /api/v1/onboarding/save.
//
// @Summary      Save progress
// @Description  Saves progress via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/save [put]
func swaggerSaveProgress() {}

// swaggerCompleteOnboarding documents POST /api/v1/onboarding/complete.
//
// @Summary      Complete onboarding
// @Description  Completes onboarding via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/complete [post]
func swaggerCompleteOnboarding() {}

// swaggerGetCommunities documents GET /api/v1/onboarding/communities.
//
// @Summary      Get communities
// @Description  Returns communities via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/communities [get]
func swaggerGetCommunities() {}

// swaggerGetConnections documents GET /api/v1/onboarding/connections.
//
// @Summary      Get connections
// @Description  Returns connections via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/connections [get]
func swaggerGetConnections() {}

// swaggerGetProfileCompletion documents GET /api/v1/profile/completion.
//
// @Summary      Get profile completion
// @Description  Returns profile completion via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/profile/completion [get]
func swaggerGetProfileCompletion() {}

// swaggerUploadProfilePhoto documents POST /api/v1/profile/photo.
//
// @Summary      Upload profile photo
// @Description  Uploads profile photo via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/profile/photo [post]
func swaggerUploadProfilePhoto() {}

// swaggerUploadResume documents POST /api/v1/resume/upload.
//
// @Summary      Upload resume
// @Description  Uploads resume via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/resume/upload [post]
func swaggerUploadResume() {}

// swaggerSaveSkills documents POST /api/v1/skills.
//
// @Summary      Save skills
// @Description  Saves skills via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/skills [post]
func swaggerSaveSkills() {}

// swaggerSaveWorkExperience documents POST /api/v1/work-experience.
//
// @Summary      Save work experience
// @Description  Saves work experience via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/work-experience [post]
func swaggerSaveWorkExperience() {}

// swaggerSaveEducation documents POST /api/v1/education.
//
// @Summary      Save education
// @Description  Saves education via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/education [post]
func swaggerSaveEducation() {}

// swaggerSaveCertifications documents POST /api/v1/certifications.
//
// @Summary      Save certifications
// @Description  Saves certifications via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/certifications [post]
func swaggerSaveCertifications() {}

// swaggerSaveCareerPreferences documents POST /api/v1/career-preferences.
//
// @Summary      Save career preferences
// @Description  Saves career preferences via the Kirmya onboarding module. Public endpoint; no authentication required.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CareerPreferences  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/career-preferences [post]
func swaggerSaveCareerPreferences() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.CareerPreferences
	_ swagger.ErrorResponse
)
