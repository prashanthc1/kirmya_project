package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/onboarding/domain"
)

// swaggerGetProgress documents GET /api/v1/onboarding.
//
// @Summary      Get onboarding progress
// @Description  Returns user's completed steps, active flow, and current step index
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding [get]
func swaggerGetProgress() {}

// swaggerStartOnboarding documents POST /api/v1/onboarding/start.
//
// @Summary      Start user onboarding
// @Description  Initializes candidate, recruiter, or employer onboarding journey
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.StartOnboardingPayload  false  "Role & persona"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/start [post]
func swaggerStartOnboarding() {}

// swaggerGetProgressAlt documents GET /api/v1/onboarding/progress.
//
// @Summary      Get onboarding progress details
// @Description  Returns detailed step state and form completion progress
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/progress [get]
func swaggerGetProgressAlt() {}

// swaggerSaveProgress documents PUT /api/v1/onboarding/progress.
//
// @Summary      Save onboarding step draft
// @Description  Saves draft form answers for the active step
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.SaveProgressPayload  true  "Step data"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/progress [put]
func swaggerSaveProgress() {}

// swaggerSaveProgressSave documents PUT /api/v1/onboarding/save.
//
// @Summary      Save progress (Alias)
// @Description  Legacy alias for saving onboarding progress
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.SaveProgressPayload  true  "Step data"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/save [put]
func swaggerSaveProgressSave() {}

// swaggerCompleteStep documents POST /api/v1/onboarding/steps/{stepId}/complete.
//
// @Summary      Complete onboarding step
// @Description  Validates and marks a single onboarding step complete
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        stepId   path      string                      true  "Step ID"
// @Param        request  body      domain.CompleteStepPayload  false "Step payload"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/steps/{stepId}/complete [post]
func swaggerCompleteStep() {}

// swaggerSkipStep documents POST /api/v1/onboarding/steps/{stepId}/skip.
//
// @Summary      Skip optional onboarding step
// @Description  Bypasses an optional onboarding step
// @Tags         Onboarding
// @Produce      json
// @Param        stepId  path      string  true  "Step ID"
// @Success      200     {object}  swagger.SuccessResponse
// @Failure      400     {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/steps/{stepId}/skip [post]
func swaggerSkipStep() {}

// swaggerResumeOnboarding documents POST /api/v1/onboarding/resume.
//
// @Summary      Resume onboarding session
// @Description  Resumes an in-progress onboarding session from last saved state
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/resume [post]
func swaggerResumeOnboarding() {}

// swaggerFinishOnboarding documents POST /api/v1/onboarding/finish.
//
// @Summary      Finish and publish profile
// @Description  Finalizes onboarding, sets account active, and lands user on main feed
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/finish [post]
func swaggerFinishOnboarding() {}

// swaggerCompleteOnboarding documents POST /api/v1/onboarding/complete.
//
// @Summary      Complete onboarding (Alias)
// @Description  Marks onboarding complete and redirects to dashboard
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/complete [post]
func swaggerCompleteOnboarding() {}

// swaggerSaveRecruiterOnboarding documents POST /api/v1/onboarding/recruiter.
//
// @Summary      Save recruiter company & verification info
// @Description  Saves hiring company affiliation and recruiter credentials
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.RecruiterOnboardingPayload  true  "Recruiter details"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/recruiter [post]
func swaggerSaveRecruiterOnboarding() {}

// swaggerSaveEmployerOnboarding documents POST /api/v1/onboarding/employer.
//
// @Summary      Save employer organization info
// @Description  Creates or links company workspace during employer onboarding
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.EmployerOnboardingPayload  true  "Company details"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/employer [post]
func swaggerSaveEmployerOnboarding() {}

// swaggerGetCommunities documents GET /api/v1/onboarding/communities.
//
// @Summary      Get suggested communities for onboarding
// @Description  Returns initial recommended communities to follow
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/communities [get]
func swaggerGetCommunities() {}

// swaggerGetConnections documents GET /api/v1/onboarding/connections.
//
// @Summary      Get suggested connections for onboarding
// @Description  Returns initial contact suggestions to bootstrap network
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/onboarding/connections [get]
func swaggerGetConnections() {}

// swaggerGetProfileCompletion documents GET /api/v1/profile/completion.
//
// @Summary      Get profile completion percentage
// @Description  Returns profile completeness score (0-100%) and missing profile sections
// @Tags         Onboarding
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/profile/completion [get]
func swaggerGetProfileCompletion() {}

// swaggerUploadProfilePhoto documents POST /api/v1/profile/photo.
//
// @Summary      Upload profile avatar
// @Description  Uploads profile photo and sets avatar URL
// @Tags         Onboarding
// @Accept       multipart/form-data
// @Produce      json
// @Param        file  formData  file  true  "Image file"
// @Success      200   {object}  swagger.SuccessResponse
// @Failure      400   {object}  swagger.ErrorResponse
// @Router       /api/v1/profile/photo [post]
func swaggerUploadProfilePhoto() {}

// swaggerUploadResume documents POST /api/v1/resume/upload.
//
// @Summary      Upload resume document
// @Description  Uploads PDF/DOCX resume and initiates background parsing
// @Tags         Onboarding
// @Accept       multipart/form-data
// @Produce      json
// @Param        file  formData  file  true  "Resume document"
// @Success      200   {object}  swagger.SuccessResponse
// @Failure      400   {object}  swagger.ErrorResponse
// @Router       /api/v1/resume/upload [post]
func swaggerUploadResume() {}

// swaggerSaveSkills documents POST /api/v1/skills.
//
// @Summary      Save user skills
// @Description  Batch updates verified and self-reported skills
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.SaveSkillsPayload  true  "Skills list"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/skills [post]
func swaggerSaveSkills() {}

// swaggerSaveWorkExperience documents POST /api/v1/work-experience.
//
// @Summary      Save work experience
// @Description  Creates employment history record
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.WorkExperiencePayload  true  "Work experience"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/work-experience [post]
func swaggerSaveWorkExperience() {}

// swaggerSaveEducation documents POST /api/v1/education.
//
// @Summary      Save education record
// @Description  Adds academic degree or institution attendance
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.EducationPayload  true  "Education details"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/education [post]
func swaggerSaveEducation() {}

// swaggerSaveCertifications documents POST /api/v1/certifications.
//
// @Summary      Save professional certifications
// @Description  Records license, credential or certification
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.CertificationPayload  true  "Certification"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/certifications [post]
func swaggerSaveCertifications() {}

// swaggerSaveCareerPreferences documents POST /api/v1/career-preferences.
//
// @Summary      Save career preferences
// @Description  Records target job titles, preferred locations, and expected salary
// @Tags         Onboarding
// @Accept       json
// @Produce      json
// @Param        request  body      domain.CareerPreferences  true  "Preferences"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/career-preferences [post]
func swaggerSaveCareerPreferences() {}

// swaggerAdminOnboardingSummary documents GET /api/v1/admin/onboarding.
//
// @Summary      Get onboarding funnel metrics (Admin)
// @Description  Returns completion rates, drop-off steps, and average time-to-complete
// @Tags         Admin Onboarding
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/onboarding [get]
func swaggerAdminOnboardingSummary() {}

// swaggerAdminOnboardingAnalytics documents GET /api/v1/admin/onboarding/analytics.
//
// @Summary      Get detailed onboarding analytics (Admin)
// @Description  Returns step-by-step conversion rates and cohort metrics
// @Tags         Admin Onboarding
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/onboarding/analytics [get]
func swaggerAdminOnboardingAnalytics() {}

// swaggerAdminOnboardingConfigGet documents GET /api/v1/admin/onboarding/config.
//
// @Summary      Get onboarding step configuration (Admin)
// @Description  Returns active step sequence, required vs optional steps
// @Tags         Admin Onboarding
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/onboarding/config [get]
func swaggerAdminOnboardingConfigGet() {}

// swaggerAdminOnboardingConfigPut documents PUT /api/v1/admin/onboarding/config.
//
// @Summary      Update onboarding step configuration (Admin)
// @Description  Enables, disables or reorders onboarding steps
// @Tags         Admin Onboarding
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      domain.OnboardingConfigPayload  true  "Step configuration"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/onboarding/config [put]
func swaggerAdminOnboardingConfigPut() {}

var (
	_ swagger.ErrorResponse
	_ domain.CareerPreferences
)
