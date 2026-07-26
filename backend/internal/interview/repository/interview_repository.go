package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/interview/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InterviewRepository interface {
	CreateInterview(ctx context.Context, interview *domain.Interview) error
	GetInterviewByID(ctx context.Context, id uuid.UUID) (*domain.Interview, error)
	ListInterviews(ctx context.Context, candidateID, organizerID *uuid.UUID, status string) ([]domain.Interview, error)
	UpdateInterviewStatus(ctx context.Context, id uuid.UUID, status string) error
	
	CreateRound(ctx context.Context, round *domain.InterviewRound) error
	UpdateRoundStatus(ctx context.Context, roundID uuid.UUID, status string) error
	GetRoundsByInterviewID(ctx context.Context, interviewID uuid.UUID) ([]domain.InterviewRound, error)
	
	AddParticipant(ctx context.Context, participant *domain.InterviewParticipant) error
	UpdateRSVPStatus(ctx context.Context, participantID uuid.UUID, rsvp string) error
	GetParticipantsByInterviewID(ctx context.Context, interviewID uuid.UUID) ([]domain.InterviewParticipant, error)

	SubmitFeedback(ctx context.Context, feedback *domain.InterviewFeedback) error
	GetFeedbackByRoundID(ctx context.Context, roundID uuid.UUID) ([]domain.InterviewFeedback, error)
	GetFeedbackByInterviewID(ctx context.Context, interviewID uuid.UUID) ([]domain.InterviewFeedback, error)

	SetAvailability(ctx context.Context, availability *domain.CandidateAvailability) error
	GetCandidateAvailability(ctx context.Context, candidateID uuid.UUID) ([]domain.CandidateAvailability, error)
	DeleteAvailability(ctx context.Context, id uuid.UUID) error
}

type pgxInterviewRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	// In-memory fallback state when DB pool is nil
	interviews   map[uuid.UUID]*domain.Interview
	rounds       map[uuid.UUID]*domain.InterviewRound
	participants map[uuid.UUID]*domain.InterviewParticipant
	feedbacks    map[uuid.UUID]*domain.InterviewFeedback
	availability map[uuid.UUID]*domain.CandidateAvailability
}

func NewInterviewRepository(pool *pgxpool.Pool) InterviewRepository {
	return &pgxInterviewRepository{
		pool:         pool,
		interviews:   make(map[uuid.UUID]*domain.Interview),
		rounds:       make(map[uuid.UUID]*domain.InterviewRound),
		participants: make(map[uuid.UUID]*domain.InterviewParticipant),
		feedbacks:    make(map[uuid.UUID]*domain.InterviewFeedback),
		availability: make(map[uuid.UUID]*domain.CandidateAvailability),
	}
}

func (r *pgxInterviewRepository) CreateInterview(ctx context.Context, interview *domain.Interview) error {
	if interview.ID == uuid.Nil {
		interview.ID = uuid.New()
	}
	interview.CreatedAt = time.Now()
	interview.UpdatedAt = time.Now()

	if r.pool != nil {
		query := `
			INSERT INTO interviews (
				id, candidate_id, job_id, organizer_id, title, status, 
				scheduled_start, scheduled_end, location_type, meeting_link, notes, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		`
		_, err := r.pool.Exec(ctx, query,
			interview.ID, interview.CandidateID, interview.JobID, interview.OrganizerID,
			interview.Title, interview.Status, interview.ScheduledStart, interview.ScheduledEnd,
			interview.LocationType, interview.MeetingLink, interview.Notes, interview.CreatedAt, interview.UpdatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert interview: %w", err)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.interviews[interview.ID] = interview
	return nil
}

func (r *pgxInterviewRepository) GetInterviewByID(ctx context.Context, id uuid.UUID) (*domain.Interview, error) {
	if r.pool != nil {
		query := `
			SELECT id, candidate_id, job_id, organizer_id, title, status, 
			       scheduled_start, scheduled_end, location_type, meeting_link, notes, created_at, updated_at
			FROM interviews WHERE id = $1
		`
		row := r.pool.QueryRow(ctx, query, id)
		var item domain.Interview
		err := row.Scan(
			&item.ID, &item.CandidateID, &item.JobID, &item.OrganizerID, &item.Title, &item.Status,
			&item.ScheduledStart, &item.ScheduledEnd, &item.LocationType, &item.MeetingLink, &item.Notes,
			&item.CreatedAt, &item.UpdatedAt,
		)
		if err == nil {
			return &item, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	if item, exists := r.interviews[id]; exists {
		return item, nil
	}
	return nil, fmt.Errorf("interview not found with id: %s", id)
}

func (r *pgxInterviewRepository) ListInterviews(ctx context.Context, candidateID, organizerID *uuid.UUID, status string) ([]domain.Interview, error) {
	if r.pool != nil {
		query := `
			SELECT id, candidate_id, job_id, organizer_id, title, status, 
			       scheduled_start, scheduled_end, location_type, meeting_link, notes, created_at, updated_at
			FROM interviews
			WHERE ($1::uuid IS NULL OR candidate_id = $1)
			  AND ($2::uuid IS NULL OR organizer_id = $2)
			  AND ($3 = '' OR status = $3)
			ORDER BY scheduled_start ASC
		`
		rows, err := r.pool.Query(ctx, query, candidateID, organizerID, status)
		if err == nil {
			defer rows.Close()
			var results []domain.Interview
			for rows.Next() {
				var item domain.Interview
				if err := rows.Scan(
					&item.ID, &item.CandidateID, &item.JobID, &item.OrganizerID, &item.Title, &item.Status,
					&item.ScheduledStart, &item.ScheduledEnd, &item.LocationType, &item.MeetingLink, &item.Notes,
					&item.CreatedAt, &item.UpdatedAt,
				); err == nil {
					results = append(results, item)
				}
			}
			return results, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.Interview
	for _, item := range r.interviews {
		if candidateID != nil && item.CandidateID != *candidateID {
			continue
		}
		if organizerID != nil && item.OrganizerID != *organizerID {
			continue
		}
		if status != "" && item.Status != status {
			continue
		}
		list = append(list, *item)
	}
	return list, nil
}

func (r *pgxInterviewRepository) UpdateInterviewStatus(ctx context.Context, id uuid.UUID, status string) error {
	now := time.Now()
	if r.pool != nil {
		query := `UPDATE interviews SET status = $1, updated_at = $2 WHERE id = $3`
		_, _ = r.pool.Exec(ctx, query, status, now, id)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if item, exists := r.interviews[id]; exists {
		item.Status = status
		item.UpdatedAt = now
	}
	return nil
}

func (r *pgxInterviewRepository) CreateRound(ctx context.Context, round *domain.InterviewRound) error {
	if round.ID == uuid.Nil {
		round.ID = uuid.New()
	}
	round.CreatedAt = time.Now()

	if r.pool != nil {
		query := `
			INSERT INTO interview_rounds (
				id, interview_id, round_number, round_name, round_type, status,
				scheduled_start, scheduled_end, meeting_link, instructions, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`
		_, err := r.pool.Exec(ctx, query,
			round.ID, round.InterviewID, round.RoundNumber, round.RoundName, round.RoundType, round.Status,
			round.ScheduledStart, round.ScheduledEnd, round.MeetingLink, round.Instructions, round.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert round: %w", err)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.rounds[round.ID] = round
	return nil
}

func (r *pgxInterviewRepository) UpdateRoundStatus(ctx context.Context, roundID uuid.UUID, status string) error {
	if r.pool != nil {
		query := `UPDATE interview_rounds SET status = $1 WHERE id = $2`
		_, _ = r.pool.Exec(ctx, query, status, roundID)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if item, exists := r.rounds[roundID]; exists {
		item.Status = status
	}
	return nil
}

func (r *pgxInterviewRepository) GetRoundsByInterviewID(ctx context.Context, interviewID uuid.UUID) ([]domain.InterviewRound, error) {
	if r.pool != nil {
		query := `
			SELECT id, interview_id, round_number, round_name, round_type, status,
			       scheduled_start, scheduled_end, meeting_link, instructions, created_at
			FROM interview_rounds WHERE interview_id = $1 ORDER BY round_number ASC
		`
		rows, err := r.pool.Query(ctx, query, interviewID)
		if err == nil {
			defer rows.Close()
			var list []domain.InterviewRound
			for rows.Next() {
				var item domain.InterviewRound
				if err := rows.Scan(
					&item.ID, &item.InterviewID, &item.RoundNumber, &item.RoundName, &item.RoundType, &item.Status,
					&item.ScheduledStart, &item.ScheduledEnd, &item.MeetingLink, &item.Instructions, &item.CreatedAt,
				); err == nil {
					list = append(list, item)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.InterviewRound
	for _, item := range r.rounds {
		if item.InterviewID == interviewID {
			list = append(list, *item)
		}
	}
	return list, nil
}

func (r *pgxInterviewRepository) AddParticipant(ctx context.Context, participant *domain.InterviewParticipant) error {
	if participant.ID == uuid.Nil {
		participant.ID = uuid.New()
	}
	participant.CreatedAt = time.Now()

	if r.pool != nil {
		query := `
			INSERT INTO interview_participants (
				id, interview_id, round_id, user_id, user_name, user_email, role, rsvp_status, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		_, err := r.pool.Exec(ctx, query,
			participant.ID, participant.InterviewID, participant.RoundID, participant.UserID,
			participant.UserName, participant.UserEmail, participant.Role, participant.RSVPStatus, participant.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to add participant: %w", err)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.participants[participant.ID] = participant
	return nil
}

func (r *pgxInterviewRepository) UpdateRSVPStatus(ctx context.Context, participantID uuid.UUID, rsvp string) error {
	if r.pool != nil {
		query := `UPDATE interview_participants SET rsvp_status = $1 WHERE id = $2`
		_, _ = r.pool.Exec(ctx, query, rsvp, participantID)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if item, exists := r.participants[participantID]; exists {
		item.RSVPStatus = rsvp
	}
	return nil
}

func (r *pgxInterviewRepository) GetParticipantsByInterviewID(ctx context.Context, interviewID uuid.UUID) ([]domain.InterviewParticipant, error) {
	if r.pool != nil {
		query := `
			SELECT id, interview_id, round_id, user_id, user_name, user_email, role, rsvp_status, created_at
			FROM interview_participants WHERE interview_id = $1
		`
		rows, err := r.pool.Query(ctx, query, interviewID)
		if err == nil {
			defer rows.Close()
			var list []domain.InterviewParticipant
			for rows.Next() {
				var item domain.InterviewParticipant
				if err := rows.Scan(
					&item.ID, &item.InterviewID, &item.RoundID, &item.UserID, &item.UserName, &item.UserEmail,
					&item.Role, &item.RSVPStatus, &item.CreatedAt,
				); err == nil {
					list = append(list, item)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.InterviewParticipant
	for _, item := range r.participants {
		if item.InterviewID == interviewID {
			list = append(list, *item)
		}
	}
	return list, nil
}

func (r *pgxInterviewRepository) SubmitFeedback(ctx context.Context, feedback *domain.InterviewFeedback) error {
	if feedback.ID == uuid.Nil {
		feedback.ID = uuid.New()
	}
	feedback.CreatedAt = time.Now()

	if r.pool != nil {
		query := `
			INSERT INTO interview_feedback (
				id, interview_id, round_id, interviewer_id, interviewer_name, rating,
				technical_score, communication_score, problem_solving_score, recommendation,
				feedback_text, strengths, areas_for_improvement, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		`
		_, err := r.pool.Exec(ctx, query,
			feedback.ID, feedback.InterviewID, feedback.RoundID, feedback.InterviewerID,
			feedback.InterviewerName, feedback.Rating, feedback.TechnicalScore, feedback.CommunicationScore,
			feedback.ProblemSolvingScore, feedback.Recommendation, feedback.FeedbackText,
			feedback.Strengths, feedback.AreasForImprovement, feedback.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert feedback: %w", err)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.feedbacks[feedback.ID] = feedback
	return nil
}

func (r *pgxInterviewRepository) GetFeedbackByRoundID(ctx context.Context, roundID uuid.UUID) ([]domain.InterviewFeedback, error) {
	if r.pool != nil {
		query := `
			SELECT id, interview_id, round_id, interviewer_id, interviewer_name, rating,
			       technical_score, communication_score, problem_solving_score, recommendation,
			       feedback_text, strengths, areas_for_improvement, created_at
			FROM interview_feedback WHERE round_id = $1 ORDER BY created_at DESC
		`
		rows, err := r.pool.Query(ctx, query, roundID)
		if err == nil {
			defer rows.Close()
			var list []domain.InterviewFeedback
			for rows.Next() {
				var item domain.InterviewFeedback
				if err := rows.Scan(
					&item.ID, &item.InterviewID, &item.RoundID, &item.InterviewerID, &item.InterviewerName,
					&item.Rating, &item.TechnicalScore, &item.CommunicationScore, &item.ProblemSolvingScore,
					&item.Recommendation, &item.FeedbackText, &item.Strengths, &item.AreasForImprovement, &item.CreatedAt,
				); err == nil {
					list = append(list, item)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.InterviewFeedback
	for _, item := range r.feedbacks {
		if item.RoundID == roundID {
			list = append(list, *item)
		}
	}
	return list, nil
}

func (r *pgxInterviewRepository) GetFeedbackByInterviewID(ctx context.Context, interviewID uuid.UUID) ([]domain.InterviewFeedback, error) {
	if r.pool != nil {
		query := `
			SELECT id, interview_id, round_id, interviewer_id, interviewer_name, rating,
			       technical_score, communication_score, problem_solving_score, recommendation,
			       feedback_text, strengths, areas_for_improvement, created_at
			FROM interview_feedback WHERE interview_id = $1 ORDER BY created_at DESC
		`
		rows, err := r.pool.Query(ctx, query, interviewID)
		if err == nil {
			defer rows.Close()
			var list []domain.InterviewFeedback
			for rows.Next() {
				var item domain.InterviewFeedback
				if err := rows.Scan(
					&item.ID, &item.InterviewID, &item.RoundID, &item.InterviewerID, &item.InterviewerName,
					&item.Rating, &item.TechnicalScore, &item.CommunicationScore, &item.ProblemSolvingScore,
					&item.Recommendation, &item.FeedbackText, &item.Strengths, &item.AreasForImprovement, &item.CreatedAt,
				); err == nil {
					list = append(list, item)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.InterviewFeedback
	for _, item := range r.feedbacks {
		if item.InterviewID == interviewID {
			list = append(list, *item)
		}
	}
	return list, nil
}

func (r *pgxInterviewRepository) SetAvailability(ctx context.Context, availability *domain.CandidateAvailability) error {
	if availability.ID == uuid.Nil {
		availability.ID = uuid.New()
	}
	availability.CreatedAt = time.Now()

	if r.pool != nil {
		query := `
			INSERT INTO candidate_availability (id, candidate_id, start_time, end_time, status, notes, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`
		_, err := r.pool.Exec(ctx, query,
			availability.ID, availability.CandidateID, availability.StartTime, availability.EndTime,
			availability.Status, availability.Notes, availability.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("failed to insert availability: %w", err)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.availability[availability.ID] = availability
	return nil
}

func (r *pgxInterviewRepository) GetCandidateAvailability(ctx context.Context, candidateID uuid.UUID) ([]domain.CandidateAvailability, error) {
	if r.pool != nil {
		query := `
			SELECT id, candidate_id, start_time, end_time, status, notes, created_at
			FROM candidate_availability WHERE candidate_id = $1 ORDER BY start_time ASC
		`
		rows, err := r.pool.Query(ctx, query, candidateID)
		if err == nil {
			defer rows.Close()
			var list []domain.CandidateAvailability
			for rows.Next() {
				var item domain.CandidateAvailability
				if err := rows.Scan(&item.ID, &item.CandidateID, &item.StartTime, &item.EndTime, &item.Status, &item.Notes, &item.CreatedAt); err == nil {
					list = append(list, item)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.CandidateAvailability
	for _, item := range r.availability {
		if item.CandidateID == candidateID {
			list = append(list, *item)
		}
	}
	return list, nil
}

func (r *pgxInterviewRepository) DeleteAvailability(ctx context.Context, id uuid.UUID) error {
	if r.pool != nil {
		query := `DELETE FROM candidate_availability WHERE id = $1`
		_, _ = r.pool.Exec(ctx, query, id)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.availability, id)
	return nil
}
