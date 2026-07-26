package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/resume_analysis/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ResumeAnalysisRepository interface {
	SaveAnalysis(ctx context.Context, analysis *domain.ResumeAnalysis) error
	GetAnalysisByID(ctx context.Context, id uuid.UUID) (*domain.ResumeAnalysis, error)
	GetUserAnalysisHistory(ctx context.Context, userID uuid.UUID) ([]domain.ResumeAnalysis, error)
}

type pgxResumeAnalysisRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	analyses     map[uuid.UUID]*domain.ResumeAnalysis
	scores       map[uuid.UUID]*domain.ResumeScores
	improvements map[uuid.UUID]*domain.ImprovementHistory
}

func NewResumeAnalysisRepository(pool *pgxpool.Pool) ResumeAnalysisRepository {
	return &pgxResumeAnalysisRepository{
		pool:         pool,
		analyses:     make(map[uuid.UUID]*domain.ResumeAnalysis),
		scores:       make(map[uuid.UUID]*domain.ResumeScores),
		improvements: make(map[uuid.UUID]*domain.ImprovementHistory),
	}
}

func (r *pgxResumeAnalysisRepository) SaveAnalysis(ctx context.Context, analysis *domain.ResumeAnalysis) error {
	if analysis.ID == uuid.Nil {
		analysis.ID = uuid.New()
	}
	analysis.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.analyses[analysis.ID] = analysis

	if analysis.Scores != nil {
		if analysis.Scores.ID == uuid.Nil {
			analysis.Scores.ID = uuid.New()
		}
		analysis.Scores.AnalysisID = analysis.ID
		analysis.Scores.CreatedAt = time.Now()
		r.scores[analysis.ID] = analysis.Scores
	}

	if analysis.Improvements != nil {
		if analysis.Improvements.ID == uuid.Nil {
			analysis.Improvements.ID = uuid.New()
		}
		analysis.Improvements.AnalysisID = analysis.ID
		analysis.Improvements.UserID = analysis.UserID
		analysis.Improvements.CreatedAt = time.Now()
		r.improvements[analysis.ID] = analysis.Improvements
	}

	return nil
}

func (r *pgxResumeAnalysisRepository) GetAnalysisByID(ctx context.Context, id uuid.UUID) (*domain.ResumeAnalysis, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if item, exists := r.analyses[id]; exists {
		itemCopy := *item
		if score, existsScore := r.scores[id]; existsScore {
			itemCopy.Scores = score
		}
		if imp, existsImp := r.improvements[id]; existsImp {
			itemCopy.Improvements = imp
		}
		return &itemCopy, nil
	}
	return nil, fmt.Errorf("resume analysis report not found: %s", id)
}

func (r *pgxResumeAnalysisRepository) GetUserAnalysisHistory(ctx context.Context, userID uuid.UUID) ([]domain.ResumeAnalysis, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.ResumeAnalysis
	for _, item := range r.analyses {
		if item.UserID == userID {
			itemCopy := *item
			if score, existsScore := r.scores[item.ID]; existsScore {
				itemCopy.Scores = score
			}
			if imp, existsImp := r.improvements[item.ID]; existsImp {
				itemCopy.Improvements = imp
			}
			list = append(list, itemCopy)
		}
	}
	return list, nil
}
