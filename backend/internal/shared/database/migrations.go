package database

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// FindMigrationsDir searches for the scripts/migrations directory starting from cwd upwards.
func FindMigrationsDir() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		candidate := filepath.Join(dir, "scripts", "migrations")
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate, nil
		}
		candidateSub := filepath.Join(dir, "..", "scripts", "migrations")
		if info, err := os.Stat(candidateSub); err == nil && info.IsDir() {
			return filepath.Clean(candidateSub), nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("scripts/migrations directory not found")
}

// RunMigrations executes all .up.sql files in scripts/migrations in numerical order with schema_migrations tracking.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	migrationsDir, err := FindMigrationsDir()
	if err != nil {
		// A missing migrations directory used to be a warning and a nil return,
		// so a deployment whose assets never shipped reported a successful
		// migration step and then served an empty schema. There is no safe way
		// to distinguish "no migrations to run" from "the migrations are gone",
		// so this fails.
		return fmt.Errorf("migrations directory not found: %w", err)
	}

	// Serialise migration across processes. Two API replicas starting together
	// otherwise read the same "not yet applied" list and both execute the same
	// DDL; the tracking insert is idempotent but the DDL is not, so the loser
	// fails on an object that already exists. The lock is session-scoped and is
	// released explicitly below.
	//
	// The identifier is an arbitrary constant unique to this application's
	// migration runner.
	const migrationLockID int64 = 8125246170349372116
	lockConn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire connection for migration lock: %w", err)
	}
	defer lockConn.Release()

	if _, err := lockConn.Exec(ctx, "SELECT pg_advisory_lock($1)", migrationLockID); err != nil {
		return fmt.Errorf("acquire migration advisory lock: %w", err)
	}
	defer func() {
		// Best effort: releasing the session lock matters for a long-lived
		// pooled connection, but the lock is dropped with the session anyway.
		if _, unlockErr := lockConn.Exec(context.Background(), "SELECT pg_advisory_unlock($1)", migrationLockID); unlockErr != nil {
			slog.Warn("Failed to release migration advisory lock", slog.String("error", unlockErr.Error()))
		}
	}()

	// 1. Ensure schema_migrations table exists
	createTrackingSQL := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);
	`
	if _, err := pool.Exec(ctx, createTrackingSQL); err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// 2. Fetch already-applied migration versions
	rows, err := pool.Query(ctx, "SELECT version FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("failed to query applied schema_migrations: %w", err)
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var v string
		// A dropped row here is not cosmetic: an applied migration that fails to
		// scan is treated as unapplied and re-executed against a schema that
		// already has it.
		if err := rows.Scan(&v); err != nil {
			return fmt.Errorf("scan applied migration version: %w", err)
		}
		applied[v] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate applied migrations: %w", err)
	}
	rows.Close()

	// 3. Collect and sort all .up.sql files
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
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

	appliedCount := 0
	for _, file := range upFiles {
		if applied[file] {
			continue
		}

		filePath := filepath.Join(migrationsDir, file)
		content, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file, err)
		}

		// Execute migration in a transaction
		tx, err := pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("failed to begin transaction for migration %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, string(content)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("failed executing migration %s: %w", file, err)
		}

		if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING", file); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("failed to record migration %s in schema_migrations: %w", file, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", file, err)
		}
		appliedCount++
	}

	slog.Info("Successfully verified and applied database schema migrations", slog.Int("total", len(upFiles)), slog.Int("newly_applied", appliedCount))
	return nil
}
