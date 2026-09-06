// ci-migrate requires real migration assets and verifies the production runner's tracking.
package main

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"kirmya/internal/shared/database"
	"os"
	"path/filepath"
	"time"
)

func run() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL required")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	dir, err := database.FindMigrationsDir()
	if err != nil {
		return err
	}
	files, err := filepath.Glob(filepath.Join(dir, "*.up.sql"))
	if err != nil {
		return err
	}
	if len(files) == 0 {
		return fmt.Errorf("no migration assets")
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return err
	}
	defer pool.Close()
	if err = pool.Ping(ctx); err != nil {
		return err
	}
	if err = database.RunMigrations(ctx, pool); err != nil {
		return err
	}
	for _, file := range files {
		var present bool
		if err = pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)", filepath.Base(file)).Scan(&present); err != nil {
			return err
		}
		if !present {
			return fmt.Errorf("untracked migration: %s", filepath.Base(file))
		}
	}
	fmt.Printf("Verified %d real migrations; verifying repeat run\n", len(files))
	return database.RunMigrations(ctx, pool)
}
func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
