package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"kirmya/internal/interview/domain"
	"kirmya/internal/interview/repository"
	"kirmya/internal/messaging/pubsub"

	"github.com/google/uuid"
)

type InterviewEvent struct {
	EventType string      `json:"event_type"` // "interview.scheduled", "interview.feedback_submitted", "interview.reminder"
	Timestamp time.Time   `json:"timestamp"`
	Payload   interface{} `json:"payload"`
}

type ReminderItem struct {
	InterviewID    uuid.UUID `json:"interview_id"`
	RoundID        *uuid.UUID `json:"round_id,omitempty"`
	Title          string    `json:"title"`
	RoundName      string    `json:"round_name,omitempty"`
	CandidateID    uuid.UUID `json:"candidate_id"`
	ScheduledStart time.Time `json:"scheduled_start"`
	ScheduledEnd   time.Time `json:"scheduled_end"`
	MeetingLink    string    `json:"meeting_link"`
	MinutesRemaining int     `json:"minutes_remaining"`
	Role           string    `json:"role"`
}

type InterviewService interface {
	ScheduleInterview(ctx context.Context, organizerID uuid.UUID, req domain.CreateInterviewRequest) (*domain.Interview, error)
	GetInterview(ctx context.Context, id uuid.UUID) (*domain.Interview, error)
	ListInterviews(ctx context.Context, candidateID, organizerID *uuid.UUID, status string) ([]domain.Interview, error)
	UpdateInterviewStatus(ctx context.Context, id uuid.UUID, status string) error

	AddRound(ctx context.Context, interviewID uuid.UUID, req domain.CreateRoundRequest) (*domain.InterviewRound, error)
	UpdateRoundStatus(ctx context.Context, roundID uuid.UUID, status string) error

	SubmitFeedback(ctx context.Context, roundID uuid.UUID, interviewerID uuid.UUID, interviewerName string, req domain.SubmitFeedbackRequest) (*domain.InterviewFeedback, error)
	GetRoundFeedback(ctx context.Context, roundID uuid.UUID) ([]domain.InterviewFeedback, error)

	SetCandidateAvailability(ctx context.Context, candidateID uuid.UUID, req domain.SetAvailabilityRequest) (*domain.CandidateAvailability, error)
	GetCandidateAvailability(ctx context.Context, candidateID uuid.UUID) ([]domain.CandidateAvailability, error)

	GetRemindersForUser(ctx context.Context, userID uuid.UUID) ([]ReminderItem, error)
}

type interviewService struct {
	repo   repository.InterviewRepository
	pubSub pubsub.PubSub
}

func NewInterviewService(repo repository.InterviewRepository, ps pubsub.PubSub) InterviewService {
	return &interviewService{
		repo:   repo,
		pubSub: ps,
	}
}

func (s *interviewService) publishEvent(ctx context.Context, eventType string, payload interface{}) {
	if s.pubSub == nil {
		return
	}
	evt := InterviewEvent{
		EventType: eventType,
		Timestamp: time.Now(),
		Payload:   payload,
	}
	data, err := json.Marshal(evt)
	if err != nil {
		slog.Error("Failed to marshal interview event", slog.String("error", err.Error()))
		return
	}

	channel := fmt.Sprintf("notifications:%s", eventType)
	if err := s.pubSub.Publish(ctx, channel, data); err != nil {
		slog.Error("Failed to publish interview event", slog.String("channel", channel), slog.String("error", err.Error()))
	} else {
		slog.Info("Published interview event successfully", slog.String("event_type", eventType))
	}
}

func (s *interviewService) ScheduleInterview(ctx context.Context, organizerID uuid.UUID, req domain.CreateInterviewRequest) (*domain.Interview, error) {
	location := req.LocationType
	if location == "" {
		location = "virtual"
	}

	interview := &domain.Interview{
		ID:             uuid.New(),
		CandidateID:    req.CandidateID,
		JobID:          req.JobID,
		OrganizerID:    organizerID,
		Title:          req.Title,
		Status:         domain.StatusScheduled,
		ScheduledStart: req.ScheduledStart,
		ScheduledEnd:   req.ScheduledEnd,
		LocationType:   location,
		MeetingLink:    req.MeetingLink,
		Notes:          req.Notes,
	}

	if err := s.repo.CreateInterview(ctx, interview); err != nil {
		return nil, fmt.Errorf("failed to schedule interview: %w", err)
	}

	// Add candidate participant
	candidatePart := &domain.InterviewParticipant{
		ID:          uuid.New(),
		InterviewID: interview.ID,
		UserID:      req.CandidateID,
		Role:        domain.RoleCandidate,
		RSVPStatus:  domain.RSVPPending,
	}
	_ = s.repo.AddParticipant(ctx, candidatePart)
	interview.Participants = append(interview.Participants, *candidatePart)

	// Add organizer participant
	organizerPart := &domain.InterviewParticipant{
		ID:          uuid.New(),
		InterviewID: interview.ID,
		UserID:      organizerID,
		Role:        domain.RoleLeadInterviewer,
		RSVPStatus:  domain.RSVPAccepted,
	}
	_ = s.repo.AddParticipant(ctx, organizerPart)
	interview.Participants = append(interview.Participants, *organizerPart)

	// Add additional panel participants
	for _, p := range req.Participants {
		if p.UserID == req.CandidateID || p.UserID == organizerID {
			continue
		}
		part := &domain.InterviewParticipant{
			ID:          uuid.New(),
			InterviewID: interview.ID,
			UserID:      p.UserID,
			UserName:    p.UserName,
			UserEmail:   p.UserEmail,
			Role:        p.Role,
			RSVPStatus:  domain.RSVPPending,
		}
		_ = s.repo.AddParticipant(ctx, part)
		interview.Participants = append(interview.Participants, *part)
	}

	// Add rounds if specified
	if len(req.Rounds) > 0 {
		for i, rReq := range req.Rounds {
			rType := rReq.RoundType
			if rType == "" {
				rType = "technical"
			}
			rNum := rReq.RoundNumber
			if rNum == 0 {
				rNum = i + 1
			}

			round := &domain.InterviewRound{
				ID:             uuid.New(),
				InterviewID:    interview.ID,
				RoundNumber:    rNum,
				RoundName:      rReq.RoundName,
				RoundType:      rType,
				Status:         domain.StatusScheduled,
				ScheduledStart: rReq.ScheduledStart,
				ScheduledEnd:   rReq.ScheduledEnd,
				MeetingLink:    rReq.MeetingLink,
				Instructions:   rReq.Instructions,
			}
			if err := s.repo.CreateRound(ctx, round); err == nil {
				interview.Rounds = append(interview.Rounds, *round)
			}
		}
	} else {
		// Create default Round 1
		defaultRound := &domain.InterviewRound{
			ID:             uuid.New(),
			InterviewID:    interview.ID,
			RoundNumber:    1,
			RoundName:      "Initial Interview Round",
			RoundType:      "screening",
			Status:         domain.StatusScheduled,
			ScheduledStart: req.ScheduledStart,
			ScheduledEnd:   req.ScheduledEnd,
			MeetingLink:    req.MeetingLink,
			Instructions:   req.Notes,
		}
		if err := s.repo.CreateRound(ctx, defaultRound); err == nil {
			interview.Rounds = append(interview.Rounds, *defaultRound)
		}
	}

	// Trigger event notification
	s.publishEvent(ctx, "interview.scheduled", map[string]interface{}{
		"interview_id":    interview.ID,
		"title":           interview.Title,
		"candidate_id":    interview.CandidateID,
		"organizer_id":    interview.OrganizerID,
		"scheduled_start": interview.ScheduledStart,
	})

	return interview, nil
}

func (s *interviewService) GetInterview(ctx context.Context, id uuid.UUID) (*domain.Interview, error) {
	interview, err := s.repo.GetInterviewByID(ctx, id)
	if err != nil {
		return nil, err
	}

	rounds, _ := s.repo.GetRoundsByInterviewID(ctx, id)
	for i := range rounds {
		feedback, _ := s.repo.GetFeedbackByRoundID(ctx, rounds[i].ID)
		rounds[i].Feedback = feedback
	}
	interview.Rounds = rounds

	participants, _ := s.repo.GetParticipantsByInterviewID(ctx, id)
	interview.Participants = participants

	return interview, nil
}

func (s *interviewService) ListInterviews(ctx context.Context, candidateID, organizerID *uuid.UUID, status string) ([]domain.Interview, error) {
	interviews, err := s.repo.ListInterviews(ctx, candidateID, organizerID, status)
	if err != nil {
		return nil, err
	}

	for i := range interviews {
		rounds, _ := s.repo.GetRoundsByInterviewID(ctx, interviews[i].ID)
		interviews[i].Rounds = rounds
		participants, _ := s.repo.GetParticipantsByInterviewID(ctx, interviews[i].ID)
		interviews[i].Participants = participants
	}

	return interviews, nil
}

func (s *interviewService) UpdateInterviewStatus(ctx context.Context, id uuid.UUID, status string) error {
	err := s.repo.UpdateInterviewStatus(ctx, id, status)
	if err == nil {
		s.publishEvent(ctx, "interview.status_updated", map[string]interface{}{
			"interview_id": id,
			"status":       status,
		})
	}
	return err
}

func (s *interviewService) AddRound(ctx context.Context, interviewID uuid.UUID, req domain.CreateRoundRequest) (*domain.InterviewRound, error) {
	rounds, _ := s.repo.GetRoundsByInterviewID(ctx, interviewID)
	roundNumber := req.RoundNumber
	if roundNumber == 0 {
		roundNumber = len(rounds) + 1
	}

	round := &domain.InterviewRound{
		ID:             uuid.New(),
		InterviewID:    interviewID,
		RoundNumber:    roundNumber,
		RoundName:      req.RoundName,
		RoundType:      req.RoundType,
		Status:         domain.StatusScheduled,
		ScheduledStart: req.ScheduledStart,
		ScheduledEnd:   req.ScheduledEnd,
		MeetingLink:    req.MeetingLink,
		Instructions:   req.Instructions,
	}

	if err := s.repo.CreateRound(ctx, round); err != nil {
		return nil, err
	}

	for _, p := range req.Participants {
		part := &domain.InterviewParticipant{
			ID:          uuid.New(),
			InterviewID: interviewID,
			RoundID:     &round.ID,
			UserID:      p.UserID,
			UserName:    p.UserName,
			UserEmail:   p.UserEmail,
			Role:        p.Role,
			RSVPStatus:  domain.RSVPPending,
		}
		_ = s.repo.AddParticipant(ctx, part)
		round.Participants = append(round.Participants, *part)
	}

	s.publishEvent(ctx, "interview.round_added", map[string]interface{}{
		"interview_id": interviewID,
		"round_id":     round.ID,
		"round_name":   round.RoundName,
	})

	return round, nil
}

func (s *interviewService) UpdateRoundStatus(ctx context.Context, roundID uuid.UUID, status string) error {
	return s.repo.UpdateRoundStatus(ctx, roundID, status)
}

func (s *interviewService) SubmitFeedback(ctx context.Context, roundID uuid.UUID, interviewerID uuid.UUID, interviewerName string, req domain.SubmitFeedbackRequest) (*domain.InterviewFeedback, error) {
	// Find corresponding round and interview
	var interviewID uuid.UUID
	rounds, _ := s.repo.GetRoundsByInterviewID(ctx, uuid.Nil)
	for _, r := range rounds {
		if r.ID == roundID {
			interviewID = r.InterviewID
			break
		}
	}

	feedback := &domain.InterviewFeedback{
		ID:                  uuid.New(),
		InterviewID:         interviewID,
		RoundID:             roundID,
		InterviewerID:       interviewerID,
		InterviewerName:     interviewerName,
		Rating:              req.Rating,
		TechnicalScore:      req.TechnicalScore,
		CommunicationScore:  req.CommunicationScore,
		ProblemSolvingScore: req.ProblemSolvingScore,
		Recommendation:      req.Recommendation,
		FeedbackText:        req.FeedbackText,
		Strengths:           req.Strengths,
		AreasForImprovement: req.AreasForImprovement,
	}

	if err := s.repo.SubmitFeedback(ctx, feedback); err != nil {
		return nil, err
	}

	// Update interview status to feedback submitted / completed if applicable
	if interviewID != uuid.Nil {
		_ = s.repo.UpdateInterviewStatus(ctx, interviewID, domain.StatusFeedbackPending)
	}

	s.publishEvent(ctx, "interview.feedback_submitted", map[string]interface{}{
		"interview_id":   interviewID,
		"round_id":       roundID,
		"interviewer_id": interviewerID,
		"recommendation": req.Recommendation,
		"rating":         req.Rating,
	})

	return feedback, nil
}

func (s *interviewService) GetRoundFeedback(ctx context.Context, roundID uuid.UUID) ([]domain.InterviewFeedback, error) {
	return s.repo.GetFeedbackByRoundID(ctx, roundID)
}

func (s *interviewService) SetCandidateAvailability(ctx context.Context, candidateID uuid.UUID, req domain.SetAvailabilityRequest) (*domain.CandidateAvailability, error) {
	status := req.Status
	if status == "" {
		status = "available"
	}

	avail := &domain.CandidateAvailability{
		ID:          uuid.New(),
		CandidateID: candidateID,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		Status:      status,
		Notes:       req.Notes,
	}

	if err := s.repo.SetAvailability(ctx, avail); err != nil {
		return nil, err
	}

	return avail, nil
}

func (s *interviewService) GetCandidateAvailability(ctx context.Context, candidateID uuid.UUID) ([]domain.CandidateAvailability, error) {
	return s.repo.GetCandidateAvailability(ctx, candidateID)
}

func (s *interviewService) GetRemindersForUser(ctx context.Context, userID uuid.UUID) ([]ReminderItem, error) {
	interviews, err := s.repo.ListInterviews(ctx, nil, nil, "")
	if err != nil {
		return nil, err
	}

	now := time.Now()
	var reminders []ReminderItem

	for _, item := range interviews {
		if item.Status == domain.StatusCancelled || item.Status == domain.StatusCompleted {
			continue
		}

		// Check if user is participant
		isParticipant := false
		role := "participant"
		if item.CandidateID == userID {
			isParticipant = true
			role = domain.RoleCandidate
		} else if item.OrganizerID == userID {
			isParticipant = true
			role = domain.RoleLeadInterviewer
		} else {
			parts, _ := s.repo.GetParticipantsByInterviewID(ctx, item.ID)
			for _, p := range parts {
				if p.UserID == userID {
					isParticipant = true
					role = p.Role
					break
				}
			}
		}

		if isParticipant {
			diff := item.ScheduledStart.Sub(now)
			minutes := int(diff.Minutes())
			// Include interviews upcoming in the next 7 days or recently started
			if minutes >= -60 && minutes <= 10080 {
				reminders = append(reminders, ReminderItem{
					InterviewID:      item.ID,
					Title:            item.Title,
					CandidateID:      item.CandidateID,
					ScheduledStart:   item.ScheduledStart,
					ScheduledEnd:     item.ScheduledEnd,
					MeetingLink:      item.MeetingLink,
					MinutesRemaining: minutes,
					Role:             role,
				})
			}
		}
	}

	return reminders, nil
}
