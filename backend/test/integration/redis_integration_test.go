package integration

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/shared/cache"
)

func TestRedisCacheIntegration(t *testing.T) {
	c := cache.InitCache()
	if c == nil {
		t.Fatalf("Cache engine initialization returned nil")
	}

	ctx := context.Background()
	testKey := "kirmya:test:integration_key"
	testVal := "integration_payload_test_value"

	// 1. Set Cache Key
	err := c.Set(ctx, testKey, testVal, 10*time.Second)
	if err != nil {
		t.Fatalf("Cache Set failed: %v", err)
	}

	// 2. Get Cache Key
	val, err := c.Get(ctx, testKey)
	if err != nil {
		t.Fatalf("Cache Get failed: %v", err)
	}
	if val != testVal {
		t.Errorf("Expected cache value %q, got %q", testVal, val)
	}

	// 3. Delete Cache Key
	err = c.Delete(ctx, testKey)
	if err != nil {
		t.Fatalf("Cache Delete failed: %v", err)
	}

	// 4. Verify Eviction
	evictedVal, _ := c.Get(ctx, testKey)
	if evictedVal != "" {
		t.Errorf("Expected empty string after eviction, got %q", evictedVal)
	}
}
