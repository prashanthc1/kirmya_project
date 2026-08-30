package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/ai_job_match/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MatchingRepository interface {
	SaveMatch(ctx context.Context, match *domain.AIJobMatch, breakdown *domain.MatchingScore) error
	GetUserMatches(ctx context.Context, userID uuid.UUID) ([]domain.AIJobMatch, error)
	GetMatchByID(ctx context.Context, id uuid.UUID) (*domain.AIJobMatch, error)
	SaveFeedback(ctx context.Context, feedback *domain.MatchingFeedback) error
}

type pgxMatchingRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	matches   map[uuid.UUID]*domain.AIJobMatch
	scores    map[uuid.UUID]*domain.MatchingScore
	feedbacks map[uuid.UUID]*domain.MatchingFeedback
}

func NewMatchingRepository(pool *pgxpool.Pool) MatchingRepository {
	repo := &pgxMatchingRepository{
		pool:      pool,
		matches:   make(map[uuid.UUID]*domain.AIJobMatch),
		scores:    make(map[uuid.UUID]*domain.MatchingScore),
		feedbacks: make(map[uuid.UUID]*domain.MatchingFeedback),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxMatchingRepository) seedDefaultData() {
	now := time.Now()
	userID := uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d")

	m1ID := uuid.MustParse("a1111111-1111-1111-1111-111111111111")
	m1 := &domain.AIJobMatch{
		ID:            m1ID,
		UserID:        userID,
		JobID:         uuid.MustParse("b1111111-1111-1111-1111-111111111111"),
		JobTitle:      "Senior Go Backend Architect",
		CompanyName:   "Stripe Global",
		OverallScore:  96,
		MatchTier:     domain.TierStrongMatch,
		Explanation:   "You match 96% of requirements. Your 5+ years of Go microservices and PostgreSQL GIN index optimization perfectly fit Stripe's high-throughput architecture.",
		MatchedSkills: []string{"Go", "PostgreSQL", "Microservices", "REST API", "Docker"},
		MissingSkills: []string{"Kafka Event Streaming"},
		RecommendedActions: []domain.RecommendedAction{
			{
				Type:        "course",
				Title:       "Apache Kafka Distributed Event Streaming Deep Dive",
				ActionURL:   "/learning/courses/kafka-masterclass",
				Description: "Close your single missing skill gap in under 4 hours.",
			},
		},
		CreatedAt: now,
	}

	s1 := &domain.MatchingScore{
		ID:                uuid.New(),
		MatchID:           m1ID,
		SkillsScore:       98,
		ExperienceScore:   95,
		GoalsScore:        92,
		LocationScore:     100,
		SalaryScore:       95,
		LearningScore:     90,
		ApplicationsScore: 94,
		CreatedAt:         now,
	}
	m1.Breakdown = s1

	m2ID := uuid.MustParse("a2222222-2222-2222-2222-222222222222")
	m2 := &domain.AIJobMatch{
		ID:            m2ID,
		UserID:        userID,
		JobID:         uuid.MustParse("b2222222-2222-2222-2222-222222222222"),
		JobTitle:      "Staff Platform Infrastructure Engineer",
		CompanyName:   "Datadog",
		OverallScore:  88,
		MatchTier:     domain.TierGoodMatch,
		Explanation:   "Strong background match with 88% overall alignment across Kubernetes and Observability stacks.",
		MatchedSkills: []string{"Go", "Kubernetes", "Prometheus", "Linux", "gRPC"},
		MissingSkills: []string{"eBPF Fundamentals", "Terraform Cloud"},
		CreatedAt:     now.Add(-12 * time.Hour),
	}

	s2 := &domain.MatchingScore{
		ID:                uuid.New(),
		MatchID:           m2ID,
		SkillsScore:       85,
		ExperienceScore:   90,
		GoalsScore:        88,
		LocationScore:     95,
		SalaryScore:       90,
		LearningScore:     80,
		ApplicationsScore: 88,
		CreatedAt:         now.Add(-12 * time.Hour),
	}
	m2.Breakdown = s2

	r.matches[m1.ID] = m1
	r.matches[m2.ID] = m2
	r.scores[m1.ID] = s1
	r.scores[m2.ID] = s2
}

func (r *pgxMatchingRepository) SaveMatch(ctx context.Context, match *domain.AIJobMatch, breakdown *domain.MatchingScore) error {
	if match.ID == uuid.Nil {
		match.ID = uuid.New()
	}
	match.CreatedAt = time.Now()

	if r.pool != nil {
		matchedJSON, _ := json.Marshal(match.MatchedSkills)
		missingJSON, _ := json.Marshal(match.MissingSkills)
		actionsJSON, _ := json.Marshal(match.RecommendedActions)

		query := `INSERT INTO ai_job_matches (id, user_id, job_id, job_title, company_name, overall_score, match_tier, explanation, matched_skills, missing_skills, recommended_actions, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		          ON CONFLICT (user_id, job_id) DO UPDATE SET overall_score = EXCLUDED.overall_score, explanation = EXCLUDED.explanation`
		_, err := r.pool.Exec(ctx, query, match.ID, match.UserID, match.JobID, match.JobTitle, match.CompanyName, match.OverallScore, match.MatchTier, match.Explanation, matchedJSON, missingJSON, actionsJSON, match.CreatedAt)
		if err != nil {
			return err
		}
		if breakdown != nil {
			if breakdown.ID == uuid.Nil {
				breakdown.ID = uuid.New()
			}
			breakdown.MatchID = match.ID
			breakdown.CreatedAt = time.Now()
			featVectorJSON, _ := json.Marshal(breakdown.FeatureVector)
			scoreQuery := `INSERT INTO matching_scores (id, match_id, skills_score, experience_score, goals_score, location_score, salary_score, learning_score, applications_score, feature_vector, created_at)
			               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
			               ON CONFLICT (id) DO UPDATE SET skills_score = EXCLUDED.skills_score, experience_score = EXCLUDED.experience_score`
			_, _ = r.pool.Exec(ctx, scoreQuery, breakdown.ID, breakdown.MatchID, breakdown.SkillsScore, breakdown.ExperienceScore, breakdown.GoalsScore, breakdown.LocationScore, breakdown.SalaryScore, breakdown.LearningScore, breakdown.ApplicationsScore, featVectorJSON, breakdown.CreatedAt)
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if breakdown != nil {
		if breakdown.ID == uuid.Nil {
			breakdown.ID = uuid.New()
		}
		breakdown.MatchID = match.ID
		breakdown.CreatedAt = time.Now()
		r.scores[match.ID] = breakdown
		match.Breakdown = breakdown
	}

	r.matches[match.ID] = match
	return nil
}

func (r *pgxMatchingRepository) GetUserMatches(ctx context.Context, userID uuid.UUID) ([]domain.AIJobMatch, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, job_id, job_title, company_name, overall_score, match_tier, explanation, matched_skills, missing_skills, recommended_actions, created_at 
		          FROM ai_job_matches WHERE user_id = $1 ORDER BY overall_score DESC`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.AIJobMatch
			for rows.Next() {
				var m domain.AIJobMatch
				var matchedBytes, missingBytes, actionsBytes []byte
				if err := rows.Scan(&m.ID, &m.UserID, &m.JobID, &m.JobTitle, &m.CompanyName, &m.OverallScore, &m.MatchTier, &m.Explanation, &matchedBytes, &missingBytes, &actionsBytes, &m.CreatedAt); err == nil {
					_ = json.Unmarshal(matchedBytes, &m.MatchedSkills)
					_ = json.Unmarshal(missingBytes, &m.MissingSkills)
					_ = json.Unmarshal(actionsBytes, &m.RecommendedActions)
					list = append(list, m)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.AIJobMatch
	for _, m := range r.matches {
		if m.UserID == userID {
			mCopy := *m
			if score, exists := r.scores[m.ID]; exists {
				mCopy.Breakdown = score
			}
			list = append(list, mCopy)
		}
	}
	return list, nil
}

func (r *pgxMatchingRepository) GetMatchByID(ctx context.Context, id uuid.UUID) (*domain.AIJobMatch, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, job_id, job_title, company_name, overall_score, match_tier, explanation, matched_skills, missing_skills, recommended_actions, created_at 
		          FROM ai_job_matches WHERE id = $1`
		m := &domain.AIJobMatch{}
		var matchedBytes, missingBytes, actionsBytes []byte
		err := r.pool.QueryRow(ctx, query, id).Scan(
			&m.ID, &m.UserID, &m.JobID, &m.JobTitle, &m.CompanyName, &m.OverallScore, &m.MatchTier, &m.Explanation, &matchedBytes, &missingBytes, &actionsBytes, &m.CreatedAt,
		)
		if err == nil {
			_ = json.Unmarshal(matchedBytes, &m.MatchedSkills)
			_ = json.Unmarshal(missingBytes, &m.MissingSkills)
			_ = json.Unmarshal(actionsBytes, &m.RecommendedActions)

			var score domain.MatchingScore
			var featBytes []byte
			errScore := r.pool.QueryRow(ctx, `SELECT id, match_id, skills_score, experience_score, goals_score, location_score, salary_score, learning_score, applications_score, feature_vector, created_at FROM matching_scores WHERE match_id = $1`, m.ID).Scan(
				&score.ID, &score.MatchID, &score.SkillsScore, &score.ExperienceScore, &score.GoalsScore, &score.LocationScore, &score.SalaryScore, &score.LearningScore, &score.ApplicationsScore, &featBytes, &score.CreatedAt,
			)
			if errScore == nil {
				_ = json.Unmarshal(featBytes, &score.FeatureVector)
				m.Breakdown = &score
			}

			return m, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if m, exists := r.matches[id]; exists {
		mCopy := *m
		if score, existsScore := r.scores[id]; existsScore {
			mCopy.Breakdown = score
		}
		return &mCopy, nil
	}
	return nil, fmt.Errorf("match not found: %s", id)
}

func (r *pgxMatchingRepository) SaveFeedback(ctx context.Context, feedback *domain.MatchingFeedback) error {
	if feedback.ID == uuid.Nil {
		feedback.ID = uuid.New()
	}
	feedback.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO matching_feedback (id, match_id, user_id, feedback_type, notes, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.pool.Exec(ctx, query, feedback.ID, feedback.MatchID, feedback.UserID, feedback.FeedbackType, feedback.Notes, feedback.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.feedbacks[feedback.ID] = feedback
	return nil
}
