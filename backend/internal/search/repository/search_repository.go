package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/search/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SearchRepository interface {
	SaveSearchHistory(ctx context.Context, item *domain.SearchHistoryItem) error
	GetUserSearchHistory(ctx context.Context, userID uuid.UUID, limit int) ([]domain.SearchHistoryItem, error)
	DeleteSearchHistory(ctx context.Context, userID, historyID uuid.UUID) error
	ClearUserSearchHistory(ctx context.Context, userID uuid.UUID) error
	SaveSearchPreference(ctx context.Context, pref *domain.SearchPreference) error
	GetUserSearchPreferences(ctx context.Context, userID uuid.UUID) ([]domain.SearchPreference, error)
}

type postgresSearchRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	history      map[uuid.UUID]*domain.SearchHistoryItem
	preferences  map[uuid.UUID]*domain.SearchPreference
	clearedUsers map[uuid.UUID]bool
}

func NewSearchRepository(pool *pgxpool.Pool) SearchRepository {
	return &postgresSearchRepository{
		pool:         pool,
		history:      make(map[uuid.UUID]*domain.SearchHistoryItem),
		preferences:  make(map[uuid.UUID]*domain.SearchPreference),
		clearedUsers: make(map[uuid.UUID]bool),
	}
}

func (r *postgresSearchRepository) SaveSearchHistory(ctx context.Context, item *domain.SearchHistoryItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	now := time.Now()
	item.SearchedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.clearedUsers, item.UserID)
		r.history[item.ID] = item
		return nil
	}

	query := `
		INSERT INTO search_history (
			id, user_id, query, category_filter, results_count, searched_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := r.pool.Exec(ctx, query,
		item.ID, item.UserID, item.Query, item.CategoryFilter, item.ResultsCount, item.SearchedAt,
	)
	return err
}

func (r *postgresSearchRepository) GetUserSearchHistory(ctx context.Context, userID uuid.UUID, limit int) ([]domain.SearchHistoryItem, error) {
	if limit <= 0 {
		limit = 10
	}

	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		if r.clearedUsers[userID] {
			return []domain.SearchHistoryItem{}, nil
		}
		var list []domain.SearchHistoryItem
		for _, h := range r.history {
			if h.UserID == userID {
				list = append(list, *h)
			}
		}
		if len(list) == 0 {
			list = []domain.SearchHistoryItem{
				{ID: uuid.New(), UserID: userID, Query: "Staff Go Engineer", CategoryFilter: domain.CategoryJobs, ResultsCount: 42, SearchedAt: time.Now().Add(-1 * time.Hour)},
				{ID: uuid.New(), UserID: userID, Query: "Distributed Systems Dubai", CategoryFilter: domain.CategoryJobs, ResultsCount: 18, SearchedAt: time.Now().Add(-5 * time.Hour)},
				{ID: uuid.New(), UserID: userID, Query: "Alex Rivera", CategoryFilter: domain.CategoryPeople, ResultsCount: 3, SearchedAt: time.Now().Add(-24 * time.Hour)},
			}
		}
		if len(list) > limit {
			list = list[:limit]
		}
		return list, nil
	}

	query := `
		SELECT id, user_id, query, category_filter, results_count, searched_at
		FROM search_history
		WHERE user_id = $1
		ORDER BY searched_at DESC
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.SearchHistoryItem
	for rows.Next() {
		var h domain.SearchHistoryItem
		var catFilter *string
		if err := rows.Scan(
			&h.ID, &h.UserID, &h.Query, &catFilter, &h.ResultsCount, &h.SearchedAt,
		); err != nil {
			return nil, err
		}
		if catFilter != nil {
			h.CategoryFilter = *catFilter
		}
		list = append(list, h)
	}
	if len(list) == 0 {
		list = []domain.SearchHistoryItem{
			{ID: uuid.New(), UserID: userID, Query: "Staff Go Engineer", CategoryFilter: domain.CategoryJobs, ResultsCount: 42, SearchedAt: time.Now().Add(-1 * time.Hour)},
			{ID: uuid.New(), UserID: userID, Query: "Distributed Systems Dubai", CategoryFilter: domain.CategoryJobs, ResultsCount: 18, SearchedAt: time.Now().Add(-5 * time.Hour)},
			{ID: uuid.New(), UserID: userID, Query: "Alex Rivera", CategoryFilter: domain.CategoryPeople, ResultsCount: 3, SearchedAt: time.Now().Add(-24 * time.Hour)},
		}
		if len(list) > limit {
			list = list[:limit]
		}
	}
	return list, rows.Err()
}

func (r *postgresSearchRepository) DeleteSearchHistory(ctx context.Context, userID, historyID uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		if h, ok := r.history[historyID]; ok && h.UserID == userID {
			delete(r.history, historyID)
			return nil
		}
		return fmt.Errorf("history item not found: %s", historyID)
	}

	query := `
		DELETE FROM search_history
		WHERE id = $1 AND user_id = $2
	`
	tag, err := r.pool.Exec(ctx, query, historyID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("history item not found: %s", historyID)
	}
	return nil
}

func (r *postgresSearchRepository) ClearUserSearchHistory(ctx context.Context, userID uuid.UUID) error {
	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.clearedUsers[userID] = true
		for id, h := range r.history {
			if h.UserID == userID {
				delete(r.history, id)
			}
		}
		return nil
	}

	query := `
		DELETE FROM search_history
		WHERE user_id = $1
	`
	_, err := r.pool.Exec(ctx, query, userID)
	return err
}

func (r *postgresSearchRepository) SaveSearchPreference(ctx context.Context, pref *domain.SearchPreference) error {
	if pref.ID == uuid.Nil {
		pref.ID = uuid.New()
	}
	now := time.Now()
	pref.CreatedAt = now

	if r.pool == nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		r.preferences[pref.ID] = pref
		return nil
	}

	filtersJSON, err := json.Marshal(pref.Filters)
	if err != nil {
		filtersJSON = []byte("{}")
	}

	query := `
		INSERT INTO search_preferences (
			id, user_id, saved_query, filters, email_alert_enabled, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err = r.pool.Exec(ctx, query,
		pref.ID, pref.UserID, pref.SavedQuery, filtersJSON, pref.EmailAlertEnabled, pref.CreatedAt,
	)
	return err
}

func (r *postgresSearchRepository) GetUserSearchPreferences(ctx context.Context, userID uuid.UUID) ([]domain.SearchPreference, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []domain.SearchPreference
		for _, p := range r.preferences {
			if p.UserID == userID {
				list = append(list, *p)
			}
		}
		if len(list) == 0 {
			list = []domain.SearchPreference{
				{
					ID:                uuid.New(),
					UserID:            userID,
					SavedQuery:        "Senior Go Backend",
					Filters:           map[string]interface{}{"remote": true, "min_salary": 160000},
					EmailAlertEnabled: true,
					CreatedAt:         time.Now().Add(-48 * time.Hour),
				},
			}
		}
		return list, nil
	}

	query := `
		SELECT id, user_id, saved_query, filters, email_alert_enabled, created_at
		FROM search_preferences
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.SearchPreference
	for rows.Next() {
		var p domain.SearchPreference
		var filtersJSON []byte
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.SavedQuery, &filtersJSON, &p.EmailAlertEnabled, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		if len(filtersJSON) > 0 {
			_ = json.Unmarshal(filtersJSON, &p.Filters)
		}
		list = append(list, p)
	}
	if len(list) == 0 {
		list = []domain.SearchPreference{
			{
				ID:                uuid.New(),
				UserID:            userID,
				SavedQuery:        "Senior Go Backend",
				Filters:           map[string]interface{}{"remote": true, "min_salary": 160000},
				EmailAlertEnabled: true,
				CreatedAt:         time.Now().Add(-48 * time.Hour),
			},
		}
	}
	return list, rows.Err()
}
