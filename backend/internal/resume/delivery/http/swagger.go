package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/resume/models"
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

// swaggerSetDefaultResume documents POST /api/v1/resumes/{id}/default.
//
// @Summary      Set default resume
// @Description  Marks this resume as the one attached to applications by default. Any resume the caller previously had as default stops being it, so exactly one is default at a time. No request body is read.
// @Tags         Profiles
// @Produce      json
// @Param        id   path      string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"Resume set as default\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid resume ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/default [post]
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

// swaggerImportResume documents POST /api/v1/resumes/import.
//
// @Summary      Import a resume
// @Description  Builds a new resume from an uploaded document or a pasted profile. The import is parsed into sections the caller can then edit; nothing is published anywhere by importing.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        request  body      models.ImportResumeRequest  true  "Source to import from"
// @Success      201      {object}  models.Resume
// @Failure      400      {object}  swagger.ErrorResponse  "The source could not be read"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/import [post]
func swaggerImportResume() {}

// swaggerGetResumeTemplates documents GET /api/v1/resumes/templates.
//
// @Summary      List resume templates
// @Description  Returns the templates a resume can be created from, with the sections each starts with.
// @Tags         Profiles
// @Produce      json
// @Success      200  {array}   models.ResumeTemplate
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/templates [get]
func swaggerGetResumeTemplates() {}

// swaggerAnalyzeResume documents POST /api/v1/resumes/{id}/analyze.
//
// @Summary      Analyse a resume against ATS rules
// @Description  Scores the resume for applicant-tracking readability — parseability, keyword coverage, section completeness — and lists what to change. The resume itself is not modified.
// @Tags         Profiles
// @Produce      json
// @Param        id   path      string  true  "Id"
// @Success      200  {object}  models.ATSAnalysis
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid resume ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/analyze [post]
func swaggerAnalyzeResume() {}

// swaggerOptimizeResume documents POST /api/v1/resumes/{id}/optimize.
//
// @Summary      Optimise a resume
// @Description  Rewrites the resume's wording for clarity and ATS readability and returns the revised resume. Suggestions are drawn from what the resume already says; no employment history, qualification or date is invented.
// @Tags         Profiles
// @Produce      json
// @Param        id   path      string  true  "Id"
// @Success      200  {object}  models.Resume
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid resume ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/optimize [post]
func swaggerOptimizeResume() {}

// swaggerTailorResume documents POST /api/v1/resumes/{id}/tailor.
//
// @Summary      Tailor a resume to a job
// @Description  Reorders and rephrases the resume against a specific job description, and reports which of the job's requirements the resume already evidences and which it does not. A gap is reported as a gap rather than filled in.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id       path      string                   true  "Id"
// @Param        request  body      models.TailorJobRequest  true  "The job to tailor against"
// @Success      200      {object}  models.TailorJobResponse
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid resume ID"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/tailor [post]
func swaggerTailorResume() {}

// swaggerPreviewResume documents POST /api/v1/resumes/{id}/preview.
//
// @Summary      Preview a resume
// @Description  Returns the rendered resume together with the URL its preview is served from.
// @Tags         Profiles
// @Produce      json
// @Param        id   path      string  true  "Id"
// @Success      200  {object}  ResumePreviewResponse
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid resume ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse  "Resume not found"
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/preview [post]
func swaggerPreviewResume() {}

// swaggerDownloadResume documents GET /api/v1/resumes/{id}/download.
//
// @Summary      Download a resume
// @Description  Serves the resume as a PDF attachment, named after its title.
// @Tags         Profiles
// @Produce      application/pdf
// @Param        id   path      string  true  "Id"
// @Success      200  {file}    binary                 "The resume as a PDF"
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid resume ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse  "Resume not found"
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/download [get]
func swaggerDownloadResume() {}

// swaggerShareResume documents POST /api/v1/resumes/{id}/share.
//
// @Summary      Share a resume
// @Description  Creates a shareable link to the resume at the privacy level asked for, defaulting to Public when none is given. The link can be withdrawn again with DELETE on the same path.
// @Tags         Profiles
// @Accept       json
// @Produce      json
// @Param        id       path      string            true   "Id"
// @Param        request  body      ShareResumeBody   false  "Privacy level for the link"
// @Success      200      {object}  models.ResumeShare
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid resume ID"
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/share [post]
func swaggerShareResume() {}

// swaggerDeleteResumeShare documents DELETE /api/v1/resumes/{id}/share.
//
// @Summary      Revoke a resume share
// @Description  Withdraws the shareable link so the resume can no longer be opened through it.
// @Tags         Profiles
// @Produce      json
// @Param        id   path      string                   true  "Id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"message\": \"Share revoked\"}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid resume ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/share [delete]
func swaggerDeleteResumeShare() {}

// swaggerGetResumeAnalytics documents GET /api/v1/resumes/{id}/analytics.
//
// @Summary      Resume analytics
// @Description  Views, downloads and shares recorded against the resume. Figures are counts; individual viewers are not identified.
// @Tags         Profiles
// @Produce      json
// @Param        id   path      string  true  "Id"
// @Success      200  {object}  models.ResumeAnalytics
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid resume ID"
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/resumes/{id}/analytics [get]
func swaggerGetResumeAnalytics() {}

// ShareResumeBody is the body of POST /api/v1/resumes/{id}/share. It is
// declared here rather than in the handler because the handler binds an
// anonymous struct; a documented operation cannot name an unnamed shape.
type ShareResumeBody struct {
	// PrivacyLevel defaults to "Public" when empty.
	PrivacyLevel string `json:"privacyLevel" example:"Public"`
}

// ResumePreviewResponse is the reply to POST /api/v1/resumes/{id}/preview.
type ResumePreviewResponse struct {
	PreviewURL string        `json:"previewUrl" example:"/preview/6f1f8f3a-6d1e-4a6e-9c53-2f1b8b0f0c11"`
	Resume     models.Resume `json:"resume"`
}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ models.Resume
	_ swagger.ErrorResponse
)
