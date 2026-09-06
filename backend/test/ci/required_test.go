//go:build ciintegration

package ci

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"kirmya/internal/shared/cache"
	"net/http"
	"os"
	"testing"
	"time"
)

func required(t *testing.T, key string) string {
	t.Helper()
	value := os.Getenv(key)
	if value == "" {
		t.Fatalf("mandatory dependency %s missing", key)
	}
	return value
}
func TestPostgresAndRedis(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		t.Fatal(err)
	}
	var count int
	if err := pool.QueryRow(ctx, "SELECT count(*) FROM schema_migrations").Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count == 0 {
		t.Fatal("no migrations applied")
	}
	redis, err := cache.NewRedisCache(required(t, "REDIS_HOST")+":"+required(t, "REDIS_PORT"), "")
	if err != nil {
		t.Fatal(err)
	}
	key := fmt.Sprintf("ci:roundtrip:%d", time.Now().UnixNano())
	if err := redis.Set(ctx, key, "persisted", time.Minute); err != nil {
		t.Fatal(err)
	}
	defer redis.Delete(ctx, key)
	if value, err := redis.Get(ctx, key); err != nil || value != "persisted" {
		t.Fatalf("Redis roundtrip: %q %v", value, err)
	}
}
func TestHTTP(t *testing.T) {
	base := required(t, "TEST_API_URL")
	client := &http.Client{Timeout: 10 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	for _, probe := range []struct {
		path   string
		status int
	}{{"/health", 200}, {"/api/v1/auth/me", 401}} {
		t.Run(probe.path, func(t *testing.T) {
			response, err := client.Get(base + probe.path)
			if err != nil {
				t.Fatal(err)
			}
			defer response.Body.Close()
			if response.StatusCode != probe.status {
				t.Fatalf("HTTP_GATE: %s got %d want %d", probe.path, response.StatusCode, probe.status)
			}
		})
	}
}
