//go:build ciintegration

package ci

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

/*
The freelancer capability lifecycle, end to end, against a real database.

What made a user a freelancer before this: a row in freelancer_profiles.
POST /freelance/profile created that row from a payload with no required field,
so an empty JSON body was enough to acquire the Freelancer workspace, and there
was no state in which freelancing could be withheld or withdrawn. Stopping
somebody freelancing meant suspending their whole Kirmya account.

These tests hold the two halves of the fix:

  the capability is explicit   it is obtained by completing onboarding, never
                               as a side effect of asking for something
  the capability is separable  suspending it stops freelancing and nothing
                               else - the account, and every other capability
                               the account holds, keep working
*/

const (
	proposalRoute = "/api/v1/freelance/projects/00000000-0000-0000-0000-000000000001/proposals"
	freelancerKey = "freelancer"
)

func freelancerDraft() map[string]any {
	return map[string]any{
		"hourly_rate": 95,
		"tagline":     "Backend engineer",
		"skills":      []string{"Go", "PostgreSQL"},
	}
}

func proposalPayload() map[string]any {
	return map[string]any{"bid_amount": 900, "estimated_days": 4, "cover_letter": "CI proposal"}
}

// capabilityOf reads the stored lifecycle state directly, so a test can tell
// "no row" from "a row that is pending".
func capabilityOf(t *testing.T, pool *pgxpool.Pool, userID string) string {
	t.Helper()
	var status string
	err := pool.QueryRow(t.Context(),
		`SELECT capability_status FROM freelancer_profiles WHERE user_id = $1`, userID).Scan(&status)
	if err != nil {
		return "none"
	}
	return status
}

func profileCount(t *testing.T, pool *pgxpool.Pool, userID string) int {
	t.Helper()
	var count int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM freelancer_profiles WHERE user_id = $1`, userID).Scan(&count); err != nil {
		t.Fatalf("counting freelancer profiles: %v", err)
	}
	return count
}

// errorCode reads the machine-readable code from a refusal body.
func errorCode(t *testing.T, resp *http.Response) string {
	t.Helper()
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	var payload struct {
		Code string `json:"code"`
	}
	_ = json.Unmarshal([]byte(body), &payload)
	return payload.Code
}

// contractIDs lists the contract ids this caller can see.
func contractIDs(t *testing.T, base, token string) map[string]bool {
	t.Helper()
	resp := do(t, http.MethodGet, base+"/api/v1/freelance/contracts", token, nil)
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /freelance/contracts: %d %s", resp.StatusCode, body)
	}
	var payload struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("decoding contracts: %v (%s)", err, body)
	}
	ids := map[string]bool{}
	for _, contract := range payload.Data {
		ids[contract.ID] = true
	}
	return ids
}

func hasWorkspace(payload meWorkspaces, key string) bool {
	for _, workspace := range payload.Workspaces {
		if workspace.Key == key {
			return true
		}
	}
	return false
}

// The whole lifecycle in one account, without ever issuing a new identity.
//
// The same access token is used throughout, deliberately. Freelancer standing
// is resolved server-side on every /auth/me and every request to a
// freelancer-only route, so a capability change takes effect on the next
// request - no re-login, no new JWT, and nothing about freelancing in the token.
func TestFreelancerCapabilityLifecycle(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	admin := makePlatformAdmin(t, pool, registerAndLogin(t, base))
	user := registerAndLogin(t, base)

	// 1. A fresh professional account. No freelancer workspace, no profile.
	if hasWorkspace(getMe(t, base, user.token), freelancerKey) {
		t.Fatal("a fresh account was offered the Freelancer workspace")
	}
	if got := capabilityOf(t, pool, user.id); got != "none" {
		t.Fatalf("a fresh account has capability %q, want none", got)
	}

	// 2. The freelancer-only route is refused, and asking does not provision.
	resp := do(t, http.MethodPost, base+proposalRoute, user.token, proposalPayload())
	if resp.StatusCode != http.StatusForbidden {
		body, _ := readBody(resp)
		t.Fatalf("a professional submitting a proposal got %d, want 403: %s", resp.StatusCode, body)
	}
	if count := profileCount(t, pool, user.id); count != 0 {
		t.Fatalf("a refused request created %d freelancer profiles", count)
	}

	// 3. Saving a draft starts onboarding. It must not finish it.
	resp = do(t, http.MethodPost, base+"/api/v1/freelance/profile", user.token, freelancerDraft())
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("saving a freelancer draft got %d, want 200: %s", resp.StatusCode, body)
	}
	if got := capabilityOf(t, pool, user.id); got != "pending" {
		t.Fatalf("capability after saving a draft = %q, want pending", got)
	}
	if hasWorkspace(getMe(t, base, user.token), freelancerKey) {
		t.Fatal("a pending freelancer was offered the Freelancer workspace")
	}
	if resp := do(t, http.MethodPost, base+proposalRoute, user.token, proposalPayload()); resp.StatusCode != http.StatusForbidden {
		t.Fatalf("a pending freelancer submitted a proposal: %d", resp.StatusCode)
	}

	// 4. Completing onboarding grants it, and /auth/me says so on the next
	//    request with the same token.
	resp = do(t, http.MethodPost, base+"/api/v1/freelance/onboarding/complete", user.token, nil)
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("completing onboarding got %d, want 200: %s", resp.StatusCode, body)
	}
	if got := capabilityOf(t, pool, user.id); got != "active" {
		t.Fatalf("capability after completing onboarding = %q, want active", got)
	}
	if !hasWorkspace(getMe(t, base, user.token), freelancerKey) {
		t.Fatal("an active freelancer was not offered the Freelancer workspace")
	}
	if resp := do(t, http.MethodPost, base+proposalRoute, user.token, proposalPayload()); resp.StatusCode == http.StatusForbidden {
		body, _ := readBody(resp)
		t.Fatalf("an active freelancer was refused the freelancer-only route: %s", body)
	}

	// 5. Suspension. Freelancing stops; the account does not.
	suspend := do(t, http.MethodPost, base+"/api/v1/admin/freelancers/"+user.id+"/suspend", admin.token,
		map[string]any{"reason": "CI lifecycle test"})
	if suspend.StatusCode != http.StatusOK {
		body, _ := readBody(suspend)
		t.Fatalf("suspending got %d, want 200: %s", suspend.StatusCode, body)
	}

	me := getMe(t, base, user.token)
	if hasWorkspace(me, freelancerKey) {
		t.Error("a suspended freelancer kept the Freelancer workspace")
	}
	if !hasWorkspace(me, "professional") {
		t.Error("suspending freelancing removed the Professional workspace")
	}
	resp = do(t, http.MethodPost, base+proposalRoute, user.token, proposalPayload())
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("a suspended freelancer submitted a proposal: %d", resp.StatusCode)
	}
	if code := errorCode(t, resp); code != "FREELANCER_ACCESS_SUSPENDED" {
		t.Errorf("refusal code = %q, want FREELANCER_ACCESS_SUSPENDED", code)
	}

	// The professional account keeps working, on the same token.
	if resp := do(t, http.MethodGet, base+"/api/v1/notifications", user.token, nil); resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusUnauthorized {
		t.Errorf("a suspended freelancer lost ordinary professional access: %d", resp.StatusCode)
	}
	// And keeps read access to engagements they are already party to.
	if resp := do(t, http.MethodGet, base+"/api/v1/freelance/contracts", user.token, nil); resp.StatusCode != http.StatusOK {
		t.Errorf("a suspended freelancer could not read their contracts: %d", resp.StatusCode)
	}

	// 6. Nothing was destroyed: one profile, still there, still theirs.
	if count := profileCount(t, pool, user.id); count != 1 {
		t.Errorf("after suspension the account has %d freelancer profiles, want 1", count)
	}

	// 7. Reinstatement restores the workspace, without a second profile.
	reinstate := do(t, http.MethodPost, base+"/api/v1/admin/freelancers/"+user.id+"/reinstate", admin.token,
		map[string]any{"reason": "CI lifecycle test, undo"})
	if reinstate.StatusCode != http.StatusOK {
		body, _ := readBody(reinstate)
		t.Fatalf("reinstating got %d, want 200: %s", reinstate.StatusCode, body)
	}
	if !hasWorkspace(getMe(t, base, user.token), freelancerKey) {
		t.Error("reinstating did not restore the Freelancer workspace")
	}
	if count := profileCount(t, pool, user.id); count != 1 {
		t.Errorf("reinstating produced %d freelancer profiles, want 1", count)
	}
}

// An inactive Kirmya account cannot use an active freelancer capability. The
// account-standing rule is the outer gate and stays the outer gate.
func TestInactiveAccountCannotUseFreelancerCapability(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/profile", user.token, freelancerDraft()); resp.StatusCode != http.StatusOK {
		t.Fatalf("save draft: %d", resp.StatusCode)
	}
	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/onboarding/complete", user.token, nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("complete onboarding: %d", resp.StatusCode)
	}
	if got := capabilityOf(t, pool, user.id); got != "active" {
		t.Fatalf("precondition: capability is %q, want active", got)
	}

	setStatus(t, pool, user, "suspended")

	// The account may no longer authenticate, so it has no workspaces at all -
	// the Freelancer one included. Account standing is the outer gate and an
	// active capability underneath it changes nothing.
	resp := do(t, http.MethodGet, base+"/api/v1/auth/me", user.token, nil)
	if resp.StatusCode != http.StatusUnauthorized && resp.StatusCode != http.StatusForbidden {
		body, _ := readBody(resp)
		t.Errorf("a suspended account with active freelancer capability reached /auth/me: %d %s",
			resp.StatusCode, body)
	}

	// And it cannot obtain a new token, so the residual access-token window is
	// the whole of what it has left. Freelancer capability does not extend it.
	if status, _ := loginRaw(t, base, user.email); status == http.StatusOK {
		t.Error("a suspended account with active freelancer capability logged in")
	}

	// The capability itself is untouched by the account suspension: these are
	// independent lifecycles, and reinstating the account must not require
	// re-onboarding as a freelancer.
	if got := capabilityOf(t, pool, user.id); got != "active" {
		t.Errorf("suspending the account changed freelancer capability to %q; the two "+
			"lifecycles are meant to be independent", got)
	}
}

// Suspending freelancing must affect freelancing only. This account holds the
// Recruiting capability too; it keeps it.
func TestFreelancerSuspensionLeavesOtherCapabilities(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	admin := makePlatformAdmin(t, pool, registerAndLogin(t, base))
	user := registerAndLogin(t, base)

	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/profile", user.token, freelancerDraft()); resp.StatusCode != http.StatusOK {
		t.Fatalf("save draft: %d", resp.StatusCode)
	}
	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/onboarding/complete", user.token, nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("complete onboarding: %d", resp.StatusCode)
	}
	userUUID, err := uuid.Parse(user.id)
	if err != nil {
		t.Fatalf("parse user id: %v", err)
	}
	seedRecruiterCapability(t, pool, userUUID, "active")

	before := getMe(t, base, user.token)
	for _, key := range []string{"professional", freelancerKey, "recruiting"} {
		if !hasWorkspace(before, key) {
			t.Fatalf("precondition: %s missing from %v", key, meKeys(before))
		}
	}

	resp := do(t, http.MethodPost, base+"/api/v1/admin/freelancers/"+user.id+"/suspend", admin.token,
		map[string]any{"reason": "CI isolation test"})
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("suspend: %d %s", resp.StatusCode, body)
	}

	after := getMe(t, base, user.token)
	if hasWorkspace(after, freelancerKey) {
		t.Error("the Freelancer workspace survived its own suspension")
	}
	for _, key := range []string{"professional", "recruiting"} {
		if !hasWorkspace(after, key) {
			t.Errorf("suspending freelancing removed %s; workspaces are now %v", key, meKeys(after))
		}
	}
	// The Recruiting capability is usable, not merely listed.
	if resp := do(t, http.MethodGet, base+"/api/v1/recruiter/dashboard", user.token, nil); resp.StatusCode == http.StatusForbidden {
		t.Error("suspending freelancing disabled the Recruiting capability")
	}
}

// A platform administrator who is also a freelancer keeps their administrative
// authority when their freelancing is withdrawn.
func TestFreelancerSuspensionLeavesPlatformAdmin(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	actor := makePlatformAdmin(t, pool, registerAndLogin(t, base))
	admin := makePlatformAdmin(t, pool, registerAndLogin(t, base))

	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/profile", actor.token, freelancerDraft()); resp.StatusCode != http.StatusOK {
		t.Fatalf("save draft: %d", resp.StatusCode)
	}
	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/onboarding/complete", actor.token, nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("complete onboarding: %d", resp.StatusCode)
	}

	resp := do(t, http.MethodPost, base+"/api/v1/admin/freelancers/"+actor.id+"/suspend", admin.token,
		map[string]any{"reason": "CI admin isolation test"})
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("suspend: %d %s", resp.StatusCode, body)
	}

	if resp := do(t, http.MethodGet, base+"/api/v1/admin/dashboard", actor.token, nil); resp.StatusCode == http.StatusForbidden {
		t.Error("suspending freelancing removed platform administration")
	}
	if hasWorkspace(getMe(t, base, actor.token), freelancerKey) {
		t.Error("the Freelancer workspace survived its own suspension")
	}
}

// A remembered Freelancer workspace must not land a suspended freelancer there.
// The preference is validated at serve time against the resolved list, so a
// capability withdrawn after the choice cannot send anybody anywhere.
func TestRememberedFreelancerWorkspaceFallsBackAfterSuspension(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	admin := makePlatformAdmin(t, pool, registerAndLogin(t, base))
	user := registerAndLogin(t, base)

	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/profile", user.token, freelancerDraft()); resp.StatusCode != http.StatusOK {
		t.Fatalf("save draft: %d", resp.StatusCode)
	}
	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/onboarding/complete", user.token, nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("complete onboarding: %d", resp.StatusCode)
	}

	// Choose the Freelancer workspace, and confirm it is remembered.
	resp := do(t, http.MethodPut, base+"/api/v1/workspace/preference", user.token, map[string]any{"key": freelancerKey})
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := readBody(resp)
		t.Fatalf("recording the workspace choice: %d %s", resp.StatusCode, body)
	}
	if got := getMe(t, base, user.token).LastWorkspaceKey; got != freelancerKey {
		t.Fatalf("precondition: lastWorkspaceKey = %q, want %q", got, freelancerKey)
	}

	resp = do(t, http.MethodPost, base+"/api/v1/admin/freelancers/"+user.id+"/suspend", admin.token,
		map[string]any{"reason": "CI remembered-workspace test"})
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("suspend: %d %s", resp.StatusCode, body)
	}

	me := getMe(t, base, user.token)
	if me.LastWorkspaceKey == freelancerKey {
		t.Errorf("lastWorkspaceKey still points at a revoked workspace: %q", me.LastWorkspaceKey)
	}
	if me.LastWorkspaceKey != "" && !hasWorkspace(me, me.LastWorkspaceKey) {
		t.Errorf("lastWorkspaceKey %q is not one of the workspaces served: %v",
			me.LastWorkspaceKey, meKeys(me))
	}
	if !hasWorkspace(me, "professional") {
		t.Error("the account has nowhere safe to land")
	}
}

// A global role of "freelancer" is not the capability. The multi-workspace
// model means role_id says nothing about which capabilities an account holds.
func TestGlobalFreelancerRoleGrantsNothing(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	// users.role_id is the global role the JWT carries. Setting it to
	// "freelancer" is the legacy way somebody might expect to become one.
	if _, err := pool.Exec(t.Context(),
		`UPDATE users SET role_id = 'freelancer' WHERE id = $1`, user.id); err != nil {
		t.Fatalf("setting the global role: %v", err)
	}

	// Re-login so the token actually carries the role, or the test would only
	// prove that a stale token does nothing.
	token := loginToken(t, base, user.email)

	if hasWorkspace(getMe(t, base, token), freelancerKey) {
		t.Error("a global freelancer role granted the Freelancer workspace")
	}
	if resp := do(t, http.MethodPost, base+proposalRoute, token, proposalPayload()); resp.StatusCode != http.StatusForbidden {
		t.Errorf("a global freelancer role reached the freelancer-only route: %d", resp.StatusCode)
	}
	if got := capabilityOf(t, pool, user.id); got != "none" {
		t.Errorf("a global role created capability %q, want none", got)
	}
}

// A client claiming to be in the Freelancer workspace gets nothing for it. The
// active workspace is a navigation concept derived from the URL; it is never an
// authorization input.
func TestForgedWorkspaceContextGrantsNothing(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	for _, header := range []map[string]string{
		{"X-Workspace": freelancerKey},
		{"X-Workspace-Key": freelancerKey},
		{"X-Active-Workspace": freelancerKey},
	} {
		req := newRequest(t, http.MethodPost, base+proposalRoute, user.token, proposalPayload())
		for name, value := range header {
			req.Header.Set(name, value)
		}
		resp, err := httpClient().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		func() {
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusForbidden {
				t.Errorf("a forged workspace header %v produced %d, want 403", header, resp.StatusCode)
			}
		}()
	}
}

// Freelancer A cannot read Freelancer B's contracts. The capability gate is not
// a substitute for resource-level authorization, and both are in force.
func TestFreelancersAreIsolatedFromEachOther(t *testing.T) {
	base := required(t, "TEST_API_URL")
	alice := registerAndLogin(t, base)
	bob := registerAndLogin(t, base)

	for _, who := range []ciUser{alice, bob} {
		if resp := do(t, http.MethodPost, base+"/api/v1/freelance/profile", who.token, freelancerDraft()); resp.StatusCode != http.StatusOK {
			t.Fatalf("save draft: %d", resp.StatusCode)
		}
		if resp := do(t, http.MethodPost, base+"/api/v1/freelance/onboarding/complete", who.token, nil); resp.StatusCode != http.StatusOK {
			t.Fatalf("complete onboarding: %d", resp.StatusCode)
		}
	}

	// Bob posts a project and hires himself nothing; what matters is that the
	// contract list each of them sees is their own.
	aliceContracts := contractIDs(t, base, alice.token)
	bobContracts := contractIDs(t, base, bob.token)
	for id := range aliceContracts {
		if bobContracts[id] {
			t.Errorf("contract %s appears in both freelancers' lists", id)
		}
	}

	// And Alice cannot read Bob's freelancer profile through the self endpoint.
	resp := do(t, http.MethodGet, base+"/api/v1/freelance/profile", alice.token, nil)
	body, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /freelance/profile: %d %s", resp.StatusCode, body)
	}
	if strings.Contains(body, bob.id) {
		t.Errorf("Alice's own profile response carries Bob's user id: %s", body)
	}
}

// loginToken signs in and returns a fresh access token.
func loginToken(t *testing.T, base, email string) string {
	t.Helper()
	body, err := json.Marshal(map[string]any{"email": email, "password": ciPassword})
	if err != nil {
		t.Fatal(err)
	}
	resp, err := httpClient().Post(base+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login: got %d want 200", resp.StatusCode)
	}
	var login struct {
		AccessToken string `json:"accessToken"`
		Token       string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&login); err != nil {
		t.Fatalf("decoding login: %v", err)
	}
	if login.AccessToken != "" {
		return login.AccessToken
	}
	return login.Token
}

func newRequest(t *testing.T, method, url, token string, body any) *http.Request {
	t.Helper()
	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest(method, url, bytes.NewReader(raw))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	return req
}

// onboardFreelancer takes an account through the deliberate path to an active
// Freelancer capability: save a complete draft, then complete onboarding.
//
// Exported to the package so other integration suites can set up a freelancer
// without reaching into the database and writing a capability_status by hand -
// a fixture that bypasses the transition would stop testing the transition.
func onboardFreelancer(t *testing.T, base string, user ciUser) {
	t.Helper()
	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/profile", user.token, freelancerDraft()); resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("saving the freelancer draft: got %d want 200: %s", resp.StatusCode, body)
	}
	if resp := do(t, http.MethodPost, base+"/api/v1/freelance/onboarding/complete", user.token, nil); resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("completing freelancer onboarding: got %d want 200: %s", resp.StatusCode, body)
	}
}
