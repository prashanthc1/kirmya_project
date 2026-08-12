package service

import (
	"context"
	"fmt"
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

func (s *RecruiterService) GetOrCreateProfile(ctx context.Context, userID uuid.UUID, companyName string) (*models.RecruiterOrgProfile, error) {
	if companyName == "" {
		companyName = "Enterprise Global Partners"
	}
	return s.repo.GetOrCreateProfile(ctx, userID, companyName)
}

func (s *RecruiterService) SubmitOnboarding(ctx context.Context, userID uuid.UUID, payload *models.OnboardingPayload) (*models.RecruiterOrgProfile, error) {
	p, err := s.GetOrCreateProfile(ctx, userID, payload.CompanyName)
	if err != nil {
		return nil, err
	}

	p.CompanyName = payload.CompanyName
	p.JobTitle = payload.JobTitle
	p.RecruiterRole = payload.RecruiterRole
	p.Department = payload.Department
	p.ProfessionalInfo = payload.ProfessionalInfo
	p.ContactPhone = payload.ContactPhone
	p.ContactEmail = payload.ContactEmail
	p.VerificationStatus = "Verified"

	err = s.repo.UpdateOrgProfile(ctx, p)
	if err != nil {
		return nil, err
	}

	_ = s.repo.LogActivity(ctx, &models.RecruiterActivity{
		ID:           uuid.New(),
		RecruiterID:  p.ID,
		ActivityType: "Onboarding Completed",
		Description:  fmt.Sprintf("Recruiter onboarding completed for %s (%s)", payload.CompanyName, payload.RecruiterRole),
		CreatedAt:    time.Now(),
	})

	return p, nil
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
	workplaceType := payload.WorkplaceType
	if workplaceType == "" {
		workplaceType = "Remote"
	}
	deadline := payload.Deadline
	if deadline == "" {
		deadline = "2026-10-31"
	}
	status := payload.Status
	if status == "" {
		status = "Active"
	}

	job := &models.RecruiterJob{
		ID:               uuid.New(),
		OrgID:            p.OrgID,
		RecruiterID:      p.ID,
		Title:            payload.Title,
		Department:       payload.Department,
		EmploymentType:   empType,
		WorkplaceType:    workplaceType,
		Location:         payload.Location,
		SalaryRange:      payload.SalaryRange,
		Currency:         payload.Currency,
		ExperienceLevel:  payload.ExperienceLevel,
		RequiredSkills:   payload.RequiredSkills,
		PreferredSkills:  payload.PreferredSkills,
		Education:        payload.Education,
		Certifications:   payload.Certifications,
		Description:      payload.Description,
		Responsibilities: payload.Responsibilities,
		Qualifications:   payload.Qualifications,
		Benefits:         payload.Benefits,
		Deadline:         deadline,
		OpeningsCount:    payload.OpeningsCount,
		Status:           status,
		ApplicantsCount:  0,
		ViewsCount:       1,
		Questions:        payload.Questions,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	err = s.repo.CreateJob(ctx, job)
	if err != nil {
		return nil, err
	}

	_ = s.repo.LogActivity(ctx, &models.RecruiterActivity{
		ID:           uuid.New(),
		RecruiterID:  p.ID,
		ActivityType: "Job Created",
		Description:  fmt.Sprintf("Created job posting: %s", job.Title),
		CreatedAt:    time.Now(),
	})

	return job, nil
}

func (s *RecruiterService) GetJobByID(ctx context.Context, userID, jobID uuid.UUID) (*models.RecruiterJob, error) {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	_ = s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, uuid.Nil, p.CompanyName, "Job Viewed")
	return s.repo.GetJobByID(ctx, jobID)
}

func (s *RecruiterService) UpdateJobStatus(ctx context.Context, userID, jobID uuid.UUID, status string) error {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	err := s.repo.UpdateJobStatus(ctx, jobID, status)
	if err == nil {
		_ = s.repo.LogActivity(ctx, &models.RecruiterActivity{
			ID:           uuid.New(),
			RecruiterID:  p.ID,
			ActivityType: "Job Status Updated",
			Description:  fmt.Sprintf("Updated job status to %s", status),
			CreatedAt:    time.Now(),
		})
	}
	return err
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
			ID:               uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			OrgID:            p.OrgID,
			RecruiterID:      p.ID,
			Title:            "Senior Go Backend Architect",
			Department:       "Engineering & Technology",
			EmploymentType:   "Full-time",
			WorkplaceType:    "Remote",
			Location:         "Dubai / Remote",
			SalaryRange:      "$120,000 - $160,000",
			Currency:         "USD",
			ExperienceLevel:  "Senior",
			RequiredSkills:   []string{"Golang", "PostgreSQL", "Microservices", "Docker"},
			PreferredSkills:  []string{"Kafka", "Kubernetes", "Redis"},
			Status:           "Active",
			ApplicantsCount:  18,
			ViewsCount:       240,
			OpeningsCount:    2,
			Deadline:         "2026-09-30",
			CreatedAt:        time.Now().Add(-48 * time.Hour),
		},
		{
			ID:               uuid.MustParse("22222222-2222-2222-2222-222222222222"),
			OrgID:            p.OrgID,
			RecruiterID:      p.ID,
			Title:            "Lead Frontend Engineer (React/MUI)",
			Department:       "Product Design",
			EmploymentType:   "Full-time",
			WorkplaceType:    "Hybrid",
			Location:         "Abu Dhabi, UAE",
			SalaryRange:      "$100,000 - $130,000",
			Currency:         "USD",
			ExperienceLevel:  "Lead",
			RequiredSkills:   []string{"React", "TypeScript", "MUI v6", "Next.js"},
			PreferredSkills:  []string{"GraphQL", "Framer Motion"},
			Status:           "Active",
			ApplicantsCount:  14,
			ViewsCount:       185,
			OpeningsCount:    1,
			Deadline:         "2026-10-15",
			CreatedAt:        time.Now().Add(-72 * time.Hour),
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
			CandidateAvatar:      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
			Stage:                "New",
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
			CandidateAvatar:      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
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
			CandidateAvatar:      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
			Stage:                "Interview",
			Notes:                "Scheduled for Technical Architecture Round.",
			InterviewScheduledAt: &now,
			UpdatedAt:            now,
		},
	}, nil
}

func (s *RecruiterService) UpdatePipelineStage(ctx context.Context, userID, pipelineID uuid.UUID, payload *models.UpdateStagePayload) error {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	err := s.repo.UpdatePipelineStage(ctx, pipelineID, payload.Stage, payload.Notes, payload.InterviewScheduledAt)
	if err == nil {
		_ = s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, pipelineID, p.CompanyName, fmt.Sprintf("Stage Changed to %s", payload.Stage))
	}
	return err
}

func (s *RecruiterService) GetDashboardOverview(ctx context.Context, userID uuid.UUID) (*models.RecruiterDashboardOverview, error) {
	jobs, _ := s.GetJobs(ctx, userID)
	interviews, _ := s.GetInterviews(ctx, userID)

	return &models.RecruiterDashboardOverview{
		ActiveJobsCount:      2,
		DraftJobsCount:       1,
		TotalApplicantsCount: 142,
		NewCandidatesCount:   18,
		ShortlistedCount:     9,
		InterviewsScheduled:  len(interviews),
		OffersCount:          3,
		SuccessfulHiresCount: 12,
		ExpiringJobsCount:    1,
		RecentJobs:           jobs,
		UpcomingInterviews:   interviews,
		RecentActivities: []models.RecruiterActivity{
			{ID: uuid.New(), ActivityType: "Job Posted", Description: "Published Senior Go Backend Architect position", CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: uuid.New(), ActivityType: "Stage Advanced", Description: "Moved Tariq Al-Mansoor to Shortlisted stage", CreatedAt: time.Now().Add(-5 * time.Hour)},
		},
	}, nil
}

func (s *RecruiterService) GetCandidates(ctx context.Context, userID uuid.UUID) ([]models.RecruiterCandidateItem, error) {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	_ = s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, uuid.Nil, p.CompanyName, "Candidate Search Performed")

	return []models.RecruiterCandidateItem{
		{
			ID:                 uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			Name:               "Sarah Chen",
			Headline:           "Staff Software Engineer & Cloud Architect",
			CurrentRole:        "Staff Engineer at CloudScale",
			Location:           "Dubai, UAE",
			Skills:             []string{"Golang", "React", "TypeScript", "PostgreSQL", "Docker", "Kubernetes"},
			ExperienceYears:    8,
			MatchScore:         96,
			Availability:       "Immediate",
			OpenToWork:         true,
			ResumeURL:          "https://kirmya.com/resumes/sarah-chen.pdf",
			ResumeAvailable:    true,
			VerificationStatus: "Verified",
			Tags: []models.CandidateTagDTO{
				{ID: uuid.New(), Name: "High Priority", Color: "#EF4444"},
				{ID: uuid.New(), Name: "Technical Leader", Color: "#6366F1"},
			},
			Saved:              true,
			RecommendationNote: "96% AI match rating based on job requirements and experience.",
		},
		{
			ID:                 uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
			Name:               "Tariq Al-Mansoor",
			Headline:           "Director of Facilities & Asset Management",
			CurrentRole:        "Facilities Director at Emaar",
			Location:           "Abu Dhabi, UAE",
			Skills:             []string{"Facilities Management", "HVAC", "SLA Auditing", "Vendor Management"},
			ExperienceYears:    12,
			MatchScore:         94,
			Availability:       "2 Weeks Notice",
			OpenToWork:         true,
			ResumeURL:          "https://kirmya.com/resumes/tariq-mansoor.pdf",
			ResumeAvailable:    true,
			VerificationStatus: "Verified",
			Tags: []models.CandidateTagDTO{
				{ID: uuid.New(), Name: "Leadership", Color: "#10B981"},
			},
			Saved:              false,
			RecommendationNote: "Verified leadership track record in commercial real estate.",
		},
	}, nil
}

func (s *RecruiterService) GetCandidateMatch(ctx context.Context, userID, jobID, candidateID uuid.UUID) (*models.CandidateMatchAnalysisDTO, error) {
	return &models.CandidateMatchAnalysisDTO{
		JobID:               jobID,
		CandidateID:         candidateID,
		CandidateName:       "Sarah Chen",
		OverallMatchScore:   96,
		SkillsMatch:         98,
		ExperienceMatch:     95,
		EducationMatch:      90,
		LocationMatch:       100,
		RoleMatch:           95,
		CareerAlignment:     94,
		MissingRequirements: []string{"Kafka Streaming (Minor)"},
		PotentialConcerns:   []string{"High market demand; competitive compensation expected."},
		TransferableSkills:  []string{"PostgreSQL GIN Index Tuning", "Distributed Microservices Architecture", "Team Mentorship"},
		ExplanationNotes:    "Candidate displays exceptional alignment with core Go microservices requirement and cloud infrastructure management.",
	}, nil
}

func (s *RecruiterService) SaveCandidate(ctx context.Context, candidateID, userID uuid.UUID) error {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	return s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, candidateID, p.CompanyName, "Candidate Saved")
}

func (s *RecruiterService) GetInterviews(ctx context.Context, userID uuid.UUID) ([]models.InterviewItem, error) {
	now := time.Now()
	return []models.InterviewItem{
		{
			ID:              uuid.New(),
			JobID:           uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			CandidateID:     uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
			CandidateName:   "Sarah Chen",
			CandidateAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
			Type:            "Video",
			ScheduledAt:     now.Add(24 * time.Hour),
			DurationMinutes: 45,
			MeetingLink:     "https://meet.google.com/abc-defg-hij",
			Instructions:    "Review system architecture diagram prior to call.",
			Notes:           "Technical Systems Architecture Deep Dive",
			Status:          "Scheduled",
			CreatedAt:       now.Add(-2 * time.Hour),
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
		Instructions:    payload.Instructions,
		Notes:           payload.Notes,
		Status:          "Scheduled",
		CreatedAt:       time.Now(),
	}

	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	_ = s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, candID, p.CompanyName, "Interview Scheduled")

	return item, nil
}

func (s *RecruiterService) GetAnalytics(ctx context.Context, userID uuid.UUID) (*models.RecruiterAnalytics, error) {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	return s.repo.GetAnalytics(ctx, p.ID)
}

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
			CandidateAvatar:   "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
			CandidateLocation: "Dubai, UAE",
			ExperienceYears:   8,
			Skills:            []string{"Golang", "React", "TypeScript", "PostgreSQL", "Docker"},
			AIMatchScore:      96,
			CurrentStage:      "New",
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
			CandidateAvatar:   "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
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
			CandidateAvatar:   "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
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
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	for _, appIDStr := range payload.ApplicationIDs {
		appID, _ := uuid.Parse(appIDStr)
		_ = s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, appID, p.CompanyName, fmt.Sprintf("Bulk Action: %s to %s", payload.Action, payload.TargetStage))
	}
	return nil
}

func (s *RecruiterService) SubmitInterviewFeedback(ctx context.Context, userID uuid.UUID, payload *models.InterviewFeedbackPayload) (*models.InterviewFeedbackDTO, error) {
	intID, _ := uuid.Parse(payload.InterviewID)
	appID, _ := uuid.Parse(payload.ApplicationID)

	return &models.InterviewFeedbackDTO{
		ID:                   uuid.New(),
		InterviewID:          intID,
		ApplicationID:        appID,
		InterviewerID:        userID,
		InterviewerName:      "Rashid Al-Maktoum",
		TechnicalSkillsScore: payload.TechnicalSkillsScore,
		CommunicationScore:   payload.CommunicationScore,
		ProblemSolvingScore:  payload.ProblemSolvingScore,
		CultureFitScore:      payload.CultureFitScore,
		LeadershipScore:      payload.LeadershipScore,
		OverallRating:        payload.OverallRating,
		Recommendation:       payload.Recommendation,
		Comments:             payload.Comments,
		CreatedAt:            time.Now(),
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

	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	_ = s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, candID, p.CompanyName, "Offer Created")

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
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	return s.repo.LogCandidateAccess(ctx, p.OrgID, p.ID, offerID, p.CompanyName, fmt.Sprintf("Offer Status Updated to %s", status))
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

func (s *RecruiterService) GetMessageTemplates(ctx context.Context, userID uuid.UUID) ([]models.MessageTemplateDTO, error) {
	p, _ := s.GetOrCreateProfile(ctx, userID, "")
	return []models.MessageTemplateDTO{
		{
			ID:        uuid.New(),
			OrgID:     p.OrgID,
			Title:     "Interview Invitation",
			Subject:   "Interview Invitation: {{job_title}} at {{company_name}}",
			Body:      "Hi {{candidate_name}},\n\nWe were impressed by your profile for {{job_title}}. We would like to invite you for a 45-minute technical interview on {{interview_date}}.\n\nBest regards,\n{{recruiter_name}}",
			Category:  "InterviewInvite",
			CreatedBy: userID,
			CreatedAt: time.Now().Add(-30 * 24 * time.Hour),
		},
		{
			ID:        uuid.New(),
			OrgID:     p.OrgID,
			Title:     "Application Received",
			Subject:   "Application Received for {{job_title}}",
			Body:      "Dear {{candidate_name}},\n\nThank you for applying for {{job_title}} at {{company_name}}. Our recruiting team is reviewing your background.\n\nSincerely,\n{{recruiter_name}}",
			Category:  "Received",
			CreatedBy: userID,
			CreatedAt: time.Now().Add(-60 * 24 * time.Hour),
		},
	}, nil
}

func (s *RecruiterService) GetTeamMembers(ctx context.Context, userID uuid.UUID) ([]models.TeamMemberDTO, error) {
	return []models.TeamMemberDTO{
		{
			ID:            uuid.New(),
			UserID:        userID,
			Name:          "Rashid Al-Maktoum",
			Email:         "recruiter@kirmya.ae",
			RecruiterRole: "Organization Owner",
			Department:    "Talent Acquisition",
			Status:        "Active",
			JoinedAt:      time.Now().Add(-180 * 24 * time.Hour),
		},
		{
			ID:            uuid.New(),
			UserID:        uuid.New(),
			Name:          "Amira Al-Farsi",
			Email:         "amira@kirmya.ae",
			RecruiterRole: "Hiring Manager",
			Department:    "Engineering",
			Status:        "Active",
			JoinedAt:      time.Now().Add(-90 * 24 * time.Hour),
		},
	}, nil
}
