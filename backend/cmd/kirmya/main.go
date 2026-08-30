package main

import (
	"context"
	"database/sql"
	"errors"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"

	aiHttp "kirmya/internal/ai/delivery/http"
	aiProvider "kirmya/internal/ai/provider"
	aiRepo "kirmya/internal/ai/repository"
	aiSvc "kirmya/internal/ai/service"

	jobMatchHttp "kirmya/internal/ai_job_match/delivery/http"
	jobMatchRepo "kirmya/internal/ai_job_match/repository"
	jobsHttp "kirmya/internal/jobs/delivery/http"
	jobsRepo "kirmya/internal/jobs/repository"
	jobsSvc "kirmya/internal/jobs/service"

	jobMatchScoring "kirmya/internal/ai_job_match/scoring"
	jobMatchSvc "kirmya/internal/ai_job_match/service"

	analyticsHttp "kirmya/internal/analytics/delivery/http"
	analyticsRepo "kirmya/internal/analytics/repository"
	analyticsSvc "kirmya/internal/analytics/service"

	applicationsHttp "kirmya/internal/applications/delivery/http"
	applicationsRepo "kirmya/internal/applications/repository"
	applicationsSvc "kirmya/internal/applications/service"

	assessmentHttp "kirmya/internal/assessment/delivery/http"
	assessmentEval "kirmya/internal/assessment/evaluator"
	assessmentRepo "kirmya/internal/assessment/repository"
	assessmentSvc "kirmya/internal/assessment/service"

	authHttp "kirmya/internal/auth/delivery/http"
	authMiddlewarePkg "kirmya/internal/auth/middleware"
	authRepo "kirmya/internal/auth/repository"
	authSvc "kirmya/internal/auth/service"

	candidateSearchHttp "kirmya/internal/candidate_search/delivery/http"
	candidateSearchRepo "kirmya/internal/candidate_search/repository"
	candidateSearchSvc "kirmya/internal/candidate_search/service"

	careerAIHttp "kirmya/internal/career_ai/delivery/http"
	careerAIPrompts "kirmya/internal/career_ai/prompts"
	careerAIProvider "kirmya/internal/career_ai/provider"
	careerAIRepo "kirmya/internal/career_ai/repository"
	careerAISvc "kirmya/internal/career_ai/service"

	companionHttp "kirmya/internal/career_companion/delivery/http"
	companionPrompt "kirmya/internal/career_companion/prompt"
	companionProvider "kirmya/internal/career_companion/provider"
	companionRepo "kirmya/internal/career_companion/repository"
	companionSvc "kirmya/internal/career_companion/service"

	commHttp "kirmya/internal/community/delivery/http"
	commRepo "kirmya/internal/community/repository"
	commSvc "kirmya/internal/community/service"

	companyHttp "kirmya/internal/company/delivery/http"
	companyRepo "kirmya/internal/company/repository"
	companySvc "kirmya/internal/company/service"

	complianceHttp "kirmya/internal/compliance/delivery/http"
	complianceRepo "kirmya/internal/compliance/repository"
	complianceSvc "kirmya/internal/compliance/service"

	coverLetterHttp "kirmya/internal/cover_letter/delivery/http"
	coverLetterRepo "kirmya/internal/cover_letter/repository"
	coverLetterSvc "kirmya/internal/cover_letter/service"

	interviewPrepHttp "kirmya/internal/interview_prep/delivery/http"
	interviewPrepRepo "kirmya/internal/interview_prep/repository"
	interviewPrepSvc "kirmya/internal/interview_prep/service"

	endorsementHttp "kirmya/internal/endorsement/delivery/http"
	endorsementRepo "kirmya/internal/endorsement/repository"
	endorsementSvc "kirmya/internal/endorsement/service"

	enterpriseRepo "kirmya/internal/enterprise_hiring/repository"
	enterpriseSvc "kirmya/internal/enterprise_hiring/service"

	enterpriseHttp "kirmya/internal/enterprise_hiring/delivery/http"

	eventHttp "kirmya/internal/event/delivery/http"
	eventProvider "kirmya/internal/event/provider"
	eventRepo "kirmya/internal/event/repository"
	eventSvc "kirmya/internal/event/service"

	freelanceHttp "kirmya/internal/freelance/delivery/http"
	freelanceRepo "kirmya/internal/freelance/repository"
	freelanceSvc "kirmya/internal/freelance/service"

	marketplaceHttp "kirmya/internal/global_marketplace/delivery/http"
	marketplaceRepo "kirmya/internal/global_marketplace/repository"
	marketplaceSvc "kirmya/internal/global_marketplace/service"

	interviewHttp "kirmya/internal/interview/delivery/http"
	interviewRepo "kirmya/internal/interview/repository"
	interviewSvc "kirmya/internal/interview/service"

	jobAlertsHttp "kirmya/internal/job_alerts/delivery/http"
	jobAlertsRepo "kirmya/internal/job_alerts/repository"
	jobAlertsSvc "kirmya/internal/job_alerts/service"

	landingHttp "kirmya/internal/landing/delivery/http"
	landingRepo "kirmya/internal/landing/repository"
	landingSvc "kirmya/internal/landing/service"

	learningHttp "kirmya/internal/learning/delivery/http"
	learningProvider "kirmya/internal/learning/provider"
	learningRepo "kirmya/internal/learning/repository"
	learningSvc "kirmya/internal/learning/service"

	msgHttp "kirmya/internal/messaging/delivery/http"
	pubsub "kirmya/internal/messaging/pubsub"
	msgRepo "kirmya/internal/messaging/repository"
	msgSvc "kirmya/internal/messaging/service"

	mobileHttp "kirmya/internal/mobile/delivery/http"
	mobileRepo "kirmya/internal/mobile/repository"
	mobileSvc "kirmya/internal/mobile/service"

	nativeMobileHttp "kirmya/internal/native_mobile/delivery/http"
	nativeMobileProvider "kirmya/internal/native_mobile/provider"
	nativeMobileRepo "kirmya/internal/native_mobile/repository"
	nativeMobileSvc "kirmya/internal/native_mobile/service"

	netHttp "kirmya/internal/networking/delivery/http"
	netRepo "kirmya/internal/networking/repository"
	netSvc "kirmya/internal/networking/service"

	notifyHttp "kirmya/internal/notification/delivery/http"
	notifyRepo "kirmya/internal/notification/repository"
	notifySvc "kirmya/internal/notification/service"

	onboardingHttp "kirmya/internal/onboarding/delivery/http"
	onboardingRepo "kirmya/internal/onboarding/repository"
	onboardingSvc "kirmya/internal/onboarding/service"

	organizationHttp "kirmya/internal/organization/delivery/http"
	organizationRepo "kirmya/internal/organization/repository"
	organizationSvc "kirmya/internal/organization/service"

	profileHttp "kirmya/internal/profile/delivery/http"
	profileRepo "kirmya/internal/profile/repository"
	profileSvc "kirmya/internal/profile/service"

	recHttp "kirmya/internal/recommendation/delivery/http"
	recRepo "kirmya/internal/recommendation/repository"
	recSvc "kirmya/internal/recommendation/service"

	recommendationHttp "kirmya/internal/recommendation_engine/delivery/http"
	recommendationRepo "kirmya/internal/recommendation_engine/repository"
	recommendationSvc "kirmya/internal/recommendation_engine/service"

	recruiterHttp "kirmya/internal/recruiter/delivery/http"
	recruiterRepo "kirmya/internal/recruiter/repository"
	recruiterSvc "kirmya/internal/recruiter/service"

	recruiterAIHttp "kirmya/internal/recruiter_ai/delivery/http"
	recruiterAIRepo "kirmya/internal/recruiter_ai/repository"
	recruiterAISvc "kirmya/internal/recruiter_ai/service"

	referralHttp "kirmya/internal/referral/delivery/http"
	referralRepo "kirmya/internal/referral/repository"
	referralSvc "kirmya/internal/referral/service"

	resumeHttp "kirmya/internal/resume/delivery/http"
	resumeRepo "kirmya/internal/resume/repository"
	resumeSvc "kirmya/internal/resume/service"

	resumeAnalysisHttp "kirmya/internal/resume_analysis/delivery/http"
	resumeAnalysisProvider "kirmya/internal/resume_analysis/provider"
	resumeAnalysisRepo "kirmya/internal/resume_analysis/repository"
	resumeAnalysisSvc "kirmya/internal/resume_analysis/service"

	searchAdapter "kirmya/internal/search/adapter"
	searchHttp "kirmya/internal/search/delivery/http"
	searchRepo "kirmya/internal/search/repository"
	searchSvc "kirmya/internal/search/service"

	trustHttp "kirmya/internal/trust_safety/delivery/http"
	trustRepo "kirmya/internal/trust_safety/repository"
	trustSvc "kirmya/internal/trust_safety/service"

	verificationHttp "kirmya/internal/verification/delivery/http"
	verificationRepo "kirmya/internal/verification/repository"
	verificationSvc "kirmya/internal/verification/service"

	intelligenceHttp "kirmya/internal/workforce_intelligence/delivery/http"
	intelligenceRepo "kirmya/internal/workforce_intelligence/repository"
	intelligenceSvc "kirmya/internal/workforce_intelligence/service"

	securityHttp "kirmya/internal/security/delivery/http"
	securityRepo "kirmya/internal/security/repository"
	securitySvc "kirmya/internal/security/service"

	adminHttp "kirmya/internal/admin/delivery/http"
	adminRepo "kirmya/internal/admin/repository"
	adminSvc "kirmya/internal/admin/service"

	billingHttp "kirmya/internal/billing/delivery/http"
	billingRepo "kirmya/internal/billing/repository"
	billingSvc "kirmya/internal/billing/service"

	legalHttp "kirmya/internal/legal/delivery/http"
	legalRepo "kirmya/internal/legal/repository"
	legalSvc "kirmya/internal/legal/service"

	backupHttp "kirmya/internal/backup/delivery/http"
	backupRepo "kirmya/internal/backup/repository"
	backupSvc "kirmya/internal/backup/service"

	dataOpsHttp "kirmya/internal/data_operations/delivery/http"
	dataOpsRepo "kirmya/internal/data_operations/repository"
	dataOpsSvc "kirmya/internal/data_operations/service"

	supportHttp "kirmya/internal/support/delivery/http"
	supportRepo "kirmya/internal/support/repository"
	supportSvc "kirmya/internal/support/service"

	sysHealthHttp "kirmya/internal/system_health/delivery/http"
	sysHealthRepo "kirmya/internal/system_health/repository"
	sysHealthSvc "kirmya/internal/system_health/service"

	mentorshipHttp "kirmya/internal/mentorship/delivery/http"
	mentorshipRepo "kirmya/internal/mentorship/repository"
	mentorshipSvc "kirmya/internal/mentorship/service"

	"kirmya/internal/router"
	cachePkg "kirmya/internal/shared/cache"
	configPkg "kirmya/internal/shared/config"
	"kirmya/internal/shared/database"
	persistencePkg "kirmya/internal/shared/persistence"
)

// The block below is the document-level half of the OpenAPI contract: the title,
// version and security scheme that every per-module annotation hangs off. swag
// reads it from this file because it is the `-g` entry point (see the Makefile);
// the operations themselves live in each module's delivery/http/swagger.go.
//
// Host and basePath are the development defaults. A deployment overrides them
// from SWAGGER_HOST and SWAGGER_BASE_PATH at startup, in router.registerSwagger.
//
// @title                       Kirmya API
// @version                     1.0
// @description                 HTTP API for Kirmya, an AI-assisted professional networking and hiring platform. Every route is mounted under /api/v1. Endpoints marked with a padlock require a Bearer access token from POST /api/v1/auth/login; the rest are open to anonymous callers. Requests are rate limited per client IP, and company, recruiter and organization endpoints apply their own per-company permission checks on top of authentication.
// @termsOfService              https://kirmya.com/terms
//
// @contact.name                Kirmya Engineering
// @contact.url                 https://kirmya.com/support
// @contact.email               support@kirmya.com
//
// @license.name                Proprietary
// @license.url                 https://kirmya.com/terms
//
// @host                        localhost:8080
// @BasePath                    /
// @schemes                     http https
//
// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 Access token issued by the auth module, sent as "Bearer {token}".
func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	slog.Info("Starting Kirmya backend modular monolith...")

	if envErr := godotenv.Load(); envErr != nil {
		if errors.Is(envErr, fs.ErrNotExist) {
			slog.Info("No .env file found, using process environment only")
		} else {
			slog.Warn("Failed to parse .env file, using process environment only")
		}
	} else {
		slog.Info("Loaded configuration from .env file")
	}

	cfg, cfgErr := configPkg.LoadConfig()
	if cfgErr != nil {
		slog.Error("Configuration load error", slog.String("error", cfgErr.Error()))
		os.Exit(1)
	}

	db, err := database.Connect()
	if err != nil {
		if os.Getenv("ALLOW_NO_DB") == "true" {
			slog.Warn("Database connection failed (running in offline/mock mode for test support)", slog.String("error", err.Error()))
		} else {
			slog.Error("Database connection failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	} else {
		defer db.Close()
	}

	var dbPool *pgxpool.Pool
	if db != nil {
		dbPool = db.Pool
	}

	appCache := cachePkg.InitCache()
	deps := buildDependencies(cfg, dbPool, appCache)

	// buildDependencies is what registers the ephemeral repositories, so the
	// audit runs against the wiring this binary actually performed.
	if auditErr := persistencePkg.Audit(cfg.AppEnv, cfg.AllowEphemeralRepos); auditErr != nil {
		slog.Error("Persistence audit failed", slog.String("error", auditErr.Error()))
		os.Exit(1)
	}

	deps.AllowedOrigins = cfg.CORSAllowedOrigins
	deps.TrustedProxies = cfg.TrustedProxies
	deps.RateLimit = router.RateLimitConfig{
		RequestsPerMinute: cfg.RateLimitRequestsPerMinute,
		Burst:             cfg.RateLimitBurst,
	}
	deps.Metrics = router.MetricsConfig{
		Username: cfg.MetricsUsername,
		Password: cfg.MetricsPassword,
	}

	r := router.New(deps, router.SwaggerConfig{
		Enabled:  cfg.SwaggerEnabled,
		Host:     cfg.SwaggerHost,
		BasePath: cfg.SwaggerBasePath,
		Username: cfg.SwaggerUsername,
		Password: cfg.SwaggerPassword,
	})

	if cfg.SwaggerEnabled {
		slog.Info("Swagger UI available", slog.String("url", "http://"+cfg.SwaggerHost+"/swagger/index.html"))
	}
	addr := ":" + cfg.ServerPort
	slog.Info("Kirmya API Monolith active", slog.String("addr", addr))

	srv := &http.Server{
		Addr:           addr,
		Handler:        r,
		ReadTimeout:    15 * time.Second,
		WriteTimeout:   30 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("Failed to run HTTP server", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutdown signal received, draining active connections...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server forced to shutdown", slog.String("error", err.Error()))
	}
	slog.Info("Kirmya API Monolith gracefully stopped")
}

func buildDependencies(cfg *configPkg.Config, dbPool *pgxpool.Pool, appCache cachePkg.Cache) router.RouterDependencies {
	pRepo := profileRepo.NewProfileRepository(dbPool)
	pSvc := profileSvc.NewProfileService(pRepo)
	pHandler := profileHttp.NewProfileHandler(pSvc)

	rRepo := resumeRepo.NewResumeRepository(dbPool)
	rSvc := resumeSvc.NewResumeService(rRepo)
	rHandler := resumeHttp.NewResumeHandler(rSvc)

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
	authMiddleware := authMiddlewarePkg.NewAuthMiddleware(authService)

	analyticsRepository := analyticsRepo.NewAnalyticsRepository(dbPool)
	analyticsService := analyticsSvc.NewAnalyticsService(analyticsRepository)
	analyticsHandler := analyticsHttp.NewAnalyticsHandler(analyticsService)

	aiRepository := aiRepo.NewAIRepository(dbPool)
	mockAIProvider := aiProvider.NewMockAIProvider()
	aiService := aiSvc.NewAIService(aiRepository, mockAIProvider)
	aiHandler := aiHttp.NewAIHandler(aiService)

	companyRepository := companyRepo.NewCompanyRepository(dbPool)
	companyManagementRepository := companyRepo.NewManagementRepository(dbPool)
	companyService := companySvc.NewCompanyService(companyRepository, companyManagementRepository)
	companyHandler := companyHttp.NewCompanyHandler(companyService)
	companyManagementService := companySvc.NewManagementService(
		companyManagementRepository,
		companyRepository,
		notifyService,
		cfg.AppBaseURL,
		cfg.AnalyticsViewSalt,
	)
	companyManagementHandler := companyHttp.NewManagementHandler(companyManagementService)

	recruiterRepository := recruiterRepo.NewRecruiterRepository(dbPool)
	recruiterService := recruiterSvc.NewRecruiterService(recruiterRepository)
	recruiterHandler := recruiterHttp.NewRecruiterHandler(recruiterService)

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

	searchRepository := searchRepo.NewSearchRepository(dbPool)
	searchEngineAdapter := searchAdapter.NewPostgreSQLSearchAdapter(dbPool)
	searchService := searchSvc.NewSearchService(searchRepository, searchEngineAdapter, appCache)
	searchHandler := searchHttp.NewSearchHandler(searchService)

	cSearchRepository := candidateSearchRepo.NewSearchRepository(dbPool)
	cSearchProvider := candidateSearchSvc.NewPostgresSearchProvider(dbPool)
	cSearchService := candidateSearchSvc.NewSearchService(cSearchProvider, cSearchRepository, recruiterRepository)
	candidateSearchHandler := candidateSearchHttp.NewSearchHandler(cSearchService)

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

	// Public platform-wide job board, backed by the real jobs table.
	jobsRepository := jobsRepo.NewJobRepository(dbPool)
	jobsService := jobsSvc.NewJobService(jobsRepository)
	jobsHandler := jobsHttp.NewJobHandler(jobsService)

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

	landingRepository := landingRepo.NewLandingRepository(dbPool)
	landingService := landingSvc.NewLandingService(landingRepository, appCache)
	landingHandler := landingHttp.NewLandingHandler(landingService)

	onboardingRepository := onboardingRepo.NewOnboardingRepository(dbPool)
	onboardingService := onboardingSvc.NewOnboardingService(onboardingRepository)
	onboardingHandler := onboardingHttp.NewOnboardingHandler(onboardingService)

	appsRepository := applicationsRepo.NewApplicationsRepository(dbPool)
	appsService := applicationsSvc.NewApplicationsService(appsRepository)
	appsHandler := applicationsHttp.NewApplicationsHandler(appsService)

	jAlertsRepository := jobAlertsRepo.NewJobAlertsRepository(dbPool)
	jAlertsService := jobAlertsSvc.NewJobAlertsService(jAlertsRepository)
	jAlertsHandler := jobAlertsHttp.NewJobAlertsHandler(jAlertsService)

	coverLetterRepository := coverLetterRepo.NewCoverLetterRepository(dbPool)
	coverLetterService := coverLetterSvc.NewCoverLetterService(coverLetterRepository)
	coverLetterHandler := coverLetterHttp.NewCoverLetterHandler(coverLetterService)

	interviewPrepRepository := interviewPrepRepo.NewPostgresRepository(dbPool)
	interviewPrepService := interviewPrepSvc.NewInterviewPrepService(interviewPrepRepository)
	interviewPrepHandler := interviewPrepHttp.NewInterviewPrepHandler(interviewPrepService)

	securityRepository := securityRepo.NewSecurityRepository(dbPool)
	securityService := securitySvc.NewSecurityService(securityRepository)
	securityHandler := securityHttp.NewSecurityHandler(securityService)
	adminSecurityHandler := securityHttp.NewAdminSecurityHandler(securityService)

	var sqlDB *sql.DB
	if dbPool != nil {
		sqlDB = stdlib.OpenDBFromPool(dbPool)
	}

	adminRepository := adminRepo.NewAdminRepository(dbPool)
	adminService := adminSvc.NewAdminService(adminRepository)
	adminHandler := adminHttp.NewAdminHandler(adminService)

	billingRepository := billingRepo.NewBillingRepository(sqlDB)
	billingService := billingSvc.NewBillingService(billingRepository)
	billingHandler := billingHttp.NewBillingHandler(billingService)
	adminBillingHandler := billingHttp.NewAdminBillingHandler(billingService)

	legalRepository := legalRepo.NewLegalRepository(sqlDB)
	legalService := legalSvc.NewLegalService(legalRepository)
	legalHandler := legalHttp.NewLegalHandler(legalService)
	adminLegalHandler := legalHttp.NewAdminLegalHandler(legalService)

	backupRepository := backupRepo.NewBackupRepository(sqlDB)
	backupService := backupSvc.NewBackupService(backupRepository)
	adminBackupHandler := backupHttp.NewBackupHandler(backupService)

	dataOpsRepository := dataOpsRepo.NewDataOperationsRepository(sqlDB)
	dataOpsService := dataOpsSvc.NewDataOperationsService(dataOpsRepository)
	dataOpsHandler := dataOpsHttp.NewDataOperationsHandler(dataOpsService)

	supportRepository := supportRepo.NewSupportRepository(sqlDB)
	supportService := supportSvc.NewSupportService(supportRepository)
	supportHandler := supportHttp.NewSupportHandler(supportService)
	adminSupportHandler := supportHttp.NewAdminSupportHandler(supportService)

	sysHealthRepository := sysHealthRepo.NewHealthRepository(sqlDB)
	sysHealthService := sysHealthSvc.NewSystemHealthService(sysHealthRepository, sqlDB)
	sysHealthHandler := sysHealthHttp.NewSystemHealthHandler(sysHealthService)

	mentorshipRepository := mentorshipRepo.NewPostgresMentorshipRepository(dbPool)
	mentorshipService := mentorshipSvc.NewMentorshipService(mentorshipRepository)
	mentorshipHandler := mentorshipHttp.NewMentorshipHandler(mentorshipService)

	trustSafetyRepository := trustRepo.NewTrustSafetyRepository(sqlDB)
	trustSafetyService := trustSvc.NewTrustSafetyService(trustSafetyRepository)
	trustSafetyHandler := trustHttp.NewTrustSafetyHandler(trustSafetyService)
	adminTrustSafetyHandler := trustHttp.NewAdminTrustSafetyHandler(trustSafetyService)

	adminAnalyticsHandler := analyticsHttp.NewAdminAnalyticsHandler(analyticsService)

	return router.RouterDependencies{
		AuthHandler:                 authHandler,
		AuthMiddleware:              authMiddleware,
		ProfileHandler:              pHandler,
		ResumeHandler:               rHandler,
		RecommendationHandler:       recHandler,
		NetworkingHandler:           netHandler,
		CommunityHandler:            commHandler,
		MessagingHandler:            msgHandler,
		NotificationHandler:         notifyHandler,
		AnalyticsHandler:            analyticsHandler,
		AdminAnalyticsHandler:       adminAnalyticsHandler,
		AIHandler:                   aiHandler,
		CompanyHandler:              companyHandler,
		CompanyManagementHandler:    companyManagementHandler,
		RecruiterHandler:            recruiterHandler,
		CandidateSearchHandler:      candidateSearchHandler,
		InterviewHandler:            interviewHandler,
		LearningHandler:             learningHandler,
		AssessmentHandler:           assessmentHandler,
		CareerAIHandler:             careerAIHandler,
		ResumeAnalysisHandler:       resumeAnalysisHandler,
		VerificationHandler:         verificationHandler,
		EndorsementHandler:          endorsementHandler,
		ReferralHandler:             referralHandler,
		EventHandler:                eventHandler,
		OrganizationHandler:         organizationHandler,
		UnifiedSearchHandler:        searchHandler,
		MobileHandler:               mobileHandler,
		NativeMobileHandler:         nativeMobileHandler,
		CompanionHandler:            companionHandler,
		JobMatchHandler:             jobMatchHandler,
		RecruiterAIHandler:          recruiterAIHandler,
		MarketplaceHandler:          marketplaceHandler,
		FreelanceHandler:            freelanceHandler,
		EnterpriseHandler:           enterpriseHandler,
		TrustHandler:                trustHandler,
		TrustSafetyHandler:          trustSafetyHandler,
		AdminTrustSafetyHandler:     adminTrustSafetyHandler,
		ComplianceHandler:           complianceHandler,
		IntelligenceHandler:         intelligenceHandler,
		RecommendationEngineHandler: recommendationHandler,
		LandingHandler:              landingHandler,
		OnboardingHandler:           onboardingHandler,
		ApplicationsHandler:         appsHandler,
		JobAlertsHandler:            jAlertsHandler,
		JobsHandler:                 jobsHandler,
		CoverLetterHandler:          coverLetterHandler,
		InterviewPrepHandler:        interviewPrepHandler,
		SecurityHandler:             securityHandler,
		AdminSecurityHandler:        adminSecurityHandler,
		AdminHandler:                adminHandler,
		BillingHandler:              billingHandler,
		AdminBillingHandler:         adminBillingHandler,
		LegalHandler:                legalHandler,
		AdminLegalHandler:           adminLegalHandler,
		AdminBackupHandler:          adminBackupHandler,
		DataOperationsHandler:       dataOpsHandler,
		SupportHandler:              supportHandler,
		AdminSupportHandler:         adminSupportHandler,
		SystemHealthHandler:         sysHealthHandler,
		MentorshipHandler:           mentorshipHandler,
	}
}
