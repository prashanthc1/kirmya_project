package repository

import (
	"context"
	"errors"
	"kirmya/internal/ai/models"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AIRepository struct {
	db *pgxpool.Pool
}

func NewAIRepository(db *pgxpool.Pool) *AIRepository {
	return &AIRepository{db: db}
}

// LogRequest records metadata about an AI execution.
func (r *AIRepository) LogRequest(ctx context.Context, req *models.AIRequest) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO ai_requests (id, user_id, feature, provider, prompt_tokens, completion_tokens, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, req.ID, req.UserID, req.Feature, req.Provider, req.PromptTokens, req.CompletionTokens, req.CreatedAt)
	return err
}

// LogResult caches raw input/output strings.
func (r *AIRepository) LogResult(ctx context.Context, res *models.AIResult) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO ai_results (id, request_id, raw_input, raw_output, parsed_response, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, res.ID, res.RequestID, res.RawInput, res.RawOutput, res.ParsedResponse, res.CreatedAt)
	return err
}

// GetPreferences fetches user preference configurations.
func (r *AIRepository) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.AIPreference, error) {
	if r.db == nil {
		// Mock offline fallback
		return &models.AIPreference{
			UserID:           userID,
			SelectedProvider: "mock",
			Temperature:      0.70,
			MaxTokens:        1000,
			UpdatedAt:        time.Now(),
		}, nil
	}

	query := `SELECT user_id, selected_provider, temperature, max_tokens, updated_at
	          FROM ai_preferences
	          WHERE user_id = $1`

	var pref models.AIPreference
	err := r.db.QueryRow(ctx, query, userID).Scan(&pref.UserID, &pref.SelectedProvider, &pref.Temperature, &pref.MaxTokens, &pref.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Return default settings
			return &models.AIPreference{
				UserID:           userID,
				SelectedProvider: "mock",
				Temperature:      0.70,
				MaxTokens:        1000,
				UpdatedAt:        time.Now(),
			}, nil
		}
		return nil, err
	}
	return &pref, nil
}

// UpdatePreferences updates or creates preference records.
func (r *AIRepository) UpdatePreferences(ctx context.Context, pref *models.AIPreference) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO ai_preferences (user_id, selected_provider, temperature, max_tokens, updated_at)
	          VALUES ($1, $2, $3, $4, $5)
	          ON CONFLICT (user_id)
	          DO UPDATE SET selected_provider = $2, temperature = $3, max_tokens = $4, updated_at = $5`
	_, err := r.db.Exec(ctx, query, pref.UserID, pref.SelectedProvider, pref.Temperature, pref.MaxTokens, pref.UpdatedAt)
	return err
}
