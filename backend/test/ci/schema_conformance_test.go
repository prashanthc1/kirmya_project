//go:build ciintegration

package ci

import (
	"context"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TestRepositorySQLMatchesTheSchema compares the columns the repositories write
// against the columns the migrations create.
//
// Batch 5 found three tables no migration ever created and twelve write paths
// naming columns that exist only in a second CREATE TABLE for a name an earlier
// migration had already taken - CREATE TABLE IF NOT EXISTS skips the later
// definition in silence, so the module that expected it failed at runtime
// instead of at migration time. Joining a community, storing mentorship
// feedback, enrolling in MFA and recording a privacy incident all failed that
// way. This check reads the same two sources and fails when they disagree.
func TestRepositorySQLMatchesTheSchema(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	schema := loadSchema(ctx, t, pool)
	if len(schema) == 0 {
		t.Fatal("information_schema returned no tables: the migrations did not run")
	}

	root := repositoryRoot(t)
	var problems []string
	for _, file := range goFilesUnder(t, filepath.Join(root, "internal")) {
		raw, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		rel, _ := filepath.Rel(root, file)
		problems = append(problems, checkStatements(string(raw), rel, schema)...)
	}

	sort.Strings(problems)
	for _, p := range problems {
		t.Error(p)
	}
}

var (
	insertRe = regexp.MustCompile(`(?is)INSERT\s+INTO\s+(\w+)\s*\(([^;]*?)\)\s*(?:VALUES|SELECT|ON CONFLICT)`)
	// A Go raw string cannot hold a backtick, and the SQL being scanned is
	// written in raw strings, so that terminator reaches the engine as \x60.
	updateRe = regexp.MustCompile(`(?is)UPDATE\s+(\w+)\s+SET\s+(.*?)(WHERE|RETURNING|\x60)`)
	wordRe   = regexp.MustCompile(`^\w+$`)
)

// checkStatements reports INSERT and UPDATE statements naming a table or column
// the database does not have. Only these two forms are checked: their column
// lists are unambiguous without parsing SQL properly.
func checkStatements(src, file string, schema map[string]map[string]bool) []string {
	var problems []string

	for _, m := range insertRe.FindAllStringSubmatch(src, -1) {
		table := strings.ToLower(m[1])
		columns, ok := schema[table]
		if !ok {
			problems = append(problems, file+": INSERT INTO "+table+", which is not a table in the migrated schema")
			continue
		}
		for _, col := range splitColumns(m[2]) {
			if !columns[col] {
				problems = append(problems, file+": INSERT INTO "+table+" names column "+col+", which does not exist")
			}
		}
	}

	for _, m := range updateRe.FindAllStringSubmatch(src, -1) {
		table := strings.ToLower(m[1])
		columns, ok := schema[table]
		if !ok {
			problems = append(problems, file+": UPDATE "+table+", which is not a table in the migrated schema")
			continue
		}
		for _, assignment := range strings.Split(m[2], ",") {
			col := strings.ToLower(strings.TrimSpace(strings.Split(assignment, "=")[0]))
			col = strings.Trim(col, `"`)
			if wordRe.MatchString(col) && !columns[col] {
				problems = append(problems, file+": UPDATE "+table+" sets column "+col+", which does not exist")
			}
		}
	}

	return problems
}

func splitColumns(list string) []string {
	var out []string
	for _, part := range strings.Split(list, ",") {
		col := strings.ToLower(strings.Trim(strings.TrimSpace(part), `"`))
		if wordRe.MatchString(col) {
			out = append(out, col)
		}
	}
	return out
}

func loadSchema(ctx context.Context, t *testing.T, pool *pgxpool.Pool) map[string]map[string]bool {
	t.Helper()
	rows, err := pool.Query(ctx, `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()

	schema := map[string]map[string]bool{}
	for rows.Next() {
		var table, column string
		if err := rows.Scan(&table, &column); err != nil {
			t.Fatal(err)
		}
		if schema[table] == nil {
			schema[table] = map[string]bool{}
		}
		schema[table][column] = true
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	return schema
}

// repositoryRoot walks up from the test binary working directory to the backend
// module root, which is where internal/ lives.
func repositoryRoot(t *testing.T) string {
	t.Helper()
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 5; i++ {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir
		}
		dir = filepath.Dir(dir)
	}
	t.Fatal("could not find the module root from the test working directory")
	return ""
}

func goFilesUnder(t *testing.T, root string) []string {
	t.Helper()
	var files []string
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}
		// docs.go is the generated OpenAPI document; it contains no SQL.
		if strings.HasSuffix(path, string(filepath.Separator)+"docs.go") {
			return nil
		}
		files = append(files, path)
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	return files
}
