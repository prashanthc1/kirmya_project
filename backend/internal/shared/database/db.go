package database

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DBConnection holds the pgxpool connection pool.
type DBConnection struct {
	Pool *pgxpool.Pool
}

// Connect initializes the database pool using environment connection strings or falls back to local dev defaults.
func Connect() (*DBConnection, error) {
	ctx := context.Background()
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		// Default local development credentials
		connStr = "postgres://postgres:postgres@localhost:5432/kirmya?sslmode=disable"
	}

	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database url: %w", err)
	}

	// Production connection pool tuning
	maxConns := int32(25)
	if v := os.Getenv("DB_MAX_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			maxConns = int32(n)
		}
	}
	minConns := int32(5)
	if v := os.Getenv("DB_MIN_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			minConns = int32(n)
		}
	}

	config.MaxConns = maxConns
	config.MinConns = minConns
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Verify the connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	// Automatically run database migrations to keep schema in sync
	if err := RunMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("database migration failed: %w", err)
	}

	return &DBConnection{Pool: pool}, nil
}

// Close teardowns the connection pool.
func (db *DBConnection) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
