package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/profile/models"
)

// This file carries the OpenAPI (swagger) contract for the profile module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetMyProfile documents GET /api/v1/profile/me.
//
// @Summary      Get my profile
// @Description  Returns my profile via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Success      200  {object}  models.UserProfile
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me [get]
func swaggerGetMyProfile() {}

// swaggerUpdateProfile documents PUT /api/v1/profile/me.
//
// @Summary      Update profile
// @Description  Updates profile via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UpdateProfileDTO  true  "Request payload"
// @Success      200  {object}  models.UserProfile
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me [put]
func swaggerUpdateProfile() {}

// swaggerGetProfilePreview documents GET /api/v1/profile/me/preview.
//
// @Summary      Get profile preview
// @Description  Returns preview representation of user profile. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Success      200  {object}  models.UserProfile
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/preview [get]
func swaggerGetProfilePreview() {}

// swaggerUpdateAbout documents PUT /api/v1/profile/me/about.
//
// @Summary      Update about summary
// @Description  Updates about section of the user profile. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UpdateProfileDTO  true  "Request payload"
// @Success      200  {object}  models.UserProfile
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/about [put]
func swaggerUpdateAbout() {}

// swaggerUpdateHeadline documents PUT /api/v1/profile/me/headline.
//
// @Summary      Update headline
// @Description  Updates headline of the user profile. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UpdateProfileDTO  true  "Request payload"
// @Success      200  {object}  models.UserProfile
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/headline [put]
func swaggerUpdateHeadline() {}

// swaggerAddWorkExperience documents POST /api/v1/profile/me/experience.
//
// @Summary      Add work experience
// @Description  Adds employment history entry. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.WorkExperienceDTO  true  "Experience payload"
// @Success      201  {object}  models.UserWorkExperience
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/experience [post]
func swaggerAddWorkExperience() {}

// swaggerUpdateWorkExperience documents PUT /api/v1/profile/me/experience/{id}.
//
// @Summary      Update work experience
// @Description  Updates employment history entry. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id       path  string                    true  "Experience ID"
// @Param        request  body  models.WorkExperienceDTO  true  "Experience payload"
// @Success      200  {object}  models.UserWorkExperience
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/experience/{id} [put]
func swaggerUpdateWorkExperience() {}

// swaggerDeleteWorkExperience documents DELETE /api/v1/profile/me/experience/{id}.
//
// @Summary      Delete work experience
// @Description  Deletes employment history entry. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Experience ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/experience/{id} [delete]
func swaggerDeleteWorkExperience() {}

// swaggerAddEducation documents POST /api/v1/profile/me/education.
//
// @Summary      Add education
// @Description  Adds education credential entry. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.EducationDTO  true  "Education payload"
// @Success      201  {object}  models.UserEducation
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/education [post]
func swaggerAddEducation() {}

// swaggerUpdateEducation documents PUT /api/v1/profile/me/education/{id}.
//
// @Summary      Update education
// @Description  Updates education credential entry. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id       path  string               true  "Education ID"
// @Param        request  body  models.EducationDTO  true  "Education payload"
// @Success      200  {object}  models.UserEducation
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/education/{id} [put]
func swaggerUpdateEducation() {}

// swaggerDeleteEducation documents DELETE /api/v1/profile/me/education/{id}.
//
// @Summary      Delete education
// @Description  Deletes education credential entry. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Param        id  path  string  true  "Education ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/education/{id} [delete]
func swaggerDeleteEducation() {}

// swaggerAddSkill documents POST /api/v1/profile/me/skills.
//
// @Summary      Add skill
// @Description  Adds skill via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UserSkill  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/skills [post]
func swaggerAddSkill() {}

// swaggerDeleteSkill documents DELETE /api/v1/profile/me/skills/{id}.
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
// @Router       /api/v1/profile/me/skills/{id} [delete]
func swaggerDeleteSkill() {}

// swaggerAddCertification documents POST /api/v1/profile/me/certifications.
//
// @Summary      Add certification
// @Description  Adds certification via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UserCertification  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/certifications [post]
func swaggerAddCertification() {}

// swaggerDeleteCertification documents DELETE /api/v1/profile/me/certifications/{id}.
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
// @Router       /api/v1/profile/me/certifications/{id} [delete]
func swaggerDeleteCertification() {}

// swaggerAddProject documents POST /api/v1/profile/me/projects.
//
// @Summary      Add project
// @Description  Adds project via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UserProject  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/projects [post]
func swaggerAddProject() {}

// swaggerDeleteProject documents DELETE /api/v1/profile/me/projects/{id}.
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
// @Router       /api/v1/profile/me/projects/{id} [delete]
func swaggerDeleteProject() {}

// swaggerAddLanguage documents POST /api/v1/profile/me/languages.
//
// @Summary      Add language
// @Description  Adds language via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UserLanguage  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/languages [post]
func swaggerAddLanguage() {}

// swaggerDeleteLanguage documents DELETE /api/v1/profile/me/languages/{id}.
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
// @Router       /api/v1/profile/me/languages/{id} [delete]
func swaggerDeleteLanguage() {}

// swaggerAddAchievement documents POST /api/v1/profile/me/achievements.
//
// @Summary      Add achievement
// @Description  Adds achievement via the Kirmya profile module. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.UserAchievement  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/achievements [post]
func swaggerAddAchievement() {}

// swaggerDeleteAchievement documents DELETE /api/v1/profile/me/achievements/{id}.
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
// @Router       /api/v1/profile/me/achievements/{id} [delete]
func swaggerDeleteAchievement() {}

// swaggerUploadPhoto documents POST /api/v1/profile/me/photo.
//
// @Summary      Upload profile avatar photo
// @Description  Uploads profile photo. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       multipart/form-data
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/photo [post]
func swaggerUploadPhoto() {}

// swaggerDeletePhoto documents DELETE /api/v1/profile/me/photo.
//
// @Summary      Delete profile avatar photo
// @Description  Deletes profile avatar photo. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/photo [delete]
func swaggerDeletePhoto() {}

// swaggerUpdatePreferences documents PUT /api/v1/profile/me/privacy.
//
// @Summary      Update profile privacy preferences
// @Description  Updates profile privacy settings. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.ProfilePrivacyDTO  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/privacy [put]
func swaggerUpdatePreferences() {}

// swaggerGetCompleteness documents GET /api/v1/profile/me/completeness.
//
// @Summary      Get profile completeness
// @Description  Returns profile completeness percentage, missing sections, and recommendations. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Success      200  {object}  models.ProfileCompletenessDTO
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/completeness [get]
func swaggerGetCompleteness() {}

// swaggerRequestVerification documents POST /api/v1/profile/me/verification.
//
// @Summary      Request profile verification
// @Description  Submits document verification request for profile. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.VerificationRequestPayload  true  "Verification payload"
// @Success      200  {object}  models.UserProfile
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/verification [post]
func swaggerRequestVerification() {}

// swaggerUpdateCareerPreferences documents PUT /api/v1/profile/me/career-preferences.
//
// @Summary      Update career preferences
// @Description  Updates availability status, target roles, preferred locations, etc. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body  models.CareerPreferencesDTO  true  "Career preferences payload"
// @Success      200  {object}  models.UserProfile
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/career-preferences [put]
func swaggerUpdateCareerPreferences() {}

// swaggerGetResumeConsistency documents GET /api/v1/profile/me/resume-consistency.
//
// @Summary      Get resume consistency score
// @Description  Analyzes profile for missing skills and title discrepancies. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Success      200  {object}  models.ResumeConsistencyDTO
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/resume-consistency [get]
func swaggerGetResumeConsistency() {}

// swaggerGetAnalytics documents GET /api/v1/profile/me/analytics.
//
// @Summary      Get profile analytics
// @Description  Returns profile view counts, search appearances, and connection requests. Requires a valid Bearer access token.
// @Tags         Profiles
// @Produce      json
// @Success      200  {object}  models.ProfileAnalyticsDTO
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/me/analytics [get]
func swaggerGetAnalytics() {}

// swaggerGetPublicProfile documents GET /api/v1/profile/{username}.
//
// @Summary      Get public profile by username
// @Description  Returns public profile representation. Public endpoint; no authentication required.
// @Tags         Profiles
// @Produce      json
// @Param        username  path  string  true  "Username"
// @Success      200  {object}  models.UserProfile
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/profile/{username} [get]
func swaggerGetPublicProfile() {}

// swaggerReportProfile documents POST /api/v1/profile/{username}/report.
//
// @Summary      Report profile
// @Description  Submits a trust and safety report against a user profile. Requires a valid Bearer access token.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        username  path  string                   true  "Username"
// @Param        request   body  models.ProfileReportDTO  true  "Report payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/profile/{username}/report [post]
func swaggerReportProfile() {}

// swaggerAdminGetProfile documents GET /api/v1/admin/users/{id}/profile.
//
// @Summary      Admin get profile
// @Description  Returns complete profile for admin oversight.
// @Tags         Admin
// @Produce      json
// @Param        id   path   string  true  "User ID"
// @Success      200  {object}  models.UserProfile
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/users/{id}/profile [get]
func swaggerAdminGetProfile() {}

// swaggerAdminUpdateProfile documents PUT /api/v1/admin/users/{id}/profile.
//
// @Summary      Admin update profile
// @Description  Updates profile fields on behalf of user with audit logging.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string                   true  "User ID"
// @Param        request  body  models.UpdateProfileDTO  true  "Update payload"
// @Success      200  {object}  models.UserProfile
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/users/{id}/profile [put]
func swaggerAdminUpdateProfile() {}

// swaggerAdminVerifyProfile documents POST /api/v1/admin/users/{id}/profile/verify.
//
// @Summary      Admin verify profile
// @Description  Sets verified badge status for a profile.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string                      true  "User ID"
// @Param        request  body  models.AdminVerificationDTO true  "Verification status"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/users/{id}/profile/verify [post]
func swaggerAdminVerifyProfile() {}

// swaggerAdminRestrictProfile documents POST /api/v1/admin/users/{id}/profile/restrict.
//
// @Summary      Admin restrict profile
// @Description  Applies moderation restrictions to a user profile.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        id       path  string                     true  "User ID"
// @Param        request  body  models.AdminRestrictionDTO  true  "Restriction payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/users/{id}/profile/restrict [post]
func swaggerAdminRestrictProfile() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
	_ models.UserProfile
	_ models.UpdateProfileDTO
	_ models.WorkExperienceDTO
	_ models.EducationDTO
	_ models.UserSkill
	_ models.UserCertification
	_ models.UserProject
	_ models.UserLanguage
	_ models.UserAchievement
	_ models.ProfilePrivacyDTO
	_ models.ProfileCompletenessDTO
	_ models.VerificationRequestPayload
	_ models.CareerPreferencesDTO
	_ models.ResumeConsistencyDTO
	_ models.ProfileAnalyticsDTO
	_ models.ProfileReportDTO
	_ models.AdminVerificationDTO
	_ models.AdminRestrictionDTO
)
