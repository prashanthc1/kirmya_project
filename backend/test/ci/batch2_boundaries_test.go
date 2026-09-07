//go:build ciintegration

package ci

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	authRepo "kirmya/internal/auth/repository"
)

// Batch 2 acceptance: the identity, ownership and organization boundaries closed
// in steps 3 and 4, exercised over real HTTP against the real database rather
// than asserted from source.

// ciPassword is shared so a test that has to sign in again after an API
// restart uses the same credential registerAndLogin issued.
const ciPassword = "Disposable-CI-password-123!"

type ciUser struct {
	id    string
	email string
	token string
}

func httpClient() *http.Client {
	return &http.Client{Timeout: 15 * time.Second}
}

// registerAndLogin creates a disposable account and returns its identity and a
// real access token. Every boundary below is checked with tokens obtained this
// way, so a test cannot pass by accident on a synthetic identity.
func registerAndLogin(t *testing.T, base string) ciUser {
	t.Helper()
	email := fmt.Sprintf("ci-b2-%s@example.invalid", uuid.NewString())
	const password = ciPassword

	body, err := json.Marshal(map[string]any{
		"firstName": "CI", "lastName": "Batch2", "email": email, "password": password,
		"acceptTerms": true, "acceptPrivacy": true,
	})
	if err != nil {
		t.Fatal(err)
	}
	resp, err := httpClient().Post(base+"/api/v1/auth/register", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("register %s: got %d want 201", email, resp.StatusCode)
	}
	var reg struct {
		ID string `json:"user_id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&reg); err != nil {
		t.Fatal(err)
	}

	loginBody, err := json.Marshal(map[string]any{"email": email, "password": password})
	if err != nil {
		t.Fatal(err)
	}
	loginResp, err := httpClient().Post(base+"/api/v1/auth/login", "application/json", bytes.NewReader(loginBody))
	if err != nil {
		t.Fatal(err)
	}
	defer loginResp.Body.Close()
	if loginResp.StatusCode != http.StatusOK {
		t.Fatalf("login %s: got %d want 200", email, loginResp.StatusCode)
	}
	var login struct {
		AccessToken string `json:"accessToken"`
		Token       string `json:"token"`
	}
	if err := json.NewDecoder(loginResp.Body).Decode(&login); err != nil {
		t.Fatal(err)
	}
	token := login.AccessToken
	if token == "" {
		token = login.Token
	}
	if token == "" {
		t.Fatalf("login %s returned no access token", email)
	}
	return ciUser{id: reg.ID, email: email, token: token}
}

func do(t *testing.T, method, url, token string, body any) *http.Response {
	t.Helper()
	var reader *bytes.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		reader = bytes.NewReader(raw)
	} else {
		reader = bytes.NewReader(nil)
	}
	req, err := http.NewRequest(method, url, reader)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := httpClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

// seedCompany inserts a disposable company. companies.handle is NOT NULL and
// UNIQUE, so it is derived from the generated id rather than left out.
//
// A seed failure is fatal rather than a skip: the delivery gate rejects skipped
// tests, so swallowing a schema mismatch here would turn a real problem into a
// confusing gate failure somewhere else.
func seedCompany(ctx context.Context, t *testing.T, pool *pgxpool.Pool, label string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	short := id.String()[:8]
	_, err := pool.Exec(ctx,
		"INSERT INTO companies (id, name, handle, created_at) VALUES ($1, $2, $3, now()) ON CONFLICT (id) DO NOTHING",
		id, label+" "+short, "ci-b2-"+short)
	if err != nil {
		t.Fatalf("seed company: %v", err)
	}
	return id
}

// seedJob inserts a disposable posting. jobs.description is NOT NULL.
func seedJob(ctx context.Context, t *testing.T, pool *pgxpool.Pool, companyID uuid.UUID, title string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	_, err := pool.Exec(ctx,
		"INSERT INTO jobs (id, company_id, title, description, status, created_at) VALUES ($1, $2, $3, $4, 'active', now()) ON CONFLICT (id) DO NOTHING",
		id, companyID, title, "Disposable CI batch2 posting.")
	if err != nil {
		t.Fatalf("seed job: %v", err)
	}
	return id
}

// TestAnalyticsRequiresAuthentication covers the route groups that carried no
// authentication middleware at all. The consent write is listed explicitly: an
// anonymous caller could previously change a stored preference.
func TestAnalyticsRequiresAuthentication(t *testing.T) {
	base := required(t, "TEST_API_URL")
	for _, probe := range []struct{ method, path string }{
		{http.MethodGet, "/api/v1/analytics/profile"},
		{http.MethodGet, "/api/v1/analytics/consent"},
		{http.MethodPut, "/api/v1/analytics/consent"},
		{http.MethodGet, "/api/v1/analytics/funnel"},
		{http.MethodGet, "/api/v1/recruiter/analytics/overview"},
		{http.MethodGet, "/api/v1/company/analytics/overview"},
		{http.MethodPost, "/api/v1/internal/analytics/events"},
	} {
		t.Run(probe.method+" "+probe.path, func(t *testing.T) {
			resp := do(t, probe.method, base+probe.path, "", map[string]any{})
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusUnauthorized {
				t.Fatalf("anonymous %s %s: got %d want 401", probe.method, probe.path, resp.StatusCode)
			}
		})
	}
}

// TestForeignOrganizationAnalyticsDenied is the foreign-organization case. The
// organization is named in the query string, so without a membership check any
// authenticated caller could read any organization's hiring data.
func TestForeignOrganizationAnalyticsDenied(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	member := registerAndLogin(t, base)
	outsider := registerAndLogin(t, base)

	companyID := seedCompany(ctx, t, pool, "CI Batch2 Company")
	if _, err := pool.Exec(ctx,
		"INSERT INTO company_members (id, company_id, user_id, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (company_id, user_id) DO NOTHING",
		uuid.New(), companyID, uuid.MustParse(member.id)); err != nil {
		t.Fatalf("seed company membership: %v", err)
	}

	t.Run("member is allowed", func(t *testing.T) {
		resp := do(t, http.MethodGet, base+"/api/v1/recruiter/analytics/overview?organization_id="+companyID.String(), member.token, nil)
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusForbidden {
			t.Fatal("member denied its own organization: got 403")
		}
	})

	t.Run("non-member is refused", func(t *testing.T) {
		resp := do(t, http.MethodGet, base+"/api/v1/recruiter/analytics/overview?organization_id="+companyID.String(), outsider.token, nil)
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusForbidden {
			t.Fatalf("foreign organization read: got %d want 403", resp.StatusCode)
		}
	})

	t.Run("company analytics refuses a non-member", func(t *testing.T) {
		resp := do(t, http.MethodGet, base+"/api/v1/company/analytics/overview?company_id="+companyID.String(), outsider.token, nil)
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusForbidden {
			t.Fatalf("foreign company read: got %d want 403", resp.StatusCode)
		}
	})

	t.Run("organization must be named", func(t *testing.T) {
		resp := do(t, http.MethodGet, base+"/api/v1/recruiter/analytics/overview", member.token, nil)
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("omitted organization_id: got %d want 400", resp.StatusCode)
		}
	})
}

// TestApplicationTimelineOwnership is the owner, foreign-user and anonymous
// matrix for F01. A foreign application and an unknown one must be
// indistinguishable, or the response confirms that another candidate's
// application exists.
func TestApplicationTimelineOwnership(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	owner := registerAndLogin(t, base)
	stranger := registerAndLogin(t, base)

	companyID := seedCompany(ctx, t, pool, "CI Batch2 Timeline")
	jobID := seedJob(ctx, t, pool, companyID, "CI Batch2 Role")
	appID := uuid.New()
	if _, err := pool.Exec(ctx,
		"INSERT INTO job_applications (id, candidate_id, job_id, current_stage, applied_at, updated_at) VALUES ($1, $2, $3, 'Applied', now(), now()) ON CONFLICT (id) DO NOTHING",
		appID, uuid.MustParse(owner.id), jobID); err != nil {
		t.Fatalf("seed application: %v", err)
	}
	if _, err := pool.Exec(ctx,
		"INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, moved_by, notes, moved_at) VALUES ($1, $2, '', 'Applied', $3, 'CI batch2 seed', now())",
		uuid.New(), appID, uuid.MustParse(owner.id)); err != nil {
		t.Fatalf("seed stage history: %v", err)
	}

	url := base + "/api/v1/applications/" + appID.String() + "/timeline"

	t.Run("anonymous is refused", func(t *testing.T) {
		resp := do(t, http.MethodGet, url, "", nil)
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusUnauthorized {
			t.Fatalf("anonymous timeline: got %d want 401", resp.StatusCode)
		}
	})

	t.Run("owner reads its own timeline", func(t *testing.T) {
		resp := do(t, http.MethodGet, url, owner.token, nil)
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("owner timeline: got %d want 200", resp.StatusCode)
		}
		var items []map[string]any
		if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
			t.Fatal(err)
		}
		if len(items) == 0 {
			t.Fatal("owner timeline is empty; the seeded stage history was not returned")
		}
	})

	t.Run("foreign candidate gets not found", func(t *testing.T) {
		resp := do(t, http.MethodGet, url, stranger.token, nil)
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusNotFound {
			t.Fatalf("foreign timeline: got %d want 404", resp.StatusCode)
		}
	})

	t.Run("unknown application is indistinguishable from a foreign one", func(t *testing.T) {
		resp := do(t, http.MethodGet, base+"/api/v1/applications/"+uuid.NewString()+"/timeline", stranger.token, nil)
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusNotFound {
			t.Fatalf("unknown timeline: got %d want 404", resp.StatusCode)
		}
	})
}

// TestSavedJobPersistsDurably is the durability case: the row is read back on a
// connection the API does not own, so a write that only ever existed in a
// repository's in-memory branch fails here. It also pins the saved-jobs contract
// that the frontend mapping depends on.
func TestSavedJobPersistsDurably(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	user := registerAndLogin(t, base)
	companyID := seedCompany(ctx, t, pool, "CI Batch2 Saved")
	jobID := seedJob(ctx, t, pool, companyID, "CI Batch2 Saved Role")

	resp := do(t, http.MethodPost, base+"/api/v1/jobs/"+jobID.String()+"/save", user.token, map[string]any{"notes": "ci batch2"})
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		t.Fatalf("save job: got %d", resp.StatusCode)
	}

	var stored int
	if err := pool.QueryRow(ctx,
		"SELECT count(*) FROM saved_jobs WHERE candidate_id = $1 AND job_id = $2",
		uuid.MustParse(user.id), jobID).Scan(&stored); err != nil {
		t.Fatal(err)
	}
	if stored != 1 {
		t.Fatalf("saved job did not reach PostgreSQL: found %d rows", stored)
	}

	listResp := do(t, http.MethodGet, base+"/api/v1/jobs/saved", user.token, nil)
	defer listResp.Body.Close()
	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("saved list: got %d want 200", listResp.StatusCode)
	}
	var rows []struct {
		ID    string `json:"id"`
		JobID string `json:"job_id"`
	}
	if err := json.NewDecoder(listResp.Body).Decode(&rows); err != nil {
		t.Fatal(err)
	}
	var found bool
	for _, r := range rows {
		if r.JobID == jobID.String() {
			found = true
			// The frontend un-saves and navigates by job_id. If the two
			// collapsed, the mapping that keeps them apart would be untestable.
			if r.ID == r.JobID {
				t.Fatal("bookmark id equals job id; the two identifiers must stay distinct")
			}
		}
	}
	if !found {
		t.Fatal("saved job absent from the list endpoint")
	}
}

// TestJobApplyAliasAcceptsPathIdentifier covers F17: the aliased route names the
// job in the URL, so a body without job_id is legitimate there.
func TestJobApplyAliasAcceptsPathIdentifier(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	user := registerAndLogin(t, base)
	companyID := seedCompany(ctx, t, pool, "CI Batch2 Apply")
	jobID := seedJob(ctx, t, pool, companyID, "CI Batch2 Apply Role")

	resp := do(t, http.MethodPost, base+"/api/v1/jobs/"+jobID.String()+"/apply", user.token,
		map[string]any{"cover_letter": "CI batch2 cover letter"})
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusBadRequest {
		t.Fatal("apply alias rejected a body without job_id, which the path already names: got 400")
	}

	conflict := do(t, http.MethodPost, base+"/api/v1/jobs/"+jobID.String()+"/apply", user.token,
		map[string]any{"job_id": uuid.NewString()})
	defer conflict.Body.Close()
	if conflict.StatusCode != http.StatusBadRequest {
		t.Fatalf("conflicting job_id: got %d want 400", conflict.StatusCode)
	}
}

// TestPasswordResetRollsBackWhenRevocationFails proves the transaction, not just
// the error handling.
//
// UpdatePasswordAndRevokeSessions exists because the password change and the
// session revocation must not land separately. The service-level test in
// internal/auth/service covers the caller refusing to report success; this
// covers the half that only a real database can show — that when the second
// statement fails, the first is rolled back and the old password still works.
//
// The failure is injected with a trigger on sessions that raises, which is
// deterministic: the first UPDATE succeeds, the second raises, and the
// transaction must undo both. A cancelled context would not do, because it could
// abort before the first statement and prove nothing.
func TestPasswordResetRollsBackWhenRevocationFails(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	// Registering and signing in leaves a real session row, which the revoking
	// UPDATE has to touch for the trigger to fire at all.
	user := registerAndLogin(t, base)
	userID := uuid.MustParse(user.id)

	var sessions int
	if err := pool.QueryRow(ctx, "SELECT count(*) FROM sessions WHERE user_id = $1", userID).Scan(&sessions); err != nil {
		t.Fatalf("count sessions: %v", err)
	}
	if sessions == 0 {
		t.Fatal("no session row for the signed-in user; the revoking UPDATE would match nothing and this test would prove nothing")
	}

	var originalHash string
	if err := pool.QueryRow(ctx, "SELECT password_hash FROM users WHERE id = $1", userID).Scan(&originalHash); err != nil {
		t.Fatalf("read original hash: %v", err)
	}

	if _, err := pool.Exec(ctx, `
		CREATE OR REPLACE FUNCTION ci_b2_block_session_update() RETURNS trigger AS $fn$
		BEGIN
			RAISE EXCEPTION 'ci batch2: session revocation deliberately failed';
		END;
		$fn$ LANGUAGE plpgsql;`); err != nil {
		t.Fatalf("create trigger function: %v", err)
	}
	if _, err := pool.Exec(ctx, `
		CREATE TRIGGER ci_b2_block_session_update
		BEFORE UPDATE ON sessions
		FOR EACH ROW EXECUTE FUNCTION ci_b2_block_session_update();`); err != nil {
		t.Fatalf("create trigger: %v", err)
	}
	defer func() {
		// Dropped on its own context so a timed-out test still cleans up; leaving
		// this trigger behind would break every later session revocation.
		cleanup, cancelCleanup := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancelCleanup()
		if _, err := pool.Exec(cleanup, "DROP TRIGGER IF EXISTS ci_b2_block_session_update ON sessions"); err != nil {
			t.Errorf("drop trigger: %v", err)
		}
		if _, err := pool.Exec(cleanup, "DROP FUNCTION IF EXISTS ci_b2_block_session_update()"); err != nil {
			t.Errorf("drop trigger function: %v", err)
		}
	}()

	repo := authRepo.NewAuthRepository(pool)
	err = repo.UpdatePasswordAndRevokeSessions(ctx, userID, "hashed-should-never-be-committed")
	if err == nil {
		t.Fatal("UpdatePasswordAndRevokeSessions reported success while the session revocation was failing")
	}

	var hashAfter string
	if err := pool.QueryRow(ctx, "SELECT password_hash FROM users WHERE id = $1", userID).Scan(&hashAfter); err != nil {
		t.Fatalf("read hash after failure: %v", err)
	}
	if hashAfter != originalHash {
		t.Fatal("the password hash was committed even though the session revocation failed; the transaction did not roll back")
	}

	// The account must still be usable with the password it had.
	loginBody, marshalErr := json.Marshal(map[string]any{"email": user.email, "password": "Disposable-CI-password-123!"})
	if marshalErr != nil {
		t.Fatal(marshalErr)
	}
	resp, err := httpClient().Post(base+"/api/v1/auth/login", "application/json", bytes.NewReader(loginBody))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("the original password stopped working after a rolled-back reset: login got %d want 200", resp.StatusCode)
	}
}
