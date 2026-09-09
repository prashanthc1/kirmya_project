//go:build ciintegration

package ci

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// readBody drains a response and returns it as text.
func readBody(resp *http.Response) (string, error) {
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	return string(raw), err
}

// TestRecommendationsAreRealAndNeverInvented exercises the three recommendation
// endpoints against the running API.
//
// Found by reading the PostgreSQL service log of a green CI run: both candidate
// queries were erroring on every request, and had been since they were written.
//
//	ERROR: column u.deleted_at does not exist
//	ERROR: could not determine data type of parameter $1
//
// The users table has no deleted_at - it carries status - and the communities
// query bound one argument while referring to $2. The service discarded both
// errors and substituted fixtures, so /recommendations/people answered every
// account with "Tariq Al-Mansoor, Principal Infrastructure Architect" and
// "Dr. Reem Al-Nuaimi", with the names of the connections they supposedly
// shared with the caller; /recommendations/communities answered with two
// invented communities and their member counts; and the job stream answered
// with three postings at employers that do not exist. Nothing failed, because
// nothing checked.
//
// This test fails against that code twice over: the invented names come back,
// and the real community seeded below does not.
func TestRecommendationsAreRealAndNeverInvented(t *testing.T) {
	base := required(t, "TEST_API_URL")

	// Two accounts: the second is a real person the first could be recommended.
	caller := registerAndLogin(t, base)
	peer := registerAndLogin(t, base)

	// A real community, created through the API rather than seeded with SQL, so
	// this exercises the same rows the product writes.
	slug := "ci-b6-" + uuid.NewString()[:8]
	createResp := do(t, http.MethodPost, base+"/api/v1/communities", peer.token, map[string]any{
		"name":        "CI Batch 6 Community " + slug,
		"title":       "CI Batch 6 Community " + slug,
		"slug":        slug,
		"description": "Disposable community created by the batch 6 acceptance test.",
		"category":    "Engineering",
		"visibility":  "public",
	})
	createResp.Body.Close()
	if createResp.StatusCode < 200 || createResp.StatusCode >= 300 {
		t.Fatalf("create community: got %d, want 2xx", createResp.StatusCode)
	}

	// The fixtures that used to be served. Their UUIDs were literals, which is
	// the cheapest thing to assert on and the hardest to reintroduce by accident.
	invented := map[string]string{
		"11111111-1111-1111-1111-111111111111": "invented job posting",
		"22222222-2222-2222-2222-222222222222": "invented job posting",
		"44444444-4444-4444-4444-444444444444": "invented person",
		"55555555-5555-5555-5555-555555555555": "invented person",
		"66666666-6666-6666-6666-666666666666": "invented community",
		"77777777-7777-7777-7777-777777777777": "invented community",
	}
	inventedNames := []string{"Tariq Al-Mansoor", "Reem Al-Nuaimi", "Gulf Gophers", "UAE AI & ML Practitioners"}

	for _, path := range []string{
		"/api/v1/recommendations",
		"/api/v1/recommendations/people",
		"/api/v1/recommendations/communities",
		"/api/v1/recommendations/feed",
	} {
		resp := do(t, http.MethodGet, base+path, caller.token, nil)
		var raw json.RawMessage
		decodeErr := json.NewDecoder(resp.Body).Decode(&raw)
		status := resp.StatusCode
		resp.Body.Close()

		// A query that cannot run is a failure, not an empty list. Before the
		// fix these answered 200 with fiction; if the SQL breaks again the
		// error now reaches here.
		if status != http.StatusOK {
			t.Errorf("GET %s: got %d want 200 (body %s)", path, status, string(raw))
			continue
		}
		if decodeErr != nil {
			t.Errorf("GET %s: response is not JSON: %v", path, decodeErr)
			continue
		}

		body := string(raw)
		for id, what := range invented {
			if strings.Contains(body, id) {
				t.Errorf("GET %s served a %s (%s)", path, what, id)
			}
		}
		for _, name := range inventedNames {
			if strings.Contains(body, name) {
				t.Errorf("GET %s served the invented name %q", path, name)
			}
		}
		// The constant "insight" the feed used to open with, scored 95 and
		// attributed to the reader's verified skills.
		if strings.Contains(body, "AI Career Optimization Insight") {
			t.Errorf("GET %s served the constant career insight", path)
		}
	}

	// The real rows have to come back, which is what proves the queries run at
	// all rather than merely failing quietly in a new direction.
	//
	// People are checked against the users table rather than against one
	// expected account: this database accumulates accounts across the whole
	// suite and the ordering is by profile completeness, so which real people
	// are returned is not fixed. That every returned person is a real account
	// is the property that matters, and it is the one the fixtures broke.
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	peopleResp := do(t, http.MethodGet, base+"/api/v1/recommendations/people", caller.token, nil)
	var people []struct {
		UserID string `json:"userId"`
	}
	if err := json.NewDecoder(peopleResp.Body).Decode(&people); err != nil {
		peopleResp.Body.Close()
		t.Fatalf("decode people: %v", err)
	}
	peopleResp.Body.Close()
	if len(people) == 0 {
		t.Fatalf("recommendations/people returned nobody although %s and %s both exist", caller.id, peer.id)
	}
	for _, p := range people {
		var exists bool
		if err := pool.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)", p.UserID).Scan(&exists); err != nil {
			t.Fatalf("look up recommended person %s: %v", p.UserID, err)
		}
		if !exists {
			t.Errorf("recommendations/people returned %s, which is not an account", p.UserID)
		}
		if p.UserID == caller.id {
			t.Errorf("recommendations/people recommended the caller to themselves")
		}
	}

	// Communities are few enough here for the exact row to be checked, and it
	// was created through the API moments ago.
	commResp := do(t, http.MethodGet, base+"/api/v1/recommendations/communities", caller.token, nil)
	comms, err := readBody(commResp)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(comms, slug) && !strings.Contains(comms, "CI Batch 6 Community "+slug) {
		t.Errorf("recommendations/communities did not include the community just created (%s): %s", slug, comms)
	}
}
