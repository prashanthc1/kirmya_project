package cache

import (
	"context"
	"log/slog"
	"os"
	"time"
)

// InitCache initializes a Redis client connection or falls back to InMemoryCache safely.
func InitCache() Cache {
	redisAddr := os.Getenv("REDIS_HOST")
	redisPort := os.Getenv("REDIS_PORT")
	redisURL := os.Getenv("REDIS_URL")
	redisPassword := os.Getenv("REDIS_PASSWORD")

	if redisURL != "" {
		slog.Info("Initializing Redis cache via REDIS_URL")
		if redisCache, err := NewRedisCacheFromURL(redisURL); err == nil {
			slog.Info("Successfully connected to production Redis cluster")
			return redisCache
		} else {
			slog.Warn("Failed to connect to REDIS_URL, falling back to InMemoryCache", "error", err)
		}
	} else if redisAddr != "" {
		if redisPort == "" {
			redisPort = "6379"
		}
		addr := redisAddr + ":" + redisPort
		slog.Info("Initializing Redis cache", "addr", addr)
		if redisCache, err := NewRedisCache(addr, redisPassword); err == nil {
			slog.Info("Successfully connected to Redis cache engine", "addr", addr)
			return redisCache
		} else {
			slog.Warn("Failed to connect to Redis, falling back to InMemoryCache", "addr", addr, "error", err)
		}
	} else {
		slog.Info("No REDIS_HOST or REDIS_URL provided, defaulting to thread-safe InMemoryCache engine")
	}

	return NewInMemoryCache()
}

// NewRedisCacheFromURL parses Redis connection string (e.g. redis://user:pass@host:6379/0)
func NewRedisCacheFromURL(redisURL string) (*RedisCache, error) {
	opts, err := ParseRedisURL(redisURL)
	if err != nil {
		return nil, err
	}
	client := NewRedisClientWithOpts(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisCache{client: client}, nil
}
