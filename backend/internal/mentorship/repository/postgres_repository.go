package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"kirmya/internal/mentorship/models"
)

type PostgresMentorshipRepository struct {
	pool     *pgxpool.Pool
	fallback *MemoryMentorshipRepository
}

func NewPostgresMentorshipRepository(pool *pgxpool.Pool) MentorshipRepository {
	return &PostgresMentorshipRepository{
		pool:     pool,
		fallback: NewMemoryMentorshipRepository(),
	}
}

// ----------------------------------------------------------------------
// Mentor Profile Operations
// ----------------------------------------------------------------------

func (r *PostgresMentorshipRepository) CreateMentorProfile(ctx context.Context, profile *models.MentorProfile) error {
	if r.pool == nil {
		return r.fallback.CreateMentorProfile(ctx, profile)
	}

	if profile.ID == "" {
		profile.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	if profile.CreatedAt.IsZero() {
		profile.CreatedAt = now
	}
	profile.UpdatedAt = now

	query := `
		INSERT INTO mentor_profiles (
			id, user_id, bio, job_title, company, years_experience,
			expertise, industries, languages, hourly_rate, max_mentees,
			current_mentees, rating, total_reviews, is_available, is_featured,
			session_types, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
		)
	`
	_, err := r.pool.Exec(ctx, query,
		profile.ID, profile.UserID, profile.Bio, profile.JobTitle, profile.Company, profile.YearsExperience,
		profile.Expertise, profile.Industries, profile.Languages, profile.HourlyRate, profile.MaxMentees,
		profile.CurrentMentees, profile.Rating, profile.TotalReviews, profile.IsAvailable, profile.IsFeatured,
		profile.SessionTypes, profile.CreatedAt, profile.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create mentor profile: %w", err)
	}
	return nil
}

func (r *PostgresMentorshipRepository) GetMentorProfileByID(ctx context.Context, id string) (*models.MentorProfile, error) {
	if r.pool == nil {
		return r.fallback.GetMentorProfileByID(ctx, id)
	}

	query := `
		SELECT id, user_id, bio, job_title, company, years_experience,
		       expertise, industries, languages, hourly_rate, max_mentees,
		       current_mentees, rating, total_reviews, is_available, is_featured,
		       session_types, created_at, updated_at
		FROM mentor_profiles
		WHERE id = $1
	`
	var p models.MentorProfile
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.UserID, &p.Bio, &p.JobTitle, &p.Company, &p.YearsExperience,
		&p.Expertise, &p.Industries, &p.Languages, &p.HourlyRate, &p.MaxMentees,
		&p.CurrentMentees, &p.Rating, &p.TotalReviews, &p.IsAvailable, &p.IsFeatured,
		&p.SessionTypes, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get mentor profile: %w", err)
	}
	return &p, nil
}

func (r *PostgresMentorshipRepository) GetMentorProfileByUserID(ctx context.Context, userID string) (*models.MentorProfile, error) {
	if r.pool == nil {
		return r.fallback.GetMentorProfileByUserID(ctx, userID)
	}

	query := `
		SELECT id, user_id, bio, job_title, company, years_experience,
		       expertise, industries, languages, hourly_rate, max_mentees,
		       current_mentees, rating, total_reviews, is_available, is_featured,
		       session_types, created_at, updated_at
		FROM mentor_profiles
		WHERE user_id = $1
	`
	var p models.MentorProfile
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.Bio, &p.JobTitle, &p.Company, &p.YearsExperience,
		&p.Expertise, &p.Industries, &p.Languages, &p.HourlyRate, &p.MaxMentees,
		&p.CurrentMentees, &p.Rating, &p.TotalReviews, &p.IsAvailable, &p.IsFeatured,
		&p.SessionTypes, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get mentor profile by user: %w", err)
	}
	return &p, nil
}

func (r *PostgresMentorshipRepository) UpdateMentorProfile(ctx context.Context, profile *models.MentorProfile) error {
	if r.pool == nil {
		return r.fallback.UpdateMentorProfile(ctx, profile)
	}

	profile.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE mentor_profiles SET
			bio = $1, job_title = $2, company = $3, years_experience = $4,
			expertise = $5, industries = $6, languages = $7, hourly_rate = $8,
			max_mentees = $9, current_mentees = $10, rating = $11, total_reviews = $12,
			is_available = $13, is_featured = $14, session_types = $15, updated_at = $16
		WHERE id = $17
	`
	ct, err := r.pool.Exec(ctx, query,
		profile.Bio, profile.JobTitle, profile.Company, profile.YearsExperience,
		profile.Expertise, profile.Industries, profile.Languages, profile.HourlyRate,
		profile.MaxMentees, profile.CurrentMentees, profile.Rating, profile.TotalReviews,
		profile.IsAvailable, profile.IsFeatured, profile.SessionTypes, profile.UpdatedAt,
		profile.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update mentor profile: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresMentorshipRepository) ListMentorProfiles(ctx context.Context, params models.MentorFilterParams) ([]*models.MentorProfile, int, error) {
	if r.pool == nil {
		return r.fallback.ListMentorProfiles(ctx, params)
	}

	limit := params.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	page := params.Page
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := `
		SELECT id, user_id, bio, job_title, company, years_experience,
		       expertise, industries, languages, hourly_rate, max_mentees,
		       current_mentees, rating, total_reviews, is_available, is_featured,
		       session_types, created_at, updated_at, count(*) OVER() AS full_count
		FROM mentor_profiles
		WHERE ($1::boolean IS NULL OR is_available = $1)
		ORDER BY is_featured DESC, rating DESC, created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.pool.Query(ctx, query, params.IsAvailable, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list mentor profiles: %w", err)
	}
	defer rows.Close()

	var list []*models.MentorProfile
	total := 0
	for rows.Next() {
		var p models.MentorProfile
		var count int
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.Bio, &p.JobTitle, &p.Company, &p.YearsExperience,
			&p.Expertise, &p.Industries, &p.Languages, &p.HourlyRate, &p.MaxMentees,
			&p.CurrentMentees, &p.Rating, &p.TotalReviews, &p.IsAvailable, &p.IsFeatured,
			&p.SessionTypes, &p.CreatedAt, &p.UpdatedAt, &count,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan mentor profile: %w", err)
		}
		total = count
		list = append(list, &p)
	}
	return list, total, nil
}

// ----------------------------------------------------------------------
// Mentorship Request Operations
// ----------------------------------------------------------------------

func (r *PostgresMentorshipRepository) CreateRequest(ctx context.Context, req *models.MentorshipRequest) error {
	if r.pool == nil {
		return r.fallback.CreateRequest(ctx, req)
	}

	if req.ID == "" {
		req.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	if req.CreatedAt.IsZero() {
		req.CreatedAt = now
	}
	req.UpdatedAt = now

	query := `
		INSERT INTO mentorship_requests (
			id, mentee_id, mentor_id, message, goals, preferred_schedule, status, response_message, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)
	`
	_, err := r.pool.Exec(ctx, query,
		req.ID, req.MenteeID, req.MentorID, req.Message, req.Goals,
		req.PreferredSchedule, req.Status, req.ResponseMessage, req.CreatedAt, req.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create mentorship request: %w", err)
	}
	return nil
}

func (r *PostgresMentorshipRepository) GetRequestByID(ctx context.Context, id string) (*models.MentorshipRequest, error) {
	if r.pool == nil {
		return r.fallback.GetRequestByID(ctx, id)
	}

	query := `
		SELECT id, mentee_id, mentor_id, message, goals, preferred_schedule, status, response_message, created_at, updated_at
		FROM mentorship_requests
		WHERE id = $1
	`
	var req models.MentorshipRequest
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&req.ID, &req.MenteeID, &req.MentorID, &req.Message, &req.Goals,
		&req.PreferredSchedule, &req.Status, &req.ResponseMessage, &req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get request: %w", err)
	}
	return &req, nil
}

func (r *PostgresMentorshipRepository) GetPendingRequestBetween(ctx context.Context, menteeID, mentorID string) (*models.MentorshipRequest, error) {
	if r.pool == nil {
		return r.fallback.GetPendingRequestBetween(ctx, menteeID, mentorID)
	}

	query := `
		SELECT id, mentee_id, mentor_id, message, goals, preferred_schedule, status, response_message, created_at, updated_at
		FROM mentorship_requests
		WHERE mentee_id = $1 AND mentor_id = $2 AND status = 'pending'
		LIMIT 1
	`
	var req models.MentorshipRequest
	err := r.pool.QueryRow(ctx, query, menteeID, mentorID).Scan(
		&req.ID, &req.MenteeID, &req.MentorID, &req.Message, &req.Goals,
		&req.PreferredSchedule, &req.Status, &req.ResponseMessage, &req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get pending request: %w", err)
	}
	return &req, nil
}

func (r *PostgresMentorshipRepository) UpdateRequest(ctx context.Context, req *models.MentorshipRequest) error {
	if r.pool == nil {
		return r.fallback.UpdateRequest(ctx, req)
	}

	req.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE mentorship_requests SET
			status = $1, response_message = $2, updated_at = $3
		WHERE id = $4
	`
	ct, err := r.pool.Exec(ctx, query, req.Status, req.ResponseMessage, req.UpdatedAt, req.ID)
	if err != nil {
		return fmt.Errorf("failed to update request: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresMentorshipRepository) ListRequestsByUserID(ctx context.Context, userID string, role string) ([]*models.MentorshipRequest, error) {
	if r.pool == nil {
		return r.fallback.ListRequestsByUserID(ctx, userID, role)
	}

	var query string
	if role == "mentor" {
		query = `SELECT id, mentee_id, mentor_id, message, goals, preferred_schedule, status, response_message, created_at, updated_at FROM mentorship_requests WHERE mentor_id = $1 ORDER BY created_at DESC`
	} else {
		query = `SELECT id, mentee_id, mentor_id, message, goals, preferred_schedule, status, response_message, created_at, updated_at FROM mentorship_requests WHERE mentee_id = $1 ORDER BY created_at DESC`
	}

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list requests: %w", err)
	}
	defer rows.Close()

	var list []*models.MentorshipRequest
	for rows.Next() {
		var req models.MentorshipRequest
		if err := rows.Scan(
			&req.ID, &req.MenteeID, &req.MentorID, &req.Message, &req.Goals,
			&req.PreferredSchedule, &req.Status, &req.ResponseMessage, &req.CreatedAt, &req.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan request: %w", err)
		}
		list = append(list, &req)
	}
	return list, nil
}

// ----------------------------------------------------------------------
// Mentorship Relationship Operations
// ----------------------------------------------------------------------

func (r *PostgresMentorshipRepository) CreateMentorship(ctx context.Context, m *models.Mentorship) error {
	if r.pool == nil {
		return r.fallback.CreateMentorship(ctx, m)
	}

	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	if m.CreatedAt.IsZero() {
		m.CreatedAt = now
	}
	m.UpdatedAt = now

	query := `
		INSERT INTO mentorships (id, request_id, mentor_id, mentee_id, status, start_date, end_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.pool.Exec(ctx, query, m.ID, m.RequestID, m.MentorID, m.MenteeID, m.Status, m.StartDate, m.EndDate, m.CreatedAt, m.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create mentorship: %w", err)
	}
	return nil
}

func (r *PostgresMentorshipRepository) GetMentorshipByID(ctx context.Context, id string) (*models.Mentorship, error) {
	if r.pool == nil {
		return r.fallback.GetMentorshipByID(ctx, id)
	}

	query := `
		SELECT id, request_id, mentor_id, mentee_id, status, start_date, end_date, created_at, updated_at
		FROM mentorships
		WHERE id = $1
	`
	var m models.Mentorship
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&m.ID, &m.RequestID, &m.MentorID, &m.MenteeID, &m.Status, &m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get mentorship: %w", err)
	}
	return &m, nil
}

func (r *PostgresMentorshipRepository) GetActiveMentorshipBetween(ctx context.Context, menteeID, mentorID string) (*models.Mentorship, error) {
	if r.pool == nil {
		return r.fallback.GetActiveMentorshipBetween(ctx, menteeID, mentorID)
	}

	query := `
		SELECT id, request_id, mentor_id, mentee_id, status, start_date, end_date, created_at, updated_at
		FROM mentorships
		WHERE mentee_id = $1 AND mentor_id = $2 AND status = 'active'
		LIMIT 1
	`
	var m models.Mentorship
	err := r.pool.QueryRow(ctx, query, menteeID, mentorID).Scan(
		&m.ID, &m.RequestID, &m.MentorID, &m.MenteeID, &m.Status, &m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get active mentorship: %w", err)
	}
	return &m, nil
}

func (r *PostgresMentorshipRepository) CountActiveMenteesForMentor(ctx context.Context, mentorID string) (int, error) {
	if r.pool == nil {
		return r.fallback.CountActiveMenteesForMentor(ctx, mentorID)
	}

	query := `SELECT count(*) FROM mentorships WHERE mentor_id = $1 AND status = 'active'`
	var count int
	err := r.pool.QueryRow(ctx, query, mentorID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count active mentees: %w", err)
	}
	return count, nil
}

func (r *PostgresMentorshipRepository) UpdateMentorship(ctx context.Context, m *models.Mentorship) error {
	if r.pool == nil {
		return r.fallback.UpdateMentorship(ctx, m)
	}

	m.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE mentorships SET
			status = $1, end_date = $2, updated_at = $3
		WHERE id = $4
	`
	ct, err := r.pool.Exec(ctx, query, m.Status, m.EndDate, m.UpdatedAt, m.ID)
	if err != nil {
		return fmt.Errorf("failed to update mentorship: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresMentorshipRepository) ListMentorshipsByUserID(ctx context.Context, userID string) ([]*models.Mentorship, error) {
	if r.pool == nil {
		return r.fallback.ListMentorshipsByUserID(ctx, userID)
	}

	query := `
		SELECT id, request_id, mentor_id, mentee_id, status, start_date, end_date, created_at, updated_at
		FROM mentorships
		WHERE mentor_id = $1 OR mentee_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list mentorships: %w", err)
	}
	defer rows.Close()

	var list []*models.Mentorship
	for rows.Next() {
		var m models.Mentorship
		if err := rows.Scan(
			&m.ID, &m.RequestID, &m.MentorID, &m.MenteeID, &m.Status, &m.StartDate, &m.EndDate, &m.CreatedAt, &m.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan mentorship: %w", err)
		}
		list = append(list, &m)
	}
	return list, nil
}

// ----------------------------------------------------------------------
// Goal Operations
// ----------------------------------------------------------------------

func (r *PostgresMentorshipRepository) CreateGoal(ctx context.Context, goal *models.MentorshipGoal) error {
	if r.pool == nil {
		return r.fallback.CreateGoal(ctx, goal)
	}

	if goal.ID == "" {
		goal.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	if goal.CreatedAt.IsZero() {
		goal.CreatedAt = now
	}
	goal.UpdatedAt = now

	query := `
		INSERT INTO mentorship_goals (id, mentorship_id, title, description, target_date, status, progress, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.pool.Exec(ctx, query, goal.ID, goal.MentorshipID, goal.Title, goal.Description, goal.TargetDate, goal.Status, goal.Progress, goal.CreatedAt, goal.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create goal: %w", err)
	}
	return nil
}

func (r *PostgresMentorshipRepository) GetGoalByID(ctx context.Context, id string) (*models.MentorshipGoal, error) {
	if r.pool == nil {
		return r.fallback.GetGoalByID(ctx, id)
	}

	query := `SELECT id, mentorship_id, title, description, target_date, status, progress, created_at, updated_at FROM mentorship_goals WHERE id = $1`
	var g models.MentorshipGoal
	err := r.pool.QueryRow(ctx, query, id).Scan(&g.ID, &g.MentorshipID, &g.Title, &g.Description, &g.TargetDate, &g.Status, &g.Progress, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get goal: %w", err)
	}
	return &g, nil
}

func (r *PostgresMentorshipRepository) UpdateGoal(ctx context.Context, goal *models.MentorshipGoal) error {
	if r.pool == nil {
		return r.fallback.UpdateGoal(ctx, goal)
	}

	goal.UpdatedAt = time.Now().UTC()
	query := `UPDATE mentorship_goals SET title = $1, description = $2, target_date = $3, status = $4, progress = $5, updated_at = $6 WHERE id = $7`
	ct, err := r.pool.Exec(ctx, query, goal.Title, goal.Description, goal.TargetDate, goal.Status, goal.Progress, goal.UpdatedAt, goal.ID)
	if err != nil {
		return fmt.Errorf("failed to update goal: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresMentorshipRepository) ListGoalsByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipGoal, error) {
	if r.pool == nil {
		return r.fallback.ListGoalsByMentorshipID(ctx, mentorshipID)
	}

	query := `SELECT id, mentorship_id, title, description, target_date, status, progress, created_at, updated_at FROM mentorship_goals WHERE mentorship_id = $1 ORDER BY created_at ASC`
	rows, err := r.pool.Query(ctx, query, mentorshipID)
	if err != nil {
		return nil, fmt.Errorf("failed to list goals: %w", err)
	}
	defer rows.Close()

	var list []*models.MentorshipGoal
	for rows.Next() {
		var g models.MentorshipGoal
		if err := rows.Scan(&g.ID, &g.MentorshipID, &g.Title, &g.Description, &g.TargetDate, &g.Status, &g.Progress, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan goal: %w", err)
		}
		list = append(list, &g)
	}
	return list, nil
}

// ----------------------------------------------------------------------
// Session Operations
// ----------------------------------------------------------------------

func (r *PostgresMentorshipRepository) CreateSession(ctx context.Context, session *models.MentorshipSession) error {
	if r.pool == nil {
		return r.fallback.CreateSession(ctx, session)
	}

	if session.ID == "" {
		session.ID = uuid.NewString()
	}
	now := time.Now().UTC()
	if session.CreatedAt.IsZero() {
		session.CreatedAt = now
	}
	session.UpdatedAt = now

	query := `
		INSERT INTO mentorship_sessions (id, mentorship_id, title, description, scheduled_at, duration_minutes, meeting_url, status, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.pool.Exec(ctx, query,
		session.ID, session.MentorshipID, session.Title, session.Description, session.ScheduledAt,
		session.DurationMinutes, session.MeetingURL, session.Status, session.Notes,
		session.CreatedAt, session.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	return nil
}

func (r *PostgresMentorshipRepository) GetSessionByID(ctx context.Context, id string) (*models.MentorshipSession, error) {
	if r.pool == nil {
		return r.fallback.GetSessionByID(ctx, id)
	}

	query := `
		SELECT id, mentorship_id, title, description, scheduled_at, duration_minutes, meeting_url, status, notes, created_at, updated_at
		FROM mentorship_sessions
		WHERE id = $1
	`
	var s models.MentorshipSession
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.MentorshipID, &s.Title, &s.Description, &s.ScheduledAt,
		&s.DurationMinutes, &s.MeetingURL, &s.Status, &s.Notes,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}
	return &s, nil
}

func (r *PostgresMentorshipRepository) UpdateSession(ctx context.Context, session *models.MentorshipSession) error {
	if r.pool == nil {
		return r.fallback.UpdateSession(ctx, session)
	}

	session.UpdatedAt = time.Now().UTC()
	query := `
		UPDATE mentorship_sessions SET
			title = $1, description = $2, scheduled_at = $3, duration_minutes = $4,
			meeting_url = $5, status = $6, notes = $7, updated_at = $8
		WHERE id = $9
	`
	ct, err := r.pool.Exec(ctx, query,
		session.Title, session.Description, session.ScheduledAt, session.DurationMinutes,
		session.MeetingURL, session.Status, session.Notes, session.UpdatedAt,
		session.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresMentorshipRepository) ListSessionsByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipSession, error) {
	if r.pool == nil {
		return r.fallback.ListSessionsByMentorshipID(ctx, mentorshipID)
	}

	query := `
		SELECT id, mentorship_id, title, description, scheduled_at, duration_minutes, meeting_url, status, notes, created_at, updated_at
		FROM mentorship_sessions
		WHERE mentorship_id = $1
		ORDER BY scheduled_at ASC
	`
	rows, err := r.pool.Query(ctx, query, mentorshipID)
	if err != nil {
		return nil, fmt.Errorf("failed to list sessions: %w", err)
	}
	defer rows.Close()

	var list []*models.MentorshipSession
	for rows.Next() {
		var s models.MentorshipSession
		if err := rows.Scan(
			&s.ID, &s.MentorshipID, &s.Title, &s.Description, &s.ScheduledAt,
			&s.DurationMinutes, &s.MeetingURL, &s.Status, &s.Notes,
			&s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan session: %w", err)
		}
		list = append(list, &s)
	}
	return list, nil
}

// ----------------------------------------------------------------------
// Feedback Operations
// ----------------------------------------------------------------------

func (r *PostgresMentorshipRepository) CreateFeedback(ctx context.Context, fb *models.MentorshipFeedback) error {
	if r.pool == nil {
		return r.fallback.CreateFeedback(ctx, fb)
	}

	if fb.ID == "" {
		fb.ID = uuid.NewString()
	}
	if fb.CreatedAt.IsZero() {
		fb.CreatedAt = time.Now().UTC()
	}

	query := `
		INSERT INTO mentorship_feedback (id, mentorship_id, session_id, from_user_id, to_user_id, rating, comment, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	var sessionID *string
	if fb.SessionID != "" {
		sessionID = &fb.SessionID
	}
	_, err := r.pool.Exec(ctx, query, fb.ID, fb.MentorshipID, sessionID, fb.FromUserID, fb.ToUserID, fb.Rating, fb.Comment, fb.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create feedback: %w", err)
	}
	return nil
}

func (r *PostgresMentorshipRepository) ListFeedbackByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipFeedback, error) {
	if r.pool == nil {
		return r.fallback.ListFeedbackByMentorshipID(ctx, mentorshipID)
	}

	query := `
		SELECT id, mentorship_id, coalesce(session_id::text, ''), from_user_id, to_user_id, rating, comment, created_at
		FROM mentorship_feedback
		WHERE mentorship_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, mentorshipID)
	if err != nil {
		return nil, fmt.Errorf("failed to list feedback: %w", err)
	}
	defer rows.Close()

	var list []*models.MentorshipFeedback
	for rows.Next() {
		var fb models.MentorshipFeedback
		if err := rows.Scan(&fb.ID, &fb.MentorshipID, &fb.SessionID, &fb.FromUserID, &fb.ToUserID, &fb.Rating, &fb.Comment, &fb.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan feedback: %w", err)
		}
		list = append(list, &fb)
	}
	return list, nil
}

func (r *PostgresMentorshipRepository) ListFeedbackByMentorID(ctx context.Context, mentorID string) ([]*models.MentorshipFeedback, error) {
	if r.pool == nil {
		return r.fallback.ListFeedbackByMentorID(ctx, mentorID)
	}

	query := `
		SELECT id, mentorship_id, coalesce(session_id::text, ''), from_user_id, to_user_id, rating, comment, created_at
		FROM mentorship_feedback
		WHERE to_user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, mentorID)
	if err != nil {
		return nil, fmt.Errorf("failed to list feedback: %w", err)
	}
	defer rows.Close()

	var list []*models.MentorshipFeedback
	for rows.Next() {
		var fb models.MentorshipFeedback
		if err := rows.Scan(&fb.ID, &fb.MentorshipID, &fb.SessionID, &fb.FromUserID, &fb.ToUserID, &fb.Rating, &fb.Comment, &fb.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan feedback: %w", err)
		}
		list = append(list, &fb)
	}
	return list, nil
}
