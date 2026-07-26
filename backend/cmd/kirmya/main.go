package main

import (
	"net/http"

	profileHttp "kirmya/internal/profile/delivery/http"
	profileRepo "kirmya/internal/profile/repository"
	profileSvc "kirmya/internal/profile/service"

	resumeHttp "kirmya/internal/resume/delivery/http"
	resumeRepo "kirmya/internal/resume/repository"
	resumeSvc "kirmya/internal/resume/service"

	recHttp "kirmya/internal/recommendation/delivery/http"
	recRepo "kirmya/internal/recommendation/repository"
	recSvc "kirmya/internal/recommendation/service"

	netHttp "kirmya/internal/networking/delivery/http"
	netRepo "kirmya/internal/networking/repository"
	netSvc "kirmya/internal/networking/service"

	commHttp "kirmya/internal/community/delivery/http"
	commRepo "kirmya/internal/community/repository"
	commSvc "kirmya/internal/community/service"

	msgHttp "kirmya/internal/messaging/delivery/http"
	msgRepo "kirmya/internal/messaging/repository"
	msgSvc "kirmya/internal/messaging/service"
	"kirmya/internal/messaging/pubsub"

	notifyHttp "kirmya/internal/notification/delivery/http"
	notifyRepo "kirmya/internal/notification/repository"
	notifySvc "kirmya/internal/notification/service"

	authHttp "kirmya/internal/auth/delivery/http"
	authRepo "kirmya/internal/auth/repository"
	authSvc "kirmya/internal/auth/service"

	analyticsHttp "kirmya/internal/analytics/delivery/http"
	analyticsRepo "kirmya/internal/analytics/repository"
	analyticsSvc "kirmya/internal/analytics/service"

	aiHttp "kirmya/internal/ai/delivery/http"
	aiProvider "kirmya/internal/ai/provider"
	aiRepo "kirmya/internal/ai/repository"
	aiSvc "kirmya/internal/ai/service"

	companyHttp "kirmya/internal/company/delivery/http"
	companyRepo "kirmya/internal/company/repository"
	companySvc "kirmya/internal/company/service"

	recruiterHttp "kirmya/internal/recruiter/delivery/http"
	recruiterRepo "kirmya/internal/recruiter/repository"
	recruiterSvc "kirmya/internal/recruiter/service"

	searchHttp "kirmya/internal/candidate_search/delivery/http"
	searchRepo "kirmya/internal/candidate_search/repository"
	searchSvc "kirmya/internal/candidate_search/service"

	interviewHttp "kirmya/internal/interview/delivery/http"
	interviewRepo "kirmya/internal/interview/repository"
	interviewSvc "kirmya/internal/interview/service"

	learningHttp "kirmya/internal/learning/delivery/http"
	learningProvider "kirmya/internal/learning/provider"
	learningRepo "kirmya/internal/learning/repository"
	learningSvc "kirmya/internal/learning/service"

	assessmentHttp "kirmya/internal/assessment/delivery/http"
	assessmentEval "kirmya/internal/assessment/evaluator"
	assessmentRepo "kirmya/internal/assessment/repository"
	assessmentSvc "kirmya/internal/assessment/service"

	careerAIHttp "kirmya/internal/career_ai/delivery/http"
	careerAIPrompts "kirmya/internal/career_ai/prompts"
	careerAIProvider "kirmya/internal/career_ai/provider"
	careerAIRepo "kirmya/internal/career_ai/repository"
	careerAISvc "kirmya/internal/career_ai/service"

	resumeAnalysisHttp "kirmya/internal/resume_analysis/delivery/http"
	resumeAnalysisProvider "kirmya/internal/resume_analysis/provider"
	resumeAnalysisRepo "kirmya/internal/resume_analysis/repository"
	resumeAnalysisSvc "kirmya/internal/resume_analysis/service"

	verificationHttp "kirmya/internal/verification/delivery/http"
	verificationRepo "kirmya/internal/verification/repository"
	verificationSvc "kirmya/internal/verification/service"

	endorsementHttp "kirmya/internal/endorsement/delivery/http"
	endorsementRepo "kirmya/internal/endorsement/repository"
	endorsementSvc "kirmya/internal/endorsement/service"

	referralHttp "kirmya/internal/referral/delivery/http"
	referralRepo "kirmya/internal/referral/repository"
	referralSvc "kirmya/internal/referral/service"

	eventHttp "kirmya/internal/event/delivery/http"
	eventProvider "kirmya/internal/event/provider"
	eventRepo "kirmya/internal/event/repository"
	eventSvc "kirmya/internal/event/service"

	organizationHttp "kirmya/internal/organization/delivery/http"
	organizationRepo "kirmya/internal/organization/repository"
	organizationSvc "kirmya/internal/organization/service"

	unifiedSearchAdapter "kirmya/internal/search/adapter"
	unifiedSearchHttp "kirmya/internal/search/delivery/http"
	unifiedSearchRepo "kirmya/internal/search/repository"
	unifiedSearchSvc "kirmya/internal/search/service"

	mobileHttp "kirmya/internal/mobile/delivery/http"
	mobileRepo "kirmya/internal/mobile/repository"
	mobileSvc "kirmya/internal/mobile/service"

	companionHttp "kirmya/internal/career_companion/delivery/http"
	companionPrompt "kirmya/internal/career_companion/prompt"
	companionProvider "kirmya/internal/career_companion/provider"
	companionRepo "kirmya/internal/career_companion/repository"
	companionSvc "kirmya/internal/career_companion/service"

	jobMatchHttp "kirmya/internal/ai_job_match/delivery/http"
	jobMatchRepo "kirmya/internal/ai_job_match/repository"
	jobMatchScoring "kirmya/internal/ai_job_match/scoring"
	jobMatchSvc "kirmya/internal/ai_job_match/service"

	recruiterAIHttp "kirmya/internal/recruiter_ai/delivery/http"
	recruiterAIRepo "kirmya/internal/recruiter_ai/repository"
	recruiterAISvc "kirmya/internal/recruiter_ai/service"

	nativeMobileHttp "kirmya/internal/native_mobile/delivery/http"
	nativeMobileProvider "kirmya/internal/native_mobile/provider"
	nativeMobileRepo "kirmya/internal/native_mobile/repository"
	nativeMobileSvc "kirmya/internal/native_mobile/service"

	marketplaceHttp "kirmya/internal/global_marketplace/delivery/http"
	marketplaceRepo "kirmya/internal/global_marketplace/repository"
	marketplaceSvc "kirmya/internal/global_marketplace/service"

	freelanceHttp "kirmya/internal/freelance/delivery/http"
	freelanceRepo "kirmya/internal/freelance/repository"
	freelanceSvc "kirmya/internal/freelance/service"

	enterpriseHttp "kirmya/internal/enterprise_hiring/delivery/http"
	enterpriseRepo "kirmya/internal/enterprise_hiring/repository"
	enterpriseSvc "kirmya/internal/enterprise_hiring/service"

	trustHttp "kirmya/internal/trust_safety/delivery/http"
	trustRepo "kirmya/internal/trust_safety/repository"
	trustSvc "kirmya/internal/trust_safety/service"

	complianceHttp "kirmya/internal/compliance/delivery/http"
	complianceRepo "kirmya/internal/compliance/repository"
	complianceSvc "kirmya/internal/compliance/service"

	intelligenceHttp "kirmya/internal/workforce_intelligence/delivery/http"
	intelligenceRepo "kirmya/internal/workforce_intelligence/repository"
	intelligenceSvc "kirmya/internal/workforce_intelligence/service"

	recommendationHttp "kirmya/internal/recommendation_engine/delivery/http"
	recommendationRepo "kirmya/internal/recommendation_engine/repository"
	recommendationSvc "kirmya/internal/recommendation_engine/service"

	telemetryPkg "kirmya/internal/shared/telemetry"

	"kirmya/internal/shared/cache"
	"kirmya/internal/shared/database"
	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"log/slog"
	"os"
)

func main() {
	// Setup structured JSON logger for production scale
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	slog.Info("Starting Kirmya backend modular monolith...")

	// 1. Initialize Database pool
	db, err := database.Connect()
	if err != nil {
		slog.Warn("Database connection failed (running in offline/mock mode for test support)", slog.String("error", err.Error()))
	} else {
		defer db.Close()
	}

	// 2. Setup Gin engine
	r := gin.New()
	r.Use(gin.Recovery())
	
	// Apply structured logger and security headers globally
	r.Use(middleware.StructuredLogger())
	r.Use(middleware.SecurityHeaders())

	// 3. Register CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// 4. Initialize module dependencies if DB is available
	var dbPool *pgxpool.Pool
	if db != nil {
		dbPool = db.Pool
	}

	pRepo := profileRepo.NewProfileRepository(dbPool)
	pService := profileSvc.NewProfileService(pRepo)
	pHandler := profileHttp.NewProfileHandler(pService)

	rRepo := resumeRepo.NewResumeRepository(dbPool)
	rService := resumeSvc.NewResumeService(rRepo)
	rHandler := resumeHttp.NewResumeHandler(rService)

	recRepository := recRepo.NewRecommendationRepository(dbPool)
	recService := recSvc.NewRecommendationService(recRepository, pRepo)
	recHandler := recHttp.NewRecommendationHandler(recService)

	netRepository := netRepo.NewNetworkingRepository(dbPool)
	netService := netSvc.NewNetworkingService(netRepository, pRepo)
	netHandler := netHttp.NewNetworkingHandler(netService)

	commRepository := commRepo.NewCommunityRepository(dbPool)
	commService := commSvc.NewCommunityService(commRepository)
	commHandler := commHttp.NewCommunityHandler(commService)

	msgRepository := msgRepo.NewMessagingRepository(dbPool)
	psBroker := pubsub.NewInMemoryPubSub()
	msgService := msgSvc.NewMessagingService(msgRepository, psBroker)
	msgHandler := msgHttp.NewMessagingHandler(msgService)

	notifyRepository := notifyRepo.NewNotificationRepository(dbPool)
	notifyService := notifySvc.NewNotificationService(notifyRepository, psBroker)
	notifyHandler := notifyHttp.NewNotificationHandler(notifyService)

	authRepository := authRepo.NewAuthRepository(dbPool)
	authService := authSvc.NewAuthService(authRepository)
	authHandler := authHttp.NewAuthHandler(authService)

	analyticsRepository := analyticsRepo.NewAnalyticsRepository(dbPool)
	analyticsService := analyticsSvc.NewAnalyticsService(analyticsRepository)
	analyticsHandler := analyticsHttp.NewAnalyticsHandler(analyticsService)

	aiRepository := aiRepo.NewAIRepository(dbPool)
	mockAIProvider := aiProvider.NewMockAIProvider()
	aiService := aiSvc.NewAIService(aiRepository, mockAIProvider)
	aiHandler := aiHttp.NewAIHandler(aiService)

	companyRepository := companyRepo.NewCompanyRepository(dbPool)
	companyService := companySvc.NewCompanyService(companyRepository)
	companyHandler := companyHttp.NewCompanyHandler(companyService)

	recruiterRepository := recruiterRepo.NewRecruiterRepository(dbPool)
	recruiterService := recruiterSvc.NewRecruiterServiceWithRepo(recruiterRepository)
	recruiterHandler := recruiterHttp.NewRecruiterHandler(recruiterService)

	postgresSearchProvider := searchSvc.NewPostgresSearchProvider(dbPool)
	searchRepository := searchRepo.NewSearchRepository(dbPool)
	searchService := searchSvc.NewSearchService(postgresSearchProvider, searchRepository, recruiterRepository)
	searchHandler := searchHttp.NewSearchHandler(searchService)

	interviewRepository := interviewRepo.NewInterviewRepository(dbPool)
	interviewService := interviewSvc.NewInterviewService(interviewRepository, psBroker)
	interviewHandler := interviewHttp.NewInterviewHandler(interviewService)

	learningRepository := learningRepo.NewLearningRepository(dbPool)
	courseraProv := learningProvider.NewCourseraProvider("mock-coursera-key")
	udemyProv := learningProvider.NewUdemyProvider("mock-udemy-id", "mock-udemy-secret")
	learningService := learningSvc.NewLearningService(learningRepository, courseraProv, udemyProv)
	learningHandler := learningHttp.NewLearningHandler(learningService)

	assessmentRepository := assessmentRepo.NewAssessmentRepository(dbPool)
	aiEvaluator := assessmentEval.NewMockLLMAIEvaluator()
	assessmentService := assessmentSvc.NewAssessmentService(assessmentRepository, aiEvaluator)
	assessmentHandler := assessmentHttp.NewAssessmentHandler(assessmentService)

	careerAIRepository := careerAIRepo.NewCareerAIRepository(dbPool)
	careerAIProv := careerAIProvider.NewMockCareerAIProvider()
	promptMgr := careerAIPrompts.NewPromptManager()
	careerAIService := careerAISvc.NewCareerAIService(careerAIRepository, careerAIProv, promptMgr)
	careerAIHandler := careerAIHttp.NewCareerAIHandler(careerAIService)

	resumeAnalysisRepository := resumeAnalysisRepo.NewResumeAnalysisRepository(dbPool)
	aiResumeProv := resumeAnalysisProvider.NewMockResumeAIProvider()
	resumeAnalysisService := resumeAnalysisSvc.NewResumeAnalysisService(resumeAnalysisRepository, aiResumeProv)
	resumeAnalysisHandler := resumeAnalysisHttp.NewResumeAnalysisHandler(resumeAnalysisService)

	verificationRepository := verificationRepo.NewVerificationRepository(dbPool)
	verificationService := verificationSvc.NewVerificationService(verificationRepository)
	verificationHandler := verificationHttp.NewVerificationHandler(verificationService)

	endorsementRepository := endorsementRepo.NewEndorsementRepository(dbPool)
	endorsementService := endorsementSvc.NewEndorsementService(endorsementRepository)
	endorsementHandler := endorsementHttp.NewEndorsementHandler(endorsementService)

	referralRepository := referralRepo.NewReferralRepository(dbPool)
	referralService := referralSvc.NewReferralService(referralRepository)
	referralHandler := referralHttp.NewReferralHandler(referralService)

	eventRepository := eventRepo.NewEventRepository(dbPool)
	liveStreamProv := eventProvider.NewMockStreamAdapter()
	eventService := eventSvc.NewEventService(eventRepository, liveStreamProv)
	eventHandler := eventHttp.NewEventHandler(eventService)

	organizationRepository := organizationRepo.NewOrganizationRepository(dbPool)
	organizationService := organizationSvc.NewOrganizationService(organizationRepository)
	organizationHandler := organizationHttp.NewOrganizationHandler(organizationService)

	unifiedSearchRepository := unifiedSearchRepo.NewSearchRepository(dbPool)
	unifiedSearchEngineAdapter := unifiedSearchAdapter.NewPostgreSQLSearchAdapter(dbPool)
	unifiedSearchService := unifiedSearchSvc.NewSearchService(unifiedSearchRepository, unifiedSearchEngineAdapter)
	unifiedSearchHandler := unifiedSearchHttp.NewSearchHandler(unifiedSearchService)

	mobileRepository := mobileRepo.NewMobileRepository(dbPool)
	mobileService := mobileSvc.NewMobileService(mobileRepository)
	mobileHandler := mobileHttp.NewMobileHandler(mobileService)

	companionRepository := companionRepo.NewCompanionRepository(dbPool)
	companionAIProvider := companionProvider.NewMockCareerAIProvider()
	companionPromptMgr := companionPrompt.NewPromptManager()
	companionService := companionSvc.NewCompanionService(companionRepository, companionAIProvider, companionPromptMgr)
	companionHandler := companionHttp.NewCompanionHandler(companionService)

	jobMatchRepository := jobMatchRepo.NewMatchingRepository(dbPool)
	jobMatchModel := jobMatchScoring.NewMatchingModel()
	jobMatchService := jobMatchSvc.NewMatchingService(jobMatchRepository, jobMatchModel)
	jobMatchHandler := jobMatchHttp.NewMatchingHandler(jobMatchService)

	recruiterAIRepository := recruiterAIRepo.NewRecruiterAIRepository(dbPool)
	recruiterAIService := recruiterAISvc.NewRecruiterAIService(recruiterAIRepository)
	recruiterAIHandler := recruiterAIHttp.NewRecruiterAIHandler(recruiterAIService)

	nativeMobileRepository := nativeMobileRepo.NewNativeMobileRepository(dbPool)
	nativePushProvider := nativeMobileProvider.NewMockPushNotificationProvider()
	nativeMobileService := nativeMobileSvc.NewNativeMobileService(nativeMobileRepository, nativePushProvider)
	nativeMobileHandler := nativeMobileHttp.NewNativeMobileHandler(nativeMobileService)

	marketplaceRepository := marketplaceRepo.NewMarketplaceRepository(dbPool)
	marketplaceService := marketplaceSvc.NewMarketplaceService(marketplaceRepository)
	marketplaceHandler := marketplaceHttp.NewMarketplaceHandler(marketplaceService)

	freelanceRepository := freelanceRepo.NewFreelanceRepository(dbPool)
	freelanceService := freelanceSvc.NewFreelanceService(freelanceRepository)
	freelanceHandler := freelanceHttp.NewFreelanceHandler(freelanceService)

	enterpriseRepository := enterpriseRepo.NewEnterpriseRepository(dbPool)
	enterpriseService := enterpriseSvc.NewEnterpriseService(enterpriseRepository)
	enterpriseHandler := enterpriseHttp.NewEnterpriseHandler(enterpriseService)

	trustRepository := trustRepo.NewTrustRepository(dbPool)
	trustService := trustSvc.NewTrustService(trustRepository)
	trustHandler := trustHttp.NewTrustHandler(trustService)

	complianceRepository := complianceRepo.NewComplianceRepository(dbPool)
	complianceService := complianceSvc.NewComplianceService(complianceRepository)
	complianceHandler := complianceHttp.NewComplianceHandler(complianceService)

	intelligenceRepository := intelligenceRepo.NewIntelligenceRepository(dbPool)
	intelligenceService := intelligenceSvc.NewIntelligenceService(intelligenceRepository)
	intelligenceHandler := intelligenceHttp.NewIntelligenceHandler(intelligenceService)

	recommendationRepository := recommendationRepo.NewRecommendationRepository(dbPool)
	recommendationService := recommendationSvc.NewRecommendationService(recommendationRepository)
	recommendationHandler := recommendationHttp.NewRecommendationHandler(recommendationService)

	// Initialize cache layer (attempts Redis, fallbacks to in-memory)
	var appCache cache.Cache
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost:6379"
	}
	redisPassword := os.Getenv("REDIS_PASSWORD")

	rCache, err := cache.NewRedisCache(redisHost, redisPassword)
	if err != nil {
		slog.Warn("Redis connection failed. Utilizing in-memory cache fallback.", slog.String("error", err.Error()))
		appCache = cache.NewInMemoryCache()
	} else {
		slog.Info("Successfully connected to Redis cache cluster.", slog.String("host", redisHost))
		appCache = rCache
	}
	_ = appCache // Available for global cache-aside usage across modules

	// 5. Register Routes
	api := r.Group("/api/v1")
	api.Use(middleware.TenantIsolationMiddleware())
	api.Use(middleware.MobileDeviceMiddleware())
	api.Use(middleware.TelemetryMiddleware())
	{
		// Prometheus Metrics Exposition Endpoint
		api.GET("/metrics", func(c *gin.Context) {
			collector := telemetryPkg.GetGlobalCollector()
			c.String(http.StatusOK, collector.GetPrometheusMetrics())
		})

		// Auth routes (rate-limited, no auth required)
		authGroup := api.Group("/auth")
		authGroup.Use(middleware.RateLimiter(5.0/60.0, 5.0)) // 5 requests per minute limit
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/refresh", authHandler.Refresh)
			authGroup.POST("/logout", authHandler.Logout)
		}

		// Analytics routes protected by Auth
		analytics := api.Group("/analytics")
		analytics.Use(middleware.AuthRequired())
		{
			analytics.POST("/events", analyticsHandler.TrackEvent)
			analytics.GET("/admin", analyticsHandler.GetAdminAnalytics)
			analytics.GET("/recruiter", analyticsHandler.GetRecruiterAnalytics)
			analytics.GET("/user", analyticsHandler.GetUserAnalytics)
		}

		// AI routes protected by Auth
		aiGroup := api.Group("/ai")
		aiGroup.Use(middleware.AuthRequired())
		{
			aiGroup.GET("/preferences", aiHandler.GetPreferences)
			aiGroup.PUT("/preferences", aiHandler.UpdatePreferences)
			aiGroup.POST("/resume-analysis", aiHandler.AnalyzeResume)
			aiGroup.POST("/skill-gap", aiHandler.AnalyzeSkillGap)
			aiGroup.POST("/job-matching", aiHandler.MatchJob)
			aiGroup.POST("/interview-prep", aiHandler.PrepareInterview)
			aiGroup.POST("/career-suggestions", aiHandler.SuggestCareer)
		}

		// Company routes (some public, some protected)
		companiesGroup := api.Group("/companies")
		{
			companiesGroup.GET("", companyHandler.SearchCompanies)
			companiesGroup.GET("/recommendations", companyHandler.GetRecommendations)
			companiesGroup.GET("/handle/:handle", companyHandler.GetByHandle)

			companiesGroup.Use(middleware.AuthRequired())
			{
				companiesGroup.POST("", companyHandler.RegisterCompany)
				companiesGroup.PUT("/:id", companyHandler.UpdateProfile)
				companiesGroup.POST("/:id/follow", companyHandler.FollowCompany)
				companiesGroup.POST("/:id/verify", companyHandler.RequestVerification)
				companiesGroup.PUT("/verify/:requestId", companyHandler.UpdateVerificationStatus)
			}
		}

		// Recruiter routes protected by Auth
		recruiterGroup := api.Group("/recruiter")
		recruiterGroup.Use(middleware.AuthRequired())
		{
			recruiterGroup.GET("/profile", recruiterHandler.GetProfile)
			recruiterGroup.POST("/jobs", recruiterHandler.CreateJob)
			recruiterGroup.GET("/jobs", recruiterHandler.GetJobs)
			recruiterGroup.GET("/pipeline/:jobId", recruiterHandler.GetPipeline)
			recruiterGroup.PUT("/pipeline/:id", recruiterHandler.UpdatePipelineStage)
			recruiterGroup.GET("/analytics", recruiterHandler.GetAnalytics)
		}

		// Candidate Search routes protected by Auth
		searchGroup := api.Group("/search")
		searchGroup.Use(middleware.AuthRequired())
		{
			searchGroup.POST("/candidates", searchHandler.SearchCandidates)
			searchGroup.GET("/history", searchHandler.GetHistory)
			searchGroup.POST("/saved", searchHandler.SaveCandidate)
			searchGroup.GET("/saved", searchHandler.GetSavedCandidates)
			searchGroup.DELETE("/saved/:id", searchHandler.RemoveSavedCandidate)
			searchGroup.POST("/notes", searchHandler.AddNote)
			searchGroup.GET("/notes/:candidateId", searchHandler.GetNotes)
			searchGroup.POST("/contact", searchHandler.ContactCandidate)
		}

		// Interview Management routes protected by Auth
		interviewsGroup := api.Group("/interviews")
		interviewsGroup.Use(middleware.AuthRequired())
		{
			interviewsGroup.POST("", interviewHandler.ScheduleInterview)
			interviewsGroup.GET("", interviewHandler.ListInterviews)
			interviewsGroup.GET("/reminders", interviewHandler.GetReminders)
			interviewsGroup.POST("/availability", interviewHandler.SetAvailability)
			interviewsGroup.GET("/availability/:candidateId", interviewHandler.GetCandidateAvailability)
			interviewsGroup.GET("/:id", interviewHandler.GetInterview)
			interviewsGroup.PUT("/:id/status", interviewHandler.UpdateInterviewStatus)
			interviewsGroup.POST("/:id/rounds", interviewHandler.AddRound)
			interviewsGroup.PUT("/rounds/:roundId/status", interviewHandler.UpdateRoundStatus)
			interviewsGroup.POST("/rounds/:roundId/feedback", interviewHandler.SubmitFeedback)
			interviewsGroup.GET("/rounds/:roundId/feedback", interviewHandler.GetRoundFeedback)
		}

		// Kirmya Learning Hub routes protected by Auth
		learningGroup := api.Group("/learning")
		learningGroup.Use(middleware.AuthRequired())
		{
			learningGroup.GET("/courses", learningHandler.GetCourses)
			learningGroup.GET("/courses/:id", learningHandler.GetCourseByID)
			learningGroup.GET("/paths", learningHandler.GetLearningPaths)
			learningGroup.POST("/enroll", learningHandler.Enroll)
			learningGroup.POST("/progress", learningHandler.UpdateProgress)
			learningGroup.GET("/progress", learningHandler.GetUserProgress)
			learningGroup.GET("/certificates", learningHandler.GetCertificates)
			learningGroup.POST("/assessment", learningHandler.SubmitSkillAssessment)
		}

		// Professional Skill Assessment System routes protected by Auth
		assessmentsGroup := api.Group("/assessments")
		assessmentsGroup.Use(middleware.AuthRequired())
		{
			assessmentsGroup.GET("", assessmentHandler.GetAssessments)
			assessmentsGroup.GET("/results", assessmentHandler.GetUserResults)
			assessmentsGroup.GET("/badges", assessmentHandler.GetUserBadges)
			assessmentsGroup.GET("/:id", assessmentHandler.GetAssessmentByID)
			assessmentsGroup.POST("/:id/submit", assessmentHandler.SubmitAssessment)
		}

		// AI Career Assistant routes protected by Auth
		careerAIGroup := api.Group("/career-ai")
		careerAIGroup.Use(middleware.AuthRequired())
		{
			careerAIGroup.POST("/recommendations", careerAIHandler.GenerateCareerAdvice)
			careerAIGroup.POST("/resume-feedback", careerAIHandler.AnalyzeResume)
			careerAIGroup.POST("/skill-gap", careerAIHandler.IdentifySkillGaps)
			careerAIGroup.POST("/job-guidance", careerAIHandler.GenerateJobGuidance)
			careerAIGroup.POST("/interview-prep", careerAIHandler.GenerateInterviewPrep)
			careerAIGroup.GET("/recommendations", careerAIHandler.GetUserRecommendations)
			careerAIGroup.GET("/usage", careerAIHandler.GetUserUsage)
		}

		// AI Resume Analysis routes protected by Auth
		resumeAnalysisGroup := api.Group("/resume-analysis")
		resumeAnalysisGroup.Use(middleware.AuthRequired())
		{
			resumeAnalysisGroup.POST("/analyze", resumeAnalysisHandler.AnalyzeResume)
			resumeAnalysisGroup.GET("/history", resumeAnalysisHandler.GetUserAnalysisHistory)
			resumeAnalysisGroup.GET("/:id", resumeAnalysisHandler.GetAnalysisByID)
		}

		// Professional Verification routes protected by Auth
		verificationGroup := api.Group("/verifications")
		verificationGroup.Use(middleware.AuthRequired())
		{
			verificationGroup.POST("/requests", verificationHandler.CreateRequest)
			verificationGroup.GET("/requests", verificationHandler.GetUserRequests)
			verificationGroup.GET("/status", verificationHandler.GetStatus)
			verificationGroup.PUT("/privacy", verificationHandler.UpdatePrivacy)
			verificationGroup.POST("/documents", verificationHandler.AddDocument)
		}

		// LinkedIn-style Endorsements & Recommendations routes protected by Auth
		endorsementsGroup := api.Group("/endorsements")
		endorsementsGroup.Use(middleware.AuthRequired())
		{
			endorsementsGroup.POST("/skills", endorsementHandler.EndorseSkill)
			endorsementsGroup.GET("/skills", endorsementHandler.GetUserEndorsements)
			endorsementsGroup.POST("/recommendations", endorsementHandler.SubmitRecommendation)
			endorsementsGroup.GET("/recommendations", endorsementHandler.GetRecommendationsForUser)
			endorsementsGroup.PUT("/recommendations/:id/status", endorsementHandler.UpdateRecommendationStatus)
			endorsementsGroup.POST("/references", endorsementHandler.CreateReference)
			endorsementsGroup.GET("/references", endorsementHandler.GetUserReferences)
		}

		// Kirmya Referral Network routes protected by Auth
		referralsGroup := api.Group("/referrals")
		referralsGroup.Use(middleware.AuthRequired())
		{
			referralsGroup.POST("/requests", referralHandler.CreateRequest)
			referralsGroup.GET("/requests", referralHandler.GetOpenRequests)
			referralsGroup.POST("/offer", referralHandler.OfferReferral)
			referralsGroup.GET("/my-referrals", referralHandler.GetUserReferrals)
			referralsGroup.PUT("/:id/status", referralHandler.UpdateReferralStatus)
		}

		// Professional Networking Events routes protected by Auth
		eventsGroup := api.Group("/events")
		eventsGroup.Use(middleware.AuthRequired())
		{
			eventsGroup.GET("", eventHandler.GetEvents)
			eventsGroup.POST("", eventHandler.CreateEvent)
			eventsGroup.GET("/my-events", eventHandler.GetUserRegistrations)
			eventsGroup.GET("/:id", eventHandler.GetEventByID)
			eventsGroup.POST("/:id/register", eventHandler.RegisterAttendee)
			eventsGroup.POST("/:id/cancel", eventHandler.CancelRegistration)
		}

		// Enterprise Organization & RBAC Management routes protected by Auth
		orgGroup := api.Group("/organizations")
		orgGroup.Use(middleware.AuthRequired())
		{
			orgGroup.POST("", organizationHandler.CreateOrganization)
			orgGroup.GET("", organizationHandler.GetOrganizationsForUser)
			orgGroup.GET("/permissions", organizationHandler.GetAllPermissions)
			orgGroup.POST("/:id/members", organizationHandler.AddMember)
			orgGroup.GET("/:id/members", organizationHandler.GetOrgMembers)
		}

		// Unified Search Platform routes protected by Auth
		unifiedSearchGroup := api.Group("/search")
		unifiedSearchGroup.Use(middleware.AuthRequired())
		{
			unifiedSearchGroup.GET("", unifiedSearchHandler.Search)
			unifiedSearchGroup.GET("/suggestions", unifiedSearchHandler.GetSuggestions)
			unifiedSearchGroup.GET("/history", unifiedSearchHandler.GetUserHistory)
			unifiedSearchGroup.POST("/preferences", unifiedSearchHandler.SavePreference)
		}

		// Mobile App (Android & iOS) routes
		mobileGroup := api.Group("/mobile")
		{
			mobileGroup.GET("/config", mobileHandler.GetMobileConfig)
			mobileGroup.GET("/docs", mobileHandler.GetOpenAPIDocs)
			mobileGroup.POST("/devices", middleware.AuthRequired(), mobileHandler.RegisterDevice)
			mobileGroup.POST("/uploads/presign", middleware.AuthRequired(), mobileHandler.CreatePresignedUpload)

			// Native Mobile Infrastructure & Auth
			mobileGroup.POST("/auth/refresh", nativeMobileHandler.RefreshToken)
			mobileGroup.POST("/devices/register", middleware.AuthRequired(), nativeMobileHandler.RegisterDevice)
			mobileGroup.POST("/push/send", middleware.AuthRequired(), nativeMobileHandler.SendPushNotification)

			// Native Mobile Dedicated APIs
			userMobileGroup := mobileGroup.Group("/user")
			userMobileGroup.Use(middleware.AuthRequired())
			{
				userMobileGroup.GET("/profile", nativeMobileHandler.GetMobileUserProfile)
				userMobileGroup.GET("/jobs", nativeMobileHandler.GetMobileUserJobs)
				userMobileGroup.GET("/applications", nativeMobileHandler.GetMobileUserApplications)
				userMobileGroup.GET("/messages", nativeMobileHandler.GetMobileUserMessages)
				userMobileGroup.GET("/notifications", nativeMobileHandler.GetMobileUserNotifications)
			}
		}

		// AI Career Companion routes protected by Auth
		companionGroup := api.Group("/career-companion")
		companionGroup.Use(middleware.AuthRequired())
		{
			companionGroup.POST("/conversations", companionHandler.CreateConversation)
			companionGroup.POST("/conversations/:id/messages", companionHandler.SendMessage)
			companionGroup.GET("/conversations", companionHandler.GetUserConversations)
			companionGroup.POST("/roadmap", companionHandler.GenerateRoadmap)
			companionGroup.GET("/roadmap", companionHandler.GetLatestCareerPlan)
			companionGroup.GET("/context", companionHandler.GetUserContext)
		}

		// Advanced AI Job Matching Engine routes protected by Auth
		jobMatchGroup := api.Group("/jobs/matches")
		jobMatchGroup.Use(middleware.AuthRequired())
		{
			jobMatchGroup.GET("", jobMatchHandler.GetUserMatches)
			jobMatchGroup.GET("/:id", jobMatchHandler.GetMatchByID)
			jobMatchGroup.POST("/:id/feedback", jobMatchHandler.SubmitFeedback)
		}

		// Recruiter AI Workspace routes protected by Auth
		recruiterAIGroup := api.Group("/recruiter-ai")
		recruiterAIGroup.Use(middleware.AuthRequired())
		{
			recruiterAIGroup.POST("/rank-candidates", recruiterAIHandler.RankCandidates)
			recruiterAIGroup.POST("/interview-questions", recruiterAIHandler.GenerateInterviewQuestions)
			recruiterAIGroup.POST("/optimize-jd", recruiterAIHandler.OptimizeJobDescription)
			recruiterAIGroup.POST("/outreach-email", recruiterAIHandler.DraftOutreachEmail)
			recruiterAIGroup.GET("/sessions", recruiterAIHandler.GetRecruiterSessions)
		}

		// Global Job Marketplace Infrastructure routes
		globalGroup := api.Group("/global")
		{
			globalGroup.GET("/jobs", marketplaceHandler.SearchInternationalJobs)
			globalGroup.GET("/countries", marketplaceHandler.GetCountries)
			globalGroup.GET("/regions", marketplaceHandler.GetRegions)
			globalGroup.GET("/currencies", marketplaceHandler.GetCurrencies)
		}

		// Freelance Marketplace Subsystem routes
		freelanceGroup := api.Group("/freelance")
		{
			freelanceGroup.GET("/projects", freelanceHandler.GetProjects)
			freelanceGroup.GET("/projects/:id", freelanceHandler.GetProjectByID)
			freelanceGroup.POST("/projects", middleware.AuthRequired(), freelanceHandler.CreateProject)
			freelanceGroup.POST("/projects/:id/proposals", middleware.AuthRequired(), freelanceHandler.SubmitProposal)
			freelanceGroup.POST("/proposals/:id/accept", middleware.AuthRequired(), freelanceHandler.AcceptProposal)
			freelanceGroup.GET("/contracts", middleware.AuthRequired(), freelanceHandler.GetUserContracts)
			freelanceGroup.GET("/profile", middleware.AuthRequired(), freelanceHandler.GetProfile)
			freelanceGroup.POST("/profile", middleware.AuthRequired(), freelanceHandler.SaveProfile)
		}

		// Enterprise Hiring Solution routes protected by Auth
		enterpriseGroup := api.Group("/enterprise")
		enterpriseGroup.Use(middleware.AuthRequired())
		{
			enterpriseGroup.GET("/overview", enterpriseHandler.GetOverview)
			enterpriseGroup.GET("/teams", enterpriseHandler.GetTeams)
			enterpriseGroup.POST("/teams", enterpriseHandler.CreateTeam)
			enterpriseGroup.GET("/pools", enterpriseHandler.GetCandidatePools)
			enterpriseGroup.POST("/pools", enterpriseHandler.CreateCandidatePool)
			enterpriseGroup.GET("/audit-logs", enterpriseHandler.GetAuditLogs)
		}

		// Trust and Safety System routes
		trustGroup := api.Group("/trust")
		{
			trustGroup.POST("/reports", middleware.AuthRequired(), trustHandler.SubmitReport)
			trustGroup.GET("/reports", middleware.AuthRequired(), trustHandler.GetReports)
			trustGroup.POST("/reports/:id/action", middleware.AuthRequired(), trustHandler.ExecuteModerationAction)
			trustGroup.POST("/users/block", middleware.AuthRequired(), trustHandler.BlockUser)
			trustGroup.GET("/fraud-logs", middleware.AuthRequired(), trustHandler.GetFraudLogs)
			trustGroup.GET("/verification", middleware.AuthRequired(), trustHandler.GetBadges)
		}

		// Enterprise-Grade Compliance Framework routes protected by Auth
		complianceGroup := api.Group("/compliance")
		complianceGroup.Use(middleware.AuthRequired())
		{
			complianceGroup.POST("/consent", complianceHandler.UpdateConsent)
			complianceGroup.GET("/consent", complianceHandler.GetUserConsents)
			complianceGroup.POST("/export", complianceHandler.RequestDataExport)
			complianceGroup.POST("/delete-account", complianceHandler.RequestAccountDeletion)
			complianceGroup.GET("/requests", complianceHandler.GetUserDataRequests)
		}

		// Workforce Intelligence Platform routes
		intelligenceGroup := api.Group("/intelligence")
		{
			intelligenceGroup.GET("/market", intelligenceHandler.GetMarketInsights)
			intelligenceGroup.GET("/skills", intelligenceHandler.GetSkillTrends)
			intelligenceGroup.GET("/hiring-stats", intelligenceHandler.GetHiringStatistics)
			intelligenceGroup.GET("/user-recommendations", middleware.AuthRequired(), intelligenceHandler.GetUserCareerRecommendations)
		}

		// Upgraded Recommendation Engine routes protected by Auth
		recommendationGroup := api.Group("/recommendations")
		recommendationGroup.Use(middleware.AuthRequired())
		{
			recommendationGroup.GET("/unified", recommendationHandler.GetUnifiedRecommendations)
			recommendationGroup.POST("/events", recommendationHandler.TrackEvent)
			recommendationGroup.GET("/preferences", recommendationHandler.GetUserPreferences)
			recommendationGroup.POST("/preferences", recommendationHandler.UpdatePreferences)
		}

		// Profile paths protected by Auth
		profiles := api.Group("/profiles")
		profiles.Use(middleware.AuthRequired())
		{
			profiles.GET("/me", pHandler.GetMyProfile)
			profiles.PUT("/me", pHandler.UpdateProfile)
			profiles.POST("/me/skills", pHandler.AddSkill)
			profiles.DELETE("/me/skills/:id", pHandler.DeleteSkill)
			profiles.POST("/me/certifications", pHandler.AddCertification)
			profiles.DELETE("/me/certifications/:id", pHandler.DeleteCertification)
			profiles.POST("/me/projects", pHandler.AddProject)
			profiles.DELETE("/me/projects/:id", pHandler.DeleteProject)
			profiles.POST("/me/languages", pHandler.AddLanguage)
			profiles.DELETE("/me/languages/:id", pHandler.DeleteLanguage)
			profiles.POST("/me/achievements", pHandler.AddAchievement)
			profiles.DELETE("/me/achievements/:id", pHandler.DeleteAchievement)
			profiles.GET("/me/preferences", pHandler.GetMyPreferences)
			profiles.PUT("/me/preferences", pHandler.UpdatePreferences)
		}

		// Public endpoint (includes visibility checks inside handler)
		api.GET("/profiles/:userId", pHandler.GetPublicProfile)

		// Resume paths protected by Auth
		resumes := api.Group("/resumes")
		resumes.Use(middleware.AuthRequired())
		{
			resumes.GET("", rHandler.ListResumes)
			resumes.POST("", rHandler.CreateResume)
			resumes.GET("/:id", rHandler.GetResume)
			resumes.PUT("/:id", rHandler.UpdateResumeSections)
			resumes.DELETE("/:id", rHandler.DeleteResume)
			resumes.POST("/:id/duplicate", rHandler.DuplicateResume)
			resumes.PUT("/:id/default", rHandler.SetDefaultResume)
			resumes.GET("/:id/versions", rHandler.ListVersions)
		}

		// Recommendation paths protected by Auth
		recommendations := api.Group("/recommendations")
		recommendations.Use(middleware.AuthRequired())
		{
			recommendations.GET("", recHandler.GetRecommendations)
			recommendations.POST("/:id/feedback", recHandler.SubmitFeedback)
			recommendations.GET("/preferences", recHandler.GetPreferences)
			recommendations.PUT("/preferences", recHandler.UpdatePreferences)
		}

		// Networking paths protected by Auth
		networking := api.Group("/networking")
		networking.Use(middleware.AuthRequired())
		{
			networking.GET("/recommendations", netHandler.GetRecommendations)
			networking.GET("/connections", netHandler.ListConnections)
			networking.GET("/requests", netHandler.ListIncomingRequests)
			networking.POST("/requests", netHandler.SendRequest)
			networking.PUT("/requests/:id", netHandler.UpdateRequest)
			networking.POST("/blocks", netHandler.BlockUser)
			networking.DELETE("/blocks/:userId", netHandler.UnblockUser)
		}

		// Community paths protected by Auth
		communities := api.Group("/communities")
		communities.Use(middleware.AuthRequired())
		{
			communities.GET("", commHandler.ListCommunities)
			communities.POST("", commHandler.CreateCommunity)
			communities.POST("/:id/join", commHandler.JoinCommunity)
			communities.PUT("/:id/memberships", commHandler.ApproveMembership)
			communities.PUT("/:id/roles", commHandler.AssignRole)
			communities.POST("/:id/posts", commHandler.CreatePost)
			communities.GET("/:id/posts", commHandler.ListPosts)
			communities.DELETE("/:id/posts/:postId", commHandler.DeletePost)
			communities.POST("/reports", commHandler.ReportPost)
		}

		// Messaging paths protected by Auth
		messaging := api.Group("/messaging")
		messaging.Use(middleware.AuthRequired())
		{
			messaging.GET("/ws", msgHandler.UpgradeWS)
			messaging.GET("/conversations", msgHandler.ListConversations)
			messaging.POST("/conversations", msgHandler.GetOrCreateConversation)
			messaging.GET("/conversations/:id/messages", msgHandler.ListMessages)
			messaging.POST("/conversations/:id/messages", msgHandler.SendMessage)
		}

		// Notification paths protected by Auth
		notifications := api.Group("/notifications")
		notifications.Use(middleware.AuthRequired())
		{
			notifications.GET("", notifyHandler.ListNotifications)
			notifications.PUT("/:id/read", notifyHandler.MarkRead)
			notifications.PUT("/read-all", notifyHandler.MarkAllRead)
			notifications.GET("/preferences", notifyHandler.GetPreferences)
			notifications.PUT("/preferences", notifyHandler.UpdatePreference)
		}
	}

	slog.Info("Kirmya API Monolith active on port :8080")
	if err := r.Run(":8080"); err != nil {
		slog.Error("Failed to run HTTP server", slog.String("error", err.Error()))
		os.Exit(1)
	}
}
