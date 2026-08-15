package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/mentorship/models"
)

// This file carries the OpenAPI (swagger) contract for the mentorship module.
// Swaggo reads these annotations to build internal/docs.

// @Summary      Create or update mentor profile
// @Description  Creates or updates a mentor profile for the authenticated user.
// @Tags         Mentorship
// @Accept       json
// @Produce      json
// @Param        request  body  models.UpdateMentorProfileDTO  true  "Mentor Profile DTO"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/mentors/profile [post]
func swaggerCreateOrUpdateProfile() {}

// @Summary      Get current user mentor profile
// @Description  Returns the authenticated user's mentor profile.
// @Tags         Mentorship
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/mentors/profile [get]
func swaggerGetMyProfile() {}

// @Summary      Search mentors
// @Description  Search and filter available mentors by expertise, industry, experience, rate, language.
// @Tags         Mentorship
// @Produce      json
// @Param        search     query  string  false  "Search term"
// @Param        expertise  query  string  false  "Comma-separated expertise"
// @Param        industry   query  string  false  "Industry name"
// @Param        page       query  int     false  "Page number"  default(1)
// @Param        limit      query  int     false  "Limit per page"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/mentorship/mentors/search [get]
func swaggerSearchMentors() {}

// @Summary      Get mentor recommendations
// @Description  Get recommended mentors tailored to user skills.
// @Tags         Mentorship
// @Produce      json
// @Param        skills  query  string  false  "Comma-separated skills"
// @Success      200  {object}  swagger.SuccessResponse
// @Router       /api/v1/mentorship/mentors/recommendations [get]
func swaggerGetRecommendations() {}

// @Summary      Get mentor profile by ID
// @Description  Returns details of a specific mentor profile by ID or UserID.
// @Tags         Mentorship
// @Produce      json
// @Param        id   path   string  true  "Profile ID or User ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/mentorship/mentors/{id} [get]
func swaggerGetMentorByID() {}

// @Summary      Create mentorship request
// @Description  Submits a mentorship application/request to a mentor.
// @Tags         Mentorship
// @Accept       json
// @Produce      json
// @Param        request  body  models.CreateMentorshipRequestDTO  true  "Request DTO"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/requests [post]
func swaggerCreateMentorshipRequest() {}

// @Summary      Get user mentorship requests
// @Description  List mentorship requests where the authenticated user is mentor or mentee.
// @Tags         Mentorship
// @Produce      json
// @Param        role  query  string  false  "Role filter: mentor, mentee, or all"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/requests [get]
func swaggerGetUserRequests() {}

// @Summary      Respond to mentorship request
// @Description  Accept, reject, or cancel a mentorship request.
// @Tags         Mentorship
// @Accept       json
// @Produce      json
// @Param        id       path  string                             true  "Request ID"
// @Param        request  body  models.UpdateMentorshipRequestDTO  true  "Update DTO"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/requests/{id}/status [put]
func swaggerRespondToMentorshipRequest() {}

// @Summary      Get active mentorship relationships
// @Description  List active mentorship relationships for the authenticated user.
// @Tags         Mentorship
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/relationships [get]
func swaggerGetActiveMentorships() {}

// @Summary      Create mentorship goal
// @Description  Create a goal under an active mentorship relationship.
// @Tags         Mentorship
// @Accept       json
// @Produce      json
// @Param        request  body  models.CreateMentorshipGoalDTO  true  "Goal DTO"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/goals [post]
func swaggerCreateGoal() {}

// @Summary      Schedule mentorship session
// @Description  Schedule a mentoring session.
// @Tags         Mentorship
// @Accept       json
// @Produce      json
// @Param        request  body  models.CreateMentorshipSessionDTO  true  "Session DTO"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/sessions [post]
func swaggerCreateSession() {}

// @Summary      Submit mentorship feedback
// @Description  Submit rating and feedback for a session or mentorship relationship.
// @Tags         Mentorship
// @Accept       json
// @Produce      json
// @Param        request  body  models.CreateMentorshipFeedbackDTO  true  "Feedback DTO"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/mentorship/feedback [post]
func swaggerSubmitFeedback() {}

var (
	_ models.MentorProfile
	_ swagger.ErrorResponse
)
