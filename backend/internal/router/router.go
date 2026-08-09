package router

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"

	aiHttp "kirmya/internal/ai/delivery/http"
	jobMatchHttp "kirmya/internal/ai_job_match/delivery/http"
	analyticsHttp "kirmya/internal/analytics/delivery/http"
	applicationsHttp "kirmya/internal/applications/delivery/http"
	assessmentHttp "kirmya/internal/assessment/delivery/http"
	authHttp "kirmya/internal/auth/delivery/http"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	candidateSearchHttp "kirmya/internal/candidate_search/delivery/http"
	careerAIHttp "kirmya/internal/career_ai/delivery/http"
	companionHttp "kirmya/internal/career_companion/delivery/http"
	commHttp "kirmya/internal/community/delivery/http"
	companyHttp "kirmya/internal/company/delivery/http"
	complianceHttp "kirmya/internal/compliance/delivery/http"
	coverLetterHttp "kirmya/internal/cover_letter/delivery/http"
	endorsementHttp "kirmya/internal/endorsement/delivery/http"
	enterpriseHttp "kirmya/internal/enterprise_hiring/delivery/http"
	eventHttp "kirmya/internal/event/delivery/http"
	freelanceHttp "kirmya/internal/freelance/delivery/http"
	marketplaceHttp "kirmya/internal/global_marketplace/delivery/http"
	interviewHttp "kirmya/internal/interview/delivery/http"
	interviewPrepHttp "kirmya/internal/interview_prep/delivery/http"
	jobAlertsHttp "kirmya/internal/job_alerts/delivery/http"
	landingHttp "kirmya/internal/landing/delivery/http"
	learningHttp "kirmya/internal/learning/delivery/http"
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
	recruiterAIHttp "kirmya/internal/recruiter_ai/delivery/http"
	referralHttp "kirmya/internal/referral/delivery/http"
	resumeHttp "kirmya/internal/resume/delivery/http"
	resumeAnalysisHttp "kirmya/internal/resume_analysis/delivery/http"
	unifiedSearchHttp "kirmya/internal/search/delivery/http"
	"kirmya/internal/shared/middleware"
	trustHttp "kirmya/internal/trust_safety/delivery/http"
	verificationHttp "kirmya/internal/verification/delivery/http"
	intelligenceHttp "kirmya/internal/workforce_intelligence/delivery/http"
)

type RouterDependencies struct {
	// AllowedOrigins are the browser origins that may call the API with
	// credentials, from config.CORSAllowedOrigins. Empty allows none.
	AllowedOrigins []string

	// TrustedProxies are the proxy addresses whose X-Forwarded-For header may
	// be believed. Empty trusts none, so the rate limiter keys on the real peer
	// address instead of one the caller can forge.
	TrustedProxies []string

	// RateLimit caps requests per client IP across the whole API. A zero
	// RequestsPerMinute disables it.
	RateLimit RateLimitConfig

	// Metrics gates the Prometheus exposition endpoint.
	Metrics MetricsConfig

	AuthMiddleware              *authMiddlewarePkg.AuthMiddleware
	AuthHandler                 *authHttp.AuthHandler
	ProfileHandler              *profileHttp.ProfileHandler
	ResumeHandler               *resumeHttp.ResumeHandler
	RecommendationHandler       *recHttp.RecommendationHandler
	NetworkingHandler           *netHttp.NetworkingHandler
	CommunityHandler            *commHttp.CommunityHandler
	MessagingHandler            *msgHttp.MessagingHandler
	NotificationHandler         *notifyHttp.NotificationHandler
	AnalyticsHandler            *analyticsHttp.AnalyticsHandler
	AIHandler                   *aiHttp.AIHandler
	CompanyHandler              *companyHttp.CompanyHandler
	CompanyManagementHandler    *companyHttp.ManagementHandler
	RecruiterHandler            *recruiterHttp.RecruiterHandler
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
	OnboardingHandler           *onboardingHttp.OnboardingHandler
	ApplicationsHandler         *applicationsHttp.ApplicationsHandler
	JobAlertsHandler            *jobAlertsHttp.JobAlertsHandler
	CoverLetterHandler          *coverLetterHttp.CoverLetterHandler
	InterviewPrepHandler        *interviewPrepHttp.InterviewPrepHandler
}

type Handlers = RouterDependencies

// RateLimitConfig describes the per-client-IP budget applied to every API
// route. Burst is the number of requests allowed back to back before the
// sustained rate takes over, which has to cover the parallel calls a single
// page load fires.
type RateLimitConfig struct {
	RequestsPerMinute float64
	Burst             float64
}

func New(deps RouterDependencies, cfg SwaggerConfig) *gin.Engine {
	engine := gin.Default()
	// Gin trusts every proxy by default, which would let any caller set
	// X-Forwarded-For and appear as a new client to the rate limiter. Trust
	// only the addresses the operator names.
	if err := engine.SetTrustedProxies(deps.TrustedProxies); err != nil {
		slog.Error("Invalid TRUSTED_PROXIES entry; trusting no proxy", slog.String("error", err.Error()))
		_ = engine.SetTrustedProxies(nil)
	}
	// Engine-level so they also cover /swagger and the 404 chain, and so CORS
	// preflights on paths with no OPTIONS handler are answered instead of
	// falling through to a 404 the browser reports as a CORS failure.
	engine.Use(middleware.SecurityHeaders())
	engine.Use(middleware.CORS(deps.AllowedOrigins))
	registerSwagger(engine, cfg)
	SetupRouter(engine, deps)
	return engine
}

func SetupRouter(engine *gin.Engine, deps RouterDependencies) {
	api := engine.Group("/api/v1")
	// Ahead of the rest of the chain so a flood is rejected before it costs a
	// database round trip. The stricter per-route limiter on /auth still
	// applies on top of this one.
	api.Use(middleware.RateLimiter(deps.RateLimit.RequestsPerMinute/60.0, deps.RateLimit.Burst))
	api.Use(middleware.TenantIsolationMiddleware())
	api.Use(middleware.MobileDeviceMiddleware())
	api.Use(middleware.TelemetryMiddleware())
	api.Use(middleware.GzipCompressionMiddleware())
	api.Use(middleware.TimeoutMiddleware(5 * time.Second))

	// Prometheus Metrics Exposition Endpoint, closed to the public internet.
	api.GET("/metrics", metricsGuard(deps.Metrics), metricsHandler())

	// Module-based Route Registration
	authHttp.RegisterRoutes(api, deps.AuthHandler, deps.AuthMiddleware)
	analyticsHttp.RegisterRoutes(api, deps.AnalyticsHandler)
	aiHttp.RegisterRoutes(api, deps.AIHandler)
	companyHttp.RegisterRoutes(api, deps.CompanyHandler, deps.CompanyManagementHandler, deps.AuthMiddleware)
	recruiterHttp.RegisterRoutes(api, deps.RecruiterHandler, deps.UnifiedSearchHandler)
	candidateSearchHttp.RegisterRoutes(api, deps.CandidateSearchHandler)
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
	landingHttp.RegisterRoutes(api, deps.LandingHandler)
	onboardingHttp.RegisterRoutes(api, deps.OnboardingHandler, deps.AuthMiddleware)
	profileHttp.RegisterRoutes(api, deps.ProfileHandler)
	resumeHttp.RegisterRoutes(api, deps.ResumeHandler)
	recHttp.RegisterRoutes(api, deps.RecommendationHandler)
	netHttp.RegisterRoutes(api, deps.NetworkingHandler)
	commHttp.RegisterRoutes(api, deps.CommunityHandler)
	msgHttp.RegisterRoutes(api, deps.MessagingHandler)
	notifyHttp.RegisterRoutes(api, deps.NotificationHandler)
	applicationsHttp.RegisterRoutes(api, deps.ApplicationsHandler)
	jobAlertsHttp.RegisterRoutes(api, deps.JobAlertsHandler)
	if deps.CoverLetterHandler != nil {
		coverLetterHttp.RegisterRoutes(api, deps.CoverLetterHandler)
	}
	if deps.InterviewPrepHandler != nil {
		interviewPrepHttp.RegisterRoutes(api, deps.InterviewPrepHandler)
	}
}
