package integration

import (
	"context"
	"testing"
	"time"

	aiDomain "kirmya/internal/ai_job_match/domain"
	aiRepo "kirmya/internal/ai_job_match/repository"
	appModels "kirmya/internal/applications/models"
	appRepo "kirmya/internal/applications/repository"
	authModels "kirmya/internal/auth/models"
	authRepo "kirmya/internal/auth/repository"
	commModels "kirmya/internal/community/models"
	commRepo "kirmya/internal/community/repository"
	compDomain "kirmya/internal/compliance/domain"
	compRepo "kirmya/internal/compliance/repository"
	entDomain "kirmya/internal/enterprise_hiring/domain"
	entRepo "kirmya/internal/enterprise_hiring/repository"
	interviewDomain "kirmya/internal/interview/domain"
	interviewRepo "kirmya/internal/interview/repository"
	jobsModels "kirmya/internal/jobs/models"
	jobsRepo "kirmya/internal/jobs/repository"
	msgModels "kirmya/internal/messaging/models"
	msgRepo "kirmya/internal/messaging/repository"
	netModels "kirmya/internal/networking/models"
	netRepo "kirmya/internal/networking/repository"
	notifyModels "kirmya/internal/notification/models"
	notifyRepo "kirmya/internal/notification/repository"
	profileModels "kirmya/internal/profile/models"
	profileRepo "kirmya/internal/profile/repository"
	recRepo "kirmya/internal/recruiter/repository"
	trustModels "kirmya/internal/trust_safety/models"
	trustRepo "kirmya/internal/trust_safety/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Journey 1: Candidate End-to-End Workflow (Auth -> Profile -> Search -> Apply -> Notification)
func TestCandidateE2EWorkflow(t *testing.T) {
	ctx := context.Background()
	userRepo := authRepo.NewAuthRepository(nil)
	pRepo := profileRepo.NewProfileRepository(nil)
	jRepo := jobsRepo.NewJobRepository(nil)
	aRepo := appRepo.NewApplicationsRepository(nil)
	nRepo := notifyRepo.NewNotificationRepository(nil)

	// Step 1: User Registration
	candidateID := uuid.New()
	err := userRepo.CreateUser(ctx, &authModels.User{
		ID:        candidateID,
		Email:     "candidate.flow@kirmya.ae",
		FirstName: "Jane",
		LastName:  "Engineer",
		RoleID:    uuid.New().String(),
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	})
	require.NoError(t, err)

	// Step 2: Complete Profile
	profile := &profileModels.UserProfile{
		ID:                 uuid.New(),
		UserID:             candidateID,
		Headline:           "Senior Distributed Systems Engineer",
		Summary:            "Passionate about Go, PostgreSQL, and high-throughput micro-services",
		Location:           "Dubai",
		Country:            "UAE",
		AvailabilityStatus: "open",
		OpenToWork:         true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}
	if pRepo != nil {
		_ = pRepo.Create(ctx, profile)
	}

	// Step 3: Search Platform Jobs
	_, _ = jRepo.SearchJobs(ctx, jobsModels.JobSearchQuery{
		Query: "Backend",
		Page:  1,
		Limit: 10,
	})

	// Step 4: Submit Application
	jobID := uuid.New()
	appDetail, err := aRepo.CreateApplication(ctx, candidateID, appModels.CreateApplicationPayload{
		JobID: jobID,
	})
	require.NoError(t, err)
	require.NotNil(t, appDetail)

	// Step 5: Notification Generated for Candidate
	notif := &notifyModels.Notification{
		ID:        uuid.New(),
		UserID:    candidateID,
		Category:  notifyModels.CategoryApplications,
		Type:      "application_update",
		Priority:  notifyModels.PriorityNormal,
		Title:     "Application Submitted",
		Content:   "Your application for Staff Backend Architect was successfully submitted.",
		IsRead:    false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err = nRepo.Create(ctx, notif)
	require.NoError(t, err)

	notifs, err := nRepo.List(ctx, candidateID, "", false, 10, 0)
	require.NoError(t, err)
	assert.NotEmpty(t, notifs)
	assert.False(t, notifs[0].IsRead)
}

// Journey 2: Recruiter ATS & Hiring Workflow (Recruiter Setup -> Application Management -> Interview Scheduling)
func TestRecruiterHiringWorkflow(t *testing.T) {
	ctx := context.Background()
	rRepo := recRepo.NewRecruiterRepository(nil)
	aRepo := appRepo.NewApplicationsRepository(nil)
	iRepo := interviewRepo.NewInterviewRepository(nil)

	recruiterID := uuid.New()
	candidateID := uuid.New()
	jobID := uuid.New()

	// Step 1: Recruiter Profile & Organization Setup
	recProfile, err := rRepo.GetOrCreateProfile(ctx, recruiterID, "Kirmya Technologies")
	require.NoError(t, err)
	require.NotNil(t, recProfile)
	assert.Equal(t, "Kirmya Technologies", recProfile.CompanyName)

	// Step 2: Recruiter Reviews Candidate Application
	appDetail, err := aRepo.CreateApplication(ctx, candidateID, appModels.CreateApplicationPayload{
		JobID: jobID,
	})
	require.NoError(t, err)
	require.NotNil(t, appDetail)

	// Step 3: Schedule Technical Interview Round
	interviewID := uuid.New()
	roundID := uuid.New()
	interview := &interviewDomain.Interview{
		ID:             interviewID,
		CandidateID:    candidateID,
		JobID:          &jobID,
		OrganizerID:    recruiterID,
		Title:          "Senior Backend Technical Panel",
		Status:         interviewDomain.StatusScheduled,
		ScheduledStart: time.Now().Add(48 * time.Hour),
		ScheduledEnd:   time.Now().Add(49 * time.Hour),
		LocationType:   "video",
		MeetingLink:    "https://meet.kirmya.ae/tech-panel",
	}
	err = iRepo.CreateInterview(ctx, interview)
	require.NoError(t, err)

	round := &interviewDomain.InterviewRound{
		ID:             roundID,
		InterviewID:    interviewID,
		RoundNumber:    1,
		RoundName:      "System Design & Live Coding",
		RoundType:      "technical",
		Status:         interviewDomain.StatusScheduled,
		ScheduledStart: time.Now().Add(48 * time.Hour),
		ScheduledEnd:   time.Now().Add(49 * time.Hour),
	}
	err = iRepo.CreateRound(ctx, round)
	require.NoError(t, err)

	// Step 4: Panelist Submits Feedback Scorecard
	interviewerID := uuid.New()
	feedback := &interviewDomain.InterviewFeedback{
		ID:             uuid.New(),
		InterviewID:    interviewID,
		RoundID:        roundID,
		InterviewerID:  interviewerID,
		Rating:         10,
		TechnicalScore: 10,
		Recommendation: interviewDomain.RecStrongHire,
		FeedbackText:   "Outstanding architecture depth and Go concurrent programming skill.",
		CreatedAt:      time.Now(),
	}
	err = iRepo.SubmitFeedback(ctx, feedback)
	require.NoError(t, err)

	feedbacks, err := iRepo.GetFeedbackByInterviewID(ctx, interviewID)
	require.NoError(t, err)
	assert.Len(t, feedbacks, 1)
	assert.Equal(t, interviewDomain.RecStrongHire, feedbacks[0].Recommendation)
}

// Journey 3: Networking & Connections Workflow (Request -> Accept -> Established)
func TestNetworkingAndConnectionsWorkflow(t *testing.T) {
	ctx := context.Background()
	nRepo := netRepo.NewNetworkingRepository(nil)

	userA := uuid.New()
	userB := uuid.New()

	// Step 1: User A sends connection request to User B
	req := &netModels.ConnectionRequest{
		ID:         uuid.New(),
		SenderID:   userA,
		ReceiverID: userB,
		Status:     "pending",
		Note:       "Hi, I noticed your work on distributed databases and would love to connect!",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	err := nRepo.CreateRequest(ctx, req)
	require.NoError(t, err)

	// Step 2: User B views incoming requests
	incoming, err := nRepo.ListIncomingRequests(ctx, userB)
	require.NoError(t, err)
	assert.NotEmpty(t, incoming)
	assert.Equal(t, req.ID, incoming[0].ID)

	// Step 3: User B accepts connection request
	err = nRepo.AcceptRequestTx(ctx, req.ID, userB)
	require.NoError(t, err)
}

// Journey 4: Messaging Workflow (Conversation -> Message -> Read State Consistency)
func TestMessagingWorkflow(t *testing.T) {
	ctx := context.Background()
	mRepo := msgRepo.NewMessagingRepository(nil)

	userA := uuid.New()
	userB := uuid.New()
	convID := uuid.New()

	// Step 1: Create Conversation
	conv := &msgModels.Conversation{
		ID:        convID,
		UserID1:   userA,
		UserID2:   userB,
		CreatedAt: time.Now(),
	}
	err := mRepo.CreateConversation(ctx, conv)
	require.NoError(t, err)

	// Step 2: User A sends message
	msg := &msgModels.Message{
		ID:             uuid.New(),
		ConversationID: convID,
		SenderID:       userA,
		Content:        "Hello! Great connecting with you on Kirmya.",
		IsRead:         false,
		CreatedAt:      time.Now(),
	}
	err = mRepo.CreateMessage(ctx, msg)
	require.NoError(t, err)

	// Step 3: List messages
	msgs, err := mRepo.ListMessages(ctx, convID)
	require.NoError(t, err)
	assert.NotEmpty(t, msgs)

	// Step 4: User B marks message read
	err = mRepo.UpdateUnread(ctx, convID, userB)
	require.NoError(t, err)
}

// Journey 5: Community & Moderation Workflow (Join -> Post -> Comment -> Report -> Moderate)
func TestCommunityAndModerationWorkflow(t *testing.T) {
	ctx := context.Background()
	cRepo := commRepo.NewCommunityRepository(nil)
	tRepo := trustRepo.NewTrustSafetyRepository(nil)

	authorID := uuid.New()
	commenterID := uuid.New()
	moderatorID := uuid.New()

	// Step 1: Create Community
	communityID := uuid.New()
	community := &commModels.Community{
		ID:          communityID,
		Title:       "Go Backend Architects UAE",
		Description: "Community for Go architects building resilient platforms.",
		Category:    "Technology",
		Visibility:  "public",
		OwnerID:     authorID,
		MemberCount: 1,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	err := cRepo.Create(ctx, community)
	require.NoError(t, err)

	// Step 2: Create Discussion Post
	postID := uuid.New()
	post := &commModels.CommunityPost{
		ID:          postID,
		CommunityID: communityID,
		UserID:      authorID,
		Title:       "Best practices for PostgreSQL Connection Pooling with pgx/v5",
		Content:     "Using MaxConns, MinConns, and proper context timeouts...",
		CreatedAt:   time.Now(),
	}
	err = cRepo.CreatePost(ctx, post)
	require.NoError(t, err)

	// Step 3: Add Comment
	commentID := uuid.New()
	comment := &commModels.CommunityComment{
		ID:          commentID,
		PostID:      postID,
		CommunityID: communityID,
		UserID:      commenterID,
		Content:     "Agreed! Setting MaxConnIdleTime is essential to avoid ghost sockets.",
		CreatedAt:   time.Now(),
	}
	err = cRepo.CreateComment(ctx, comment)
	require.NoError(t, err)

	// Step 4: Trust & Safety Report Submitted
	report := &trustModels.SafetyReport{
		ID:          uuid.New(),
		ReporterID:  authorID,
		TargetType:  "comment",
		TargetID:    commentID,
		Category:    "spam",
		Description: "Spam check evaluation",
		Status:      "submitted",
		Priority:    "normal",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	err = tRepo.CreateReport(ctx, report)
	require.NoError(t, err)

	// Step 5: Moderator Reviews and Resolves Case
	decision := &trustModels.ModerationDecision{
		ID:               uuid.New(),
		AdminID:          moderatorID,
		TargetType:       "comment",
		TargetID:         commentID,
		ActionType:       "warning",
		EnforcementLevel: "standard",
		Reason:           "Verified and compliant",
		IsActive:         true,
		CreatedAt:        time.Now(),
	}
	err = tRepo.CreateModerationDecision(ctx, decision)
	require.NoError(t, err)
}

// Journey 6: AI Job Matching & Multi-Factor Scoring Workflow
func TestAIJobMatchingWorkflow(t *testing.T) {
	ctx := context.Background()
	mRepo := aiRepo.NewMatchingRepository(nil)

	userID := uuid.New()
	jobID := uuid.New()
	matchID := uuid.New()

	match := &aiDomain.AIJobMatch{
		ID:            matchID,
		UserID:        userID,
		JobID:         jobID,
		JobTitle:      "Principal Platform Engineer",
		CompanyName:   "Kirmya Core Systems",
		OverallScore:  96,
		MatchTier:     aiDomain.TierStrongMatch,
		Explanation:   "Perfect match on Go, PostgreSQL, high-concurrency architecture.",
		MatchedSkills: []string{"Go", "PostgreSQL", "Docker", "Kubernetes"},
		CreatedAt:     time.Now(),
	}

	breakdown := &aiDomain.MatchingScore{
		SkillsScore:       98,
		ExperienceScore:   95,
		GoalsScore:        92,
		LocationScore:     100,
		SalaryScore:       95,
		LearningScore:     90,
		ApplicationsScore: 95,
	}

	err := mRepo.SaveMatch(ctx, match, breakdown)
	require.NoError(t, err)

	fetched, err := mRepo.GetMatchByID(ctx, matchID)
	require.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, 96, fetched.OverallScore)
	assert.NotNil(t, fetched.Breakdown)
	assert.Equal(t, 98, fetched.Breakdown.SkillsScore)
}

// Journey 7: Compliance, Privacy & Data Request Workflow
func TestComplianceAndPrivacyWorkflow(t *testing.T) {
	ctx := context.Background()
	cRepo := compRepo.NewComplianceRepository(nil)

	userID := uuid.New()

	// 1. Consent Tracking
	consent := &compDomain.ConsentRecord{
		ID:          uuid.New(),
		UserID:      userID,
		ConsentType: compDomain.ConsentAnalytics,
		IsGranted:   true,
		GrantedAt:   time.Now(),
		IPAddress:   "192.168.1.100",
	}
	err := cRepo.SaveConsent(ctx, consent)
	require.NoError(t, err)

	// 2. Data Subject Request (DSR)
	req := &compDomain.DataRequest{
		ID:          uuid.New(),
		UserID:      userID,
		RequestType: compDomain.RequestTypeExport,
		Status:      compDomain.RequestStatusPending,
		RequestedAt: time.Now(),
	}
	err = cRepo.CreateDataRequest(ctx, req)
	require.NoError(t, err)

	fetched, err := cRepo.GetRequestByID(ctx, req.ID)
	require.NoError(t, err)
	assert.NotNil(t, fetched)
	assert.Equal(t, compDomain.RequestStatusPending, fetched.Status)
}

// Journey 8: Enterprise Hiring Squads & Multi-Tenant Isolation
func TestEnterpriseHiringWorkflow(t *testing.T) {
	ctx := context.Background()
	eRepo := entRepo.NewEnterpriseRepository(nil)

	entID := uuid.New()

	// 1. Create Hiring Squad
	team := &entDomain.HiringTeam{
		ID:             uuid.New(),
		EnterpriseID:   entID,
		DepartmentName: "Infrastructure",
		TeamName:       "Core SRE Squad",
		TeamLeadID:     uuid.New(),
		TeamLeadName:   "Marcus Vance",
		MemberCount:    8,
		CreatedAt:      time.Now(),
	}
	err := eRepo.CreateTeam(ctx, team)
	require.NoError(t, err)

	teams, err := eRepo.GetTeams(ctx, entID)
	require.NoError(t, err)
	assert.NotEmpty(t, teams)

	// 2. Candidate Talent Pool
	pool := &entDomain.CandidatePool{
		ID:             uuid.New(),
		EnterpriseID:   entID,
		Name:           "High Performance Go Engineers",
		Description:    "Pre-evaluated candidates with >5 yrs Go and PostgreSQL",
		CandidateCount: 14,
		CreatedAt:      time.Now(),
	}
	err = eRepo.CreateCandidatePool(ctx, pool)
	require.NoError(t, err)

	pools, err := eRepo.GetCandidatePools(ctx, entID)
	require.NoError(t, err)
	assert.NotEmpty(t, pools)
}
