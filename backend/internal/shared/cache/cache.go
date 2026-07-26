package cache

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache defines the standard behavior for the application caching tier.
type Cache interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
}

// 1. RedisCache implementation
type RedisCache struct {
	client *redis.Client
}

func NewRedisCache(addr string, password string) (*RedisCache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       0,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	err := client.Ping(ctx).Err()
	if err != nil {
		return nil, err
	}

	return &RedisCache{client: client}, nil
}

func (r *RedisCache) Get(ctx context.Context, key string) (string, error) {
	val, err := r.client.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", nil // Cache miss returning empty string and nil error
		}
		return "", err
	}
	return val, nil
}

func (r *RedisCache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	return r.client.Set(ctx, key, value, ttl).Err()
}

func (r *RedisCache) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

// 2. InMemoryCache implementation (fallback for offline mode)
type inMemoryVal struct {
	value     string
	expiresAt time.Time
}

type InMemoryCache struct {
	store sync.Map
}

func NewInMemoryCache() *InMemoryCache {
	slog.Info("Initializing local thread-safe InMemoryCache fallback engine.")
	return &InMemoryCache{}
}

func (m *InMemoryCache) Get(ctx context.Context, key string) (string, error) {
	val, exists := m.store.Load(key)
	if !exists {
		return "", nil
	}

	cached := val.(inMemoryVal)
	if time.Now().After(cached.expiresAt) {
		m.store.Delete(key) // Evict expired key on access
		return "", nil
	}

	return cached.value, nil
}

func (m *InMemoryCache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	m.store.Store(key, inMemoryVal{
		value:     value,
		expiresAt: time.Now().Add(ttl),
	})
	return nil
}

func (m *InMemoryCache) Delete(ctx context.Context, key string) error {
	m.store.Delete(key)
	return nil
}
