package database

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
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

// TestRunMigrationsFailsWithoutAssets pins the failure that a missing
// migrations directory must now produce.
//
// RunMigrations used to log a warning and return nil here, so a deployment
// whose migration assets never shipped reported a successful, required
// migration step and then served an empty schema. There is no way to tell
// "nothing to apply" apart from "the migrations are gone", so it fails.
func TestRunMigrationsFailsWithoutAssets(t *testing.T) {
	// t.Chdir restores the working directory when the test finishes, so the
	// upward search for scripts/migrations starts somewhere that has none.
	t.Chdir(t.TempDir())

	if _, err := FindMigrationsDir(); err == nil {
		t.Fatal("expected no migrations directory above the temporary working directory")
	}

	// A nil pool is sufficient: the directory is resolved before the pool is
	// touched, so reaching a nil dereference would itself prove the ordering
	// changed.
	err := RunMigrations(context.Background(), nil)
	if err == nil {
		t.Fatal("RunMigrations returned nil with no migration assets; a required migration step must not pass silently")
	}
	if !strings.Contains(err.Error(), "migrations directory not found") {
		t.Fatalf("unexpected error: %v", err)
	}
}

// TestRunMigrationsIsSerialisedAcrossProcesses covers the concurrency case.
// Two API replicas starting together previously read the same "not yet applied"
// list and both executed the same DDL; the advisory lock makes the second wait
// and find the work done. Each migration must end up recorded exactly once.
func TestRunMigrationsIsSerialisedAcrossProcesses(t *testing.T) {
	_ = godotenv.Load("../../../.env")

	dsn := strings.TrimSpace(os.Getenv("MIGRATION_TEST_DATABASE_URL"))
	if dsn == "" {
		t.Skip("MIGRATION_TEST_DATABASE_URL is not set; skipping the destructive concurrent migration test")
	}

	ctx := context.Background()

	// Separate pools so the two runs contend the way separate processes do
	// rather than sharing one pool's connections.
	poolA, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer poolA.Close()
	poolB, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer poolB.Close()

	if _, err := poolA.Exec(ctx, "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"); err != nil {
		t.Fatalf("reset schema: %v", err)
	}

	errs := make(chan error, 2)
	var wg sync.WaitGroup
	for _, pool := range []*pgxpool.Pool{poolA, poolB} {
		wg.Add(1)
		go func(p *pgxpool.Pool) {
			defer wg.Done()
			errs <- RunMigrations(ctx, p)
		}(pool)
	}
	wg.Wait()
	close(errs)

	for err := range errs {
		if err != nil {
			t.Fatalf("concurrent migration run failed: %v", err)
		}
	}

	// Every version recorded exactly once, and the count matching the assets on
	// disk: a double-apply shows up as a duplicate, a lost run as a shortfall.
	var duplicates int
	if err := poolA.QueryRow(ctx,
		"SELECT count(*) FROM (SELECT version FROM schema_migrations GROUP BY version HAVING count(*) > 1) d").Scan(&duplicates); err != nil {
		t.Fatalf("check duplicates: %v", err)
	}
	if duplicates != 0 {
		t.Fatalf("%d migration version(s) recorded more than once", duplicates)
	}

	migrationsDir, err := FindMigrationsDir()
	if err != nil {
		t.Fatalf("find migrations: %v", err)
	}
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		t.Fatalf("read migrations: %v", err)
	}
	expected := 0
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			expected++
		}
	}
	var applied int
	if err := poolA.QueryRow(ctx, "SELECT count(*) FROM schema_migrations").Scan(&applied); err != nil {
		t.Fatalf("count applied: %v", err)
	}
	if applied != expected {
		t.Fatalf("applied %d migrations, expected %d", applied, expected)
	}
}
