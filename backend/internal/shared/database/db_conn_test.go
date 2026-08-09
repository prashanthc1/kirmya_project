package database

import (
	"context"
	"testing"

	"github.com/joho/godotenv"
)

func TestCheckDatabaseTables(t *testing.T) {
	_ = godotenv.Load("../../../.env")
	db, err := Connect()
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	rows, err := db.Pool.Query(context.Background(),
		"SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
	if err != nil {
		t.Fatalf("Failed to query tables: %v", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Fatalf("Scan error: %v", err)
		}
		tables = append(tables, name)
	}

	t.Logf("Found %d tables in database 'kirmya_project':", len(tables))
	for _, table := range tables {
		t.Logf(" - %s", table)
	}
}
