package service

import (
	"context"
	"errors"
	"fmt"

	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/mentorship/models"
	"kirmya/internal/mentorship/repository"
)

var (
	ErrSelfMentorshipNotAllowed = errors.New("cannot request mentorship from yourself")
	ErrDuplicateRequest        = errors.New("a pending or active mentorship request already exists with this mentor")
	ErrMentorNotAvailable      = errors.New("mentor is currently not available for new mentees")
	ErrMentorCapacityReached    = errors.New("mentor has reached maximum mentee capacity")
	ErrUnauthorized            = errors.New("unauthorized to access or modify this mentorship resource")
	ErrInvalidStatus           = errors.New("invalid request status transition")
)

type MentorshipService interface {
	// Profile management
	CreateOrUpdateProfile(ctx context.Context, userID string, dto models.UpdateMentorProfileDTO) (*models.MentorProfile, error)
	GetProfileByUserID(ctx context.Context, userID string) (*models.MentorProfile, error)
	GetProfileByID(ctx context.Context, id string) (*models.MentorProfile, error)
	SearchMentors(ctx context.Context, params models.MentorFilterParams) ([]*models.MentorProfile, int, error)
	GetRecommendations(ctx context.Context, userID string, userSkills []string) ([]*models.MentorProfile, error)

	// Mentorship requests
	CreateMentorshipRequest(ctx context.Context, menteeID string, dto models.CreateMentorshipRequestDTO) (*models.MentorshipRequest, error)
	RespondToMentorshipRequest(ctx context.Context, userID string, requestID string, dto models.UpdateMentorshipRequestDTO) (*models.MentorshipRequest, error)
	GetUserRequests(ctx context.Context, userID string, role string) ([]*models.MentorshipRequest, error)

	// Active relationships
	GetUserMentorships(ctx context.Context, userID string) ([]*models.Mentorship, error)
	GetMentorshipByID(ctx context.Context, userID string, mentorshipID string) (*models.Mentorship, error)

	// Goals
	CreateGoal(ctx context.Context, userID string, dto models.CreateMentorshipGoalDTO) (*models.MentorshipGoal, error)
	GetGoals(ctx context.Context, userID string, mentorshipID string) ([]*models.MentorshipGoal, error)
	UpdateGoal(ctx context.Context, userID string, goalID string, dto models.UpdateMentorshipGoalDTO) (*models.MentorshipGoal, error)

	// Sessions
	CreateSession(ctx context.Context, userID string, dto models.CreateMentorshipSessionDTO) (*models.MentorshipSession, error)
	GetSessions(ctx context.Context, userID string, mentorshipID string) ([]*models.MentorshipSession, error)
	UpdateSession(ctx context.Context, userID string, sessionID string, dto models.UpdateMentorshipSessionDTO) (*models.MentorshipSession, error)

	// Feedback
	SubmitFeedback(ctx context.Context, fromUserID string, dto models.CreateMentorshipFeedbackDTO) (*models.MentorshipFeedback, error)
	GetFeedbackForMentorship(ctx context.Context, userID string, mentorshipID string) ([]*models.MentorshipFeedback, error)
}

type mentorshipService struct {
	repo repository.MentorshipRepository
}

func NewMentorshipService(repo repository.MentorshipRepository) MentorshipService {
	return &mentorshipService{
		repo: repo,
	}
}

// Profile management
func (s *mentorshipService) CreateOrUpdateProfile(ctx context.Context, userID string, dto models.UpdateMentorProfileDTO) (*models.MentorProfile, error) {
	if userID == "" {
		return nil, errors.New("user ID is required")
	}

	maxMentees := dto.MaxMentees
	if maxMentees <= 0 {
		maxMentees = 5
	}

	isAvailable := true
	if dto.IsAvailable != nil {
		isAvailable = *dto.IsAvailable
	}

	existing, err := s.repo.GetMentorProfileByUserID(ctx, userID)
	if err == nil && existing != nil {
		// Update existing profile
		existing.Bio = dto.Bio
		existing.JobTitle = dto.JobTitle
		existing.Company = dto.Company
		existing.YearsExperience = dto.YearsExperience
		existing.Expertise = dto.Expertise
		existing.Industries = dto.Industries
		existing.Languages = dto.Languages
		existing.HourlyRate = dto.HourlyRate
		existing.MaxMentees = maxMentees
		existing.IsAvailable = isAvailable
		existing.SessionTypes = dto.SessionTypes
		existing.UpdatedAt = time.Now()

		if err := s.repo.UpdateMentorProfile(ctx, existing); err != nil {
			return nil, fmt.Errorf("failed to update mentor profile: %w", err)
		}
		return existing, nil
	}

	// Create new profile
	profile := &models.MentorProfile{
		ID:              uuid.New().String(),
		UserID:          userID,
		Bio:             dto.Bio,
		JobTitle:        dto.JobTitle,
		Company:         dto.Company,
		YearsExperience: dto.YearsExperience,
		Expertise:       dto.Expertise,
		Industries:      dto.Industries,
		Languages:       dto.Languages,
		HourlyRate:      dto.HourlyRate,
		MaxMentees:      maxMentees,
		CurrentMentees:  0,
		Rating:          5.0,
		TotalReviews:    0,
		IsAvailable:     isAvailable,
		IsFeatured:      false,
		SessionTypes:    dto.SessionTypes,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.repo.CreateMentorProfile(ctx, profile); err != nil {
		return nil, fmt.Errorf("failed to create mentor profile: %w", err)
	}
	return profile, nil
}

func (s *mentorshipService) GetProfileByUserID(ctx context.Context, userID string) (*models.MentorProfile, error) {
	return s.repo.GetMentorProfileByUserID(ctx, userID)
}

func (s *mentorshipService) GetProfileByID(ctx context.Context, id string) (*models.MentorProfile, error) {
	return s.repo.GetMentorProfileByID(ctx, id)
}

func (s *mentorshipService) SearchMentors(ctx context.Context, params models.MentorFilterParams) ([]*models.MentorProfile, int, error) {
	return s.repo.ListMentorProfiles(ctx, params)
}

func (s *mentorshipService) GetRecommendations(ctx context.Context, userID string, userSkills []string) ([]*models.MentorProfile, error) {
	avail := true
	params := models.MentorFilterParams{
		IsAvailable: &avail,
		Limit:       100,
	}

	profiles, _, err := s.repo.ListMentorProfiles(ctx, params)
	if err != nil {
		return nil, err
	}

	type scoredProfile struct {
		profile *models.MentorProfile
		score   float64
	}

	var scored []scoredProfile
	for _, p := range profiles {
		if p.UserID == userID {
			continue // Don't recommend oneself
		}

		score := 0.0
		// Skill/expertise match
		for _, exp := range p.Expertise {
			for _, skill := range userSkills {
				if strings.EqualFold(exp, skill) {
					score += 10.0
				} else if strings.Contains(strings.ToLower(exp), strings.ToLower(skill)) {
					score += 5.0
				}
			}
		}

		// Experience bonus
		score += float64(p.YearsExperience) * 0.5
		// Rating bonus
		score += p.Rating * 2.0

		scored = append(scored, scoredProfile{profile: p, score: score})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	var result []*models.MentorProfile
	for i := 0; i < len(scored) && i < 10; i++ {
		result = append(result, scored[i].profile)
	}

	return result, nil
}

// Mentorship requests
func (s *mentorshipService) CreateMentorshipRequest(ctx context.Context, menteeID string, dto models.CreateMentorshipRequestDTO) (*models.MentorshipRequest, error) {
	if menteeID == "" {
		return nil, errors.New("mentee ID is required")
	}

	// Fetch mentor profile by profile ID or UserID
	mentorProfile, err := s.repo.GetMentorProfileByID(ctx, dto.MentorID)
	if err != nil {
		// Fallback check by UserID
		mentorProfile, err = s.repo.GetMentorProfileByUserID(ctx, dto.MentorID)
		if err != nil {
			return nil, errors.New("mentor profile not found")
		}
	}

	// 1. Prevent self request
	if menteeID == mentorProfile.UserID || menteeID == mentorProfile.ID {
		return nil, ErrSelfMentorshipNotAllowed
	}

	// 2. Check availability
	if !mentorProfile.IsAvailable {
		return nil, ErrMentorNotAvailable
	}

	// 3. Check capacity
	activeCount, err := s.repo.CountActiveMenteesForMentor(ctx, mentorProfile.UserID)
	if err != nil {
		activeCount = mentorProfile.CurrentMentees
	}
	if activeCount >= mentorProfile.MaxMentees {
		return nil, ErrMentorCapacityReached
	}

	// 4. Prevent duplicate pending request or active mentorship
	existingReq, err := s.repo.GetPendingRequestBetween(ctx, menteeID, mentorProfile.UserID)
	if err == nil && existingReq != nil {
		return nil, ErrDuplicateRequest
	}
	existingMentorship, err := s.repo.GetActiveMentorshipBetween(ctx, menteeID, mentorProfile.UserID)
	if err == nil && existingMentorship != nil {
		return nil, ErrDuplicateRequest
	}

	req := &models.MentorshipRequest{
		ID:                uuid.New().String(),
		MenteeID:          menteeID,
		MentorID:          mentorProfile.UserID,
		Message:           dto.Message,
		Goals:             dto.Goals,
		PreferredSchedule: dto.PreferredSchedule,
		Status:            models.RequestStatusPending,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	if err := s.repo.CreateRequest(ctx, req); err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	return req, nil
}

func (s *mentorshipService) RespondToMentorshipRequest(ctx context.Context, userID string, requestID string, dto models.UpdateMentorshipRequestDTO) (*models.MentorshipRequest, error) {
	req, err := s.repo.GetRequestByID(ctx, requestID)
	if err != nil {
		return nil, errors.New("mentorship request not found")
	}

	if req.MentorID != userID && req.MenteeID != userID {
		return nil, ErrUnauthorized
	}

	if req.Status != models.RequestStatusPending {
		return nil, errors.New("request is no longer pending")
	}

	newStatus := strings.ToLower(dto.Status)
	if newStatus != models.RequestStatusAccepted && newStatus != models.RequestStatusRejected && newStatus != models.RequestStatusCancelled {
		return nil, ErrInvalidStatus
	}

	if newStatus == models.RequestStatusAccepted {
		// Mentor capacity re-check
		prof, err := s.repo.GetMentorProfileByUserID(ctx, req.MentorID)
		if err == nil && prof != nil {
			activeCount, _ := s.repo.CountActiveMenteesForMentor(ctx, req.MentorID)
			if activeCount >= prof.MaxMentees {
				return nil, ErrMentorCapacityReached
			}
		}

		// Create active mentorship relationship
		m := &models.Mentorship{
			ID:        uuid.New().String(),
			RequestID: req.ID,
			MentorID:  req.MentorID,
			MenteeID:  req.MenteeID,
			Status:    models.MentorshipStatusActive,
			StartDate: time.Now(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := s.repo.CreateMentorship(ctx, m); err != nil {
			return nil, fmt.Errorf("failed to create active mentorship: %w", err)
		}

		// Update mentor profile current mentees count
		if prof != nil {
			activeCount, _ := s.repo.CountActiveMenteesForMentor(ctx, req.MentorID)
			prof.CurrentMentees = activeCount
			if prof.CurrentMentees >= prof.MaxMentees {
				prof.IsAvailable = false
			}
			_ = s.repo.UpdateMentorProfile(ctx, prof)
		}
	}

	req.Status = newStatus
	req.ResponseMessage = dto.ResponseMessage
	req.UpdatedAt = time.Now()

	if err := s.repo.UpdateRequest(ctx, req); err != nil {
		return nil, fmt.Errorf("failed to update request status: %w", err)
	}

	return req, nil
}

func (s *mentorshipService) GetUserRequests(ctx context.Context, userID string, role string) ([]*models.MentorshipRequest, error) {
	return s.repo.ListRequestsByUserID(ctx, userID, role)
}

// Active relationships
func (s *mentorshipService) GetUserMentorships(ctx context.Context, userID string) ([]*models.Mentorship, error) {
	return s.repo.ListMentorshipsByUserID(ctx, userID)
}

func (s *mentorshipService) GetMentorshipByID(ctx context.Context, userID string, mentorshipID string) (*models.Mentorship, error) {
	m, err := s.repo.GetMentorshipByID(ctx, mentorshipID)
	if err != nil {
		return nil, err
	}
	if m.MenteeID != userID && m.MentorID != userID {
		return nil, ErrUnauthorized
	}
	return m, nil
}

// Goals
func (s *mentorshipService) CreateGoal(ctx context.Context, userID string, dto models.CreateMentorshipGoalDTO) (*models.MentorshipGoal, error) {
	m, err := s.repo.GetMentorshipByID(ctx, dto.MentorshipID)
	if err != nil {
		return nil, errors.New("mentorship relationship not found")
	}
	if m.MenteeID != userID && m.MentorID != userID {
		return nil, ErrUnauthorized
	}

	goal := &models.MentorshipGoal{
		ID:           uuid.New().String(),
		MentorshipID: dto.MentorshipID,
		Title:        dto.Title,
		Description:  dto.Description,
		TargetDate:   dto.TargetDate,
		Status:       models.GoalStatusPending,
		Progress:     0,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.repo.CreateGoal(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (s *mentorshipService) GetGoals(ctx context.Context, userID string, mentorshipID string) ([]*models.MentorshipGoal, error) {
	m, err := s.repo.GetMentorshipByID(ctx, mentorshipID)
	if err != nil {
		return nil, errors.New("mentorship relationship not found")
	}
	if m.MenteeID != userID && m.MentorID != userID {
		return nil, ErrUnauthorized
	}
	return s.repo.ListGoalsByMentorshipID(ctx, mentorshipID)
}

func (s *mentorshipService) UpdateGoal(ctx context.Context, userID string, goalID string, dto models.UpdateMentorshipGoalDTO) (*models.MentorshipGoal, error) {
	goal, err := s.repo.GetGoalByID(ctx, goalID)
	if err != nil {
		return nil, errors.New("goal not found")
	}

	m, err := s.repo.GetMentorshipByID(ctx, goal.MentorshipID)
	if err != nil || (m.MenteeID != userID && m.MentorID != userID) {
		return nil, ErrUnauthorized
	}

	if dto.Title != "" {
		goal.Title = dto.Title
	}
	if dto.Description != "" {
		goal.Description = dto.Description
	}
	if dto.TargetDate != nil {
		goal.TargetDate = dto.TargetDate
	}
	if dto.Status != "" {
		goal.Status = dto.Status
	}
	if dto.Progress >= 0 && dto.Progress <= 100 {
		goal.Progress = dto.Progress
		if goal.Progress == 100 && goal.Status != models.GoalStatusCompleted {
			goal.Status = models.GoalStatusCompleted
		}
	}
	goal.UpdatedAt = time.Now()

	if err := s.repo.UpdateGoal(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

// Sessions
func (s *mentorshipService) CreateSession(ctx context.Context, userID string, dto models.CreateMentorshipSessionDTO) (*models.MentorshipSession, error) {
	m, err := s.repo.GetMentorshipByID(ctx, dto.MentorshipID)
	if err != nil {
		return nil, errors.New("mentorship relationship not found")
	}
	if m.MenteeID != userID && m.MentorID != userID {
		return nil, ErrUnauthorized
	}

	session := &models.MentorshipSession{
		ID:              uuid.New().String(),
		MentorshipID:    dto.MentorshipID,
		Title:           dto.Title,
		Description:     dto.Description,
		ScheduledAt:     dto.ScheduledAt,
		DurationMinutes: dto.DurationMinutes,
		MeetingURL:      dto.MeetingURL,
		Status:          models.SessionStatusScheduled,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

func (s *mentorshipService) GetSessions(ctx context.Context, userID string, mentorshipID string) ([]*models.MentorshipSession, error) {
	m, err := s.repo.GetMentorshipByID(ctx, mentorshipID)
	if err != nil {
		return nil, errors.New("mentorship relationship not found")
	}
	if m.MenteeID != userID && m.MentorID != userID {
		return nil, ErrUnauthorized
	}
	return s.repo.ListSessionsByMentorshipID(ctx, mentorshipID)
}

func (s *mentorshipService) UpdateSession(ctx context.Context, userID string, sessionID string, dto models.UpdateMentorshipSessionDTO) (*models.MentorshipSession, error) {
	session, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("session not found")
	}

	m, err := s.repo.GetMentorshipByID(ctx, session.MentorshipID)
	if err != nil || (m.MenteeID != userID && m.MentorID != userID) {
		return nil, ErrUnauthorized
	}

	if dto.Title != "" {
		session.Title = dto.Title
	}
	if dto.Description != "" {
		session.Description = dto.Description
	}
	if dto.ScheduledAt != nil {
		session.ScheduledAt = *dto.ScheduledAt
	}
	if dto.DurationMinutes > 0 {
		session.DurationMinutes = dto.DurationMinutes
	}
	if dto.MeetingURL != "" {
		session.MeetingURL = dto.MeetingURL
	}
	if dto.Status != "" {
		session.Status = dto.Status
	}
	if dto.Notes != "" {
		session.Notes = dto.Notes
	}
	session.UpdatedAt = time.Now()

	if err := s.repo.UpdateSession(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

// Feedback
func (s *mentorshipService) SubmitFeedback(ctx context.Context, fromUserID string, dto models.CreateMentorshipFeedbackDTO) (*models.MentorshipFeedback, error) {
	if dto.Rating < 1 || dto.Rating > 5 {
		return nil, errors.New("rating must be between 1 and 5")
	}

	m, err := s.repo.GetMentorshipByID(ctx, dto.MentorshipID)
	if err != nil {
		return nil, errors.New("mentorship relationship not found")
	}
	if m.MenteeID != fromUserID && m.MentorID != fromUserID {
		return nil, ErrUnauthorized
	}

	toUserID := m.MentorID
	if fromUserID == m.MentorID {
		toUserID = m.MenteeID
	}

	fb := &models.MentorshipFeedback{
		ID:           uuid.New().String(),
		MentorshipID: dto.MentorshipID,
		SessionID:    dto.SessionID,
		FromUserID:   fromUserID,
		ToUserID:     toUserID,
		Rating:       dto.Rating,
		Comment:      dto.Comment,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateFeedback(ctx, fb); err != nil {
		return nil, err
	}

	// If feedback is for the mentor, update aggregate rating
	if toUserID == m.MentorID {
		prof, err := s.repo.GetMentorProfileByUserID(ctx, m.MentorID)
		if err == nil && prof != nil {
			allFeedbacks, _ := s.repo.ListFeedbackByMentorID(ctx, m.MentorID)
			totalRating := 0
			for _, f := range allFeedbacks {
				totalRating += f.Rating
			}
			prof.TotalReviews = len(allFeedbacks)
			if prof.TotalReviews > 0 {
				prof.Rating = float64(totalRating) / float64(prof.TotalReviews)
			}
			_ = s.repo.UpdateMentorProfile(ctx, prof)
		}
	}

	return fb, nil
}

func (s *mentorshipService) GetFeedbackForMentorship(ctx context.Context, userID string, mentorshipID string) ([]*models.MentorshipFeedback, error) {
	m, err := s.repo.GetMentorshipByID(ctx, mentorshipID)
	if err != nil {
		return nil, errors.New("mentorship relationship not found")
	}
	if m.MenteeID != userID && m.MentorID != userID {
		return nil, ErrUnauthorized
	}
	return s.repo.ListFeedbackByMentorshipID(ctx, mentorshipID)
}
