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

// RunMigrations executes all .up.sql files in scripts/migrations in numerical order.
func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	migrationsDir, err := FindMigrationsDir()
	if err != nil {
		slog.Warn("Skipping database migrations: migrations directory not found", slog.String("error", err.Error()))
		return nil
	}

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

	for _, file := range upFiles {
		filePath := filepath.Join(migrationsDir, file)
		content, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file, err)
		}

		_, err = pool.Exec(ctx, string(content))
		if err != nil {
			return fmt.Errorf("failed executing migration %s: %w", file, err)
		}
	}

	slog.Info("Successfully verified and applied database schema migrations", slog.Int("count", len(upFiles)))
	return nil
}
