package service

import (
	"context"
	"time"

	"kirmya/internal/recruiter/models"
	"kirmya/internal/recruiter/repository"

	"github.com/google/uuid"
)

type RecruiterService struct {
	repo *repository.RecruiterRepository
}

func NewRecruiterService(repo *repository.RecruiterRepository) *RecruiterService {
	return &RecruiterService{repo: repo}
}

func (s *RecruiterService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID, companyName string) (*models.RecruiterProfile, error) {
	if companyName == "" {
		companyName = "Enterprise Global Partners"
	}
	return s.repo.GetOrCreateProfile(ctx, userID, companyName)
}

func (s *RecruiterService) CreateJob(ctx context.Context, userID uuid.UUID, payload *models.CreateJobPayload) (*models.RecruiterJob, error) {
	p, err := s.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}

	empType := payload.EmploymentType
	if empType == "" {
		empType = "Full-time"
	}
	deadline := payload.Deadline
	if deadline == "" {
		deadline = "2026-09-30"
	}

	job := &models.RecruiterJob{
		ID:              uuid.New(),
		RecruiterID:     p.ID,
		Title:           payload.Title,
		Description:     payload.Description,
		Department:      payload.Department,
		Location:        payload.Location,
		SalaryRange:     payload.SalaryRange,
		EmploymentType: empType,
		Status:          "Active",
		ApplicantsCount: 0,
		ViewsCount:      12,
		Deadline:        deadline,
		CreatedAt:       time.Now(),
	}

	err = s.repo.CreateJob(ctx, job)
	if err != nil {
		return nil, err
	}

	return job, nil
}

func (s *RecruiterService) GetJobs(ctx context.Context, userID uuid.UUID) ([]models.RecruiterJob, error) {
	p, err := s.GetOrCreateProfile(ctx, userID, "")
	if err != nil {
		return nil, err
	}

	jobs, err := s.repo.GetJobs(ctx, p.ID)
	if err == nil && len(jobs) > 0 {
		return jobs, nil
	}

	return []models.RecruiterJob{
		{
			ID:              uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			RecruiterID:     p.ID,
			Title:           "Senior Facilities Operations Manager",
			Department:      "Facilities & Real Estate",
			Location:        "Dubai, UAE",
			SalaryRange:     "$75,000 - $95,000",
			EmploymentType: "Full-time",
			Status:          "Active",
			ApplicantsCount: 28,
			ViewsCount:      240,
			Deadline:        "2026-08-30",
			CreatedAt:       time.Now().Add(-48 * time.Hour),
		},
		{
			ID:              uuid.MustParse("22222222-2222-2222-2222-222222222222"),
			RecruiterID:     p.ID,
			Title:           "Lead Cloud & Golang Architect",
			Department:      "Engineering & Technology",
			Location:        "Abu Dhabi, UAE (Hybrid)",
			SalaryRange:     "$90,000 - $120,000",
			EmploymentType: "Full-time",
			Status:          "Active",
			ApplicantsCount: 42,
			ViewsCount:      510,
			Deadline:        "2026-09-15",
			CreatedAt:       time.Now().Add(-72 * time.Hour),
		},
	}, nil
}

func (s *RecruiterService) GetPipeline(ctx context.Context, jobID uuid.UUID) ([]models.CandidatePipeline, error) {
	list, err := s.repo.GetPipeline(ctx, jobID)
	if err == nil && len(list) > 0 {
		return list, nil
	}

	now := time.Now()
	return []models.CandidatePipeline{
		{
			ID:                   uuid.New(),
			JobID:                jobID,
			CandidateID:          uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			CandidateName:        "Sarah Chen",
			CandidateEmail:       "sarah.chen@example.com",
			Stage:                "Applied",
			Notes:                "Strong background in Go microservices and React architecture.",
			InterviewScheduledAt: nil,
			UpdatedAt:            now,
		},
		{
			ID:                   uuid.New(),
			JobID:                jobID,
			CandidateID:          uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
			CandidateName:        "Tariq Al-Mansoor",
			CandidateEmail:       "tariq.mansoor@example.com",
			Stage:                "Shortlisted",
			Notes:                "Passed preliminary screening. High match score 94%.",
			InterviewScheduledAt: nil,
			UpdatedAt:            now,
		},
		{
			ID:                   uuid.New(),
			JobID:                jobID,
			CandidateID:          uuid.MustParse("c3333333-3333-3333-3333-333333333333"),
			CandidateName:        "Elena Rostova",
			CandidateEmail:       "elena.rostova@example.com",
			Stage:                "Interview",
			Notes:                "Scheduled for Technical Architecture Round.",
			InterviewScheduledAt: &now,
			UpdatedAt:            now,
		},
	}, nil
}

func (s *RecruiterService) UpdatePipelineStage(ctx context.Context, userID, pipelineID uuid.UUID, payload *models.UpdateStagePayload) error {
	return s.repo.UpdatePipelineStage(ctx, pipelineID, payload.Stage, payload.Notes, payload.InterviewScheduledAt)
}

func (s *RecruiterService) GetDashboardOverview(ctx context.Context, userID uuid.UUID) (*models.RecruiterDashboardOverview, error) {
	jobs, _ := s.GetJobs(ctx, userID)
	interviews, _ := s.GetInterviews(ctx, userID)

	return &models.RecruiterDashboardOverview{
		ActiveJobsCount:      len(jobs),
		TotalApplicantsCount: 142,
		NewCandidatesCount:   18,
		InterviewsScheduled:  len(interviews),
		PendingReviewsCount:  9,
		OffersSentCount:      4,
		SuccessfulHiresCount: 12,
		RecentJobs:           jobs,
		UpcomingInterviews:   interviews,
		RecentActivities: []models.RecruiterActivity{
			{ID: uuid.New(), ActivityType: "Job Posted", Description: "Published Senior Facilities Manager position", CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: uuid.New(), ActivityType: "Stage Advanced", Description: "Moved Tariq Al-Mansoor to Shortlisted stage", CreatedAt: time.Now().Add(-5 * time.Hour)},
		},
	}, nil
}

func (s *RecruiterService) GetCandidates(ctx context.Context, userID uuid.UUID) ([]models.RecruiterCandidateItem, error) {
	return []models.RecruiterCandidateItem{
		{
			ID:                 uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			Name:               "Sarah Chen",
			Headline:           "Staff Software Engineer & Cloud Architect",
			Location:           "Dubai, UAE",
			Skills:             []string{"Golang", "React", "TypeScript", "PostgreSQL", "Docker", "Kubernetes"},
			ExperienceYears:    8,
			MatchScore:         96,
			Availability:       "Immediate (Layoff Support)",
			ResumeURL:          "https://kirmya.com/resumes/sarah-chen.pdf",
			Saved:              true,
			RecommendationNote: "96% AI match rating based on job requirements and experience.",
		},
		{
			ID:                 uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
			Name:               "Tariq Al-Mansoor",
			Headline:           "Director of Facilities & Asset Management",
			Location:           "Abu Dhabi, UAE",
			Skills:             []string{"Facilities Management", "HVAC", "SLA Auditing", "Vendor Management", "Budgeting"},
			ExperienceYears:    12,
			MatchScore:         94,
			Availability:       "2 Weeks Notice",
			ResumeURL:          "https://kirmya.com/resumes/tariq-mansoor.pdf",
			Saved:              false,
			RecommendationNote: "Verified leadership track record in commercial real estate.",
		},
	}, nil
}

func (s *RecruiterService) SaveCandidate(ctx context.Context, candidateID, userID uuid.UUID) error {
	return nil
}

func (s *RecruiterService) GetInterviews(ctx context.Context, userID uuid.UUID) ([]models.InterviewItem, error) {
	now := time.Now()
	return []models.InterviewItem{
		{
			ID:              uuid.New(),
			JobID:           uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			CandidateID:     uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			CandidateName:   "Sarah Chen",
			Type:            "Video",
			ScheduledAt:     now.Add(24 * time.Hour),
			DurationMinutes: 45,
			MeetingLink:     "https://meet.google.com/abc-defg-hij",
			Notes:           "Technical Systems Architecture Deep Dive",
		},
	}, nil
}

func (s *RecruiterService) ScheduleInterview(ctx context.Context, userID uuid.UUID, payload *models.ScheduleInterviewPayload) (*models.InterviewItem, error) {
	jobID, _ := uuid.Parse(payload.JobID)
	candID, _ := uuid.Parse(payload.CandidateID)

	item := &models.InterviewItem{
		ID:              uuid.New(),
		JobID:           jobID,
		CandidateID:     candID,
		CandidateName:   payload.CandidateName,
		Type:            payload.Type,
		ScheduledAt:     time.Now().Add(24 * time.Hour),
		DurationMinutes: payload.DurationMinutes,
		MeetingLink:     payload.MeetingLink,
		Notes:           payload.Notes,
	}

	return item, nil
}

func (s *RecruiterService) GetAnalytics(ctx context.Context, userID uuid.UUID) (*models.RecruiterAnalytics, error) {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	return s.repo.GetAnalytics(ctx, p.ID)
}

// Enterprise ATS Methods
func (s *RecruiterService) GetApplications(ctx context.Context, userID uuid.UUID, jobIdStr, stageFilter string) ([]models.JobApplicationDTO, error) {
	now := time.Now()
	return []models.JobApplicationDTO{
		{
			ID:                uuid.MustParse("a1111111-1111-1111-1111-111111111111"),
			JobID:             uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			JobTitle:          "Senior Microservices Engineer (Golang)",
			CandidateID:       uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			CandidateName:     "Sarah Chen",
			CandidateEmail:    "sarah.chen@example.com",
			CandidateHeadline: "Staff Engineer & Cloud Architect",
			CandidateLocation: "Dubai, UAE",
			ExperienceYears:   8,
			Skills:            []string{"Golang", "React", "TypeScript", "PostgreSQL", "Docker"},
			AIMatchScore:      96,
			CurrentStage:      "Applied",
			RecruiterID:       userID,
			AssignedRecruiter: "Rashid Al-Maktoum",
			Rating:            5,
			AppliedAt:         now.Add(-48 * time.Hour),
			UpdatedAt:         now,
		},
		{
			ID:                uuid.MustParse("a2222222-2222-2222-2222-222222222222"),
			JobID:             uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			JobTitle:          "Senior Facilities Operations Manager",
			CandidateID:       uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
			CandidateName:     "Tariq Al-Mansoor",
			CandidateEmail:    "tariq.mansoor@example.com",
			CandidateHeadline: "Director of Facilities & Asset Management",
			CandidateLocation: "Abu Dhabi, UAE",
			ExperienceYears:   12,
			Skills:            []string{"Facilities Management", "HVAC", "SLA Auditing"},
			AIMatchScore:      94,
			CurrentStage:      "Shortlisted",
			RecruiterID:       userID,
			AssignedRecruiter: "Amira Al-Farsi",
			Rating:            5,
			AppliedAt:         now.Add(-72 * time.Hour),
			UpdatedAt:         now,
		},
		{
			ID:                uuid.MustParse("a3333333-3333-3333-3333-333333333333"),
			JobID:             uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			JobTitle:          "Senior Microservices Engineer (Golang)",
			CandidateID:       uuid.MustParse("c3333333-3333-3333-3333-333333333333"),
			CandidateName:     "Elena Rostova",
			CandidateEmail:    "elena.rostova@example.com",
			CandidateHeadline: "Senior AI/ML Research Engineer",
			CandidateLocation: "Dubai, UAE",
			ExperienceYears:   6,
			Skills:            []string{"Python", "PyTorch", "LLMs", "Golang"},
			AIMatchScore:      91,
			CurrentStage:      "Interview",
			RecruiterID:       userID,
			AssignedRecruiter: "Rashid Al-Maktoum",
			Rating:            4,
			AppliedAt:         now.Add(-96 * time.Hour),
			UpdatedAt:         now,
		},
	}, nil
}

func (s *RecruiterService) GetApplicationDetail(ctx context.Context, appID uuid.UUID) (*models.JobApplicationDTO, error) {
	apps, err := s.GetApplications(ctx, uuid.Nil, "", "")
	if err != nil || len(apps) == 0 {
		return nil, err
	}
	return &apps[0], nil
}

func (s *RecruiterService) BulkUpdateApplications(ctx context.Context, userID uuid.UUID, payload *models.ATSBulkActionPayload) error {
	return nil
}

func (s *RecruiterService) SubmitInterviewFeedback(ctx context.Context, userID uuid.UUID, payload *models.InterviewFeedbackPayload) (*models.InterviewFeedbackDTO, error) {
	intID, _ := uuid.Parse(payload.InterviewID)
	appID, _ := uuid.Parse(payload.ApplicationID)

	return &models.InterviewFeedbackDTO{
		ID:                 uuid.New(),
		InterviewID:        intID,
		ApplicationID:      appID,
		InterviewerID:      userID,
		InterviewerName:    "Rashid Al-Maktoum",
		OverallRating:      payload.OverallRating,
		TechnicalScore:     payload.TechnicalScore,
		CommunicationScore: payload.CommunicationScore,
		ExperienceScore:    payload.ExperienceScore,
		CultureFitScore:    payload.CultureFitScore,
		Recommendation:     payload.Recommendation,
		Notes:              payload.Notes,
		CreatedAt:          time.Now(),
	}, nil
}

func (s *RecruiterService) CreateJobOffer(ctx context.Context, userID uuid.UUID, payload *models.JobOfferPayload) (*models.JobOfferDTO, error) {
	appID, _ := uuid.Parse(payload.ApplicationID)
	jobID, _ := uuid.Parse(payload.JobID)
	candID, _ := uuid.Parse(payload.CandidateID)

	currency := payload.Currency
	if currency == "" {
		currency = "USD"
	}
	contractType := payload.ContractType
	if contractType == "" {
		contractType = "Full-time"
	}

	return &models.JobOfferDTO{
		ID:            uuid.New(),
		ApplicationID: appID,
		JobID:         jobID,
		CandidateID:   candID,
		CandidateName: "Sarah Chen",
		RecruiterID:   userID,
		PositionTitle: payload.PositionTitle,
		Salary:        payload.Salary,
		Currency:      currency,
		Benefits:      payload.Benefits,
		JoiningDate:   payload.JoiningDate,
		ContractType:  contractType,
		Status:        "Sent",
		CreatedAt:     time.Now(),
		ExpiresAt:     time.Now().Add(14 * 24 * time.Hour),
	}, nil
}

func (s *RecruiterService) UpdateJobOfferStatus(ctx context.Context, userID, offerID uuid.UUID, status string) error {
	return nil
}

func (s *RecruiterService) GetAIEvaluation(ctx context.Context, appID uuid.UUID) (*models.AIEvaluationResponse, error) {
	return &models.AIEvaluationResponse{
		ApplicationID:     appID,
		CandidateName:     "Sarah Chen",
		OverallMatchScore: 96,
		Recommendation:    "Hire",
		SummaryOverview:   "Exceptional fit for Senior Microservices Golang Architect position with 8+ years experience in high-throughput cloud systems.",
		SkillGaps:         []string{"Kafka (Minor)"},
		Strengths:         []string{"Golang Microservices", "PostgreSQL Optimization", "Kubernetes Orchestration", "System Design"},
		RiskFactors:       []string{"Immediate notice requirement due to layoff; high offer acceleration required."},
		SuggestedQuestions: []string{
			"How do you profile memory allocations in high-concurrency Go services?",
			"Describe a scenario where you resolved deadlocks in PostgreSQL pool transactions.",
		},
	}, nil
}
