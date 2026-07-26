package repository

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"kirmya/internal/endorsement/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EndorsementRepository interface {
	CreateEndorsement(ctx context.Context, end *domain.SkillEndorsement) error
	GetUserEndorsements(ctx context.Context, userID uuid.UUID) ([]domain.SkillEndorsementGroup, error)
	HasEndorsed(ctx context.Context, userID, endorserID uuid.UUID, skillName string) (bool, error)

	CreateRecommendation(ctx context.Context, rec *domain.ProfessionalRecommendation) error
	GetRecommendationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.ProfessionalRecommendation, error)
	UpdateRecommendationStatus(ctx context.Context, id uuid.UUID, status string, isFlagged bool) error

	CreateReference(ctx context.Context, ref *domain.ProfessionalReference) error
	GetUserReferences(ctx context.Context, candidateID uuid.UUID) ([]domain.ProfessionalReference, error)
}

type pgxEndorsementRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	endorsements    map[uuid.UUID]*domain.SkillEndorsement
	recommendations map[uuid.UUID]*domain.ProfessionalRecommendation
	references      map[uuid.UUID]*domain.ProfessionalReference
}

func NewEndorsementRepository(pool *pgxpool.Pool) EndorsementRepository {
	return &pgxEndorsementRepository{
		pool:            pool,
		endorsements:    make(map[uuid.UUID]*domain.SkillEndorsement),
		recommendations: make(map[uuid.UUID]*domain.ProfessionalRecommendation),
		references:      make(map[uuid.UUID]*domain.ProfessionalReference),
	}
}

func (r *pgxEndorsementRepository) HasEndorsed(ctx context.Context, userID, endorserID uuid.UUID, skillName string) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	skillLower := strings.ToLower(skillName)
	for _, end := range r.endorsements {
		if end.UserID == userID && end.EndorserID == endorserID && strings.ToLower(end.SkillName) == skillLower {
			return true, nil
		}
	}
	return false, nil
}

func (r *pgxEndorsementRepository) CreateEndorsement(ctx context.Context, end *domain.SkillEndorsement) error {
	if end.ID == uuid.Nil {
		end.ID = uuid.New()
	}
	end.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.endorsements[end.ID] = end
	return nil
}

func (r *pgxEndorsementRepository) GetUserEndorsements(ctx context.Context, userID uuid.UUID) ([]domain.SkillEndorsementGroup, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	groupMap := make(map[string][]domain.SkillEndorsement)
	for _, end := range r.endorsements {
		if end.UserID == userID {
			groupMap[end.SkillName] = append(groupMap[end.SkillName], *end)
		}
	}

	var result []domain.SkillEndorsementGroup
	for skill, list := range groupMap {
		result = append(result, domain.SkillEndorsementGroup{
			SkillName:        skill,
			EndorsementCount: len(list),
			Endorsers:        list,
		})
	}
	return result, nil
}

func (r *pgxEndorsementRepository) CreateRecommendation(ctx context.Context, rec *domain.ProfessionalRecommendation) error {
	if rec.ID == uuid.Nil {
		rec.ID = uuid.New()
	}
	rec.CreatedAt = time.Now()
	rec.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.recommendations[rec.ID] = rec
	return nil
}

func (r *pgxEndorsementRepository) GetRecommendationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.ProfessionalRecommendation, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.ProfessionalRecommendation
	for _, rec := range r.recommendations {
		if rec.RecipientID == userID || rec.AuthorID == userID {
			list = append(list, *rec)
		}
	}
	return list, nil
}

func (r *pgxEndorsementRepository) UpdateRecommendationStatus(ctx context.Context, id uuid.UUID, status string, isFlagged bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if rec, exists := r.recommendations[id]; exists {
		rec.Status = status
		rec.IsFlagged = isFlagged
		rec.UpdatedAt = time.Now()
		return nil
	}
	return fmt.Errorf("recommendation not found: %s", id)
}

func (r *pgxEndorsementRepository) CreateReference(ctx context.Context, ref *domain.ProfessionalReference) error {
	if ref.ID == uuid.Nil {
		ref.ID = uuid.New()
	}
	ref.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.references[ref.ID] = ref
	return nil
}

func (r *pgxEndorsementRepository) GetUserReferences(ctx context.Context, candidateID uuid.UUID) ([]domain.ProfessionalReference, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.ProfessionalReference
	for _, ref := range r.references {
		if ref.CandidateID == candidateID {
			list = append(list, *ref)
		}
	}
	return list, nil
}
