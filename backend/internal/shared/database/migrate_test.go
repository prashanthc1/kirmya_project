package database

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func findMigrationsDir() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		candidate := filepath.Join(dir, "scripts", "migrations")
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", os.ErrNotExist
}

// TestRunMigrations rebuilds the schema from scratch, so it drops everything in
// the public schema first. That is destructive by design, which is why it runs
// only against MIGRATION_TEST_DATABASE_URL and never against DATABASE_URL: the
// same command that verifies the migrations must not be able to empty the
// database a developer is working in, or the CI database of a live deployment.
//
//	MIGRATION_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/kirmya_migrationtest go test ./internal/shared/database/...
func TestRunMigrations(t *testing.T) {
	_ = godotenv.Load("../../../.env")

	dsn := strings.TrimSpace(os.Getenv("MIGRATION_TEST_DATABASE_URL"))
	if dsn == "" {
		t.Skip("MIGRATION_TEST_DATABASE_URL is not set; skipping the destructive migration rebuild test")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	db := &DBConnection{Pool: pool}

	t.Log("Resetting database schema public...")
	_, err = db.Pool.Exec(ctx, "DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
	if err != nil {
		t.Fatalf("Failed to reset schema: %v", err)
	}

	migrationsDir, err := findMigrationsDir()
	if err != nil {
		t.Fatalf("Failed to find migrations directory: %v", err)
	}
	t.Logf("Using migrations directory: %s", migrationsDir)

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		t.Fatalf("Failed to read migrations directory: %v", err)
	}

	var upFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			upFiles = append(upFiles, entry.Name())
		}
	}

	sort.Slice(upFiles, func(i, j int) bool {
		return upFiles[i] < upFiles[j]
	})

	t.Logf("Found %d up-migration files to apply", len(upFiles))

	for _, file := range upFiles {
		filePath := filepath.Join(migrationsDir, file)
		content, err := os.ReadFile(filePath)
		if err != nil {
			t.Fatalf("Failed to read migration file %s: %v", file, err)
		}

		t.Logf("Executing migration: %s ...", file)
		_, err = db.Pool.Exec(ctx, string(content))
		if err != nil {
			t.Fatalf("Failed migration %s: %v", file, err)
		}
	}

	t.Logf("All %d migrations applied successfully!", len(upFiles))
}
