//go:build ciintegration

package ci

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

/*
The freelance marketplace foundation, against the real API and a real database.

Three properties, each of which the service-layer tests assert in isolation and
which this file proves survive the whole stack - routing, authentication
middleware, handler, service, repository and PostgreSQL:

  ownership   a client reaches their own projects and nobody else's
  lifecycle   a project moves along its lifecycle or not at all
  money       an amount sent as a decimal is stored as exact minor units

The ownership tests are the ones that matter most. Everything else here is a
bug; a failure in those is a vulnerability.
*/

// projectPayload is a valid create request.
func projectPayload(title string) map[string]any {
	return map[string]any{
		"title":           title,
		"description":     "Work described for the CI suite.",
		"budget":          1500.50,
		"budget_type":     "fixed",
		"skills_required": []string{"Go", "PostgreSQL"},
	}
}

// createProject posts a project and returns its id.
func createProject(t *testing.T, base, token, title string) string {
	t.Helper()
	resp := do(t, http.MethodPost, base+"/api/v1/freelance/projects", token, projectPayload(title))
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("POST /freelance/projects: %d %s", resp.StatusCode, body)
	}
	var payload struct {
		Project struct {
			ID       string `json:"id"`
			Status   string `json:"status"`
			Currency string `json:"currency"`
		} `json:"project"`
	}
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("decoding created project: %v (%s)", err, body)
	}
	if payload.Project.ID == "" {
		t.Fatalf("created project carries no id: %s", body)
	}
	// A new project is a draft, not a live posting.
	if payload.Project.Status != "draft" {
		t.Errorf("new project status = %q, want draft", payload.Project.Status)
	}
	if payload.Project.Currency != "AED" {
		t.Errorf("new project currency = %q, want AED", payload.Project.Currency)
	}
	return payload.Project.ID
}

// TestFreelanceProjectOwnershipIsEnforced is the IDOR test.
//
// Two real accounts, one real project. The second account must not be able to
// read it, must not be able to edit it, and must not be able to learn that it
// exists - which is why the expected status is 404 rather than 403.
func TestFreelanceProjectOwnershipIsEnforced(t *testing.T) {
	base := required(t, "TEST_API_URL")
	owner := registerAndLogin(t, base)
	stranger := registerAndLogin(t, base)

	projectID := createProject(t, base, owner.token, "Owner's project")

	// The owner reaches their own project.
	resp := do(t, http.MethodGet, base+"/api/v1/freelance/my/projects/"+projectID, owner.token, nil)
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("the owner could not read their own project: %d %s", resp.StatusCode, body)
	}

	// A second signed-in account does not.
	resp = do(t, http.MethodGet, base+"/api/v1/freelance/my/projects/"+projectID, stranger.token, nil)
	if resp.StatusCode != http.StatusNotFound {
		body, _ := readBody(resp)
		t.Errorf("a stranger reading another client's project got %d, want 404: %s", resp.StatusCode, body)
	}

	// And cannot edit it.
	resp = do(t, http.MethodPatch, base+"/api/v1/freelance/my/projects/"+projectID, stranger.token,
		map[string]any{"title": "Hijacked"})
	if resp.StatusCode != http.StatusNotFound {
		body, _ := readBody(resp)
		t.Errorf("a stranger editing another client's project got %d, want 404: %s", resp.StatusCode, body)
	}

	// The refusal prevented the write rather than reporting one it performed.
	resp = do(t, http.MethodGet, base+"/api/v1/freelance/my/projects/"+projectID, owner.token, nil)
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	var after struct {
		Title string `json:"title"`
	}
	if err := json.Unmarshal([]byte(body), &after); err != nil {
		t.Fatalf("decoding project: %v (%s)", err, body)
	}
	if after.Title == "Hijacked" {
		t.Error("a stranger's rejected edit was applied anyway")
	}
}

// An anonymous caller reaches none of the owner-scoped surface.
func TestFreelanceOwnerRoutesRefuseAnonymous(t *testing.T) {
	base := required(t, "TEST_API_URL")
	owner := registerAndLogin(t, base)
	projectID := createProject(t, base, owner.token, "Anonymous probe target")

	for _, probe := range []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/v1/freelance/my/projects"},
		{http.MethodGet, "/api/v1/freelance/my/projects/" + projectID},
		{http.MethodPatch, "/api/v1/freelance/my/projects/" + projectID},
		{http.MethodPost, "/api/v1/freelance/projects"},
		{http.MethodPost, "/api/v1/freelance/profile/enable"},
	} {
		resp := do(t, probe.method, base+probe.path, "", nil)
		if resp.StatusCode != http.StatusUnauthorized {
			body, _ := readBody(resp)
			t.Errorf("%s %s answered %d to an anonymous caller, want 401: %s",
				probe.method, probe.path, resp.StatusCode, body)
		}
	}
}

// The listing is scoped to the caller, and a draft never reaches the public
// board. Both halves matter: the first is the IDOR, the second is the leak.
func TestFreelanceListingIsScopedAndHidesDrafts(t *testing.T) {
	base := required(t, "TEST_API_URL")
	owner := registerAndLogin(t, base)
	stranger := registerAndLogin(t, base)

	projectID := createProject(t, base, owner.token, "Scoped listing project")

	ownIDs := myProjectIDs(t, base, owner.token)
	if !ownIDs[projectID] {
		t.Error("the owner's own listing did not include their project")
	}

	strangerIDs := myProjectIDs(t, base, stranger.token)
	if strangerIDs[projectID] {
		t.Error("a second account's listing included somebody else's project")
	}

	// The public board carries published work, never a draft.
	resp := do(t, http.MethodGet, base+"/api/v1/freelance/projects", "", nil)
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /freelance/projects: %d %s", resp.StatusCode, body)
	}
	var public struct {
		Data []struct {
			ID     string `json:"id"`
			Status string `json:"status"`
		} `json:"data"`
	}
	if err := json.Unmarshal([]byte(body), &public); err != nil {
		t.Fatalf("decoding the public board: %v (%s)", err, body)
	}
	for _, project := range public.Data {
		if project.ID == projectID {
			t.Error("an unpublished draft appeared on the public project board")
		}
		if project.Status == "draft" {
			t.Errorf("the public board carried a draft project (%s)", project.ID)
		}
	}
}

// myProjectIDs reads the caller's own project listing.
func myProjectIDs(t *testing.T, base, token string) map[string]bool {
	t.Helper()
	resp := do(t, http.MethodGet, base+"/api/v1/freelance/my/projects?limit=100", token, nil)
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /freelance/my/projects: %d %s", resp.StatusCode, body)
	}
	// The repository's standard pagination envelope, not a shape invented for
	// this module.
	var payload struct {
		Page       int `json:"page"`
		Limit      int `json:"limit"`
		TotalItems int `json:"total_items"`
		TotalPages int `json:"total_pages"`
		Data       []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("decoding the project listing: %v (%s)", err, body)
	}
	if payload.Limit == 0 {
		t.Errorf("the listing did not use the standard pagination envelope: %s", body)
	}
	ids := map[string]bool{}
	for _, project := range payload.Data {
		ids[project.ID] = true
	}
	return ids
}

// TestFreelanceMoneyIsStoredAsExactMinorUnits is the money test.
//
// 1500.50 sent over the wire has to land in the database as 150050 fils. Through
// a float64 the nearest double to 1500.50 times 100 is 150049.99999999997, and
// truncating it stores 150049 - half a fils short, on every amount that happens
// to be inexact in binary.
func TestFreelanceMoneyIsStoredAsExactMinorUnits(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	owner := registerAndLogin(t, base)

	projectID := createProject(t, base, owner.token, "Exact money project")

	var minorUnits int64
	var currency string
	if err := pool.QueryRow(t.Context(),
		`SELECT budget_minor_units, currency FROM freelance_projects WHERE id = $1`,
		projectID).Scan(&minorUnits, &currency); err != nil {
		t.Fatalf("reading the stored budget: %v", err)
	}
	if minorUnits != 150050 {
		t.Errorf("1500.50 was stored as %d minor units, want 150050", minorUnits)
	}
	if currency != "AED" {
		t.Errorf("stored currency = %q, want AED", currency)
	}

	// And it reads back as the same decimal the client sent.
	resp := do(t, http.MethodGet, base+"/api/v1/freelance/my/projects/"+projectID, owner.token, nil)
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	var project struct {
		Budget json.Number `json:"budget"`
	}
	if err := json.Unmarshal([]byte(body), &project); err != nil {
		t.Fatalf("decoding project: %v (%s)", err, body)
	}
	if project.Budget.String() != "1500.50" {
		t.Errorf("budget read back as %s, want 1500.50", project.Budget)
	}
}

// The lifecycle is enforced over HTTP, not only in the service.
func TestFreelanceProjectLifecycleIsEnforcedOverHTTP(t *testing.T) {
	base := required(t, "TEST_API_URL")
	owner := registerAndLogin(t, base)
	projectID := createProject(t, base, owner.token, "Lifecycle project")

	// draft -> completed is not a move the lifecycle has.
	resp := do(t, http.MethodPatch, base+"/api/v1/freelance/my/projects/"+projectID, owner.token,
		map[string]any{"status": "completed"})
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusConflict {
		t.Errorf("draft -> completed answered %d, want 409: %s", resp.StatusCode, body)
	}

	// An invented status is a validation failure, not a silent no-op.
	resp = do(t, http.MethodPatch, base+"/api/v1/freelance/my/projects/"+projectID, owner.token,
		map[string]any{"status": "nonsense"})
	if resp.StatusCode != http.StatusBadRequest {
		body, _ := readBody(resp)
		t.Errorf("an invented status answered %d, want 400: %s", resp.StatusCode, body)
	}

	// The legal move is accepted, and it sticks.
	resp = do(t, http.MethodPatch, base+"/api/v1/freelance/my/projects/"+projectID, owner.token,
		map[string]any{"status": "published"})
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("draft -> published answered %d, want 200: %s", resp.StatusCode, body)
	}
}

// Enabling freelancing creates a pending capability and is idempotent.
func TestEnableFreelanceProfileIsExplicitAndIdempotent(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	if got := capabilityOf(t, pool, user.id); got != "none" {
		t.Fatalf("a fresh account has capability %q, want none", got)
	}

	resp := do(t, http.MethodPost, base+"/api/v1/freelance/profile/enable", user.token, nil)
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("enabling freelancing answered %d, want 200: %s", resp.StatusCode, body)
	}

	// Enabling is not activating: the capability is pending until onboarding
	// completes, which is the defect migration 0101 exists to prevent.
	if got := capabilityOf(t, pool, user.id); got != "pending" {
		t.Errorf("capability after enabling = %q, want pending", got)
	}

	// A second call writes nothing and creates no second profile.
	resp = do(t, http.MethodPost, base+"/api/v1/freelance/profile/enable", user.token, nil)
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Errorf("enabling twice answered %d, want 200: %s", resp.StatusCode, body)
	}
	if count := profileCount(t, pool, user.id); count != 1 {
		t.Errorf("enabling twice produced %d profiles, want 1", count)
	}
}

// The database refuses what the service refuses. These are the constraints
// migration 0102 adds, exercised directly: a service bug must not be able to
// write a row the schema should have rejected.
func TestFreelanceSchemaConstraintsHold(t *testing.T) {
	pool := connectDB(t)

	assertRejected(t, pool, "a negative budget",
		`INSERT INTO freelance_projects (id, client_id, title, description, budget_minor_units, status)
		 SELECT gen_random_uuid(), id, 'x', 'x', -1, 'draft' FROM users LIMIT 1`)

	assertRejected(t, pool, "an unknown project status",
		`INSERT INTO freelance_projects (id, client_id, title, description, budget_minor_units, status)
		 SELECT gen_random_uuid(), id, 'x', 'x', 100, 'not_a_status' FROM users LIMIT 1`)

	assertRejected(t, pool, "a project owned by no account",
		`INSERT INTO freelance_projects (id, client_id, title, description, budget_minor_units, status)
		 VALUES (gen_random_uuid(), gen_random_uuid(), 'x', 'x', 100, 'draft')`)

	assertRejected(t, pool, "a review rating outside 1-5",
		`INSERT INTO freelance_reviews (contract_id, author_id, subject_id, rating)
		 SELECT gen_random_uuid(), id, id, 9 FROM users LIMIT 1`)

	assertRejected(t, pool, "a self-authored review",
		`INSERT INTO freelance_reviews (id, contract_id, author_id, subject_id, rating)
		 SELECT gen_random_uuid(), gen_random_uuid(), id, id, 5 FROM users LIMIT 1`)

	assertRejected(t, pool, "a zero-amount payment intent",
		`INSERT INTO freelance_payment_intents (contract_id, payer_id, amount_minor_units)
		 SELECT gen_random_uuid(), id, 0 FROM users LIMIT 1`)
}

// assertRejected runs a statement that must fail, inside a transaction that is
// always rolled back so a statement that wrongly succeeds leaves nothing behind.
func assertRejected(t *testing.T, pool *pgxpool.Pool, what, statement string) {
	t.Helper()
	tx, err := pool.Begin(t.Context())
	if err != nil {
		t.Fatalf("begin: %v", err)
	}
	defer func() { _ = tx.Rollback(t.Context()) }()

	if _, err := tx.Exec(t.Context(), statement); err == nil {
		t.Errorf("the database accepted %s", what)
	}
}
