package integration

import (
	"context"
	"os"
	"testing"
	"time"

	"kirmya/internal/shared/database"
)

func TestPostgreSQLDatabaseIntegration(t *testing.T) {
	if os.Getenv("ALLOW_NO_DB") == "true" {
		t.Skip("Skipping live database pool integration test when running in ALLOW_NO_DB mock mode")
	}
	// DATABASE_URL is the signal that a Postgres instance was deliberately
	// provisioned. Without it database.Connect() falls back to hardcoded local
	// dev credentials, so the test fails on any machine or CI job with no local
	// Postgres. Set DATABASE_URL to make this test run and fail hard.
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("Skipping live database pool integration test: DATABASE_URL is not set")
	}

	db, err := database.Connect()
	if err != nil {
		t.Fatalf("Failed to establish PostgreSQL database connection pool: %v", err)
	}
	defer db.Pool.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := db.Pool.Ping(ctx); err != nil {
		t.Fatalf("PostgreSQL database ping failed: %v", err)
	}

	var one int
	err = db.Pool.QueryRow(ctx, "SELECT 1").Scan(&one)
	if err != nil || one != 1 {
		t.Fatalf("Expected SELECT 1 to return 1, got val=%d, err=%v", one, err)
	}
}
