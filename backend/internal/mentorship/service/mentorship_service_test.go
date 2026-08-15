package service_test

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/mentorship/models"
	"kirmya/internal/mentorship/repository"
	"kirmya/internal/mentorship/service"
)

func setupTestService() service.MentorshipService {
	repo := repository.NewMemoryMentorshipRepository()
	return service.NewMentorshipService(repo)
}

func TestMentorProfileCreationAndSearch(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	// 1. Create Profile
	profileDTO := models.UpdateMentorProfileDTO{
		Bio:             "Senior Software Engineer & Tech Lead",
		JobTitle:        "Staff Engineer",
		Company:         "TechCorp",
		YearsExperience: 10,
		Expertise:       []string{"Go", "Distributed Systems", "Cloud Architecture"},
		Industries:      []string{"Software", "FinTech"},
		Languages:       []string{"English", "Spanish"},
		HourlyRate:      100.0,
		MaxMentees:      2,
		SessionTypes:    []string{"1on1", "CodeReview"},
	}

	prof, err := svc.CreateOrUpdateProfile(ctx, "user-mentor-1", profileDTO)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if prof.UserID != "user-mentor-1" || prof.MaxMentees != 2 || !prof.IsAvailable {
		t.Errorf("unexpected profile fields: %+v", prof)
	}

	// 2. Fetch Profile by User ID
	gotProf, err := svc.GetProfileByUserID(ctx, "user-mentor-1")
	if err != nil || gotProf.ID != prof.ID {
		t.Fatalf("failed to get profile by user ID: %v", err)
	}

	// 3. Search Mentors
	searchRes, total, err := svc.SearchMentors(ctx, models.MentorFilterParams{
		Search: "Distributed Systems",
	})
	if err != nil || total != 1 || len(searchRes) != 1 {
		t.Fatalf("expected 1 search result, got %d (total %d), err: %v", len(searchRes), total, err)
	}

	// 4. Recommendations
	recs, err := svc.GetRecommendations(ctx, "user-mentee-1", []string{"Go", "Kubernetes"})
	if err != nil || len(recs) != 1 {
		t.Fatalf("expected 1 recommendation, got %d, err: %v", len(recs), err)
	}
}

func TestMentorshipRequestValidation(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	// Create Mentor
	profDTO := models.UpdateMentorProfileDTO{
		Bio:             "Go Expert",
		JobTitle:        "Tech Lead",
		Company:         "Acme",
		YearsExperience: 8,
		Expertise:       []string{"Go"},
		MaxMentees:      1,
	}
	mentorProf, err := svc.CreateOrUpdateProfile(ctx, "mentor-123", profDTO)
	if err != nil {
		t.Fatalf("failed to create mentor: %v", err)
	}

	// 1. Self Request Error
	_, err = svc.CreateMentorshipRequest(ctx, "mentor-123", models.CreateMentorshipRequestDTO{
		MentorID: mentorProf.ID,
		Message:  "Hello myself",
	})
	if err != service.ErrSelfMentorshipNotAllowed {
		t.Fatalf("expected ErrSelfMentorshipNotAllowed, got %v", err)
	}

	// 2. Valid Request
	req, err := svc.CreateMentorshipRequest(ctx, "mentee-1", models.CreateMentorshipRequestDTO{
		MentorID: mentorProf.ID,
		Message:  "Please mentor me in Go",
		Goals:    []string{"Master Go Concurrency"},
	})
	if err != nil || req.Status != models.RequestStatusPending {
		t.Fatalf("failed to create valid request: %v", err)
	}

	// 3. Duplicate Pending Request Error
	_, err = svc.CreateMentorshipRequest(ctx, "mentee-1", models.CreateMentorshipRequestDTO{
		MentorID: mentorProf.ID,
		Message:  "Duplicate request",
	})
	if err != service.ErrDuplicateRequest {
		t.Fatalf("expected ErrDuplicateRequest, got %v", err)
	}

	// 4. Accept Request & Capacity Enforcement
	updatedReq, err := svc.RespondToMentorshipRequest(ctx, "mentor-123", req.ID, models.UpdateMentorshipRequestDTO{
		Status:          models.RequestStatusAccepted,
		ResponseMessage: "Glad to help!",
	})
	if err != nil || updatedReq.Status != models.RequestStatusAccepted {
		t.Fatalf("failed to accept request: %v", err)
	}

	// Mentor profile should now have CurrentMentees=1, IsAvailable=false (since MaxMentees=1)
	updatedProf, err := svc.GetProfileByUserID(ctx, "mentor-123")
	if err != nil {
		t.Fatalf("failed to get mentor profile: %v", err)
	}
	if updatedProf.CurrentMentees != 1 || updatedProf.IsAvailable != false {
		t.Errorf("expected CurrentMentees=1 and IsAvailable=false, got CurrentMentees=%d, IsAvailable=%v", updatedProf.CurrentMentees, updatedProf.IsAvailable)
	}

	// 5. Mentor Capacity Reached Error for another mentee
	_, err = svc.CreateMentorshipRequest(ctx, "mentee-2", models.CreateMentorshipRequestDTO{
		MentorID: mentorProf.ID,
		Message:  "Request to full mentor",
	})
	if err != service.ErrMentorNotAvailable {
		t.Fatalf("expected ErrMentorNotAvailable, got %v", err)
	}
}

func TestMentorshipGoalsAndSessions(t *testing.T) {
	svc := setupTestService()
	ctx := context.Background()

	// Setup Mentor & Mentee with active relationship
	profDTO := models.UpdateMentorProfileDTO{
		Bio:        "Engineering Manager",
		MaxMentees: 5,
	}
	mentorProf, _ := svc.CreateOrUpdateProfile(ctx, "mentor-a", profDTO)
	req, _ := svc.CreateMentorshipRequest(ctx, "mentee-b", models.CreateMentorshipRequestDTO{
		MentorID: mentorProf.ID,
		Message:  "Career growth mentorship",
	})
	_, _ = svc.RespondToMentorshipRequest(ctx, "mentor-a", req.ID, models.UpdateMentorshipRequestDTO{
		Status: models.RequestStatusAccepted,
	})

	mentorships, err := svc.GetUserMentorships(ctx, "mentee-b")
	if err != nil || len(mentorships) != 1 {
		t.Fatalf("expected 1 active mentorship, got %d, err: %v", len(mentorships), err)
	}
	mID := mentorships[0].ID

	// 1. Goal Tracking
	targetDate := time.Now().Add(30 * 24 * time.Hour)
	goal, err := svc.CreateGoal(ctx, "mentee-b", models.CreateMentorshipGoalDTO{
		MentorshipID: mID,
		Title:        "System Design Mastery",
		Description:  "Read Designing Data-Intensive Applications",
		TargetDate:   &targetDate,
	})
	if err != nil || goal.Progress != 0 {
		t.Fatalf("failed to create goal: %v", err)
	}

	updatedGoal, err := svc.UpdateGoal(ctx, "mentee-b", goal.ID, models.UpdateMentorshipGoalDTO{
		Progress: 100,
	})
	if err != nil || updatedGoal.Status != models.GoalStatusCompleted {
		t.Fatalf("expected goal to be completed when progress=100, got status=%s, err=%v", updatedGoal.Status, err)
	}

	// 2. Session Scheduling
	sessionDate := time.Now().Add(24 * time.Hour)
	session, err := svc.CreateSession(ctx, "mentor-a", models.CreateMentorshipSessionDTO{
		MentorshipID:    mID,
		Title:           "Initial Kickoff & Goal Alignment",
		ScheduledAt:     sessionDate,
		DurationMinutes: 45,
		MeetingURL:      "https://meet.kirmya.com/room-123",
	})
	if err != nil || session.Status != models.SessionStatusScheduled {
		t.Fatalf("failed to schedule session: %v", err)
	}

	updatedSession, err := svc.UpdateSession(ctx, "mentor-a", session.ID, models.UpdateMentorshipSessionDTO{
		Status: models.SessionStatusCompleted,
		Notes:  "Great initial sync, outlined 3 key areas.",
	})
	if err != nil || updatedSession.Status != models.SessionStatusCompleted {
		t.Fatalf("failed to update session: %v", err)
	}

	// 3. Feedback Submission
	fb, err := svc.SubmitFeedback(ctx, "mentee-b", models.CreateMentorshipFeedbackDTO{
		MentorshipID: mID,
		SessionID:    session.ID,
		Rating:       5,
		Comment:      "Outstanding mentor!",
	})
	if err != nil || fb.Rating != 5 {
		t.Fatalf("failed to submit feedback: %v", err)
	}

	// Verify mentor rating updated
	mentorProfAfter, _ := svc.GetProfileByUserID(ctx, "mentor-a")
	if mentorProfAfter.TotalReviews != 1 || mentorProfAfter.Rating != 5.0 {
		t.Errorf("expected 1 review with 5.0 rating, got %d reviews with %.1f rating", mentorProfAfter.TotalReviews, mentorProfAfter.Rating)
	}
}
