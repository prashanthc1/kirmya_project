package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the profile module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetMyProfile documents GET /api/v1/profiles/me.
//
// @Summary      Get my profile
// @Description  Returns my profile via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me [get]
func swaggerGetMyProfile() {}

// swaggerUpdateProfile documents PUT /api/v1/profiles/me.
//
// @Summary      Update profile
// @Description  Updates profile via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  UpdateProfileRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me [put]
func swaggerUpdateProfile() {}

// swaggerAddSkill documents POST /api/v1/profiles/me/skills.
//
// @Summary      Add skill
// @Description  Adds skill via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  AddSkillRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/skills [post]
func swaggerAddSkill() {}

// swaggerDeleteSkill documents DELETE /api/v1/profiles/me/skills/{id}.
//
// @Summary      Delete skill
// @Description  Deletes skill via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/skills/{id} [delete]
func swaggerDeleteSkill() {}

// swaggerAddCertification documents POST /api/v1/profiles/me/certifications.
//
// @Summary      Add certification
// @Description  Adds certification via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  AddCertRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/certifications [post]
func swaggerAddCertification() {}

// swaggerDeleteCertification documents DELETE /api/v1/profiles/me/certifications/{id}.
//
// @Summary      Delete certification
// @Description  Deletes certification via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/certifications/{id} [delete]
func swaggerDeleteCertification() {}

// swaggerAddProject documents POST /api/v1/profiles/me/projects.
//
// @Summary      Add project
// @Description  Adds project via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  AddProjectRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/projects [post]
func swaggerAddProject() {}

// swaggerDeleteProject documents DELETE /api/v1/profiles/me/projects/{id}.
//
// @Summary      Delete project
// @Description  Deletes project via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/projects/{id} [delete]
func swaggerDeleteProject() {}

// swaggerAddLanguage documents POST /api/v1/profiles/me/languages.
//
// @Summary      Add language
// @Description  Adds language via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  AddLangRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/languages [post]
func swaggerAddLanguage() {}

// swaggerDeleteLanguage documents DELETE /api/v1/profiles/me/languages/{id}.
//
// @Summary      Delete language
// @Description  Deletes language via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/languages/{id} [delete]
func swaggerDeleteLanguage() {}

// swaggerAddAchievement documents POST /api/v1/profiles/me/achievements.
//
// @Summary      Add achievement
// @Description  Adds achievement via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  AddAchievementRequest  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/achievements [post]
func swaggerAddAchievement() {}

// swaggerDeleteAchievement documents DELETE /api/v1/profiles/me/achievements/{id}.
//
// @Summary      Delete achievement
// @Description  Deletes achievement via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/achievements/{id} [delete]
func swaggerDeleteAchievement() {}

// swaggerGetMyPreferences documents GET /api/v1/profiles/me/preferences.
//
// @Summary      Get my preferences
// @Description  Returns my preferences via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/preferences [get]
func swaggerGetMyPreferences() {}

// swaggerUpdatePreferences documents PUT /api/v1/profiles/me/preferences.
//
// @Summary      Update preferences
// @Description  Updates preferences via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  UpdatePrefRequest  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profiles/me/preferences [put]
func swaggerUpdatePreferences() {}

// swaggerGetPublicProfile documents GET /api/v1/profiles/{userId}.
//
// @Summary      Get public profile
// @Description  Returns public profile via the Kirmya profile module. Public endpoint; no authentication required.
// @Tags         Profiles
// @Produce      json
// @Param        userId  path  string  true  "User id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/profiles/{userId} [get]
func swaggerGetPublicProfile() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
