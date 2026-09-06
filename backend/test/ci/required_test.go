//go:build ciintegration

package ci

import (
	"bytes"
	"context"
	"encoding/json"
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

// Registration must both return a real identity and persist it in PostgreSQL.
func TestHTTPRegistrationPersists(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	email := fmt.Sprintf("ci-%d@example.invalid", time.Now().UnixNano())
	payload, err := json.Marshal(map[string]interface{}{"firstName": "CI", "lastName": "Candidate", "email": email, "password": "Disposable-CI-password-123!", "acceptTerms": true, "acceptPrivacy": true})
	if err != nil {
		t.Fatal(err)
	}
	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Post(required(t, "TEST_API_URL")+"/api/v1/auth/register", "application/json", bytes.NewReader(payload))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusCreated {
		t.Fatalf("registration got %d want 201", response.StatusCode)
	}
	var body struct {
		ID string `json:"user_id"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	var storedID string
	if err := pool.QueryRow(ctx, "SELECT id::text FROM users WHERE email=$1", email).Scan(&storedID); err != nil {
		t.Fatal(err)
	}
	if body.ID == "" || body.ID != storedID {
		t.Fatalf("HTTP identity %q does not match persisted identity %q", body.ID, storedID)
	}
}
