package router

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	adminHttp "kirmya/internal/admin/delivery/http"
	aiHttp "kirmya/internal/ai/delivery/http"
	jobMatchHttp "kirmya/internal/ai_job_match/delivery/http"
	analyticsHttp "kirmya/internal/analytics/delivery/http"
	applicationsHttp "kirmya/internal/applications/delivery/http"
	assessmentHttp "kirmya/internal/assessment/delivery/http"
	authHttp "kirmya/internal/auth/delivery/http"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	backupHttp "kirmya/internal/backup/delivery/http"
	billingHttp "kirmya/internal/billing/delivery/http"
	candidateSearchHttp "kirmya/internal/candidate_search/delivery/http"
	careerAIHttp "kirmya/internal/career_ai/delivery/http"
	companionHttp "kirmya/internal/career_companion/delivery/http"
	commHttp "kirmya/internal/community/delivery/http"
	companyHttp "kirmya/internal/company/delivery/http"
	complianceHttp "kirmya/internal/compliance/delivery/http"
	coverLetterHttp "kirmya/internal/cover_letter/delivery/http"
	dataOpsHttp "kirmya/internal/data_operations/delivery/http"
	endorsementHttp "kirmya/internal/endorsement/delivery/http"
	enterpriseHttp "kirmya/internal/enterprise_hiring/delivery/http"
	eventHttp "kirmya/internal/event/delivery/http"
	freelanceHttp "kirmya/internal/freelance/delivery/http"
	marketplaceHttp "kirmya/internal/global_marketplace/delivery/http"
	interviewHttp "kirmya/internal/interview/delivery/http"
	interviewPrepHttp "kirmya/internal/interview_prep/delivery/http"
	jobAlertsHttp "kirmya/internal/job_alerts/delivery/http"
	jobsHttp "kirmya/internal/jobs/delivery/http"
	landingHttp "kirmya/internal/landing/delivery/http"
	learningHttp "kirmya/internal/learning/delivery/http"
	legalHttp "kirmya/internal/legal/delivery/http"
	mediaHttp "kirmya/internal/media/delivery/http"
	mentorshipHttp "kirmya/internal/mentorship/delivery/http"
	msgHttp "kirmya/internal/messaging/delivery/http"
	mobileHttp "kirmya/internal/mobile/delivery/http"
	nativeMobileHttp "kirmya/internal/native_mobile/delivery/http"
	netHttp "kirmya/internal/networking/delivery/http"
	notifyHttp "kirmya/internal/notification/delivery/http"
	onboardingHttp "kirmya/internal/onboarding/delivery/http"
	organizationHttp "kirmya/internal/organization/delivery/http"
	profileHttp "kirmya/internal/profile/delivery/http"
	recHttp "kirmya/internal/recommendation/delivery/http"
	recommendationEngineHttp "kirmya/internal/recommendation_engine/delivery/http"
	recruiterHttp "kirmya/internal/recruiter/delivery/http"
	recruiterSvc "kirmya/internal/recruiter/service"
	recruiterAIHttp "kirmya/internal/recruiter_ai/delivery/http"
	referralHttp "kirmya/internal/referral/delivery/http"
	resumeHttp "kirmya/internal/resume/delivery/http"
	resumeAnalysisHttp "kirmya/internal/resume_analysis/delivery/http"
	unifiedSearchHttp "kirmya/internal/search/delivery/http"
	securityHttp "kirmya/internal/security/delivery/http"
	"kirmya/internal/shared/middleware"
	supportHttp "kirmya/internal/support/delivery/http"
	sysHealthHttp "kirmya/internal/system_health/delivery/http"
	trustHttp "kirmya/internal/trust_safety/delivery/http"
	verificationHttp "kirmya/internal/verification/delivery/http"
	intelligenceHttp "kirmya/internal/workforce_intelligence/delivery/http"
	workspaceHttp "kirmya/internal/workspace/delivery/http"
)

type RouterDependencies struct {
	AllowedOrigins []string
	TrustedProxies []string
	RateLimit      RateLimitConfig
	Metrics        MetricsConfig

	AuthMiddleware           *authMiddlewarePkg.AuthMiddleware
	AuthHandler              *authHttp.AuthHandler
	ProfileHandler           *profileHttp.ProfileHandler
	ResumeHandler            *resumeHttp.ResumeHandler
	RecommendationHandler    *recHttp.RecommendationHandler
	NetworkingHandler        *netHttp.NetworkingHandler
	CommunityHandler         *commHttp.CommunityHandler
	MessagingHandler         *msgHttp.MessagingHandler
	NotificationHandler      *notifyHttp.NotificationHandler
	AnalyticsHandler         *analyticsHttp.AnalyticsHandler
	AIHandler                *aiHttp.AIHandler
	CompanyHandler           *companyHttp.CompanyHandler
	CompanyManagementHandler *companyHttp.ManagementHandler
	RecruiterHandler         *recruiterHttp.RecruiterHandler
	WorkspaceHandler         *workspaceHttp.WorkspaceHandler
	// RecruiterService backs the recruiter capability guard on the privileged
	// half of /recruiter/*.
	RecruiterService            *recruiterSvc.RecruiterService
	CandidateSearchHandler      *candidateSearchHttp.SearchHandler
	InterviewHandler            *interviewHttp.InterviewHandler
	LearningHandler             *learningHttp.LearningHandler
	AssessmentHandler           *assessmentHttp.AssessmentHandler
	CareerAIHandler             *careerAIHttp.CareerAIHandler
	ResumeAnalysisHandler       *resumeAnalysisHttp.ResumeAnalysisHandler
	VerificationHandler         *verificationHttp.VerificationHandler
	EndorsementHandler          *endorsementHttp.EndorsementHandler
	ReferralHandler             *referralHttp.ReferralHandler
	EventHandler                *eventHttp.EventHandler
	OrganizationHandler         *organizationHttp.OrganizationHandler
	UnifiedSearchHandler        *unifiedSearchHttp.SearchHandler
	MobileHandler               *mobileHttp.MobileHandler
	NativeMobileHandler         *nativeMobileHttp.NativeMobileHandler
	CompanionHandler            *companionHttp.CompanionHandler
	JobMatchHandler             *jobMatchHttp.MatchingHandler
	RecruiterAIHandler          *recruiterAIHttp.RecruiterAIHandler
	MarketplaceHandler          *marketplaceHttp.MarketplaceHandler
	FreelanceHandler            *freelanceHttp.FreelanceHandler
	EnterpriseHandler           *enterpriseHttp.EnterpriseHandler
	TrustHandler                *trustHttp.TrustHandler
	ComplianceHandler           *complianceHttp.ComplianceHandler
	IntelligenceHandler         *intelligenceHttp.IntelligenceHandler
	RecommendationEngineHandler *recommendationEngineHttp.RecommendationHandler
	LandingHandler              *landingHttp.LandingHandler
	NewsletterHandler           *landingHttp.NewsletterHandler
	OnboardingHandler           *onboardingHttp.OnboardingHandler
	ApplicationsHandler         *applicationsHttp.ApplicationsHandler
	JobAlertsHandler            *jobAlertsHttp.JobAlertsHandler
	JobsHandler                 *jobsHttp.JobHandler
	CoverLetterHandler          *coverLetterHttp.CoverLetterHandler
	InterviewPrepHandler        *interviewPrepHttp.InterviewPrepHandler
	AdminHandler                *adminHttp.AdminHandler
	BillingHandler              *billingHttp.BillingHandler
	AdminBillingHandler         *billingHttp.AdminBillingHandler
	LegalHandler                *legalHttp.LegalHandler
	AdminLegalHandler           *legalHttp.AdminLegalHandler
	TrustSafetyHandler          *trustHttp.TrustSafetyHandler
	AdminTrustSafetyHandler     *trustHttp.AdminTrustSafetyHandler
	AdminAnalyticsHandler       *analyticsHttp.AdminAnalyticsHandler
	SecurityHandler             *securityHttp.SecurityHandler
	AdminSecurityHandler        *securityHttp.AdminSecurityHandler
	SupportHandler              *supportHttp.SupportHandler
	AdminSupportHandler         *supportHttp.AdminSupportHandler
	AdminBackupHandler          *backupHttp.BackupHandler
	DataOperationsHandler       *dataOpsHttp.DataOperationsHandler
	SystemHealthHandler         *sysHealthHttp.SystemHealthHandler
	MentorshipHandler           *mentorshipHttp.MentorshipHandler
	FileHandler                 *mediaHttp.FileHandler
}

type Handlers = RouterDependencies

type RateLimitConfig struct {
	RequestsPerMinute float64
	Burst             float64
	// AuthRequestsPerMinute and AuthBurst size the /auth group's own bucket.
	// Zero means "use the package default", so a caller that does not set them
	// keeps the production allowance.
	AuthRequestsPerMinute float64
	AuthBurst             float64

	// AuthSessionRequestsPerMinute and AuthSessionBurst size the separate bucket
	// in front of the session endpoints, which every page load hits twice.
	AuthSessionRequestsPerMinute float64
	AuthSessionBurst             float64

	// NewsletterRequestsPerMinute and NewsletterBurst size the public
	// newsletter endpoints' bucket.
	NewsletterRequestsPerMinute float64
	NewsletterBurst             float64
}

func New(deps RouterDependencies, cfg SwaggerConfig) *gin.Engine {
	engine := gin.New()
	engine.Use(middleware.PanicRecovery())
	engine.Use(middleware.StructuredLogger())
	if err := engine.SetTrustedProxies(deps.TrustedProxies); err != nil {
		slog.Error("Invalid TRUSTED_PROXIES entry; trusting no proxy", slog.String("error", err.Error()))
		_ = engine.SetTrustedProxies(nil)
	}
	engine.Use(middleware.SecurityHeaders())
	engine.Use(middleware.CORS(deps.AllowedOrigins))
	// CORS hides an unauthorised response; it does not stop the request from
	// running. OriginGuard refuses the state-changing ones outright, which is
	// what actually prevents a forged cross-site write.
	engine.Use(middleware.OriginGuard(deps.AllowedOrigins))
	registerSwagger(engine, cfg)
	if deps.SystemHealthHandler == nil {
		registerHealthCheck(engine)
	}
	SetupRouter(engine, deps)
	return engine
}

// registerHealthCheck installs the probes used when no health service is wired.
//
// That is the tooling and unit-test path only; the running server always has
// the real handler. What matters here is what this fallback must not do, which
// is answer a question it cannot answer.
//
// It used to serve GET /health/dependencies with six hardcoded "healthy"
// values — postgresql, redis, nats, opensearch, email, storage — on a router
// built with no dependencies at all. A reliability test asserted that response
// and passed, which is how a fabricated dependency report survives: the check
// covering it is a check of the fabrication.
func registerHealthCheck(engine *gin.Engine) {
	health := engine.Group("/health")
	{
		// Liveness is the one thing this can honestly report: the process
		// received the request and answered it.
		health.GET("", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":    "ok",
				"service":   "kirmya-backend",
				"timestamp": time.Now().Format(time.RFC3339),
			})
		})
		health.GET("/live", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "alive"})
		})
		// Readiness is not. Without a health service there is nothing to check
		// the database or any other dependency with, so this fails closed: a
		// platform host must not route traffic to a replica whose readiness is
		// unknown, and 200 "ready" is what tells it to.
		health.GET("/ready", func(c *gin.Context) {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unknown",
				"reason": "no health service is configured; readiness cannot be determined",
			})
		})
		// GET /health/dependencies is deliberately absent. It reported on six
		// dependencies this fallback has no handle on.
	}
}

func SetupRouter(engine *gin.Engine, deps RouterDependencies) {
	api := engine.Group("/api/v1")
	api.Use(middleware.RateLimiter(deps.RateLimit.RequestsPerMinute/60.0, deps.RateLimit.Burst))
	api.Use(middleware.TenantIsolationMiddleware())
	api.Use(middleware.MobileDeviceMiddleware())
	api.Use(middleware.TelemetryMiddleware())
	api.Use(middleware.GzipCompressionMiddleware())
	api.Use(middleware.TimeoutMiddleware(5 * time.Second))

	api.GET("/metrics", metricsGuard(deps.Metrics), metricsHandler())

	authHttp.RegisterRoutesWithSessionLimit(api, deps.AuthHandler, deps.AuthMiddleware,
		deps.RateLimit.AuthRequestsPerMinute, deps.RateLimit.AuthBurst,
		deps.RateLimit.AuthSessionRequestsPerMinute, deps.RateLimit.AuthSessionBurst)
	analyticsHttp.RegisterRoutes(api, deps.AnalyticsHandler, deps.AdminAnalyticsHandler)
	aiHttp.RegisterRoutes(api, deps.AIHandler)

	companyHttp.RegisterRoutes(api, deps.CompanyHandler, deps.CompanyManagementHandler, deps.AuthMiddleware)
	recruiterHttp.RegisterRoutes(api, deps.RecruiterHandler, deps.UnifiedSearchHandler, deps.RecruiterService)
	candidateSearchHttp.RegisterRoutes(api, deps.CandidateSearchHandler, recruiterHttp.RequireRecruiterCapability(deps.RecruiterService))
	workspaceHttp.RegisterRoutes(api, deps.WorkspaceHandler)
	interviewHttp.RegisterRoutes(api, deps.InterviewHandler)
	learningHttp.RegisterRoutes(api, deps.LearningHandler)
	assessmentHttp.RegisterRoutes(api, deps.AssessmentHandler)
	careerAIHttp.RegisterRoutes(api, deps.CareerAIHandler)
	resumeAnalysisHttp.RegisterRoutes(api, deps.ResumeAnalysisHandler)
	verificationHttp.RegisterRoutes(api, deps.VerificationHandler)
	endorsementHttp.RegisterRoutes(api, deps.EndorsementHandler)
	referralHttp.RegisterRoutes(api, deps.ReferralHandler)
	eventHttp.RegisterRoutes(api, deps.EventHandler)
	organizationHttp.RegisterRoutes(api, deps.OrganizationHandler)
	unifiedSearchHttp.RegisterRoutes(api, deps.UnifiedSearchHandler)

	mobileGroup := mobileHttp.RegisterRoutes(api, deps.MobileHandler)
	if mobileGroup != nil {
		nativeMobileHttp.RegisterRoutes(mobileGroup, deps.NativeMobileHandler)
	}

	companionHttp.RegisterRoutes(api, deps.CompanionHandler)
	jobMatchHttp.RegisterRoutes(api, deps.JobMatchHandler)
	recruiterAIHttp.RegisterRoutes(api, deps.RecruiterAIHandler)
	marketplaceHttp.RegisterRoutes(api, deps.MarketplaceHandler)
	freelanceHttp.RegisterRoutes(api, deps.FreelanceHandler)
	enterpriseHttp.RegisterRoutes(api, deps.EnterpriseHandler)
	trustHttp.RegisterRoutes(api, deps.TrustHandler)
	complianceHttp.RegisterRoutes(api, deps.ComplianceHandler)
	intelligenceHttp.RegisterRoutes(api, deps.IntelligenceHandler)
	recommendationEngineHttp.RegisterRoutes(api, deps.RecommendationEngineHandler)
	landingHttp.RegisterRoutes(api, deps.LandingHandler, deps.NewsletterHandler,
		deps.RateLimit.NewsletterRequestsPerMinute, deps.RateLimit.NewsletterBurst)
	onboardingHttp.RegisterRoutes(api, deps.OnboardingHandler, deps.AuthMiddleware)
	profileHttp.RegisterRoutes(api, deps.ProfileHandler, deps.AuthMiddleware)
	resumeHttp.RegisterRoutes(api, deps.ResumeHandler)
	recHttp.RegisterRoutes(api, deps.RecommendationHandler)
	netHttp.RegisterRoutes(api, deps.NetworkingHandler)
	commHttp.RegisterRoutes(api, deps.CommunityHandler)
	msgHttp.RegisterRoutes(api, deps.MessagingHandler)
	notifyHttp.RegisterRoutes(api, deps.NotificationHandler)
	applicationsHttp.RegisterRoutes(api, deps.ApplicationsHandler)
	jobAlertsHttp.RegisterRoutes(api, deps.JobAlertsHandler)
	jobsHttp.RegisterRoutes(api, deps.JobsHandler)
	if deps.FileHandler != nil {
		mediaHttp.RegisterRoutes(api, deps.FileHandler)
	}
	if deps.MentorshipHandler != nil {
		mentorshipHttp.RegisterRoutes(api, deps.MentorshipHandler)
	}
	if deps.CoverLetterHandler != nil {
		coverLetterHttp.RegisterRoutes(api, deps.CoverLetterHandler)
	}
	if deps.InterviewPrepHandler != nil {
		interviewPrepHttp.RegisterRoutes(api, deps.InterviewPrepHandler)
	}
	if deps.AdminHandler != nil {
		adminHttp.RegisterRoutes(api, deps.AdminHandler, deps.AuthMiddleware)
	}
	if deps.BillingHandler != nil {
		billingHttp.RegisterBillingRoutes(api, deps.BillingHandler, deps.AuthMiddleware)
	}
	if deps.AdminBillingHandler != nil {
		billingHttp.RegisterAdminBillingRoutes(api, deps.AdminBillingHandler, deps.AuthMiddleware)
	}
	if deps.LegalHandler != nil {
		legalHttp.RegisterLegalRoutes(api, deps.LegalHandler)
	}
	if deps.AdminLegalHandler != nil {
		legalHttp.RegisterAdminLegalRoutes(api, deps.AdminLegalHandler, deps.AuthMiddleware)
	}
	if deps.SecurityHandler != nil {
		securityHttp.RegisterSecurityRoutes(api, deps.SecurityHandler)
	}
	if deps.AdminSecurityHandler != nil {
		securityHttp.RegisterAdminSecurityRoutes(api, deps.AdminSecurityHandler, deps.AuthMiddleware)
	}
	if deps.SupportHandler != nil {
		supportHttp.RegisterPublicHelpRoutes(api, deps.SupportHandler)
		supportHttp.RegisterSupportRoutes(api, deps.SupportHandler)
	}
	if deps.AdminSupportHandler != nil {
		supportHttp.RegisterAdminSupportRoutes(api, deps.AdminSupportHandler, deps.AuthMiddleware)
	}
	if deps.AdminBackupHandler != nil {
		backupHttp.RegisterAdminBackupRoutes(api, deps.AdminBackupHandler, deps.AuthMiddleware)
	}
	if deps.DataOperationsHandler != nil {
		dataOpsHttp.RegisterUserRoutes(api, deps.DataOperationsHandler, deps.AuthMiddleware)
		dataOpsHttp.RegisterAdminRoutes(api, deps.DataOperationsHandler, deps.AuthMiddleware)
	}
	if deps.SystemHealthHandler != nil {
		sysHealthHttp.RegisterPublicHealthRoutes(engine, deps.SystemHealthHandler)
		sysHealthHttp.RegisterAdminHealthRoutes(api, deps.SystemHealthHandler, deps.AuthMiddleware)
	}
	if deps.TrustSafetyHandler != nil {
		trustHttp.RegisterSafetyRoutes(api, deps.TrustSafetyHandler)
	}
	if deps.AdminTrustSafetyHandler != nil {
		trustHttp.RegisterAdminSafetyRoutes(api, deps.AdminTrustSafetyHandler, deps.AuthMiddleware)
	}
}
