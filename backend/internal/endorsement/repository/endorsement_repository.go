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

type postgresEndorsementRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	endorsements    map[uuid.UUID]*domain.SkillEndorsement
	recommendations map[uuid.UUID]*domain.ProfessionalRecommendation
	references      map[uuid.UUID]*domain.ProfessionalReference
}

func NewEndorsementRepository(pool *pgxpool.Pool) EndorsementRepository {
	return &postgresEndorsementRepository{
		pool:            pool,
		endorsements:    make(map[uuid.UUID]*domain.SkillEndorsement),
		recommendations: make(map[uuid.UUID]*domain.ProfessionalRecommendation),
		references:      make(map[uuid.UUID]*domain.ProfessionalReference),
	}
}

func (r *postgresEndorsementRepository) HasEndorsed(ctx context.Context, userID, endorserID uuid.UUID, skillName string) (bool, error) {
	if r.pool == nil {
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

	query := `
		SELECT EXISTS (
			SELECT 1 FROM skill_endorsements
			WHERE user_id = $1 AND endorser_id = $2 AND LOWER(skill_name) = LOWER($3)
		)
	`
	var exists bool
	err := r.pool.QueryRow(ctx, query, userID, endorserID, skillName).Scan(&exists)
	return exists, err
}

func (r *postgresEndorsementRepository) CreateEndorsement(ctx context.Context, end *domain.SkillEndorsement) error {
	if end.ID == uuid.Nil {
		end.ID = uuid.New()
	}
	now := time.Now()
	end.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.endorsements[end.ID] = end
		return nil
	}

	query := `
		INSERT INTO skill_endorsements (
			id, user_id, endorser_id, skill_name, endorser_name, endorser_title, endorser_avatar_url, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id, endorser_id, skill_name) DO NOTHING
	`
	_, err := r.pool.Exec(ctx, query,
		end.ID, end.UserID, end.EndorserID, end.SkillName, end.EndorserName, end.EndorserTitle, end.EndorserAvatarURL, end.CreatedAt,
	)
	return err
}

func (r *postgresEndorsementRepository) GetUserEndorsements(ctx context.Context, userID uuid.UUID) ([]domain.SkillEndorsementGroup, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, user_id, endorser_id, skill_name, endorser_name, endorser_title, endorser_avatar_url, created_at
		FROM skill_endorsements
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	groupMap := make(map[string][]domain.SkillEndorsement)
	for rows.Next() {
		var end domain.SkillEndorsement
		var endorserTitle, avatarURL *string
		if err := rows.Scan(
			&end.ID, &end.UserID, &end.EndorserID, &end.SkillName, &end.EndorserName,
			&endorserTitle, &avatarURL, &end.CreatedAt,
		); err != nil {
			return nil, err
		}
		if endorserTitle != nil {
			end.EndorserTitle = *endorserTitle
		}
		if avatarURL != nil {
			end.EndorserAvatarURL = *avatarURL
		}
		groupMap[end.SkillName] = append(groupMap[end.SkillName], end)
	}

	if err := rows.Err(); err != nil {
		return nil, err
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

func (r *postgresEndorsementRepository) CreateRecommendation(ctx context.Context, rec *domain.ProfessionalRecommendation) error {
	if rec.ID == uuid.Nil {
		rec.ID = uuid.New()
	}
	now := time.Now()
	rec.CreatedAt = now
	rec.UpdatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.recommendations[rec.ID] = rec
		return nil
	}

	query := `
		INSERT INTO professional_recommendations (
			id, recipient_id, author_id, author_name, author_title, author_avatar_url,
			relationship, content_text, status, is_flagged, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.pool.Exec(ctx, query,
		rec.ID, rec.RecipientID, rec.AuthorID, rec.AuthorName, rec.AuthorTitle, rec.AuthorAvatarURL,
		rec.Relationship, rec.ContentText, rec.Status, rec.IsFlagged, rec.CreatedAt, rec.UpdatedAt,
	)
	return err
}

func (r *postgresEndorsementRepository) GetRecommendationsForUser(ctx context.Context, userID uuid.UUID) ([]domain.ProfessionalRecommendation, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.ProfessionalRecommendation
		for _, rec := range r.recommendations {
			if rec.RecipientID == userID {
				list = append(list, *rec)
			}
		}
		return list, nil
	}

	query := `
		SELECT id, recipient_id, author_id, author_name, author_title, author_avatar_url,
		       relationship, content_text, status, is_flagged, created_at, updated_at
		FROM professional_recommendations
		WHERE recipient_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.ProfessionalRecommendation
	for rows.Next() {
		var rec domain.ProfessionalRecommendation
		var authorAvatarURL *string
		if err := rows.Scan(
			&rec.ID, &rec.RecipientID, &rec.AuthorID, &rec.AuthorName, &rec.AuthorTitle, &authorAvatarURL,
			&rec.Relationship, &rec.ContentText, &rec.Status, &rec.IsFlagged, &rec.CreatedAt, &rec.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if authorAvatarURL != nil {
			rec.AuthorAvatarURL = *authorAvatarURL
		}
		list = append(list, rec)
	}
	return list, rows.Err()
}

func (r *postgresEndorsementRepository) UpdateRecommendationStatus(ctx context.Context, id uuid.UUID, status string, isFlagged bool) error {
	now := time.Now()
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if rec, exists := r.recommendations[id]; exists {
			rec.Status = status
			rec.IsFlagged = isFlagged
			rec.UpdatedAt = now
			return nil
		}
		return fmt.Errorf("recommendation not found: %s", id)
	}

	query := `
		UPDATE professional_recommendations
		SET status = $1, is_flagged = $2, updated_at = $3
		WHERE id = $4
	`
	tag, err := r.pool.Exec(ctx, query, status, isFlagged, now, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("recommendation not found: %s", id)
	}
	return nil
}

func (r *postgresEndorsementRepository) CreateReference(ctx context.Context, ref *domain.ProfessionalReference) error {
	if ref.ID == uuid.Nil {
		ref.ID = uuid.New()
	}
	now := time.Now()
	ref.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.references[ref.ID] = ref
		return nil
	}

	query := `
		INSERT INTO professional_references (
			id, candidate_id, referee_name, referee_title, company_name, referee_email, referee_phone, relationship, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.pool.Exec(ctx, query,
		ref.ID, ref.CandidateID, ref.RefereeName, ref.RefereeTitle, ref.CompanyName,
		ref.RefereeEmail, ref.RefereePhone, ref.Relationship, ref.Status, ref.CreatedAt,
	)
	return err
}

func (r *postgresEndorsementRepository) GetUserReferences(ctx context.Context, candidateID uuid.UUID) ([]domain.ProfessionalReference, error) {
	if r.pool == nil {
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

	query := `
		SELECT id, candidate_id, referee_name, referee_title, company_name,
		       referee_email, referee_phone, relationship, status, created_at
		FROM professional_references
		WHERE candidate_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, candidateID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.ProfessionalReference
	for rows.Next() {
		var ref domain.ProfessionalReference
		var phone *string
		if err := rows.Scan(
			&ref.ID, &ref.CandidateID, &ref.RefereeName, &ref.RefereeTitle, &ref.CompanyName,
			&ref.RefereeEmail, &phone, &ref.Relationship, &ref.Status, &ref.CreatedAt,
		); err != nil {
			return nil, err
		}
		if phone != nil {
			ref.RefereePhone = *phone
		}
		list = append(list, ref)
	}
	return list, rows.Err()
}
