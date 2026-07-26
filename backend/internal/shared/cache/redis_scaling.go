package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

type MultiTierCache interface {
	GetOrFetch(ctx context.Context, key string, ttl time.Duration, fetchFunc func() (interface{}, error), target interface{}) error
	SetWithTTL(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	InvalidatePattern(ctx context.Context, pattern string) error
}

type multiTierCache struct {
	baseCache Cache
}

func NewMultiTierCache(baseCache Cache) MultiTierCache {
	return &multiTierCache{baseCache: baseCache}
}

func (m *multiTierCache) GetOrFetch(ctx context.Context, key string, ttl time.Duration, fetchFunc func() (interface{}, error), target interface{}) error {
	// Step 1: Try reading from Redis cache
	cachedVal, err := m.baseCache.Get(ctx, key)
	if err == nil && cachedVal != "" {
		if err := json.Unmarshal([]byte(cachedVal), target); err == nil {
			return nil
		}
	}

	// Step 2: Cache miss -> Fetch from database authoritative source
	freshVal, err := fetchFunc()
	if err != nil {
		return fmt.Errorf("failed to fetch database source: %w", err)
	}

	// Step 3: Populate Redis cache asynchronously with TTL
	bytes, err := json.Marshal(freshVal)
	if err == nil {
		_ = m.baseCache.Set(ctx, key, string(bytes), ttl)
		_ = json.Unmarshal(bytes, target)
	}

	return nil
}

func (m *multiTierCache) SetWithTTL(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return m.baseCache.Set(ctx, key, string(bytes), ttl)
}

func (m *multiTierCache) InvalidatePattern(ctx context.Context, pattern string) error {
	return m.baseCache.Delete(ctx, pattern)
}
