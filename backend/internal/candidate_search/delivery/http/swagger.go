package http

import (
	"kirmya/internal/candidate_search/models"
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the candidate search module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerSearchCandidates documents POST /api/v1/search/candidates.
//
// @Summary      Search candidates
// @Description  Searches candidates via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Accept       json
// @Produce      json
// @Param        request  body  models.SearchCriteria  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/candidates [post]
func swaggerSearchCandidates() {}

// swaggerGetHistory documents GET /api/v1/search/history.
//
// @Summary      Get history
// @Description  Returns history via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/history [get]
func swaggerGetHistory() {}

// swaggerSaveCandidate documents POST /api/v1/search/saved.
//
// @Summary      Save candidate
// @Description  Saves candidate via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Accept       json
// @Produce      json
// @Param        request  body  models.SaveCandidatePayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/saved [post]
func swaggerSaveCandidate() {}

// swaggerGetSavedCandidates documents GET /api/v1/search/saved.
//
// @Summary      Get saved candidates
// @Description  Returns saved candidates via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/saved [get]
func swaggerGetSavedCandidates() {}

// swaggerRemoveSavedCandidate documents DELETE /api/v1/search/saved/{id}.
//
// @Summary      Remove saved candidate
// @Description  Removes saved candidate via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/saved/{id} [delete]
func swaggerRemoveSavedCandidate() {}

// swaggerAddNote documents POST /api/v1/search/notes.
//
// @Summary      Add note
// @Description  Adds note via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Accept       json
// @Produce      json
// @Param        request  body  models.AddNotePayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/notes [post]
func swaggerAddNote() {}

// swaggerGetNotes documents GET /api/v1/search/notes/{candidateId}.
//
// @Summary      Get notes
// @Description  Returns notes via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Produce      json
// @Param        candidateId  path  string  true  "Candidate id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/notes/{candidateId} [get]
func swaggerGetNotes() {}

// swaggerContactCandidate documents POST /api/v1/search/contact.
//
// @Summary      Contact candidate
// @Description  Contacts candidate via the Kirmya candidate search module. Requires a valid Bearer access token.
// @Tags         Search
// @Accept       json
// @Produce      json
// @Param        request  body  models.ContactCandidatePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/search/contact [post]
func swaggerContactCandidate() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ models.ContactCandidatePayload
	_ swagger.ErrorResponse
)
