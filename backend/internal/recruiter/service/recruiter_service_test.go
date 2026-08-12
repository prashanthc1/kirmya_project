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
