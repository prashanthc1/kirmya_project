package router

import (
	"os"
	"sort"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

const goldenPath = "testdata/routes.golden"

// TestRouteTable locks the public API surface: any added, removed or renamed
// route must be reflected in testdata/routes.golden. Regenerate with
// KIRMYA_UPDATE_GOLDEN=1 go test ./internal/router.
func TestRouteTable(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Every handler is populated, by reflection, in fullyPopulatedRouter. This
	// list used to be written by hand and held 14 of the 62 handler fields, so
	// the golden file described a quarter of the API and the other three
	// quarters could change freely without this test noticing. A route only
	// exists on a gin engine if its handler was non-nil at registration, which
	// is also why four duplicate registrations once reached production as a
	// startup panic with this test green: the colliding pair was never
	// registered here at all.
	//
	// Handlers are zero values; routes are registered by method value and
	// nothing here serves a request. Swagger stays disabled so the golden file
	// covers the API surface only.
	engine := fullyPopulatedRouter(t)

	var got []string
	for _, route := range engine.Routes() {
		got = append(got, route.Method+" "+route.Path)
	}
	sort.Strings(got)

	if os.Getenv("KIRMYA_UPDATE_GOLDEN") == "1" {
		if err := os.WriteFile(goldenPath, []byte(strings.Join(got, "\n")+"\n"), 0o644); err != nil {
			t.Fatalf("write golden: %v", err)
		}
		return
	}

	raw, err := os.ReadFile(goldenPath)
	if err != nil {
		t.Fatalf("read golden: %v", err)
	}
	var want []string
	for _, line := range strings.Split(string(raw), "\n") {
		if line = strings.TrimSpace(line); line != "" {
			want = append(want, line)
		}
	}

	inGot := map[string]bool{}
	for _, r := range got {
		inGot[r] = true
	}
	for _, r := range want {
		if !inGot[r] {
			t.Errorf("missing route: %s", r)
		}
	}
	inWant := map[string]bool{}
	for _, r := range want {
		inWant[r] = true
	}
	for _, r := range got {
		if !inWant[r] {
			t.Errorf("unexpected route: %s", r)
		}
	}
}
