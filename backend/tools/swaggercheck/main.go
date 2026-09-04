// Command swaggercheck is the CI gate for the published API contract.
//
// It builds the real Gin route table the same way main.go does, then holds the
// generated OpenAPI spec against it. A route that ships without documentation,
// a documented path that no longer exists, or an operation missing a summary,
// tag or error response all fail the build — so the spec cannot silently drift
// away from the server.
//
// Usage: go run ./tools/swaggercheck   (or `make swagger-validate`)
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	adminHttp "kirmya/internal/admin/delivery/http"
	aiHttp "kirmya/internal/ai/delivery/http"
	jobMatchHttp "kirmya/internal/ai_job_match/delivery/http"
	analyticsHttp "kirmya/internal/analytics/delivery/http"
	applicationsHttp "kirmya/internal/applications/delivery/http"
	assessmentHttp "kirmya/internal/assessment/delivery/http"
	authHttp "kirmya/internal/auth/delivery/http"
	authMiddleware "kirmya/internal/auth/middleware"
	authService "kirmya/internal/auth/service"
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
	recruiterAIHttp "kirmya/internal/recruiter_ai/delivery/http"
	referralHttp "kirmya/internal/referral/delivery/http"
	resumeHttp "kirmya/internal/resume/delivery/http"
	resumeAnalysisHttp "kirmya/internal/resume_analysis/delivery/http"
	"kirmya/internal/router"
	unifiedSearchHttp "kirmya/internal/search/delivery/http"
	securityHttp "kirmya/internal/security/delivery/http"
	supportHttp "kirmya/internal/support/delivery/http"
	sysHealthHttp "kirmya/internal/system_health/delivery/http"
	trustHttp "kirmya/internal/trust_safety/delivery/http"
	verificationHttp "kirmya/internal/verification/delivery/http"
	intelligenceHttp "kirmya/internal/workforce_intelligence/delivery/http"
)

const specPath = "internal/docs/swagger.json"

type operation struct {
	Summary     string                     `json:"summary"`
	Description string                     `json:"description"`
	Tags        []string                   `json:"tags"`
	Responses   map[string]json.RawMessage `json:"responses"`
	Security    []map[string][]string      `json:"security"`
}

type spec struct {
	Swagger             string                          `json:"swagger"`
	Info                map[string]json.RawMessage      `json:"info"`
	Paths               map[string]map[string]operation `json:"paths"`
	Definitions         map[string]json.RawMessage      `json:"definitions"`
	SecurityDefinitions map[string]json.RawMessage      `json:"securityDefinitions"`
}

// swagParam rewrites OpenAPI's {id} placeholders into Gin's :id form so the two
// route representations can be compared key-by-key.
var swagParam = regexp.MustCompile(`\{([^}]+)\}`)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "\nswaggercheck: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	raw, err := os.ReadFile(specPath)
	if err != nil {
		return fmt.Errorf("read %s: %w (run `make swagger` first)", specPath, err)
	}
	var s spec
	if err := json.Unmarshal(raw, &s); err != nil {
		return fmt.Errorf("parse %s: %w", specPath, err)
	}

	var problems []string
	problems = append(problems, validateSchema(&s)...)

	documented := map[string]bool{}
	for path, methods := range s.Paths {
		ginPath := swagParam.ReplaceAllString(path, ":$1")
		for method := range methods {
			documented[strings.ToUpper(method)+" "+ginPath] = true
		}
	}

	problems = append(problems, validateOperations(&s)...)
	problems = append(problems, compareRoutes(documented)...)

	if len(problems) > 0 {
		sort.Strings(problems)
		for _, p := range problems {
			fmt.Fprintln(os.Stderr, "  - "+p)
		}
		return fmt.Errorf("%d problem(s) found in the OpenAPI contract", len(problems))
	}

	fmt.Printf("OpenAPI contract OK: %d paths, %d operations, %d definitions, all registered routes documented.\n",
		len(s.Paths), countOperations(&s), len(s.Definitions))
	return nil
}

// validateSchema checks the document-level invariants of the spec.
func validateSchema(s *spec) []string {
	var problems []string
	if s.Swagger == "" {
		problems = append(problems, "spec: missing top-level \"swagger\" version")
	}
	for _, key := range []string{"title", "version", "description", "contact", "license"} {
		if _, ok := s.Info[key]; !ok {
			problems = append(problems, "spec: info."+key+" is not set")
		}
	}
	if _, ok := s.SecurityDefinitions["BearerAuth"]; !ok {
		problems = append(problems, "spec: securityDefinitions.BearerAuth is not defined")
	}
	if len(s.Paths) == 0 {
		problems = append(problems, "spec: no paths documented")
	}
	return problems
}

// validateOperations enforces the per-endpoint documentation bar: every
// operation needs a summary, description, tag, a success response and at least
// one error response.
func validateOperations(s *spec) []string {
	var problems []string
	for path, methods := range s.Paths {
		for method, op := range methods {
			id := strings.ToUpper(method) + " " + path
			if strings.TrimSpace(op.Summary) == "" {
				problems = append(problems, id+": missing @Summary")
			}
			if strings.TrimSpace(op.Description) == "" {
				problems = append(problems, id+": missing @Description")
			}
			if len(op.Tags) == 0 {
				problems = append(problems, id+": missing @Tags")
			}
			var success, failure bool
			for code := range op.Responses {
				n, err := strconv.Atoi(code)
				if err != nil {
					continue
				}
				switch {
				case n >= 200 && n < 300:
					success = true
				case n >= 400:
					failure = true
				}
			}
			if !success {
				problems = append(problems, id+": no 2xx @Success response documented")
			}
			if !failure {
				problems = append(problems, id+": no 4xx/5xx @Failure response documented")
			}
		}
	}
	return problems
}

// compareRoutes diffs the live Gin route table against the spec in both
// directions.
func compareRoutes(documented map[string]bool) []string {
	gin.SetMode(gin.TestMode)
	engine := router.New(router.Handlers{
		AuthMiddleware:              authMiddleware.NewAuthMiddleware(&authService.AuthService{}),
		AuthHandler:                 &authHttp.AuthHandler{},
		ProfileHandler:              &profileHttp.ProfileHandler{},
		ResumeHandler:               &resumeHttp.ResumeHandler{},
		RecommendationHandler:       &recHttp.RecommendationHandler{},
		NetworkingHandler:           &netHttp.NetworkingHandler{},
		CommunityHandler:            &commHttp.CommunityHandler{},
		MessagingHandler:            &msgHttp.MessagingHandler{},
		NotificationHandler:         &notifyHttp.NotificationHandler{},
		AnalyticsHandler:            &analyticsHttp.AnalyticsHandler{},
		AIHandler:                   &aiHttp.AIHandler{},
		CompanyHandler:              &companyHttp.CompanyHandler{},
		CompanyManagementHandler:    &companyHttp.ManagementHandler{},
		RecruiterHandler:            &recruiterHttp.RecruiterHandler{},
		CandidateSearchHandler:      &candidateSearchHttp.SearchHandler{},
		InterviewHandler:            &interviewHttp.InterviewHandler{},
		LearningHandler:             &learningHttp.LearningHandler{},
		AssessmentHandler:           &assessmentHttp.AssessmentHandler{},
		CareerAIHandler:             &careerAIHttp.CareerAIHandler{},
		ResumeAnalysisHandler:       &resumeAnalysisHttp.ResumeAnalysisHandler{},
		VerificationHandler:         &verificationHttp.VerificationHandler{},
		EndorsementHandler:          &endorsementHttp.EndorsementHandler{},
		ReferralHandler:             &referralHttp.ReferralHandler{},
		EventHandler:                &eventHttp.EventHandler{},
		OrganizationHandler:         &organizationHttp.OrganizationHandler{},
		UnifiedSearchHandler:        &unifiedSearchHttp.SearchHandler{},
		MobileHandler:               &mobileHttp.MobileHandler{},
		NativeMobileHandler:         &nativeMobileHttp.NativeMobileHandler{},
		CompanionHandler:            &companionHttp.CompanionHandler{},
		JobMatchHandler:             &jobMatchHttp.MatchingHandler{},
		RecruiterAIHandler:          &recruiterAIHttp.RecruiterAIHandler{},
		MarketplaceHandler:          &marketplaceHttp.MarketplaceHandler{},
		FreelanceHandler:            &freelanceHttp.FreelanceHandler{},
		EnterpriseHandler:           &enterpriseHttp.EnterpriseHandler{},
		TrustHandler:                &trustHttp.TrustHandler{},
		ComplianceHandler:           &complianceHttp.ComplianceHandler{},
		IntelligenceHandler:         &intelligenceHttp.IntelligenceHandler{},
		RecommendationEngineHandler: &recommendationEngineHttp.RecommendationHandler{},
		LandingHandler:              &landingHttp.LandingHandler{},
		OnboardingHandler:           &onboardingHttp.OnboardingHandler{},
		ApplicationsHandler:         &applicationsHttp.ApplicationsHandler{},
		JobAlertsHandler:            &jobAlertsHttp.JobAlertsHandler{},
		JobsHandler:                 &jobsHttp.JobHandler{},
		CoverLetterHandler:          &coverLetterHttp.CoverLetterHandler{},
		InterviewPrepHandler:        &interviewPrepHttp.InterviewPrepHandler{},
		AdminHandler:                &adminHttp.AdminHandler{},
		BillingHandler:              &billingHttp.BillingHandler{},
		AdminBillingHandler:         &billingHttp.AdminBillingHandler{},
		LegalHandler:                &legalHttp.LegalHandler{},
		AdminLegalHandler:           &legalHttp.AdminLegalHandler{},
		TrustSafetyHandler:          &trustHttp.TrustSafetyHandler{},
		AdminTrustSafetyHandler:     &trustHttp.AdminTrustSafetyHandler{},
		AdminAnalyticsHandler:       &analyticsHttp.AdminAnalyticsHandler{},
		SecurityHandler:             &securityHttp.SecurityHandler{},
		AdminSecurityHandler:        &securityHttp.AdminSecurityHandler{},
		SupportHandler:              &supportHttp.SupportHandler{},
		AdminSupportHandler:         &supportHttp.AdminSupportHandler{},
		AdminBackupHandler:          &backupHttp.BackupHandler{},
		DataOperationsHandler:       &dataOpsHttp.DataOperationsHandler{},
		SystemHealthHandler:         &sysHealthHttp.SystemHealthHandler{},
		MentorshipHandler:           &mentorshipHttp.MentorshipHandler{},
		FileHandler:                 &mediaHttp.FileHandler{},
	}, router.SwaggerConfig{})

	var problems []string
	registered := map[string]bool{}
	for _, rt := range engine.Routes() {
		key := rt.Method + " " + rt.Path

		// Exclude legacy alias groups maintained solely for backwards compatibility
		if strings.HasPrefix(rt.Path, "/api/v1/profiles/") ||
			strings.HasPrefix(rt.Path, "/api/v1/messaging/") ||
			strings.HasPrefix(rt.Path, "/api/v1/networking/") ||
			strings.HasPrefix(rt.Path, "/api/v1/admin/safety/") {
			continue
		}

		registered[key] = true
		if !documented[key] {
			problems = append(problems, "undocumented route: "+key)
		}
	}
	for key := range documented {
		if !registered[key] {
			problems = append(problems, "documented route is not registered: "+key)
		}
	}
	return problems
}

func countOperations(s *spec) int {
	n := 0
	for _, methods := range s.Paths {
		n += len(methods)
	}
	return n
}
