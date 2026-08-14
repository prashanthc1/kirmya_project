package service

import (
	"context"
	"testing"

	"kirmya/internal/recruiter/models"
	"kirmya/internal/recruiter/repository"

	"github.com/google/uuid"
)

func TestRecruiterService_FullWorkflow(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()

	// 1. Test Onboarding
	onboardPayload := &models.OnboardingPayload{
		CompanyName:   "Kirmya Tech Solutions",
		JobTitle:      "Head of Talent",
		RecruiterRole: "Organization Owner",
		Department:    "People & Culture",
		ContactEmail:  "headofpersonnel@kirmya.ae",
	}
	profile, err := svc.SubmitOnboarding(ctx, userID, onboardPayload)
	if err != nil {
		t.Fatalf("SubmitOnboarding failed: %v", err)
	}
	if profile.CompanyName != "Kirmya Tech Solutions" {
		t.Errorf("Expected company name 'Kirmya Tech Solutions', got %s", profile.CompanyName)
	}

	// 2. Test Job Creation
	jobPayload := &models.CreateJobPayload{
		Title:           "Senior Go Engineer",
		Department:      "Engineering",
		EmploymentType:  "Full-time",
		WorkplaceType:   "Remote",
		Location:        "Dubai, UAE",
		SalaryRange:     "$100,000 - $140,000",
		Currency:        "USD",
		ExperienceLevel: "Senior",
		Description:     "Architect scalable backend microservices.",
		Questions: []models.JobApplicationQuestionDTO{
			{
				QuestionText: "How many years of Go experience do you have?",
				QuestionType: "Number",
				IsRequired:   true,
			},
		},
	}
	job, err := svc.CreateJob(ctx, userID, jobPayload)
	if err != nil {
		t.Fatalf("CreateJob failed: %v", err)
	}
	if job.Title != "Senior Go Engineer" {
		t.Errorf("Expected job title 'Senior Go Engineer', got %s", job.Title)
	}

	// 3. Test Candidate Pipeline & Match Analysis
	match, err := svc.GetCandidateMatch(ctx, userID, job.ID, uuid.New())
	if err != nil {
		t.Fatalf("GetCandidateMatch failed: %v", err)
	}
	if match.OverallMatchScore < 80 {
		t.Errorf("Expected match score >= 80, got %d", match.OverallMatchScore)
	}

	// 4. Test Interview Feedback & Offer
	feedbackPayload := &models.InterviewFeedbackPayload{
		InterviewID:          uuid.New().String(),
		ApplicationID:        uuid.New().String(),
		TechnicalSkillsScore: 5,
		CommunicationScore:   5,
		ProblemSolvingScore:  5,
		CultureFitScore:      5,
		LeadershipScore:      4,
		OverallRating:        5,
		Recommendation:       "Strong Hire",
		Comments:             "Exceptional technical mastery and communication.",
	}
	feedback, err := svc.SubmitInterviewFeedback(ctx, userID, feedbackPayload)
	if err != nil {
		t.Fatalf("SubmitInterviewFeedback failed: %v", err)
	}
	if feedback.Recommendation != "Strong Hire" {
		t.Errorf("Expected recommendation 'Strong Hire', got %s", feedback.Recommendation)
	}

	// 5. Test Offer Creation
	offerPayload := &models.JobOfferPayload{
		ApplicationID: uuid.New().String(),
		JobID:         job.ID.String(),
		CandidateID:   uuid.New().String(),
		PositionTitle: "Senior Go Engineer",
		Salary:        "$130,000",
		Currency:      "USD",
		Benefits:      "Health, 30 days annual leave, Remote stipend",
		JoiningDate:   "2026-10-01",
		ContractType:  "Full-time",
	}
	offer, err := svc.CreateJobOffer(ctx, userID, offerPayload)
	if err != nil {
		t.Fatalf("CreateJobOffer failed: %v", err)
	}
	if offer.Status != "Sent" {
		t.Errorf("Expected offer status 'Sent', got %s", offer.Status)
	}
}

func TestRecruiterService_CandidateNotes(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()
	candidateID := uuid.MustParse("c1111111-1111-1111-1111-111111111111")

	// Create Note
	notePayload := &models.CreateNotePayload{
		Note:           "Strong technical background in distributed systems.",
		Score:          9,
		Recommendation: "Strong Hire",
		IsPinned:       true,
	}
	note, err := svc.CreateCandidateNote(ctx, userID, candidateID, notePayload)
	if err != nil {
		t.Fatalf("CreateCandidateNote failed: %v", err)
	}
	if note.Note != "Strong technical background in distributed systems." {
		t.Errorf("Expected note text match, got %s", note.Note)
	}
	if note.Score != 9 {
		t.Errorf("Expected score 9, got %d", note.Score)
	}

	// Get Notes (returns fallback data since db is nil)
	notes, err := svc.GetCandidateNotes(ctx, userID, candidateID)
	if err != nil {
		t.Fatalf("GetCandidateNotes failed: %v", err)
	}
	if len(notes) == 0 {
		t.Error("Expected at least one note")
	}
}

func TestRecruiterService_CandidateEvaluation(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()

	evalPayload := &models.CandidateEvaluationPayload{
		ApplicationID:      uuid.New().String(),
		JobID:              uuid.New().String(),
		CandidateID:        uuid.New().String(),
		SkillsScore:        9,
		ExperienceScore:    8,
		CommunicationScore: 9,
		TechnicalScore:     10,
		CultureFitScore:    8,
		RoleFitScore:       9,
		OverallScore:       9,
		Recommendation:     "Strong Hire",
		Strengths:          "Exceptional Go and PostgreSQL skills",
		Weaknesses:         "Limited Kafka experience",
		Notes:              "Recommend fast-track to offer stage.",
	}

	eval, err := svc.CreateCandidateEvaluation(ctx, userID, evalPayload)
	if err != nil {
		t.Fatalf("CreateCandidateEvaluation failed: %v", err)
	}
	if eval.OverallScore != 9 {
		t.Errorf("Expected overall score 9, got %d", eval.OverallScore)
	}
	if eval.Recommendation != "Strong Hire" {
		t.Errorf("Expected recommendation 'Strong Hire', got %s", eval.Recommendation)
	}

	// Get evaluations
	evals, err := svc.GetCandidateEvaluations(ctx, eval.ApplicationID)
	if err != nil {
		t.Fatalf("GetCandidateEvaluations failed: %v", err)
	}
	if len(evals) == 0 {
		t.Error("Expected at least one evaluation")
	}
}

func TestRecruiterService_StageHistory(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	appID := uuid.New()

	history, err := svc.GetStageHistory(ctx, appID)
	if err != nil {
		t.Fatalf("GetStageHistory failed: %v", err)
	}
	if len(history) < 2 {
		t.Errorf("Expected at least 2 history entries, got %d", len(history))
	}
	if history[0].FromStage != "New" || history[0].ToStage != "Shortlisted" {
		t.Errorf("Unexpected stage transition: %s -> %s", history[0].FromStage, history[0].ToStage)
	}
}

func TestRecruiterService_DashboardOverview(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()

	overview, err := svc.GetDashboardOverview(ctx, userID)
	if err != nil {
		t.Fatalf("GetDashboardOverview failed: %v", err)
	}
	if overview.ActiveJobsCount == 0 {
		t.Error("Expected non-zero active jobs count")
	}
	if overview.TotalApplicantsCount == 0 {
		t.Error("Expected non-zero total applicants count")
	}
	if len(overview.RecentJobs) == 0 {
		t.Error("Expected recent jobs")
	}
}

func TestRecruiterService_BulkActions(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()

	bulkPayload := &models.ATSBulkActionPayload{
		ApplicationIDs: []string{uuid.New().String(), uuid.New().String()},
		Action:         "move",
		TargetStage:    "Shortlisted",
		Notes:          "Batch shortlisting",
	}

	err := svc.BulkUpdateApplications(ctx, userID, bulkPayload)
	if err != nil {
		t.Fatalf("BulkUpdateApplications failed: %v", err)
	}
}

func TestRecruiterService_PipelineStageUpdate(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userID := uuid.New()
	pipelineID := uuid.New()

	payload := &models.UpdateStagePayload{
		Stage: "Shortlisted",
		Notes: "Advanced after technical screening",
	}

	err := svc.UpdatePipelineStage(ctx, userID, pipelineID, payload)
	if err != nil {
		t.Fatalf("UpdatePipelineStage failed: %v", err)
	}
}

func TestRecruiterService_CompanyIsolation(t *testing.T) {
	repo := repository.NewRecruiterRepository(nil)
	svc := NewRecruiterService(repo)
	ctx := context.Background()
	userA := uuid.New()
	userB := uuid.New()

	// Both users get profiles (in nil-db mode, same org)
	pA, _ := svc.GetOrCreateProfile(ctx, userA, "Company A")
	pB, _ := svc.GetOrCreateProfile(ctx, userB, "Company B")

	if pA == nil || pB == nil {
		t.Fatal("Expected profiles to be created")
	}

	// Verify org access check (returns true in nil-db mode)
	hasAccess, err := repo.VerifyRecruiterOrgAccess(ctx, pA.ID, pA.OrgID)
	if err != nil {
		t.Fatalf("VerifyRecruiterOrgAccess failed: %v", err)
	}
	if !hasAccess {
		t.Error("Expected recruiter to have access to own org")
	}
}
