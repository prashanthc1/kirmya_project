package persistence_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestEveryMemoryOnlyRepositoryIsRegistered is the guard that keeps the audit
// honest. A repository that accepts the pgx pool and never queries it is
// memory-only no matter what it is called, and one that forgets to register
// itself is exactly the situation the registry exists to prevent: production
// would boot clean while the module quietly drops its data.
//
// It reads the source tree rather than wiring the modules up, so it also
// catches a repository that has been written but not yet handed a service.
func TestEveryMemoryOnlyRepositoryIsRegistered(t *testing.T) {
	root := repoRoot(t)

	entries, err := os.ReadDir(filepath.Join(root, "internal"))
	if err != nil {
		t.Fatalf("read internal/: %v", err)
	}

	var unregistered []string
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		dir := filepath.Join(root, "internal", entry.Name(), "repository")
		sources, err := filepath.Glob(filepath.Join(dir, "*.go"))
		if err != nil || len(sources) == 0 {
			continue
		}

		var body strings.Builder
		for _, src := range sources {
			if strings.HasSuffix(src, "_test.go") {
				continue
			}
			content, err := os.ReadFile(src)
			if err != nil {
				t.Fatalf("read %s: %v", src, err)
			}
			body.Write(content)
		}
		pkg := body.String()

		if !strings.Contains(pkg, "pgxpool.Pool") || usesPool(pkg) {
			continue
		}
		if strings.Contains(pkg, "persistence.RegisterEphemeral") {
			continue
		}
		unregistered = append(unregistered, entry.Name())
	}

	if len(unregistered) > 0 {
		t.Errorf("these repositories never query their pool but do not call persistence.RegisterEphemeral, "+
			"so a production deployment would start believing their data is durable: %s",
			strings.Join(unregistered, ", "))
	}
}

// usesPool reports whether the package actually sends anything to the database.
func usesPool(pkg string) bool {
	for _, call := range []string{".Query(", ".QueryRow(", ".Exec(", ".SendBatch(", ".CopyFrom(", ".Begin(", ".Acquire("} {
		if strings.Contains(pkg, call) {
			return true
		}
	}
	return false
}

func repoRoot(t *testing.T) string {
	t.Helper()

	dir, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	for i := 0; i < 6; i++ {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir
		}
		dir = filepath.Dir(dir)
	}
	t.Fatal("could not locate the module root from the test working directory")
	return ""
}
