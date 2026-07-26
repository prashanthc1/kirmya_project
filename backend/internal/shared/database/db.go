package database

import (
	"context"
	"fmt"
	"os"

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

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Verify the connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return &DBConnection{Pool: pool}, nil
}

// Close teardowns the connection pool.
func (db *DBConnection) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
