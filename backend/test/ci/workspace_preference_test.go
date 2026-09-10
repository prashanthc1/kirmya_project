//go:build ciintegration

package ci

import (
	"net/http"
	"testing"

	"github.com/google/uuid"
)

/*
Remembering a workspace, end to end.

The unit tests prove the rules given answers. These prove the wiring: that the
key survives a round trip through Postgres and the real endpoint, that the two
validations are actually applied by the running server rather than only by the
service, and that one account cannot reach another's preference.

The property that matters most is the one no unit test can show: a workspace
revoked *after* it was chosen must stop being served. That needs a real write,
a real revocation, and a real bootstrap in between.
*/

// selectWorkspace performs the switcher's write.
func selectWorkspace(t *testing.T, base, token, key string) *http.Response {
	t.Helper()
	return do(t, http.MethodPut, base+"/api/v1/workspace/preference", token,
		map[string]string{"key": key})
}

// A chosen workspace comes back on the next bootstrap.
func TestWorkspacePreferenceSurvivesARoundTrip(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)
	becomeRecruiter(t, base, user)

	if before := getMe(t, base, user.token); before.LastWorkspaceKey != "" {
		t.Errorf("lastWorkspaceKey = %q before choosing anything, want empty", before.LastWorkspaceKey)
	}

	resp := selectWorkspace(t, base, user.token, "recruiting")
	if resp.StatusCode != http.StatusNoContent {
		body, _ := readBody(resp)
		t.Fatalf("PUT /workspace/preference: got %d want 204: %s", resp.StatusCode, body)
	}

	after := getMe(t, base, user.token)
	if after.LastWorkspaceKey != "recruiting" {
		t.Errorf("lastWorkspaceKey = %q, want recruiting", after.LastWorkspaceKey)
	}

	// Whatever is served must be usable: the client turns the key into a route
	// by finding it in the list served beside it.
	var found bool
	for _, workspace := range after.Workspaces {
		if workspace.Key == after.LastWorkspaceKey {
			found = true
			if workspace.Route != "/recruiter" {
				t.Errorf("remembered workspace route = %q, want /recruiter", workspace.Route)
			}
		}
	}
	if !found {
		t.Error("the remembered key names no workspace in the list served with it")
	}
}

// Choosing again replaces the choice rather than accumulating rows.
func TestWorkspacePreferenceIsReplacedNotAccumulated(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)
	becomeRecruiter(t, base, user)

	for i := 0; i < 3; i++ {
		if resp := selectWorkspace(t, base, user.token, "recruiting"); resp.StatusCode != http.StatusNoContent {
			t.Fatalf("PUT #%d: got %d want 204", i, resp.StatusCode)
		}
		if resp := selectWorkspace(t, base, user.token, "professional"); resp.StatusCode != http.StatusNoContent {
			t.Fatalf("PUT #%d: got %d want 204", i, resp.StatusCode)
		}
	}

	var rows int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM workspace_preferences WHERE user_id = $1`, user.id).Scan(&rows); err != nil {
		t.Fatalf("counting preferences: %v", err)
	}
	if rows != 1 {
		t.Errorf("workspace_preferences has %d rows for one account, want exactly 1", rows)
	}

	if got := getMe(t, base, user.token).LastWorkspaceKey; got != "professional" {
		t.Errorf("lastWorkspaceKey = %q, want the most recent choice", got)
	}
}

// The refusal on the way in: a workspace this account does not hold.
func TestWorkspacePreferenceRefusesAWorkspaceNotHeld(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	// Never onboarded, so recruiting is not this account's; platform_admin
	// never is; and the company names a uuid this account has no part in.
	for _, key := range []string{
		"recruiting",
		"platform_admin",
		"company:" + uuid.NewString(),
		"community_admin:" + uuid.NewString(),
		"not-a-workspace",
	} {
		resp := selectWorkspace(t, base, user.token, key)
		if resp.StatusCode != http.StatusForbidden {
			body, _ := readBody(resp)
			t.Errorf("PUT %q: got %d want 403: %s", key, resp.StatusCode, body)
		}
	}

	var rows int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM workspace_preferences WHERE user_id = $1`, user.id).Scan(&rows); err != nil {
		t.Fatalf("counting preferences: %v", err)
	}
	if rows != 0 {
		t.Errorf("a refused selection wrote %d rows", rows)
	}
	if got := getMe(t, base, user.token).LastWorkspaceKey; got != "" {
		t.Errorf("lastWorkspaceKey = %q after only refused selections, want empty", got)
	}
}

// The refusal on the way out, and the reason the second check exists: the
// workspace was genuinely held when it was chosen, and is not held now.
func TestWorkspacePreferenceStopsBeingServedWhenTheWorkspaceIsRevoked(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)
	becomeRecruiter(t, base, user)

	if resp := selectWorkspace(t, base, user.token, "recruiting"); resp.StatusCode != http.StatusNoContent {
		t.Fatalf("PUT /workspace/preference: got %d want 204", resp.StatusCode)
	}
	if got := getMe(t, base, user.token).LastWorkspaceKey; got != "recruiting" {
		t.Fatalf("precondition: lastWorkspaceKey = %q, want recruiting", got)
	}

	// An administrator withdraws the capability. The stored row is untouched -
	// nothing goes back to rewrite preferences - so the only thing standing
	// between this account and a workspace it no longer holds is the check
	// applied when the key is served.
	if _, err := pool.Exec(t.Context(),
		`UPDATE recruiter_profiles SET capability_status = 'suspended' WHERE user_id = $1`,
		user.id); err != nil {
		t.Fatalf("suspending the recruiter capability: %v", err)
	}

	after := getMe(t, base, user.token)
	if after.LastWorkspaceKey != "" {
		t.Errorf("lastWorkspaceKey = %q after revocation, want empty", after.LastWorkspaceKey)
	}
	for _, workspace := range after.Workspaces {
		if workspace.Key == "recruiting" {
			t.Error("the revoked workspace is still in the list")
		}
	}

	// The row is still there, which is the point: the serving check is what
	// protects the account, not a cleanup nobody guarantees ran.
	var stored string
	if err := pool.QueryRow(t.Context(),
		`SELECT last_workspace_key FROM workspace_preferences WHERE user_id = $1`,
		user.id).Scan(&stored); err != nil {
		t.Fatalf("reading the stored preference: %v", err)
	}
	if stored != "recruiting" {
		t.Errorf("stored key = %q, want the untouched original", stored)
	}
}

// One account cannot write, read, or influence another's preference.
func TestWorkspacePreferenceIsPerAccount(t *testing.T) {
	base := required(t, "TEST_API_URL")
	first := registerAndLogin(t, base)
	second := registerAndLogin(t, base)
	becomeRecruiter(t, base, first)

	if resp := selectWorkspace(t, base, first.token, "recruiting"); resp.StatusCode != http.StatusNoContent {
		t.Fatalf("PUT for the first account: got %d want 204", resp.StatusCode)
	}

	if got := getMe(t, base, second.token).LastWorkspaceKey; got != "" {
		t.Errorf("the second account's lastWorkspaceKey = %q, want empty", got)
	}
	if got := getMe(t, base, first.token).LastWorkspaceKey; got != "recruiting" {
		t.Errorf("the first account's lastWorkspaceKey = %q, want recruiting", got)
	}
}

// Selecting a workspace is not a way to enter one. The route still refuses.
func TestWorkspacePreferenceIsNotAnAuthorizationInput(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)
	becomeRecruiter(t, base, user)

	if resp := selectWorkspace(t, base, user.token, "recruiting"); resp.StatusCode != http.StatusNoContent {
		t.Fatalf("PUT: got %d want 204", resp.StatusCode)
	}

	// Choosing recruiting does not make this account a platform administrator,
	// and the admin routes do not consult the preference at all.
	resp := do(t, http.MethodGet, base+"/api/v1/admin/users", user.token, nil)
	if resp.StatusCode != http.StatusForbidden && resp.StatusCode != http.StatusUnauthorized {
		body, _ := readBody(resp)
		t.Errorf("GET /admin/users with a recruiting preference: got %d, want a refusal: %s",
			resp.StatusCode, body)
	}
}

// The endpoint is authenticated. An anonymous caller writes nothing.
func TestWorkspacePreferenceRequiresAuthentication(t *testing.T) {
	base := required(t, "TEST_API_URL")

	resp := do(t, http.MethodPut, base+"/api/v1/workspace/preference", "",
		map[string]string{"key": "professional"})
	if resp.StatusCode != http.StatusUnauthorized {
		body, _ := readBody(resp)
		t.Errorf("anonymous PUT: got %d want 401: %s", resp.StatusCode, body)
	}
}

// Reading the bootstrap never writes a preference.
func TestWorkspacePreferenceReadCreatesNoRows(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	var before int
	if err := pool.QueryRow(t.Context(), `SELECT count(*) FROM workspace_preferences`).Scan(&before); err != nil {
		t.Fatalf("counting preferences: %v", err)
	}

	for i := 0; i < 5; i++ {
		getMe(t, base, user.token)
	}

	var after int
	if err := pool.QueryRow(t.Context(), `SELECT count(*) FROM workspace_preferences`).Scan(&after); err != nil {
		t.Fatalf("counting preferences: %v", err)
	}
	if after != before {
		t.Errorf("workspace_preferences grew from %d to %d: bootstrapping wrote a preference",
			before, after)
	}
}
