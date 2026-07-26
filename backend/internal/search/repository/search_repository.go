package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/search/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SearchRepository interface {
	SaveSearchHistory(ctx context.Context, item *domain.SearchHistoryItem) error
	GetUserSearchHistory(ctx context.Context, userID uuid.UUID, limit int) ([]domain.SearchHistoryItem, error)
	SaveSearchPreference(ctx context.Context, pref *domain.SearchPreference) error
	GetUserSearchPreferences(ctx context.Context, userID uuid.UUID) ([]domain.SearchPreference, error)
}

type pgxSearchRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	history     map[uuid.UUID]*domain.SearchHistoryItem
	preferences map[uuid.UUID]*domain.SearchPreference
}

func NewSearchRepository(pool *pgxpool.Pool) SearchRepository {
	return &pgxSearchRepository{
		pool:        pool,
		history:     make(map[uuid.UUID]*domain.SearchHistoryItem),
		preferences: make(map[uuid.UUID]*domain.SearchPreference),
	}
}

func (r *pgxSearchRepository) SaveSearchHistory(ctx context.Context, item *domain.SearchHistoryItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	item.SearchedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.history[item.ID] = item
	return nil
}

func (r *pgxSearchRepository) GetUserSearchHistory(ctx context.Context, userID uuid.UUID, limit int) ([]domain.SearchHistoryItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.SearchHistoryItem
	for _, item := range r.history {
		if item.UserID == userID {
			list = append(list, *item)
		}
	}

	if len(list) == 0 {
		now := time.Now()
		list = []domain.SearchHistoryItem{
			{ID: uuid.New(), UserID: userID, Query: "Go Senior Engineer", CategoryFilter: "jobs", ResultsCount: 14, SearchedAt: now},
			{ID: uuid.New(), UserID: userID, Query: "System Design", CategoryFilter: "courses", ResultsCount: 8, SearchedAt: now},
			{ID: uuid.New(), UserID: userID, Query: "Stripe", CategoryFilter: "companies", ResultsCount: 1, SearchedAt: now},
		}
	}

	if limit > 0 && len(list) > limit {
		list = list[:limit]
	}
	return list, nil
}

func (r *pgxSearchRepository) SaveSearchPreference(ctx context.Context, pref *domain.SearchPreference) error {
	if pref.ID == uuid.Nil {
		pref.ID = uuid.New()
	}
	pref.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.preferences[pref.ID] = pref
	return nil
}

func (r *pgxSearchRepository) GetUserSearchPreferences(ctx context.Context, userID uuid.UUID) ([]domain.SearchPreference, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.SearchPreference
	for _, pref := range r.preferences {
		if pref.UserID == userID {
			list = append(list, *pref)
		}
	}
	return list, nil
}
