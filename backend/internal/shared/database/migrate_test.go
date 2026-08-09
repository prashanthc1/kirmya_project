package database

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"

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

func TestRunMigrations(t *testing.T) {
	_ = godotenv.Load("../../../.env")
	db, err := Connect()
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
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
