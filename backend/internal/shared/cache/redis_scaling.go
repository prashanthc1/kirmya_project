package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"kirmya/internal/shared/telemetry"
)

type MultiTierCache interface {
	GetOrFetch(ctx context.Context, key string, ttl time.Duration, fetchFunc func() (interface{}, error), target interface{}) error
	SetWithTTL(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	InvalidateKey(ctx context.Context, key string) error
	InvalidatePattern(ctx context.Context, pattern string) error
}

type multiTierCache struct {
	baseCache Cache
}

func NewMultiTierCache(baseCache Cache) MultiTierCache {
	return &multiTierCache{baseCache: baseCache}
}

func (m *multiTierCache) GetOrFetch(ctx context.Context, key string, ttl time.Duration, fetchFunc func() (interface{}, error), target interface{}) error {
	metrics := telemetry.GetGlobalCollector()

	// Step 1: Try reading from Redis/InMemory cache
	if m.baseCache != nil {
		cachedVal, err := m.baseCache.Get(ctx, key)
		if err == nil && cachedVal != "" {
			if err := json.Unmarshal([]byte(cachedVal), target); err == nil {
				metrics.RecordCacheHit()
				return nil
			}
		}
	}

	// Record Cache Miss
	metrics.RecordCacheMiss()

	// Step 2: Cache miss -> Fetch from database authoritative source
	freshVal, err := fetchFunc()
	if err != nil {
		return fmt.Errorf("failed to fetch database source: %w", err)
	}

	// Step 3: Populate Redis cache asynchronously with TTL (Fault tolerant - swallowed on fail)
	if m.baseCache != nil && freshVal != nil {
		bytes, err := json.Marshal(freshVal)
		if err == nil {
			_ = m.baseCache.Set(ctx, key, string(bytes), ttl)
			_ = json.Unmarshal(bytes, target)
		} else {
			slog.Warn("Failed to marshal fresh value for cache", "key", key, "error", err)
		}
	}

	return nil
}

func (m *multiTierCache) SetWithTTL(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if m.baseCache == nil {
		return nil
	}
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return m.baseCache.Set(ctx, key, string(bytes), ttl)
}

func (m *multiTierCache) InvalidateKey(ctx context.Context, key string) error {
	if m.baseCache == nil {
		return nil
	}
	return m.baseCache.Delete(ctx, key)
}

func (m *multiTierCache) InvalidatePattern(ctx context.Context, pattern string) error {
	if m.baseCache == nil {
		return nil
	}
	return m.baseCache.Delete(ctx, pattern)
}
