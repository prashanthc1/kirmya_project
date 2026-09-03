package http

import (
	"kirmya/internal/analytics/domain"
	"kirmya/internal/common/swagger"
)

// swaggerTrackEvent documents POST /api/v1/internal/analytics/events.
//
// @Summary      Track event
// @Description  Records event via the Kirmya analytics module.
// @Tags         Analytics
// @Accept       json
// @Produce      json
// @Param        request  body      domain.TrackEventPayload  true  "Request payload"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      500      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/internal/analytics/events [post]
func swaggerTrackEvent() {}

// swaggerGetUserAnalyticsProfile documents GET /api/v1/analytics/profile.
//
// @Summary      Get profile analytics
// @Description  Returns user profile analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/profile [get]
func swaggerGetUserAnalyticsProfile() {}

// swaggerGetUserAnalyticsJobs documents GET /api/v1/analytics/jobs.
//
// @Summary      Get job seeker analytics
// @Description  Returns job seeker analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/jobs [get]
func swaggerGetUserAnalyticsJobs() {}

// swaggerGetUserAnalyticsApplications documents GET /api/v1/analytics/applications.
//
// @Summary      Get application analytics
// @Description  Returns user application analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/applications [get]
func swaggerGetUserAnalyticsApplications() {}

// swaggerGetUserAnalyticsNetwork documents GET /api/v1/analytics/network.
//
// @Summary      Get network analytics
// @Description  Returns user network growth analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/network [get]
func swaggerGetUserAnalyticsNetwork() {}

// swaggerGetUserAnalyticsContent documents GET /api/v1/analytics/content.
//
// @Summary      Get content analytics
// @Description  Returns content engagement analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/content [get]
func swaggerGetUserAnalyticsContent() {}

// swaggerGetUserAnalyticsCareer documents GET /api/v1/analytics/career.
//
// @Summary      Get career analytics
// @Description  Returns career progression analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/career [get]
func swaggerGetUserAnalyticsCareer() {}

// swaggerGetUserAnalyticsMe documents GET /api/v1/analytics/me.
//
// @Summary      Get consolidated personal analytics
// @Description  Returns consolidated personal user analytics across profile, job views, and applications.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/me [get]
func swaggerGetUserAnalyticsMe() {}

// swaggerGetRecruiterAnalytics documents GET /api/v1/recruiter/analytics.
//
// @Summary      Get recruiter analytics
// @Description  Returns recruiter workspace analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/analytics [get]
func swaggerGetRecruiterAnalytics() {}

// swaggerGetRecruiterAnalyticsJobs documents GET /api/v1/recruiter/analytics/jobs.
//
// @Summary      Get recruiter job analytics
// @Description  Returns pipeline analytics for recruiter jobs.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/analytics/jobs [get]
func swaggerGetRecruiterAnalyticsJobs() {}

// swaggerGetRecruiterAnalyticsCandidates documents GET /api/v1/recruiter/analytics/candidates.
//
// @Summary      Get recruiter candidate analytics
// @Description  Returns candidate engagement and response metrics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/analytics/candidates [get]
func swaggerGetRecruiterAnalyticsCandidates() {}

// swaggerGetRecruiterAnalyticsOverview documents GET /api/v1/recruiter/analytics/overview.
//
// @Summary      Get recruiter analytics overview
// @Description  Returns high level KPIs for recruiter talent acquisition.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/recruiter/analytics/overview [get]
func swaggerGetRecruiterAnalyticsOverview() {}

// swaggerGetCompanyAnalyticsOverview documents GET /api/v1/company/analytics/overview.
//
// @Summary      Get company brand analytics
// @Description  Returns followers and page visit trends.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/company/analytics/overview [get]
func swaggerGetCompanyAnalyticsOverview() {}

// swaggerGetCompanyAnalyticsJobs documents GET /api/v1/company/analytics/jobs.
//
// @Summary      Get company job posting analytics
// @Description  Returns job views and applicant conversion across listings.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/company/analytics/jobs [get]
func swaggerGetCompanyAnalyticsJobs() {}

// swaggerGetCompanyAnalyticsApplications documents GET /api/v1/company/analytics/applications.
//
// @Summary      Get company application funnel
// @Description  Returns applicant stage progress and drop-off analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/company/analytics/applications [get]
func swaggerGetCompanyAnalyticsApplications() {}

// swaggerGetCompanyAnalyticsCandidates documents GET /api/v1/company/analytics/candidates.
//
// @Summary      Get company talent pool analytics
// @Description  Returns candidate demographics and sourcing channel breakdown.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/company/analytics/candidates [get]
func swaggerGetCompanyAnalyticsCandidates() {}

// swaggerGetCommunityAnalytics documents GET /api/v1/communities/{id}/analytics.
//
// @Summary      Get community analytics
// @Description  Returns member engagement, post activity, and growth metrics for a community.
// @Tags         Analytics
// @Produce      json
// @Param        id   path      string  true  "Community ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/analytics [get]
func swaggerGetCommunityAnalytics() {}

// swaggerGetAdminAnalyticsOverview documents GET /api/v1/admin/analytics/overview.
//
// @Summary      Get platform analytics overview
// @Description  Returns executive KPIs on platform growth, revenue, and active accounts.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/overview [get]
func swaggerGetAdminAnalyticsOverview() {}

// swaggerGetAdminAnalyticsUsers documents GET /api/v1/admin/analytics/users.
//
// @Summary      Get user growth analytics
// @Description  Returns new registrations, DAU/MAU, and churn rates.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/users [get]
func swaggerGetAdminAnalyticsUsers() {}

// swaggerGetAdminAnalyticsJobs documents GET /api/v1/admin/analytics/jobs.
//
// @Summary      Get job market analytics
// @Description  Returns job posting volume, salary benchmarks, and demand by industry.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/jobs [get]
func swaggerGetAdminAnalyticsJobs() {}

// swaggerGetAdminAnalyticsApplications documents GET /api/v1/admin/analytics/applications.
//
// @Summary      Get admin applications analytics
// @Description  Returns admin applications analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/applications [get]
func swaggerGetAdminAnalyticsApplications() {}

// swaggerGetAdminAnalyticsRecruiters documents GET /api/v1/admin/analytics/recruiters.
//
// @Summary      Get admin recruiters analytics
// @Description  Returns admin recruiters analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/recruiters [get]
func swaggerGetAdminAnalyticsRecruiters() {}

// swaggerGetAdminAnalyticsCompanies documents GET /api/v1/admin/analytics/companies.
//
// @Summary      Get admin companies analytics
// @Description  Returns admin companies analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/companies [get]
func swaggerGetAdminAnalyticsCompanies() {}

// swaggerGetAdminAnalyticsCommunities documents GET /api/v1/admin/analytics/communities.
//
// @Summary      Get admin communities analytics
// @Description  Returns admin communities analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/communities [get]
func swaggerGetAdminAnalyticsCommunities() {}

// swaggerGetAdminAnalyticsMessaging documents GET /api/v1/admin/analytics/messaging.
//
// @Summary      Get admin messaging analytics
// @Description  Returns admin messaging throughput analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/messaging [get]
func swaggerGetAdminAnalyticsMessaging() {}

// swaggerGetAdminAnalyticsNotifications documents GET /api/v1/admin/analytics/notifications.
//
// @Summary      Get admin notification analytics
// @Description  Returns delivery, open rates, and push notification throughput.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/notifications [get]
func swaggerGetAdminAnalyticsNotifications() {}

// swaggerGetAdminAnalyticsRecommendations documents GET /api/v1/admin/analytics/recommendations.
//
// @Summary      Get admin recommendations analytics
// @Description  Returns recommendation CTR and algorithmic accuracy metrics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/recommendations [get]
func swaggerGetAdminAnalyticsRecommendations() {}

// swaggerGetAdminAnalyticsAI documents GET /api/v1/admin/analytics/ai.
//
// @Summary      Get admin AI usage analytics
// @Description  Returns admin AI usage & latency analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/ai [get]
func swaggerGetAdminAnalyticsAI() {}

// swaggerGetAdminAnalyticsSearch documents GET /api/v1/admin/analytics/search.
//
// @Summary      Get admin search analytics
// @Description  Returns admin search query analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/search [get]
func swaggerGetAdminAnalyticsSearch() {}

// swaggerGetAdminAnalyticsSearchZeroResults documents GET /api/v1/admin/analytics/search/zero-results.
//
// @Summary      Get admin zero-results search queries
// @Description  Returns search terms that yielded zero candidate or job matches.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/search/zero-results [get]
func swaggerGetAdminAnalyticsSearchZeroResults() {}

// swaggerGetAdminAnalyticsSupport documents GET /api/v1/admin/analytics/support.
//
// @Summary      Get admin support analytics
// @Description  Returns admin support ticket analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/support [get]
func swaggerGetAdminAnalyticsSupport() {}

// swaggerGetAdminAnalyticsSafety documents GET /api/v1/admin/analytics/safety.
//
// @Summary      Get admin safety analytics
// @Description  Returns admin trust & safety analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/safety [get]
func swaggerGetAdminAnalyticsSafety() {}

// swaggerGetAdminAnalyticsSystem documents GET /api/v1/admin/analytics/system.
//
// @Summary      Get admin system metrics
// @Description  Returns admin system health metrics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/system [get]
func swaggerGetAdminAnalyticsSystem() {}

// swaggerGetAdminAnalyticsSystemPerformance documents GET /api/v1/admin/analytics/system/performance.
//
// @Summary      Get admin system performance metrics
// @Description  Returns real-time p95/p99 latency and DB query performance.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/system/performance [get]
func swaggerGetAdminAnalyticsSystemPerformance() {}

// swaggerGetAdminAnalyticsEvents documents GET /api/v1/admin/analytics/events.
//
// @Summary      Get admin events log
// @Description  Returns admin event ingestion audit log.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/events [get]
func swaggerGetAdminAnalyticsEvents() {}

// swaggerRequestExport documents POST /api/v1/admin/analytics/export.
//
// @Summary      Export analytics data
// @Description  Triggers asynchronous data export (CSV/JSON).
// @Tags         Analytics
// @Accept       json
// @Produce      json
// @Success      202  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/export [post]
func swaggerRequestExport() {}

// swaggerGetUserConsent documents GET /api/v1/analytics/consent.
//
// @Summary      Get user consent preferences
// @Description  Returns user consent and privacy settings for analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/consent [get]
func swaggerGetUserConsent() {}

// swaggerUpdateUserConsent documents PUT /api/v1/analytics/consent.
//
// @Summary      Update user consent preferences
// @Description  Updates user consent preferences.
// @Tags         Analytics
// @Accept       json
// @Produce      json
// @Param        request  body      object  true  "Consent settings"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/consent [put]
func swaggerUpdateUserConsent() {}

// swaggerGetPersonalFunnel documents GET /api/v1/analytics/funnel.
//
// @Summary      Get user activation funnel
// @Description  Returns personal activation funnel stages.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/funnel [get]
func swaggerGetPersonalFunnel() {}

// swaggerGetPersonalMentorship documents GET /api/v1/analytics/mentorship.
//
// @Summary      Get personal mentorship analytics
// @Description  Returns user mentorship engagement metrics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/mentorship [get]
func swaggerGetPersonalMentorship() {}

// swaggerGetPersonalLearning documents GET /api/v1/analytics/learning.
//
// @Summary      Get personal learning analytics
// @Description  Returns user learning progress analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/analytics/learning [get]
func swaggerGetPersonalLearning() {}

// swaggerGetPerformance documents GET /api/v1/admin/analytics/performance.
//
// @Summary      Get system performance analytics
// @Description  Returns latency percentile metrics and throughput rates.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/performance [get]
func swaggerGetPerformance() {}

// swaggerGetTrustSafety documents GET /api/v1/admin/analytics/trust-safety.
//
// @Summary      Get trust & safety analytics
// @Description  Returns moderation, bans, and safety report analytics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/trust-safety [get]
func swaggerGetTrustSafety() {}

// swaggerGetMentorshipAdmin documents GET /api/v1/admin/analytics/mentorship.
//
// @Summary      Get admin mentorship analytics
// @Description  Returns platform-wide mentorship engagement metrics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/mentorship [get]
func swaggerGetMentorshipAdmin() {}

// swaggerGetLearningAdmin documents GET /api/v1/admin/analytics/learning.
//
// @Summary      Get admin learning analytics
// @Description  Returns platform-wide learning metrics.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/learning [get]
func swaggerGetLearningAdmin() {}

// swaggerGetFunnelAdmin documents GET /api/v1/admin/analytics/funnel.
//
// @Summary      Get admin user activation funnel
// @Description  Returns platform-wide activation funnel stages.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/funnel [get]
func swaggerGetFunnelAdmin() {}

// swaggerGetCohorts documents GET /api/v1/admin/analytics/cohorts.
//
// @Summary      Get admin cohort grid analytics
// @Description  Returns user retention cohort matrix.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/cohorts [get]
func swaggerGetCohorts() {}

// swaggerGetFeatureAdoption documents GET /api/v1/admin/analytics/feature-adoption.
//
// @Summary      Get feature adoption metrics
// @Description  Returns feature usage map and active counts.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/feature-adoption [get]
func swaggerGetFeatureAdoption() {}

// swaggerGenerateCustomReport documents POST /api/v1/admin/analytics/reports/custom.
//
// @Summary      Generate custom report
// @Description  Generates ad-hoc custom analytics export.
// @Tags         Analytics
// @Accept       json
// @Produce      json
// @Success      202  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/reports/custom [post]
func swaggerGenerateCustomReport() {}

// swaggerGetScheduledReports documents GET /api/v1/admin/analytics/reports/scheduled.
//
// @Summary      Get scheduled analytics reports
// @Description  Returns list of configured recurring report deliveries.
// @Tags         Analytics
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/reports/scheduled [get]
func swaggerGetScheduledReports() {}

// swaggerCreateScheduledReport documents POST /api/v1/admin/analytics/reports/scheduled.
//
// @Summary      Create scheduled report delivery
// @Description  Sets up a recurring scheduled report export.
// @Tags         Analytics
// @Accept       json
// @Produce      json
// @Param        request  body      object  true  "Schedule configuration"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/reports/scheduled [post]
func swaggerCreateScheduledReport() {}

// swaggerDownloadReport documents GET /api/v1/admin/analytics/reports/download/{id}.
//
// @Summary      Download analytics export package
// @Description  Downloads a generated CSV/JSON analytics report file.
// @Tags         Analytics
// @Produce      json
// @Param        id   path      string  true  "Report ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/reports/download/{id} [get]
func swaggerDownloadReport() {}

// swaggerTriggerRetentionCleanup documents POST /api/v1/admin/analytics/cleanup.
//
// @Summary      Trigger data retention cleanup
// @Description  Executes automated purging of expired analytics raw events.
// @Tags         Analytics
// @Accept       json
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/admin/analytics/cleanup [post]
func swaggerTriggerRetentionCleanup() {}

var (
	_ domain.TrackEventPayload
	_ swagger.ErrorResponse
)
