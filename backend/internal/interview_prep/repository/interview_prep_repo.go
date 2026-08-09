package repository

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"kirmya/internal/interview_prep/models"
)

type Repository interface {
	// Preparations
	CreatePreparation(ctx context.Context, prep *models.InterviewPreparation) error
	GetPreparation(ctx context.Context, id uuid.UUID) (*models.InterviewPreparation, error)
	ListPreparations(ctx context.Context, userID uuid.UUID) ([]models.InterviewPreparation, error)
	UpdatePreparation(ctx context.Context, prep *models.InterviewPreparation) error
	DeletePreparation(ctx context.Context, id uuid.UUID) error

	// Questions
	SaveQuestion(ctx context.Context, q *models.InterviewQuestion) error
	GetQuestion(ctx context.Context, id uuid.UUID) (*models.InterviewQuestion, error)
	ListQuestions(ctx context.Context, userID uuid.UUID, prepID *uuid.UUID) ([]models.InterviewQuestion, error)
	UpdateQuestion(ctx context.Context, q *models.InterviewQuestion) error
	DeleteQuestion(ctx context.Context, id uuid.UUID) error

	// Mock Sessions & Answers
	CreateMockSession(ctx context.Context, session *models.MockInterviewSession) error
	GetMockSession(ctx context.Context, id uuid.UUID) (*models.MockInterviewSession, error)
	ListMockSessions(ctx context.Context, userID uuid.UUID) ([]models.MockInterviewSession, error)
	UpdateMockSession(ctx context.Context, session *models.MockInterviewSession) error
	AddMockAnswer(ctx context.Context, answer *models.MockInterviewAnswer) error
	ListMockAnswers(ctx context.Context, sessionID uuid.UUID) ([]models.MockInterviewAnswer, error)

	// Tasks
	CreateTask(ctx context.Context, task *models.PreparationTask) error
	ListTasks(ctx context.Context, prepID uuid.UUID) ([]models.PreparationTask, error)
	ToggleTaskCompletion(ctx context.Context, id uuid.UUID, isCompleted bool) error
	DeleteTask(ctx context.Context, id uuid.UUID) error

	// Notes & Debrief
	SaveNote(ctx context.Context, note *models.InterviewNote) error
	GetNote(ctx context.Context, prepID uuid.UUID) (*models.InterviewNote, error)

	// Readiness Scores
	GetReadinessScore(ctx context.Context, userID uuid.UUID) (*models.InterviewReadinessScore, error)
	SaveReadinessScore(ctx context.Context, score *models.InterviewReadinessScore) error

	// AI Coach
	SaveAICoachSession(ctx context.Context, session *models.AICoachSession) error
	GetAICoachSession(ctx context.Context, id uuid.UUID) (*models.AICoachSession, error)
	ListAICoachSessions(ctx context.Context, userID uuid.UUID) ([]models.AICoachSession, error)
}

type postgresRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	// Memory fallbacks when pool is nil
	preps     map[uuid.UUID]*models.InterviewPreparation
	questions map[uuid.UUID]*models.InterviewQuestion
	sessions  map[uuid.UUID]*models.MockInterviewSession
	answers   map[uuid.UUID]*models.MockInterviewAnswer
	tasks     map[uuid.UUID]*models.PreparationTask
	notes     map[uuid.UUID]*models.InterviewNote
	readiness map[uuid.UUID]*models.InterviewReadinessScore
	coach     map[uuid.UUID]*models.AICoachSession
}

func NewPostgresRepository(pool *pgxpool.Pool) Repository {
	return &postgresRepository{
		pool:      pool,
		preps:     make(map[uuid.UUID]*models.InterviewPreparation),
		questions: make(map[uuid.UUID]*models.InterviewQuestion),
		sessions:  make(map[uuid.UUID]*models.MockInterviewSession),
		answers:   make(map[uuid.UUID]*models.MockInterviewAnswer),
		tasks:     make(map[uuid.UUID]*models.PreparationTask),
		notes:     make(map[uuid.UUID]*models.InterviewNote),
		readiness: make(map[uuid.UUID]*models.InterviewReadinessScore),
		coach:     make(map[uuid.UUID]*models.AICoachSession),
	}
}

// ----------------- Preparations -----------------

func (r *postgresRepository) CreatePreparation(ctx context.Context, prep *models.InterviewPreparation) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.preps[prep.ID] = prep
		return nil
	}

	query := `
		INSERT INTO interview_preparations (
			id, user_id, job_id, application_id, company_name, job_title, job_description,
			interview_date, interview_type, interview_round, experience_level, preparation_duration,
			status, readiness_score, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`
	_, err := r.pool.Exec(ctx, query,
		prep.ID, prep.UserID, prep.JobID, prep.ApplicationID, prep.CompanyName, prep.JobTitle, prep.JobDescription,
		prep.InterviewDate, prep.InterviewType, prep.InterviewRound, prep.ExperienceLevel, prep.PreparationDuration,
		prep.Status, prep.ReadinessScore, prep.CreatedAt, prep.UpdatedAt,
	)
	return err
}

func (r *postgresRepository) GetPreparation(ctx context.Context, id uuid.UUID) (*models.InterviewPreparation, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		prep, exists := r.preps[id]
		if !exists {
			return nil, errors.New("preparation not found")
		}
		return prep, nil
	}

	query := `
		SELECT id, user_id, job_id, application_id, company_name, job_title, job_description,
		       interview_date, interview_type, interview_round, experience_level, preparation_duration,
		       status, readiness_score, created_at, updated_at
		FROM interview_preparations WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	var prep models.InterviewPreparation
	err := row.Scan(
		&prep.ID, &prep.UserID, &prep.JobID, &prep.ApplicationID, &prep.CompanyName, &prep.JobTitle, &prep.JobDescription,
		&prep.InterviewDate, &prep.InterviewType, &prep.InterviewRound, &prep.ExperienceLevel, &prep.PreparationDuration,
		&prep.Status, &prep.ReadinessScore, &prep.CreatedAt, &prep.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &prep, nil
}

func (r *postgresRepository) ListPreparations(ctx context.Context, userID uuid.UUID) ([]models.InterviewPreparation, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var res []models.InterviewPreparation
		for _, p := range r.preps {
			if p.UserID == userID {
				res = append(res, *p)
			}
		}
		return res, nil
	}

	query := `
		SELECT id, user_id, job_id, application_id, company_name, job_title, job_description,
		       interview_date, interview_type, interview_round, experience_level, preparation_duration,
		       status, readiness_score, created_at, updated_at
		FROM interview_preparations WHERE user_id = $1 ORDER BY updated_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.InterviewPreparation
	for rows.Next() {
		var prep models.InterviewPreparation
		if err := rows.Scan(
			&prep.ID, &prep.UserID, &prep.JobID, &prep.ApplicationID, &prep.CompanyName, &prep.JobTitle, &prep.JobDescription,
			&prep.InterviewDate, &prep.InterviewType, &prep.InterviewRound, &prep.ExperienceLevel, &prep.PreparationDuration,
			&prep.Status, &prep.ReadinessScore, &prep.CreatedAt, &prep.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, prep)
	}
	return list, nil
}

func (r *postgresRepository) UpdatePreparation(ctx context.Context, prep *models.InterviewPreparation) error {
	prep.UpdatedAt = time.Now()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.preps[prep.ID] = prep
		return nil
	}

	query := `
		UPDATE interview_preparations SET
			company_name = $1, job_title = $2, job_description = $3, interview_date = $4,
			interview_type = $5, interview_round = $6, experience_level = $7, preparation_duration = $8,
			status = $9, readiness_score = $10, updated_at = $11
		WHERE id = $12
	`
	_, err := r.pool.Exec(ctx, query,
		prep.CompanyName, prep.JobTitle, prep.JobDescription, prep.InterviewDate,
		prep.InterviewType, prep.InterviewRound, prep.ExperienceLevel, prep.PreparationDuration,
		prep.Status, prep.ReadinessScore, prep.UpdatedAt, prep.ID,
	)
	return err
}

func (r *postgresRepository) DeletePreparation(ctx context.Context, id uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.preps, id)
		return nil
	}

	query := `DELETE FROM interview_preparations WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// ----------------- Questions -----------------

func (r *postgresRepository) SaveQuestion(ctx context.Context, q *models.InterviewQuestion) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.questions[q.ID] = q
		return nil
	}

	query := `
		INSERT INTO interview_question_library (
			id, preparation_id, user_id, question, category, difficulty, sample_answer, user_answer,
			notes, is_practiced, is_saved, star_situation, star_task, star_action, star_result, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`
	_, err := r.pool.Exec(ctx, query,
		q.ID, q.PreparationID, q.UserID, q.Question, q.Category, q.Difficulty, q.SampleAnswer, q.UserAnswer,
		q.Notes, q.IsPracticed, q.IsSaved, q.STARSituation, q.STARTask, q.STARAction, q.STARResult, q.CreatedAt,
	)
	return err
}

func (r *postgresRepository) GetQuestion(ctx context.Context, id uuid.UUID) (*models.InterviewQuestion, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		q, exists := r.questions[id]
		if !exists {
			return nil, errors.New("question not found")
		}
		return q, nil
	}

	query := `
		SELECT id, preparation_id, user_id, question, category, difficulty, sample_answer, user_answer,
		       notes, is_practiced, is_saved, star_situation, star_task, star_action, star_result, created_at
		FROM interview_question_library WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	var q models.InterviewQuestion
	err := row.Scan(
		&q.ID, &q.PreparationID, &q.UserID, &q.Question, &q.Category, &q.Difficulty, &q.SampleAnswer, &q.UserAnswer,
		&q.Notes, &q.IsPracticed, &q.IsSaved, &q.STARSituation, &q.STARTask, &q.STARAction, &q.STARResult, &q.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &q, nil
}

func (r *postgresRepository) ListQuestions(ctx context.Context, userID uuid.UUID, prepID *uuid.UUID) ([]models.InterviewQuestion, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var res []models.InterviewQuestion
		for _, q := range r.questions {
			if q.UserID == userID {
				if prepID != nil && (q.PreparationID == nil || *q.PreparationID != *prepID) {
					continue
				}
				res = append(res, *q)
			}
		}
		return res, nil
	}

	var rows pgx.Rows
	var err error

	if prepID != nil {
		query := `
			SELECT id, preparation_id, user_id, question, category, difficulty, sample_answer, user_answer,
			       notes, is_practiced, is_saved, star_situation, star_task, star_action, star_result, created_at
			FROM interview_question_library WHERE user_id = $1 AND preparation_id = $2 ORDER BY created_at DESC
		`
		rows, err = r.pool.Query(ctx, query, userID, *prepID)
	} else {
		query := `
			SELECT id, preparation_id, user_id, question, category, difficulty, sample_answer, user_answer,
			       notes, is_practiced, is_saved, star_situation, star_task, star_action, star_result, created_at
			FROM interview_question_library WHERE user_id = $1 ORDER BY created_at DESC
		`
		rows, err = r.pool.Query(ctx, query, userID)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.InterviewQuestion
	for rows.Next() {
		var q models.InterviewQuestion
		if err := rows.Scan(
			&q.ID, &q.PreparationID, &q.UserID, &q.Question, &q.Category, &q.Difficulty, &q.SampleAnswer, &q.UserAnswer,
			&q.Notes, &q.IsPracticed, &q.IsSaved, &q.STARSituation, &q.STARTask, &q.STARAction, &q.STARResult, &q.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, q)
	}
	return list, nil
}

func (r *postgresRepository) UpdateQuestion(ctx context.Context, q *models.InterviewQuestion) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.questions[q.ID] = q
		return nil
	}

	query := `
		UPDATE interview_question_library SET
			user_answer = $1, notes = $2, is_practiced = $3, is_saved = $4,
			star_situation = $5, star_task = $6, star_action = $7, star_result = $8
		WHERE id = $9
	`
	_, err := r.pool.Exec(ctx, query,
		q.UserAnswer, q.Notes, q.IsPracticed, q.IsSaved,
		q.STARSituation, q.STARTask, q.STARAction, q.STARResult, q.ID,
	)
	return err
}

func (r *postgresRepository) DeleteQuestion(ctx context.Context, id uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.questions, id)
		return nil
	}

	query := `DELETE FROM interview_question_library WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// ----------------- Mock Sessions & Answers -----------------

func (r *postgresRepository) CreateMockSession(ctx context.Context, session *models.MockInterviewSession) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.sessions[session.ID] = session
		return nil
	}

	query := `
		INSERT INTO mock_interview_sessions (
			id, user_id, preparation_id, title, interview_type, difficulty, total_questions,
			completed_questions, overall_score, relevance_score, clarity_score, confidence_score,
			technical_score, communication_score, structure_score, status, started_at, completed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
	`
	_, err := r.pool.Exec(ctx, query,
		session.ID, session.UserID, session.PreparationID, session.Title, session.InterviewType, session.Difficulty,
		session.TotalQuestions, session.CompletedQuestions, session.OverallScore, session.RelevanceScore, session.ClarityScore,
		session.ConfidenceScore, session.TechnicalScore, session.CommunicationScore, session.StructureScore, session.Status,
		session.StartedAt, session.CompletedAt,
	)
	return err
}

func (r *postgresRepository) GetMockSession(ctx context.Context, id uuid.UUID) (*models.MockInterviewSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		s, exists := r.sessions[id]
		if !exists {
			return nil, errors.New("mock session not found")
		}
		var answers []models.MockInterviewAnswer
		for _, a := range r.answers {
			if a.SessionID == id {
				answers = append(answers, *a)
			}
		}
		s.Answers = answers
		return s, nil
	}

	query := `
		SELECT id, user_id, preparation_id, title, interview_type, difficulty, total_questions,
		       completed_questions, overall_score, relevance_score, clarity_score, confidence_score,
		       technical_score, communication_score, structure_score, status, started_at, completed_at
		FROM mock_interview_sessions WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	var session models.MockInterviewSession
	err := row.Scan(
		&session.ID, &session.UserID, &session.PreparationID, &session.Title, &session.InterviewType, &session.Difficulty,
		&session.TotalQuestions, &session.CompletedQuestions, &session.OverallScore, &session.RelevanceScore, &session.ClarityScore,
		&session.ConfidenceScore, &session.TechnicalScore, &session.CommunicationScore, &session.StructureScore, &session.Status,
		&session.StartedAt, &session.CompletedAt,
	)
	if err != nil {
		return nil, err
	}

	answers, _ := r.ListMockAnswers(ctx, id)
	session.Answers = answers
	return &session, nil
}

func (r *postgresRepository) ListMockSessions(ctx context.Context, userID uuid.UUID) ([]models.MockInterviewSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var res []models.MockInterviewSession
		for _, s := range r.sessions {
			if s.UserID == userID {
				res = append(res, *s)
			}
		}
		return res, nil
	}

	query := `
		SELECT id, user_id, preparation_id, title, interview_type, difficulty, total_questions,
		       completed_questions, overall_score, relevance_score, clarity_score, confidence_score,
		       technical_score, communication_score, structure_score, status, started_at, completed_at
		FROM mock_interview_sessions WHERE user_id = $1 ORDER BY started_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.MockInterviewSession
	for rows.Next() {
		var session models.MockInterviewSession
		if err := rows.Scan(
			&session.ID, &session.UserID, &session.PreparationID, &session.Title, &session.InterviewType, &session.Difficulty,
			&session.TotalQuestions, &session.CompletedQuestions, &session.OverallScore, &session.RelevanceScore, &session.ClarityScore,
			&session.ConfidenceScore, &session.TechnicalScore, &session.CommunicationScore, &session.StructureScore, &session.Status,
			&session.StartedAt, &session.CompletedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, session)
	}
	return list, nil
}

func (r *postgresRepository) UpdateMockSession(ctx context.Context, session *models.MockInterviewSession) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.sessions[session.ID] = session
		return nil
	}

	query := `
		UPDATE mock_interview_sessions SET
			completed_questions = $1, overall_score = $2, relevance_score = $3, clarity_score = $4,
			confidence_score = $5, technical_score = $6, communication_score = $7, structure_score = $8,
			status = $9, completed_at = $10
		WHERE id = $11
	`
	_, err := r.pool.Exec(ctx, query,
		session.CompletedQuestions, session.OverallScore, session.RelevanceScore, session.ClarityScore,
		session.ConfidenceScore, session.TechnicalScore, session.CommunicationScore, session.StructureScore,
		session.Status, session.CompletedAt, session.ID,
	)
	return err
}

func (r *postgresRepository) AddMockAnswer(ctx context.Context, answer *models.MockInterviewAnswer) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.answers[answer.ID] = answer
		return nil
	}

	query := `
		INSERT INTO mock_interview_answers (
			id, session_id, question_text, candidate_answer, audio_transcript, overall_score,
			relevance_score, clarity_score, confidence_score, technical_score, communication_score,
			structure_score, what_went_well, what_could_improve, suggested_answer,
			has_star_situation, has_star_task, has_star_action, has_star_result, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
	`
	_, err := r.pool.Exec(ctx, query,
		answer.ID, answer.SessionID, answer.QuestionText, answer.CandidateAnswer, answer.AudioTranscript,
		answer.OverallScore, answer.RelevanceScore, answer.ClarityScore, answer.ConfidenceScore, answer.TechnicalScore,
		answer.CommunicationScore, answer.StructureScore, answer.WhatWentWell, answer.WhatCouldImprove, answer.SuggestedAnswer,
		answer.HasSTARSituation, answer.HasSTARTask, answer.HasSTARAction, answer.HasSTARResult, answer.CreatedAt,
	)
	return err
}

func (r *postgresRepository) ListMockAnswers(ctx context.Context, sessionID uuid.UUID) ([]models.MockInterviewAnswer, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var res []models.MockInterviewAnswer
		for _, a := range r.answers {
			if a.SessionID == sessionID {
				res = append(res, *a)
			}
		}
		return res, nil
	}

	query := `
		SELECT id, session_id, question_text, candidate_answer, audio_transcript, overall_score,
		       relevance_score, clarity_score, confidence_score, technical_score, communication_score,
		       structure_score, what_went_well, what_could_improve, suggested_answer,
		       has_star_situation, has_star_task, has_star_action, has_star_result, created_at
		FROM mock_interview_answers WHERE session_id = $1 ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.MockInterviewAnswer
	for rows.Next() {
		var a models.MockInterviewAnswer
		if err := rows.Scan(
			&a.ID, &a.SessionID, &a.QuestionText, &a.CandidateAnswer, &a.AudioTranscript, &a.OverallScore,
			&a.RelevanceScore, &a.ClarityScore, &a.ConfidenceScore, &a.TechnicalScore, &a.CommunicationScore,
			&a.StructureScore, &a.WhatWentWell, &a.WhatCouldImprove, &a.SuggestedAnswer,
			&a.HasSTARSituation, &a.HasSTARTask, &a.HasSTARAction, &a.HasSTARResult, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, nil
}

// ----------------- Tasks -----------------

func (r *postgresRepository) CreateTask(ctx context.Context, task *models.PreparationTask) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.tasks[task.ID] = task
		return nil
	}

	query := `
		INSERT INTO preparation_tasks (id, preparation_id, title, category, due_date, is_completed, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query, task.ID, task.PreparationID, task.Title, task.Category, task.DueDate, task.IsCompleted, task.CreatedAt)
	return err
}

func (r *postgresRepository) ListTasks(ctx context.Context, prepID uuid.UUID) ([]models.PreparationTask, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var res []models.PreparationTask
		for _, t := range r.tasks {
			if t.PreparationID == prepID {
				res = append(res, *t)
			}
		}
		return res, nil
	}

	query := `
		SELECT id, preparation_id, title, category, due_date, is_completed, created_at
		FROM preparation_tasks WHERE preparation_id = $1 ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, prepID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.PreparationTask
	for rows.Next() {
		var t models.PreparationTask
		if err := rows.Scan(&t.ID, &t.PreparationID, &t.Title, &t.Category, &t.DueDate, &t.IsCompleted, &t.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, nil
}

func (r *postgresRepository) ToggleTaskCompletion(ctx context.Context, id uuid.UUID, isCompleted bool) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if t, exists := r.tasks[id]; exists {
			t.IsCompleted = isCompleted
		}
		return nil
	}

	query := `UPDATE preparation_tasks SET is_completed = $1 WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, isCompleted, id)
	return err
}

func (r *postgresRepository) DeleteTask(ctx context.Context, id uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.tasks, id)
		return nil
	}

	query := `DELETE FROM preparation_tasks WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// ----------------- Notes & Debrief -----------------

func (r *postgresRepository) SaveNote(ctx context.Context, note *models.InterviewNote) error {
	note.UpdatedAt = time.Now()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.notes[note.PreparationID] = note
		return nil
	}

	query := `
		INSERT INTO interview_notes (
			id, preparation_id, user_id, interviewers, topics_discussed, questions_asked,
			candidate_performance, personal_notes, overall_feeling, potential_strengths,
			potential_weaknesses, follow_up_suggestions, thank_you_draft, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		ON CONFLICT (id) DO UPDATE SET
			interviewers = EXCLUDED.interviewers, topics_discussed = EXCLUDED.topics_discussed,
			questions_asked = EXCLUDED.questions_asked, candidate_performance = EXCLUDED.candidate_performance,
			personal_notes = EXCLUDED.personal_notes, overall_feeling = EXCLUDED.overall_feeling,
			potential_strengths = EXCLUDED.potential_strengths, potential_weaknesses = EXCLUDED.potential_weaknesses,
			follow_up_suggestions = EXCLUDED.follow_up_suggestions, thank_you_draft = EXCLUDED.thank_you_draft,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.pool.Exec(ctx, query,
		note.ID, note.PreparationID, note.UserID, note.Interviewers, note.TopicsDiscussed, note.QuestionsAsked,
		note.CandidatePerformance, note.PersonalNotes, note.OverallFeeling, note.PotentialStrengths,
		note.PotentialWeaknesses, note.FollowUpSuggestions, note.ThankYouDraft, note.CreatedAt, note.UpdatedAt,
	)
	return err
}

func (r *postgresRepository) GetNote(ctx context.Context, prepID uuid.UUID) (*models.InterviewNote, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		note, exists := r.notes[prepID]
		if !exists {
			return nil, errors.New("note not found")
		}
		return note, nil
	}

	query := `
		SELECT id, preparation_id, user_id, interviewers, topics_discussed, questions_asked,
		       candidate_performance, personal_notes, overall_feeling, potential_strengths,
		       potential_weaknesses, follow_up_suggestions, thank_you_draft, created_at, updated_at
		FROM interview_notes WHERE preparation_id = $1
	`
	row := r.pool.QueryRow(ctx, query, prepID)
	var n models.InterviewNote
	err := row.Scan(
		&n.ID, &n.PreparationID, &n.UserID, &n.Interviewers, &n.TopicsDiscussed, &n.QuestionsAsked,
		&n.CandidatePerformance, &n.PersonalNotes, &n.OverallFeeling, &n.PotentialStrengths,
		&n.PotentialWeaknesses, &n.FollowUpSuggestions, &n.ThankYouDraft, &n.CreatedAt, &n.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

// ----------------- Readiness Scores -----------------

func (r *postgresRepository) GetReadinessScore(ctx context.Context, userID uuid.UUID) (*models.InterviewReadinessScore, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		s, exists := r.readiness[userID]
		if !exists {
			defaultScore := &models.InterviewReadinessScore{
				UserID:                   userID,
				OverallReadiness:         75,
				TechnicalReadiness:       80,
				BehavioralReadiness:      72,
				CommunicationReadiness:   85,
				RoleFitReadiness:         78,
				CompanyKnowledgeReadiness: 70,
				TotalMockSessions:        0,
				TotalQuestionsPracticed:  0,
				UpdatedAt:                time.Now(),
			}
			return defaultScore, nil
		}
		return s, nil
	}

	query := `
		SELECT user_id, overall_readiness, technical_readiness, behavioral_readiness,
		       communication_readiness, role_fit_readiness, company_knowledge_readiness,
		       total_mock_sessions, total_questions_practiced, updated_at
		FROM interview_readiness_scores WHERE user_id = $1
	`
	row := r.pool.QueryRow(ctx, query, userID)
	var s models.InterviewReadinessScore
	err := row.Scan(
		&s.UserID, &s.OverallReadiness, &s.TechnicalReadiness, &s.BehavioralReadiness,
		&s.CommunicationReadiness, &s.RoleFitReadiness, &s.CompanyKnowledgeReadiness,
		&s.TotalMockSessions, &s.TotalQuestionsPracticed, &s.UpdatedAt,
	)
	if err != nil {
		// Return default score if record doesn't exist yet
		return &models.InterviewReadinessScore{
			UserID:                   userID,
			OverallReadiness:         75,
			TechnicalReadiness:       80,
			BehavioralReadiness:      72,
			CommunicationReadiness:   85,
			RoleFitReadiness:         78,
			CompanyKnowledgeReadiness: 70,
			TotalMockSessions:        0,
			TotalQuestionsPracticed:  0,
			UpdatedAt:                time.Now(),
		}, nil
	}
	return &s, nil
}

func (r *postgresRepository) SaveReadinessScore(ctx context.Context, score *models.InterviewReadinessScore) error {
	score.UpdatedAt = time.Now()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.readiness[score.UserID] = score
		return nil
	}

	query := `
		INSERT INTO interview_readiness_scores (
			user_id, overall_readiness, technical_readiness, behavioral_readiness,
			communication_readiness, role_fit_readiness, company_knowledge_readiness,
			total_mock_sessions, total_questions_practiced, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (user_id) DO UPDATE SET
			overall_readiness = EXCLUDED.overall_readiness, technical_readiness = EXCLUDED.technical_readiness,
			behavioral_readiness = EXCLUDED.behavioral_readiness, communication_readiness = EXCLUDED.communication_readiness,
			role_fit_readiness = EXCLUDED.role_fit_readiness, company_knowledge_readiness = EXCLUDED.company_knowledge_readiness,
			total_mock_sessions = EXCLUDED.total_mock_sessions, total_questions_practiced = EXCLUDED.total_questions_practiced,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.pool.Exec(ctx, query,
		score.UserID, score.OverallReadiness, score.TechnicalReadiness, score.BehavioralReadiness,
		score.CommunicationReadiness, score.RoleFitReadiness, score.CompanyKnowledgeReadiness,
		score.TotalMockSessions, score.TotalQuestionsPracticed, score.UpdatedAt,
	)
	return err
}

// ----------------- AI Coach Sessions -----------------

func (r *postgresRepository) SaveAICoachSession(ctx context.Context, session *models.AICoachSession) error {
	session.UpdatedAt = time.Now()
	msgJSON, err := json.Marshal(session.Messages)
	if err != nil {
		msgJSON = []byte("[]")
	}

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.coach[session.ID] = session
		return nil
	}

	query := `
		INSERT INTO ai_coach_sessions (id, user_id, topic, messages, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO UPDATE SET
			topic = EXCLUDED.topic, messages = EXCLUDED.messages, updated_at = EXCLUDED.updated_at
	`
	_, err = r.pool.Exec(ctx, query, session.ID, session.UserID, session.Topic, msgJSON, session.CreatedAt, session.UpdatedAt)
	return err
}

func (r *postgresRepository) GetAICoachSession(ctx context.Context, id uuid.UUID) (*models.AICoachSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		s, exists := r.coach[id]
		if !exists {
			return nil, errors.New("coach session not found")
		}
		return s, nil
	}

	query := `SELECT id, user_id, topic, messages, created_at, updated_at FROM ai_coach_sessions WHERE id = $1`
	row := r.pool.QueryRow(ctx, query, id)
	var s models.AICoachSession
	var msgJSON []byte
	if err := row.Scan(&s.ID, &s.UserID, &s.Topic, &msgJSON, &s.CreatedAt, &s.UpdatedAt); err != nil {
		return nil, err
	}
	_ = json.Unmarshal(msgJSON, &s.Messages)
	return &s, nil
}

func (r *postgresRepository) ListAICoachSessions(ctx context.Context, userID uuid.UUID) ([]models.AICoachSession, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var res []models.AICoachSession
		for _, s := range r.coach {
			if s.UserID == userID {
				res = append(res, *s)
			}
		}
		return res, nil
	}

	query := `SELECT id, user_id, topic, messages, created_at, updated_at FROM ai_coach_sessions WHERE user_id = $1 ORDER BY updated_at DESC`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.AICoachSession
	for rows.Next() {
		var s models.AICoachSession
		var msgJSON []byte
		if err := rows.Scan(&s.ID, &s.UserID, &s.Topic, &msgJSON, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(msgJSON, &s.Messages)
		list = append(list, s)
	}
	return list, nil
}
