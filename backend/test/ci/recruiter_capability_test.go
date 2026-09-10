//go:build ciintegration

package ci

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// The P0 that closed here: /recruiter/* was gated on authentication alone, and
// the handlers behind it called GetOrCreateProfile. So the first request from
// any authenticated account created an organizations row, a
// recruiter_organization_profiles row with verification_status "Verified", and
// a recruiter_profiles row with verified = true - none of which anything had
// verified - and that account could then publish a live public job posting.
//
// Reproduced before the fix: GET /recruiter/dashboard answered 200 for an
// account with role_id "user", wrote three rows, and POST /recruiter/jobs
// followed by /publish put a posting on the board with status 'active'.
//
// These tests fail against that code on every one of their assertions.

// privilegedRecruiterRoutes is deliberately the whole privileged surface rather
// than one endpoint: the original defect was that the guard did not exist, so a
// test proving one route is protected proves very little.
var privilegedRecruiterRoutes = []struct {
	method string
	path   string
}{
	{http.MethodGet, "/api/v1/recruiter/dashboard"},
	{http.MethodGet, "/api/v1/recruiter/jobs"},
	{http.MethodGet, "/api/v1/recruiter/candidates"},
	{http.MethodGet, "/api/v1/recruiter/applications"},
	{http.MethodGet, "/api/v1/recruiter/analytics"},
	{http.MethodGet, "/api/v1/recruiter/interviews"},
	{http.MethodGet, "/api/v1/recruiter/team"},
	{http.MethodGet, "/api/v1/recruiter/candidates/search"},
	{http.MethodPost, "/api/v1/recruiter/jobs"},

	// The second provisioning path, and the reason this table is not scoped to
	// /recruiter/*. The candidate-search module lives under /search/* and
	// resolved the caller's recruiter profile through the same
	// GetOrCreateProfile call, so it handed out a recruiter identity - and the
	// member directory with it - to any signed-in account, with the recruiter
	// module's own guard nowhere near it.
	{http.MethodPost, "/api/v1/search/candidates"},
	{http.MethodGet, "/api/v1/search/history"},
	{http.MethodPost, "/api/v1/search/saved"},
	{http.MethodGet, "/api/v1/search/saved"},
	{http.MethodPost, "/api/v1/search/notes"},
	{http.MethodPost, "/api/v1/search/contact"},
}

// Test 1 and 2: an ordinary account is refused across the whole module, not at
// one endpoint.
func TestRecruiterCapabilityRequiredOnEveryPrivilegedRoute(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	for _, route := range privilegedRecruiterRoutes {
		resp := do(t, route.method, base+route.path, user.token, map[string]any{
			"title": "must not be created", "description": "x", "status": "Active",
		})
		body, _ := readBody(resp)
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("%s %s: got %d want 403 for an account with no recruiter capability: %s",
				route.method, route.path, resp.StatusCode, body)
			continue
		}
		if !strings.Contains(body, "RECRUITER_ONBOARDING_REQUIRED") {
			t.Errorf("%s %s: refusal carried no machine-readable code: %s",
				route.method, route.path, body)
		}
	}
}

// Test 8 and 15: the defect was half authorization and half unintended writes.
// Refusing without writing is the part that a status-code assertion misses.
func TestRefusedRecruiterCallsWriteNothing(t *testing.T) {
	base := required(t, "TEST_API_URL")
	db := connectDB(t)
	user := registerAndLogin(t, base)

	before := recruiterRowCounts(t, db)

	// Repeatedly, because the original provisioned on first touch and a single
	// call would not show whether the guard holds.
	for i := 0; i < 3; i++ {
		for _, route := range privilegedRecruiterRoutes {
			resp := do(t, route.method, base+route.path, user.token, map[string]any{
				"title": "must not be created", "description": "x", "status": "Active",
			})
			_, _ = readBody(resp)
		}
	}

	after := recruiterRowCounts(t, db)
	for table, beforeCount := range before {
		if after[table] != beforeCount {
			t.Errorf("%s grew from %d to %d: a refused request created recruiter records",
				table, beforeCount, after[table])
		}
	}

	// And specifically nothing for this account.
	var mine int
	if err := db.QueryRow(t.Context(),
		`SELECT count(*) FROM recruiter_profiles WHERE user_id = $1`, user.id).Scan(&mine); err != nil {
		t.Fatal(err)
	}
	if mine != 0 {
		t.Errorf("a refused caller has %d recruiter_profiles rows, want 0", mine)
	}
}

// Tests 3, 4, 5, 6: the lifecycle, end to end.
func TestRecruiterCapabilityLifecycle(t *testing.T) {
	base := required(t, "TEST_API_URL")
	db := connectDB(t)
	user := registerAndLogin(t, base)

	// 4. Onboarding incomplete - denied.
	resp := do(t, http.MethodGet, base+"/api/v1/recruiter/dashboard", user.token, nil)
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("before onboarding: got %d want 403: %s", resp.StatusCode, body)
	}

	// The state read stays reachable without the capability, so the client can
	// decide whether to offer onboarding.
	resp = do(t, http.MethodGet, base+"/api/v1/recruiter/profile", user.token, nil)
	body, _ = readBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("profile state read: got %d want 200: %s", resp.StatusCode, body)
	}
	var state struct {
		CapabilityStatus   string `json:"capabilityStatus"`
		OnboardingRequired bool   `json:"onboardingRequired"`
	}
	if err := json.Unmarshal([]byte(body), &state); err != nil {
		t.Fatal(err)
	}
	if !state.OnboardingRequired {
		t.Errorf("an account with no recruiter profile was told onboarding is not required: %s", body)
	}

	// 17. Reading the profile must not provision one - that read was the
	// original entry point into the whole defect.
	var provisioned int
	if err := db.QueryRow(t.Context(),
		`SELECT count(*) FROM recruiter_profiles WHERE user_id = $1`, user.id).Scan(&provisioned); err != nil {
		t.Fatal(err)
	}
	if provisioned != 0 {
		t.Errorf("GET /recruiter/profile created %d recruiter profile rows", provisioned)
	}

	// 3 and 6. Explicit onboarding, then allowed.
	onboard := do(t, http.MethodPost, base+"/api/v1/recruiter/onboarding", user.token, map[string]any{
		"companyName": "Journey Recruiting Co", "jobTitle": "Talent Partner",
		"recruiterRole": "Recruiter", "department": "Talent Acquisition",
		"contactEmail": user.email,
	})
	onboardBody, _ := readBody(onboard)
	if onboard.StatusCode != http.StatusOK {
		t.Fatalf("onboarding: got %d want 200: %s", onboard.StatusCode, onboardBody)
	}

	resp = do(t, http.MethodGet, base+"/api/v1/recruiter/dashboard", user.token, nil)
	body, _ = readBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("after onboarding: got %d want 200: %s", resp.StatusCode, body)
	}

	// 17. Onboarding completes the capability; it does not assert verification.
	var capability, verification string
	var verified bool
	if err := db.QueryRow(t.Context(), `
		SELECT rp.capability_status, rp.verified, rop.verification_status
		FROM recruiter_profiles rp
		JOIN recruiter_organization_profiles rop ON rop.user_id = rp.user_id
		WHERE rp.user_id = $1`, user.id).Scan(&capability, &verified, &verification); err != nil {
		t.Fatal(err)
	}
	if capability != "active" {
		t.Errorf("capability_status after onboarding = %q, want active", capability)
	}
	if verified {
		t.Error("recruiter_profiles.verified is true after onboarding; nothing verified this profile")
	}
	if strings.EqualFold(verification, "Verified") {
		t.Errorf("verification_status = %q after onboarding; onboarding is not verification", verification)
	}

	// 5. Suspension denies immediately, with its own code.
	if _, err := db.Exec(t.Context(),
		`UPDATE recruiter_profiles SET capability_status = 'suspended' WHERE user_id = $1`, user.id); err != nil {
		t.Fatal(err)
	}
	resp = do(t, http.MethodGet, base+"/api/v1/recruiter/dashboard", user.token, nil)
	body, _ = readBody(resp)
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("suspended recruiter: got %d want 403: %s", resp.StatusCode, body)
	}
	if !strings.Contains(body, "RECRUITER_ACCESS_DISABLED") {
		t.Errorf("suspended recruiter refusal is indistinguishable from needing onboarding: %s", body)
	}

	// 6, continued. Onboarding is the one route that grants the capability, so
	// it is the one a suspended account would try to walk back in through. It
	// must refuse with the disabled code - not 500, which reads as "retry" - and
	// it must refuse before writing, so the attempt cannot even rewrite the
	// organization profile on its way to being turned away.
	var orgBefore string
	_ = db.QueryRow(t.Context(),
		`SELECT company_name FROM recruiter_organization_profiles WHERE user_id = $1`, user.id).Scan(&orgBefore)

	retry := do(t, http.MethodPost, base+"/api/v1/recruiter/onboarding", user.token, map[string]any{
		"companyName": "Readmission Attempt Co", "jobTitle": "Talent Partner",
		"recruiterRole": "Recruiter", "department": "Talent Acquisition",
		"contactEmail": user.email,
	})
	retryBody, _ := readBody(retry)
	if retry.StatusCode != http.StatusForbidden {
		t.Errorf("re-onboarding a suspended account: got %d want 403: %s", retry.StatusCode, retryBody)
	}
	if !strings.Contains(retryBody, "RECRUITER_ACCESS_DISABLED") {
		t.Errorf("re-onboarding a suspended account did not say the capability is disabled: %s", retryBody)
	}

	if err := db.QueryRow(t.Context(),
		`SELECT capability_status FROM recruiter_profiles WHERE user_id = $1`, user.id).Scan(&capability); err != nil {
		t.Fatal(err)
	}
	if capability != "suspended" {
		t.Errorf("capability_status = %q after a suspended account re-onboarded; onboarding lifted a suspension", capability)
	}

	var orgAfter string
	_ = db.QueryRow(t.Context(),
		`SELECT company_name FROM recruiter_organization_profiles WHERE user_id = $1`, user.id).Scan(&orgAfter)
	if orgAfter != orgBefore {
		t.Errorf("organization profile company_name changed from %q to %q: a refused onboarding still wrote", orgBefore, orgAfter)
	}
}

// Test 16: the escalation the P0 actually enabled. An ordinary account could
// create a job and publish it to the public board.
func TestOrdinaryUserCannotPublishAJob(t *testing.T) {
	base := required(t, "TEST_API_URL")
	db := connectDB(t)
	user := registerAndLogin(t, base)

	var before int
	if err := db.QueryRow(t.Context(), `SELECT count(*) FROM jobs`).Scan(&before); err != nil {
		t.Fatal(err)
	}

	create := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs", user.token, map[string]any{
		"title": "Posting by an account that never onboarded", "description": "x",
		"status": "Active", "workplaceType": "Remote", "employmentType": "Full-time",
	})
	createBody, _ := readBody(create)
	if create.StatusCode != http.StatusForbidden {
		t.Fatalf("job creation by a non-recruiter: got %d want 403: %s", create.StatusCode, createBody)
	}

	var after int
	if err := db.QueryRow(t.Context(), `SELECT count(*) FROM jobs`).Scan(&after); err != nil {
		t.Fatal(err)
	}
	if after != before {
		t.Errorf("jobs grew from %d to %d: a refused caller created a posting", before, after)
	}

	// Publishing an arbitrary job is refused at the capability layer before
	// ownership is even reached.
	pub := do(t, http.MethodPost,
		fmt.Sprintf("%s/api/v1/recruiter/jobs/%s/publish", base, uuid.New()), user.token, nil)
	pubBody, _ := readBody(pub)
	if pub.StatusCode != http.StatusForbidden {
		t.Errorf("publish by a non-recruiter: got %d want 403: %s", pub.StatusCode, pubBody)
	}
}

// Tests 9 and 10: neither a forged client claim nor a legacy global role grants
// the capability. The workspace architecture turns on this: role_id and
// client-supplied context are not authority.
func TestForgedClaimsAndLegacyRoleGrantNothing(t *testing.T) {
	base := required(t, "TEST_API_URL")
	db := connectDB(t)
	user := registerAndLogin(t, base)

	// 10. Legacy users.role_id = 'recruiter', which the application never writes
	// but imported data might carry.
	if _, err := db.Exec(t.Context(),
		`UPDATE users SET role_id = 'recruiter' WHERE id = $1`, user.id); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = db.Exec(t.Context(), `UPDATE users SET role_id = 'user' WHERE id = $1`, user.id)
	})

	// A fresh token, so the JWT itself carries role "recruiter".
	refreshed := loginAgain(t, base, user.email)

	resp := do(t, http.MethodGet, base+"/api/v1/recruiter/dashboard", refreshed, nil)
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("legacy role_id 'recruiter' granted recruiter access: got %d want 403: %s",
			resp.StatusCode, body)
	}

	// 9. Client-supplied role and workspace context are not authority.
	req := doWithHeaders(t, http.MethodGet, base+"/api/v1/recruiter/dashboard", refreshed,
		map[string]string{
			"X-Workspace":        "recruiting",
			"X-Active-Workspace": "recruiting",
			"X-User-Role":        "recruiter",
		})
	forgedBody, _ := readBody(req)
	if req.StatusCode != http.StatusForbidden {
		t.Errorf("client-supplied workspace/role headers granted access: got %d want 403: %s",
			req.StatusCode, forgedBody)
	}
}

// --- helpers -------------------------------------------------------------

// connectDB opens the CI pool the other specs already use.
func connectDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	pool, err := pgxpool.New(t.Context(), required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatalf("connecting to PostgreSQL: %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

// loginAgain issues a fresh token, so a role change lands in the JWT claim
// rather than only in the database.
func loginAgain(t *testing.T, base, email string) string {
	t.Helper()
	resp := do(t, http.MethodPost, base+"/api/v1/auth/login", "", map[string]any{
		"email": email, "password": ciPassword,
	})
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("re-login: got %d want 200: %s", resp.StatusCode, body)
	}
	var out struct {
		AccessToken string `json:"accessToken"`
	}
	if err := json.Unmarshal([]byte(body), &out); err != nil {
		t.Fatal(err)
	}
	return out.AccessToken
}

// doWithHeaders sends extra client-supplied headers, to prove they are not
// authority.
func doWithHeaders(t *testing.T, method, url, token string, headers map[string]string) *http.Response {
	t.Helper()
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		t.Fatal(err)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := httpClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

func recruiterRowCounts(t *testing.T, db *pgxpool.Pool) map[string]int {
	t.Helper()
	counts := map[string]int{}
	for _, table := range []string{"organizations", "recruiter_organization_profiles", "recruiter_profiles"} {
		var n int
		if err := db.QueryRow(t.Context(), "SELECT count(*) FROM "+table).Scan(&n); err != nil {
			t.Fatalf("counting %s: %v", table, err)
		}
		counts[table] = n
	}
	return counts
}

// becomeRecruiter completes recruiter onboarding for an account and returns it
// unchanged, so it can be chained onto registerAndLogin.
//
// It exists because every recruiter test in this package used to skip this
// step: registering an account was enough to act as a recruiter, since the
// first privileged call provisioned the profile. That was the defect. Tests
// that need a recruiter now have to say so, which is the point - the setup line
// is the thing that used to be missing in production too.
func becomeRecruiter(t *testing.T, base string, user ciUser) ciUser {
	t.Helper()
	resp := do(t, http.MethodPost, base+"/api/v1/recruiter/onboarding", user.token, map[string]any{
		"companyName":   "CI Recruiting Co",
		"jobTitle":      "Talent Partner",
		"recruiterRole": "Recruiter",
		"department":    "Talent Acquisition",
		"contactEmail":  user.email,
	})
	body, _ := readBody(resp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("recruiter onboarding for %s: got %d want 200: %s", user.email, resp.StatusCode, body)
	}
	return user
}
