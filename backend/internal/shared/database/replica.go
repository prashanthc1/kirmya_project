package database

import (
	"context"
	"fmt"
	"os"
	"sync/atomic"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DBCluster interface {
	Primary() *pgxpool.Pool
	Replica() *pgxpool.Pool
	Close()
}

type dbCluster struct {
	primaryPool  *pgxpool.Pool
	replicaPools []*pgxpool.Pool
	rrIndex      uint64
}

func NewDBCluster(ctx context.Context, primaryConnStr string, replicaConnStrs []string) (DBCluster, error) {
	primaryPool, err := pgxpool.New(ctx, primaryConnStr)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to primary db: %w", err)
	}

	var replicaPools []*pgxpool.Pool
	for _, connStr := range replicaConnStrs {
		if connStr != "" {
			pool, err := pgxpool.New(ctx, connStr)
			if err == nil {
				replicaPools = append(replicaPools, pool)
			}
		}
	}

	// Fallback if no replica configured: use primary pool for reads
	if len(replicaPools) == 0 {
		replicaPools = append(replicaPools, primaryPool)
	}

	return &dbCluster{
		primaryPool:  primaryPool,
		replicaPools: replicaPools,
	}, nil
}

func (c *dbCluster) Primary() *pgxpool.Pool {
	return c.primaryPool
}

func (c *dbCluster) Replica() *pgxpool.Pool {
	if len(c.replicaPools) == 1 {
		return c.replicaPools[0]
	}
	idx := atomic.AddUint64(&c.rrIndex, 1)
	return c.replicaPools[idx%uint64(len(c.replicaPools))]
}

func (c *dbCluster) Close() {
	if c.primaryPool != nil {
		c.primaryPool.Close()
	}
	for _, p := range c.replicaPools {
		if p != nil && p != c.primaryPool {
			p.Close()
		}
	}
}

func InitClusterFromEnv(ctx context.Context) (DBCluster, error) {
	primaryURI := os.Getenv("DATABASE_URL")
	if primaryURI == "" {
		primaryURI = "postgresql://postgres:postgres@localhost:5432/kirmya?sslmode=disable"
	}

	replica1 := os.Getenv("DATABASE_REPLICA_URL_1")
	replica2 := os.Getenv("DATABASE_REPLICA_URL_2")

	replicas := []string{replica1, replica2}
	return NewDBCluster(ctx, primaryURI, replicas)
}
