package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/assessment/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AssessmentRepository interface {
	GetAssessments(ctx context.Context, category, difficulty string) ([]domain.Assessment, error)
	GetAssessmentByID(ctx context.Context, id uuid.UUID) (*domain.Assessment, error)
	GetQuestionsByAssessmentID(ctx context.Context, assessmentID uuid.UUID) ([]domain.Question, error)

	SaveUserResult(ctx context.Context, result *domain.UserAssessmentResult) error
	GetUserResults(ctx context.Context, userID uuid.UUID) ([]domain.UserAssessmentResult, error)
	GetUserBadges(ctx context.Context, userID uuid.UUID) ([]domain.SkillBadge, error)
	IssueBadge(ctx context.Context, badge *domain.SkillBadge) error
	CalculatePercentileRank(ctx context.Context, assessmentID uuid.UUID, score int) int
	GetBadgeByVerificationCode(ctx context.Context, code string) (*domain.SkillBadge, error)
}

type postgresAssessmentRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	assessments map[uuid.UUID]*domain.Assessment
	questions   map[uuid.UUID][]domain.Question
	results     map[uuid.UUID][]domain.UserAssessmentResult
	badges      map[uuid.UUID][]domain.SkillBadge
}

func NewAssessmentRepository(pool *pgxpool.Pool) AssessmentRepository {
	repo := &postgresAssessmentRepository{
		pool:        pool,
		assessments: make(map[uuid.UUID]*domain.Assessment),
		questions:   make(map[uuid.UUID][]domain.Question),
		results:     make(map[uuid.UUID][]domain.UserAssessmentResult),
		badges:      make(map[uuid.UUID][]domain.SkillBadge),
	}
	repo.seedInitialDataIfMemory()
	return repo
}

func (r *postgresAssessmentRepository) GetAssessments(ctx context.Context, category, difficulty string) ([]domain.Assessment, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.Assessment
		for _, a := range r.assessments {
			if category != "" && a.Category != category {
				continue
			}
			if difficulty != "" && a.DifficultyLevel != difficulty {
				continue
			}
			list = append(list, *a)
		}
		return list, nil
	}

	query := `
		SELECT id, title, description, category, difficulty_level,
		       duration_minutes, passing_score, total_questions, badge_title, badge_tier, created_at
		FROM assessments
		WHERE ($1 = '' OR category = $1)
		  AND ($2 = '' OR difficulty_level = $2)
		ORDER BY title ASC
	`
	rows, err := r.pool.Query(ctx, query, category, difficulty)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Assessment
	for rows.Next() {
		var a domain.Assessment
		var badgeTitle, badgeTier *string
		if err := rows.Scan(
			&a.ID, &a.Title, &a.Description, &a.Category, &a.DifficultyLevel,
			&a.DurationMinutes, &a.PassingScore, &a.TotalQuestions, &badgeTitle, &badgeTier, &a.CreatedAt,
		); err != nil {
			return nil, err
		}
		if badgeTitle != nil {
			a.BadgeTitle = *badgeTitle
		}
		if badgeTier != nil {
			a.BadgeTier = *badgeTier
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func (r *postgresAssessmentRepository) GetAssessmentByID(ctx context.Context, id uuid.UUID) (*domain.Assessment, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if a, exists := r.assessments[id]; exists {
			aCopy := *a
			aCopy.Questions = r.questions[id]
			return &aCopy, nil
		}
		return nil, fmt.Errorf("assessment not found: %s", id)
	}

	query := `
		SELECT id, title, description, category, difficulty_level,
		       duration_minutes, passing_score, total_questions, badge_title, badge_tier, created_at
		FROM assessments
		WHERE id = $1
	`
	var a domain.Assessment
	var badgeTitle, badgeTier *string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.Title, &a.Description, &a.Category, &a.DifficultyLevel,
		&a.DurationMinutes, &a.PassingScore, &a.TotalQuestions, &badgeTitle, &badgeTier, &a.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("assessment not found: %s", id)
		}
		return nil, err
	}
	if badgeTitle != nil {
		a.BadgeTitle = *badgeTitle
	}
	if badgeTier != nil {
		a.BadgeTier = *badgeTier
	}

	questions, err := r.GetQuestionsByAssessmentID(ctx, id)
	if err == nil {
		a.Questions = questions
	}
	return &a, nil
}

func (r *postgresAssessmentRepository) GetQuestionsByAssessmentID(ctx context.Context, assessmentID uuid.UUID) ([]domain.Question, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.questions[assessmentID], nil
	}

	query := `
		SELECT id, assessment_id, question_type, question_text, options_json,
		       correct_option_index, practical_rubric, max_points, question_order, created_at
		FROM questions
		WHERE assessment_id = $1
		ORDER BY question_order ASC
	`
	rows, err := r.pool.Query(ctx, query, assessmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Question
	for rows.Next() {
		var q domain.Question
		var optionsJSON []byte
		var rubric *string
		if err := rows.Scan(
			&q.ID, &q.AssessmentID, &q.QuestionType, &q.QuestionText, &optionsJSON,
			&q.CorrectOptionIndex, &rubric, &q.MaxPoints, &q.QuestionOrder, &q.CreatedAt,
		); err != nil {
			return nil, err
		}
		if len(optionsJSON) > 0 {
			_ = json.Unmarshal(optionsJSON, &q.Options)
		}
		if rubric != nil {
			q.PracticalRubric = *rubric
		}
		list = append(list, q)
	}
	return list, rows.Err()
}

func (r *postgresAssessmentRepository) SaveUserResult(ctx context.Context, result *domain.UserAssessmentResult) error {
	if result.ID == uuid.Nil {
		result.ID = uuid.New()
	}
	if result.CompletedAt.IsZero() {
		result.CompletedAt = time.Now()
	}

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.results[result.UserID] = append(r.results[result.UserID], *result)
		return nil
	}

	query := `
		INSERT INTO user_assessment_results (
			id, user_id, user_name, assessment_id, assessment_title,
			score_percentage, mcq_score, practical_ai_score, percentile_rank,
			passed, time_taken_seconds, ai_feedback_summary, completed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`
	_, err := r.pool.Exec(ctx, query,
		result.ID, result.UserID, result.UserName, result.AssessmentID, result.AssessmentTitle,
		result.ScorePercentage, result.MCQScore, result.PracticalAIScore, result.PercentileRank,
		result.Passed, result.TimeTakenSeconds, result.AIFeedbackSummary, result.CompletedAt,
	)
	return err
}

func (r *postgresAssessmentRepository) GetUserResults(ctx context.Context, userID uuid.UUID) ([]domain.UserAssessmentResult, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.results[userID], nil
	}

	query := `
		SELECT id, user_id, user_name, assessment_id, assessment_title,
		       score_percentage, mcq_score, practical_ai_score, percentile_rank,
		       passed, time_taken_seconds, ai_feedback_summary, completed_at
		FROM user_assessment_results
		WHERE user_id = $1
		ORDER BY completed_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.UserAssessmentResult
	for rows.Next() {
		var res domain.UserAssessmentResult
		var userName, assessmentTitle, aiFeedback *string
		if err := rows.Scan(
			&res.ID, &res.UserID, &userName, &res.AssessmentID, &assessmentTitle,
			&res.ScorePercentage, &res.MCQScore, &res.PracticalAIScore, &res.PercentileRank,
			&res.Passed, &res.TimeTakenSeconds, &aiFeedback, &res.CompletedAt,
		); err != nil {
			return nil, err
		}
		if userName != nil {
			res.UserName = *userName
		}
		if assessmentTitle != nil {
			res.AssessmentTitle = *assessmentTitle
		}
		if aiFeedback != nil {
			res.AIFeedbackSummary = *aiFeedback
		}
		list = append(list, res)
	}
	return list, rows.Err()
}

func (r *postgresAssessmentRepository) GetUserBadges(ctx context.Context, userID uuid.UUID) ([]domain.SkillBadge, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.badges[userID], nil
	}

	query := `
		SELECT id, user_id, user_name, assessment_id, badge_title, tier,
		       verification_code, skills_validated, icon_name, issued_at
		FROM skill_badges
		WHERE user_id = $1
		ORDER BY issued_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.SkillBadge
	for rows.Next() {
		var b domain.SkillBadge
		var iconName *string
		if err := rows.Scan(
			&b.ID, &b.UserID, &b.UserName, &b.AssessmentID, &b.BadgeTitle, &b.Tier,
			&b.VerificationCode, &b.SkillsValidated, &iconName, &b.IssuedAt,
		); err != nil {
			return nil, err
		}
		if iconName != nil {
			b.IconName = *iconName
		}
		list = append(list, b)
	}
	return list, rows.Err()
}

func (r *postgresAssessmentRepository) IssueBadge(ctx context.Context, badge *domain.SkillBadge) error {
	if badge.ID == uuid.Nil {
		badge.ID = uuid.New()
	}
	if badge.IssuedAt.IsZero() {
		badge.IssuedAt = time.Now()
	}

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.badges[badge.UserID] = append(r.badges[badge.UserID], *badge)
		return nil
	}

	query := `
		INSERT INTO skill_badges (
			id, user_id, user_name, assessment_id, badge_title, tier,
			verification_code, skills_validated, icon_name, issued_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (verification_code) DO NOTHING
	`
	_, err := r.pool.Exec(ctx, query,
		badge.ID, badge.UserID, badge.UserName, badge.AssessmentID, badge.BadgeTitle, badge.Tier,
		badge.VerificationCode, badge.SkillsValidated, badge.IconName, badge.IssuedAt,
	)
	return err
}

func (r *postgresAssessmentRepository) CalculatePercentileRank(ctx context.Context, assessmentID uuid.UUID, score int) int {
	if r.pool == nil {
		return 85
	}

	query := `
		SELECT COUNT(*) FILTER (WHERE score_percentage <= $2) * 100 / NULLIF(COUNT(*), 0)
		FROM user_assessment_results
		WHERE assessment_id = $1
	`
	var percentile *int
	err := r.pool.QueryRow(ctx, query, assessmentID, score).Scan(&percentile)
	if err != nil || percentile == nil || *percentile == 0 {
		return 85
	}
	return *percentile
}

func (r *postgresAssessmentRepository) GetBadgeByVerificationCode(ctx context.Context, code string) (*domain.SkillBadge, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		for _, userBadges := range r.badges {
			for _, b := range userBadges {
				if b.VerificationCode == code {
					bCopy := b
					return &bCopy, nil
				}
			}
		}
		return nil, fmt.Errorf("skill badge not found with code: %s", code)
	}

	query := `
		SELECT id, user_id, user_name, assessment_id, badge_title, tier,
		       verification_code, skills_validated, icon_name, issued_at
		FROM skill_badges
		WHERE verification_code = $1
	`
	var b domain.SkillBadge
	var iconName *string
	err := r.pool.QueryRow(ctx, query, code).Scan(
		&b.ID, &b.UserID, &b.UserName, &b.AssessmentID, &b.BadgeTitle, &b.Tier,
		&b.VerificationCode, &b.SkillsValidated, &iconName, &b.IssuedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("skill badge not found with code: %s", code)
		}
		return nil, err
	}
	if iconName != nil {
		b.IconName = *iconName
	}
	return &b, nil
}

func (r *postgresAssessmentRepository) seedInitialDataIfMemory() {
	goID := uuid.MustParse("11111111-1111-1111-1111-111111111101")
	r.assessments[goID] = &domain.Assessment{
		ID:              goID,
		Title:           "Advanced Go & High-Concurrency Systems",
		Description:     "Evaluate proficiency with Go concurrency, memory management, channels, and low-latency microservices.",
		Category:        "Engineering",
		DifficultyLevel: "advanced",
		DurationMinutes: 25,
		PassingScore:    75,
		TotalQuestions:  3,
		BadgeTitle:      "Go Concurrency Specialist",
		BadgeTier:       domain.TierGold,
		CreatedAt:       time.Now(),
	}

	correct0 := 2
	correct1 := 1
	r.questions[goID] = []domain.Question{
		{
			ID:                 uuid.MustParse("22222222-2222-2222-2222-222222222201"),
			AssessmentID:       goID,
			QuestionType:       domain.TypeMCQ,
			QuestionText:       "What is the primary risk of creating goroutines without bounded worker pools or cancellation contexts?",
			Options:            []string{"Excessive disk IO", "Stack overflow in main thread", "Goroutine leak causing memory exhaustion", "Network interface deadlock"},
			CorrectOptionIndex: &correct0,
			MaxPoints:          10,
			QuestionOrder:      1,
		},
		{
			ID:                 uuid.MustParse("22222222-2222-2222-2222-222222222202"),
			AssessmentID:       goID,
			QuestionType:       domain.TypeMCQ,
			QuestionText:       "Which memory synchronization primitive is best suited for concurrent read-heavy caching with rare writes?",
			Options:            []string{"sync.Mutex", "sync.RWMutex", "sync.WaitGroup", "atomic.AddInt64"},
			CorrectOptionIndex: &correct1,
			MaxPoints:          10,
			QuestionOrder:      2,
		},
	}
}
