// Package router owns the HTTP surface of the Kirmya monolith: global
// middleware, API versioning and the registration of every feature module's
// routes. Modules define their own paths in their routes.go; this package only
// wires them together.
package router

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	aiHttp "kirmya/internal/ai/delivery/http"
	jobMatchHttp "kirmya/internal/ai_job_match/delivery/http"
	analyticsHttp "kirmya/internal/analytics/delivery/http"
	assessmentHttp "kirmya/internal/assessment/delivery/http"
	authHttp "kirmya/internal/auth/delivery/http"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	candidateSearchHttp "kirmya/internal/candidate_search/delivery/http"
	careerAIHttp "kirmya/internal/career_ai/delivery/http"
	companionHttp "kirmya/internal/career_companion/delivery/http"
	commHttp "kirmya/internal/community/delivery/http"
	companyHttp "kirmya/internal/company/delivery/http"
	complianceHttp "kirmya/internal/compliance/delivery/http"
	endorsementHttp "kirmya/internal/endorsement/delivery/http"
	enterpriseHttp "kirmya/internal/enterprise_hiring/delivery/http"
	eventHttp "kirmya/internal/event/delivery/http"
	freelanceHttp "kirmya/internal/freelance/delivery/http"
	marketplaceHttp "kirmya/internal/global_marketplace/delivery/http"
	interviewHttp "kirmya/internal/interview/delivery/http"
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
	recommendationHttp "kirmya/internal/recommendation_engine/delivery/http"
	recruiterHttp "kirmya/internal/recruiter/delivery/http"
	recruiterAIHttp "kirmya/internal/recruiter_ai/delivery/http"
	referralHttp "kirmya/internal/referral/delivery/http"
	resumeHttp "kirmya/internal/resume/delivery/http"
	resumeAnalysisHttp "kirmya/internal/resume_analysis/delivery/http"
	searchHttp "kirmya/internal/search/delivery/http"
	trustHttp "kirmya/internal/trust_safety/delivery/http"
	verificationHttp "kirmya/internal/verification/delivery/http"
	intelligenceHttp "kirmya/internal/workforce_intelligence/delivery/http"

	"kirmya/internal/shared/middleware"
	telemetryPkg "kirmya/internal/shared/telemetry"
)

// Handlers carries the delivery-layer handlers built by main.go's dependency
// injection. Adding a module means adding a field here plus one RegisterRoutes
// call below.
type Handlers struct {
	Auth           *authHttp.AuthHandler
	AuthMiddleware *authMiddlewarePkg.AuthMiddleware

	AI                   *aiHttp.AIHandler
	Analytics            *analyticsHttp.AnalyticsHandler
	Assessment           *assessmentHttp.AssessmentHandler
	CandidateSearch      *candidateSearchHttp.SearchHandler
	CareerAI             *careerAIHttp.CareerAIHandler
	CareerCompanion      *companionHttp.CompanionHandler
	Community            *commHttp.CommunityHandler
	Company              *companyHttp.CompanyHandler
	Compliance           *complianceHttp.ComplianceHandler
	Endorsement          *endorsementHttp.EndorsementHandler
	EnterpriseHiring     *enterpriseHttp.EnterpriseHandler
	Event                *eventHttp.EventHandler
	Freelance            *freelanceHttp.FreelanceHandler
	GlobalMarketplace    *marketplaceHttp.MarketplaceHandler
	Interview            *interviewHttp.InterviewHandler
	JobMatch             *jobMatchHttp.MatchingHandler
	Landing              *landingHttp.LandingHandler
	Learning             *learningHttp.LearningHandler
	Messaging            *msgHttp.MessagingHandler
	Mobile               *mobileHttp.MobileHandler
	NativeMobile         *nativeMobileHttp.NativeMobileHandler
	Networking           *netHttp.NetworkingHandler
	Notification         *notifyHttp.NotificationHandler
	Onboarding           *onboardingHttp.OnboardingHandler
	Organization         *organizationHttp.OrganizationHandler
	Profile              *profileHttp.ProfileHandler
	Recommendation       *recHttp.RecommendationHandler
	RecommendationEngine *recommendationHttp.RecommendationHandler
	Recruiter            *recruiterHttp.RecruiterHandler
	RecruiterAI          *recruiterAIHttp.RecruiterAIHandler
	Referral             *referralHttp.ReferralHandler
	Resume               *resumeHttp.ResumeHandler
	ResumeAnalysis       *resumeAnalysisHttp.ResumeAnalysisHandler
	Search               *searchHttp.SearchHandler
	TrustSafety          *trustHttp.TrustHandler
	Verification         *verificationHttp.VerificationHandler
	WorkforceIntel       *intelligenceHttp.IntelligenceHandler
}

// New builds the Gin engine: global middleware, the /api/v1 version group and
// every module's routes.
func New(h Handlers) *gin.Engine {
	r := gin.New()

	// Global middleware
	r.Use(gin.Recovery())
	r.Use(middleware.StructuredLogger())
	r.Use(middleware.SecurityHeaders())
	r.Use(corsMiddleware())

	// API version group
	api := r.Group("/api/v1")
	api.Use(middleware.TenantIsolationMiddleware())
	api.Use(middleware.MobileDeviceMiddleware())
	api.Use(middleware.TelemetryMiddleware())
	api.Use(middleware.GzipCompressionMiddleware())
	api.Use(middleware.TimeoutMiddleware(5 * time.Second))

	api.GET("/metrics", func(c *gin.Context) {
		c.String(http.StatusOK, telemetryPkg.GetGlobalCollector().GetPrometheusMetrics())
	})

	registerModules(api, h)

	return r
}

// registerModules calls each feature module's RegisterRoutes. Modules own their
// own prefixes, methods and middleware.
func registerModules(api *gin.RouterGroup, h Handlers) {
	authHttp.RegisterRoutes(api, h.Auth, h.AuthMiddleware)
	profileHttp.RegisterRoutes(api, h.Profile)
	onboardingHttp.RegisterRoutes(api, h.Onboarding)
	resumeHttp.RegisterRoutes(api, h.Resume)
	resumeAnalysisHttp.RegisterRoutes(api, h.ResumeAnalysis)
	organizationHttp.RegisterRoutes(api, h.Organization)
	companyHttp.RegisterRoutes(api, h.Company)
	enterpriseHttp.RegisterRoutes(api, h.EnterpriseHiring)
	recruiterHttp.RegisterRoutes(api, h.Recruiter, h.Search)
	recruiterAIHttp.RegisterRoutes(api, h.RecruiterAI)
	jobMatchHttp.RegisterRoutes(api, h.JobMatch)
	freelanceHttp.RegisterRoutes(api, h.Freelance)
	marketplaceHttp.RegisterRoutes(api, h.GlobalMarketplace)
	commHttp.RegisterRoutes(api, h.Community)
	msgHttp.RegisterRoutes(api, h.Messaging)
	notifyHttp.RegisterRoutes(api, h.Notification)
	netHttp.RegisterRoutes(api, h.Networking)
	eventHttp.RegisterRoutes(api, h.Event)
	endorsementHttp.RegisterRoutes(api, h.Endorsement)
	referralHttp.RegisterRoutes(api, h.Referral)
	verificationHttp.RegisterRoutes(api, h.Verification)
	trustHttp.RegisterRoutes(api, h.TrustSafety)
	complianceHttp.RegisterRoutes(api, h.Compliance)
	analyticsHttp.RegisterRoutes(api, h.Analytics)
	intelligenceHttp.RegisterRoutes(api, h.WorkforceIntel)
	aiHttp.RegisterRoutes(api, h.AI)
	careerAIHttp.RegisterRoutes(api, h.CareerAI)
	companionHttp.RegisterRoutes(api, h.CareerCompanion)
	learningHttp.RegisterRoutes(api, h.Learning)
	assessmentHttp.RegisterRoutes(api, h.Assessment)
	interviewHttp.RegisterRoutes(api, h.Interview)
	candidateSearchHttp.RegisterRoutes(api, h.CandidateSearch)
	searchHttp.RegisterRoutes(api, h.Search)
	recHttp.RegisterRoutes(api, h.Recommendation)
	recommendationHttp.RegisterRoutes(api, h.RecommendationEngine)
	mobileHttp.RegisterRoutes(api, h.Mobile)
	nativeMobileHttp.RegisterRoutes(api, h.NativeMobile)
	landingHttp.RegisterRoutes(api, h.Landing)
}

// corsMiddleware answers preflight requests and echoes only allow-listed
// origins back to the browser.
func corsMiddleware() gin.HandlerFunc {
	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")
	if allowedOriginsEnv == "" {
		allowedOriginsEnv = os.Getenv("CORS_ALLOWED_ORIGINS")
	}
	if allowedOriginsEnv == "" {
		allowedOriginsEnv = "http://localhost:3000,http://127.0.0.1:3000"
	}
	allowedOrigins := make(map[string]bool)
	for _, origin := range strings.Split(allowedOriginsEnv, ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			allowedOrigins[origin] = true
		}
	}

	return func(c *gin.Context) {
		reqOrigin := c.GetHeader("Origin")
		if reqOrigin != "" && allowedOrigins[reqOrigin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", reqOrigin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Vary", "Origin")
		}
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
