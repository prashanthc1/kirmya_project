package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/cover_letter/models"
)

// swaggerCoverLettersList documents GET /api/v1/cover-letters
//
// @Summary      List user cover letters
// @Description  Returns all saved cover letters for the authenticated candidate
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters [get]
func swaggerCoverLettersList() {}

// swaggerCoverLettersCreate documents POST /api/v1/cover-letters
//
// @Summary      Create cover letter
// @Description  Creates a new cover letter draft
// @Tags         Cover Letters
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateCoverLetterPayload  true  "Cover letter content"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters [post]
func swaggerCoverLettersCreate() {}

// swaggerCoverLettersTemplates documents GET /api/v1/cover-letters/templates
//
// @Summary      List cover letter templates
// @Description  Returns pre-designed cover letter visual layouts and styles
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/templates [get]
func swaggerCoverLettersTemplates() {}

// swaggerCoverLettersGetByID documents GET /api/v1/cover-letters/{id}
//
// @Summary      Get cover letter details
// @Description  Returns full content and metadata of a specific cover letter
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Cover letter ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id} [get]
func swaggerCoverLettersGetByID() {}

// swaggerCoverLettersUpdate documents PUT /api/v1/cover-letters/{id}
//
// @Summary      Update cover letter
// @Description  Updates sections, styling or content of a cover letter
// @Tags         Cover Letters
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                           true  "Cover letter ID"
// @Param        request  body      models.UpdateCoverLetterPayload  true  "Updated fields"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      404      {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id} [put]
func swaggerCoverLettersUpdate() {}

// swaggerCoverLettersDelete documents DELETE /api/v1/cover-letters/{id}
//
// @Summary      Delete cover letter
// @Description  Permanently removes a saved cover letter
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Cover letter ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id} [delete]
func swaggerCoverLettersDelete() {}

// swaggerCoverLettersDuplicate documents POST /api/v1/cover-letters/{id}/duplicate
//
// @Summary      Duplicate cover letter
// @Description  Clones an existing cover letter as a new draft
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Cover letter ID"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/duplicate [post]
func swaggerCoverLettersDuplicate() {}

// swaggerCoverLettersGenerate documents POST /api/v1/cover-letters/{id}/generate
//
// @Summary      Generate AI cover letter
// @Description  Generates personalized letter using candidate profile and job description
// @Tags         Cover Letters
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                             true  "Cover letter ID"
// @Param        request  body      models.GenerateCoverLetterRequest  true  "Generation parameters"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/generate [post]
func swaggerCoverLettersGenerate() {}

// swaggerCoverLettersRewrite documents POST /api/v1/cover-letters/{id}/rewrite
//
// @Summary      Rewrite cover letter section with AI
// @Description  Adjusts tone, length or focus of cover letter sections
// @Tags         Cover Letters
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                 true  "Cover letter ID"
// @Param        request  body      models.RewriteRequest  true  "Rewrite instructions"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/rewrite [post]
func swaggerCoverLettersRewrite() {}

// swaggerCoverLettersTailor documents POST /api/v1/cover-letters/{id}/tailor
//
// @Summary      Tailor cover letter for job
// @Description  Aligns keywords and accomplishments to a specific job vacancy
// @Tags         Cover Letters
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                           true  "Cover letter ID"
// @Param        request  body      models.TailorCoverLetterPayload  true  "Job description"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/tailor [post]
func swaggerCoverLettersTailor() {}

// swaggerCoverLettersPreview documents POST /api/v1/cover-letters/{id}/preview
//
// @Summary      Preview rendered cover letter
// @Description  Renders formatted letter HTML with selected template styling
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Cover letter ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/preview [post]
func swaggerCoverLettersPreview() {}

// swaggerCoverLettersDownload documents GET /api/v1/cover-letters/{id}/download
//
// @Summary      Download cover letter PDF / DOCX
// @Description  Generates and streams binary document file
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      application/pdf
// @Param        id      path      string  true   "Cover letter ID"
// @Param        format  query     string  false  "Format (pdf, docx, txt)"
// @Success      200     {file}    file
// @Failure      401     {object}  swagger.ErrorResponse
// @Failure      404     {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/download [get]
func swaggerCoverLettersDownload() {}

// swaggerCoverLettersShare documents POST /api/v1/cover-letters/{id}/share
//
// @Summary      Create public share link
// @Description  Generates a secure view link with expiration
// @Tags         Cover Letters
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                          true  "Cover letter ID"
// @Param        request  body      models.ShareCoverLetterPayload  true  "Share options"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/share [post]
func swaggerCoverLettersShare() {}

// swaggerCoverLettersShareDelete documents DELETE /api/v1/cover-letters/{id}/share
//
// @Summary      Revoke public share link
// @Description  Deactivates active public share links for the cover letter
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Cover letter ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/share [delete]
func swaggerCoverLettersShareDelete() {}

// swaggerCoverLettersVersionsList documents GET /api/v1/cover-letters/{id}/versions
//
// @Summary      List version history
// @Description  Returns timeline of previous revisions and snapshots
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Cover letter ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/versions [get]
func swaggerCoverLettersVersionsList() {}

// swaggerCoverLettersVersionsCreate documents POST /api/v1/cover-letters/{id}/versions
//
// @Summary      Create version checkpoint
// @Description  Saves named snapshot of current cover letter draft
// @Tags         Cover Letters
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                            true  "Cover letter ID"
// @Param        request  body      models.CreateVersionPayload       true  "Version tag"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/versions [post]
func swaggerCoverLettersVersionsCreate() {}

// swaggerCoverLettersAnalytics documents GET /api/v1/cover-letters/{id}/analytics
//
// @Summary      Get cover letter analytics
// @Description  Returns view counts and job alignment score
// @Tags         Cover Letters
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Cover letter ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/cover-letters/{id}/analytics [get]
func swaggerCoverLettersAnalytics() {}

var (
	_ models.CoverLetter
	_ swagger.ErrorResponse
)

