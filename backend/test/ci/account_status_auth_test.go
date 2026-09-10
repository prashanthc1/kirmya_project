//go:build ciintegration

package ci

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

/*
Account standing, across every authentication path.

The defect these cover: login refused a denylist of locked/suspended/disabled
while refresh required an allowlist of exactly "active". An account marked
"deleted" was therefore refused by one and admitted by the other - it signed in
with HTTP 200, was handed an access token and a refresh session, and read
ordinary protected APIs until that token expired. Reproduced against the
previous build before any of this was written.

The rule is now one allowlist, in models.User.CanAuthenticate, called by login,
refresh and session restoration alike.
*/

// setStatus writes an account's standing directly, which is how a status change
// made outside the application - an administrator in SQL, a maintenance script -
// reaches the product. Nothing revokes sessions on this path, deliberately: it
// is how these tests prove that eligibility is enforced at refresh and
// bootstrap independently of whether revocation ran.
func setStatus(t *testing.T, pool *pgxpool.Pool, user ciUser, status string) {
	t.Helper()
	if _, err := pool.Exec(t.Context(),
		`UPDATE users SET status = $1 WHERE id = $2`, status, user.id); err != nil {
		t.Fatalf("setting status %q for %s: %v", status, user.email, err)
	}
}

// loginRaw signs in and returns the status code and access token, without
// failing the test on a refusal - these tests are mostly about refusals.
func loginRaw(t *testing.T, base, email string) (int, string) {
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
		return resp.StatusCode, ""
	}
	var login struct {
		AccessToken string `json:"accessToken"`
		Token       string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&login); err != nil {
		t.Fatal(err)
	}
	token := login.AccessToken
	if token == "" {
		token = login.Token
	}
	return http.StatusOK, token
}

// signInWithCookies signs in through a client that keeps the refresh cookie,
// which is the only way to exercise the refresh path as a browser does: the
// refresh token is HttpOnly and never appears in a response body.
func signInWithCookies(t *testing.T, base, email string) (*http.Client, error) {
	t.Helper()
	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, err
	}
	client := &http.Client{Timeout: 15 * time.Second, Jar: jar}

	body, err := json.Marshal(map[string]any{"email": email, "password": ciPassword})
	if err != nil {
		return nil, err
	}
	resp, err := client.Post(base+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("sign-in for %s: got %d want 200", email, resp.StatusCode)
	}

	parsed, err := url.Parse(base)
	if err != nil {
		return nil, err
	}
	if len(jar.Cookies(parsed)) == 0 {
		// The cookie is scoped to /api/v1/auth, so look there too.
		authURL := *parsed
		authURL.Path = "/api/v1/auth"
		if len(jar.Cookies(&authURL)) == 0 {
			t.Fatal("no refresh cookie was stored; the refresh path cannot be exercised")
		}
	}
	return client, nil
}

// refreshWith performs a refresh using a client that holds the session cookie.
func refreshWith(t *testing.T, base string, client *http.Client) int {
	t.Helper()
	resp, err := client.Post(base+"/api/v1/auth/refresh", "application/json", bytes.NewReader([]byte("{}")))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	return resp.StatusCode
}

// The baseline: an account in good standing works everywhere.
func TestActiveAccountAuthenticatesEverywhere(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	status, token := loginRaw(t, base, user.email)
	if status != http.StatusOK {
		t.Fatalf("login for an active account: got %d want 200", status)
	}
	if token == "" {
		t.Fatal("login returned no access token")
	}

	if resp := do(t, http.MethodGet, base+"/api/v1/auth/me", token, nil); resp.StatusCode != http.StatusOK {
		t.Errorf("/auth/me for an active account: got %d want 200", resp.StatusCode)
	}
}

// The defect itself, one test per non-active status the product defines.
func TestNonActiveAccountsCannotLogIn(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	for _, status := range []string{"deleted", "suspended", "disabled", "locked"} {
		t.Run(status, func(t *testing.T) {
			user := registerAndLogin(t, base)
			if code, _ := loginRaw(t, base, user.email); code != http.StatusOK {
				t.Fatalf("precondition: active login got %d want 200", code)
			}

			setStatus(t, pool, user, status)

			code, token := loginRaw(t, base, user.email)
			if code != http.StatusUnauthorized {
				t.Errorf("login for a %q account: got %d want 401", status, code)
			}
			if token != "" {
				t.Errorf("login for a %q account issued an access token", status)
			}
		})
	}
}

// A status nobody has thought of is refused, not admitted. Under the previous
// denylist every unrecognised status signed in, which is the whole reason the
// rule is an allowlist.
func TestUnknownStatusCannotLogIn(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	for _, status := range []string{"deactivated", "blocked", "inactive", "archived", "actve"} {
		user := registerAndLogin(t, base)
		setStatus(t, pool, user, status)

		if code, _ := loginRaw(t, base, user.email); code != http.StatusUnauthorized {
			t.Errorf("login for an unrecognised status %q: got %d want 401", status, code)
		}
	}
}

// A refusal for standing must be indistinguishable from a wrong password, or
// the endpoint becomes a membership test anyone can run against the user table.
func TestStandingRefusalDoesNotLeakAccountState(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	suspended := registerAndLogin(t, base)
	setStatus(t, pool, suspended, "suspended")

	body, err := json.Marshal(map[string]any{"email": suspended.email, "password": ciPassword})
	if err != nil {
		t.Fatal(err)
	}
	resp, err := httpClient().Post(base+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	suspendedBody, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}

	// The same account with a wrong password.
	wrongBody, err := json.Marshal(map[string]any{"email": suspended.email, "password": "not-the-password-123!"})
	if err != nil {
		t.Fatal(err)
	}
	wrongResp, err := httpClient().Post(base+"/api/v1/auth/login", "application/json", bytes.NewReader(wrongBody))
	if err != nil {
		t.Fatal(err)
	}
	defer wrongResp.Body.Close()
	wrongText, err := readBody(wrongResp)
	if err != nil {
		t.Fatal(err)
	}

	if resp.StatusCode != wrongResp.StatusCode {
		t.Errorf("suspended answered %d and a wrong password answered %d; the difference identifies the account",
			resp.StatusCode, wrongResp.StatusCode)
	}
	for _, leak := range []string{"suspend", "lock", "disabled", "deleted", "contact support"} {
		if bytes.Contains(bytes.ToLower([]byte(suspendedBody)), []byte(leak)) {
			t.Errorf("the refusal body names the account's standing (%q): %s", leak, suspendedBody)
		}
	}
	_ = wrongText
}

// Standing changes after sign-in: the session must not survive it. This is the
// path a status change made outside the application takes, so nothing has
// revoked anything - refresh enforces standing on its own.
func TestStatusChangeAfterLoginStopsRefresh(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	jar, err := signInWithCookies(t, base, user.email)
	if err != nil {
		t.Fatal(err)
	}
	if code := refreshWith(t, base, jar); code != http.StatusOK {
		t.Fatalf("precondition: refresh for an active account got %d want 200", code)
	}

	setStatus(t, pool, user, "suspended")

	if code := refreshWith(t, base, jar); code != http.StatusUnauthorized {
		t.Errorf("refresh after suspension: got %d want 401", code)
	}
}

// Session restoration is an authentication path and applies the same rule. An
// access token issued while the account was in good standing stops bootstrapping
// the moment the standing changes, which is what ejects the web client.
func TestBootstrapRefusesAnAccountThatLostStanding(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	_, token := loginRaw(t, base, user.email)
	if token == "" {
		t.Fatal("precondition: no access token")
	}
	if resp := do(t, http.MethodGet, base+"/api/v1/auth/me", token, nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("precondition: /auth/me got %d want 200", resp.StatusCode)
	}

	setStatus(t, pool, user, "deleted")

	resp := do(t, http.MethodGet, base+"/api/v1/auth/me", token, nil)
	if resp.StatusCode != http.StatusUnauthorized {
		body, _ := readBody(resp)
		t.Errorf("/auth/me with a token issued before deletion: got %d want 401: %s", resp.StatusCode, body)
	}
}

// A password reset must not be a way back in for an account that may not sign
// in. This used to be a third, separate denylist.
func TestPasswordResetIsRefusedForNonActiveAccounts(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)
	setStatus(t, pool, user, "suspended")

	body, err := json.Marshal(map[string]any{"email": user.email})
	if err != nil {
		t.Fatal(err)
	}
	resp, err := httpClient().Post(base+"/api/v1/auth/forgot-password", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	// The endpoint answers the same to everything, by design, so the assertion
	// is on the effect: no reset row is created for an ineligible account.
	var issued int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM password_resets WHERE user_id = $1`, user.id).Scan(&issued); err != nil {
		t.Skipf("password_resets not readable in this schema: %v", err)
	}
	if issued != 0 {
		t.Errorf("%d reset tokens issued to a suspended account", issued)
	}
}

/*
Accumulated authority does not restore a lost account.

One identity can hold many authority sources: a recruiter capability, a
freelancer profile, an approved company membership, a community administration
role, a platform admin role. Each is a separate table, owned by a separate
module, and each answers a question about what the account may do. None of them
answers whether the account may authenticate at all.

That is the layering the workspace audit describes, and this is the test that
holds it: standing is the outer gate, and every one of these sits behind it.
*/
func TestAccumulatedAuthorityCannotRestoreAnIneligibleAccount(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	user := registerAndLogin(t, base)
	user = becomeRecruiter(t, base, user)

	// Give the account every other authority the product has, directly, so the
	// test does not depend on the console paths that create them.
	if _, err := pool.Exec(t.Context(),
		`INSERT INTO freelancer_profiles (id, user_id, hourly_rate, tagline, created_at, updated_at)
		 VALUES (gen_random_uuid(), $1, 75, 'CI account-standing fixture', NOW(), NOW())
		 ON CONFLICT DO NOTHING`, user.id); err != nil {
		t.Fatalf("seeding a freelancer profile: %v", err)
	}
	if _, err := pool.Exec(t.Context(),
		`UPDATE users SET role_id = 'platform_admin' WHERE id = $1`, user.id); err != nil {
		t.Fatalf("promoting to platform admin: %v", err)
	}

	// It all works while the account is in good standing.
	code, token := loginRaw(t, base, user.email)
	if code != http.StatusOK || token == "" {
		t.Fatalf("precondition: login got %d", code)
	}
	if resp := do(t, http.MethodGet, base+"/api/v1/admin/users", token, nil); resp.StatusCode != http.StatusOK {
		t.Fatalf("precondition: a platform admin cannot reach /admin/users (got %d)", resp.StatusCode)
	}

	// Now the account loses its standing, with every one of those records left
	// exactly where it is.
	setStatus(t, pool, user, "deleted")

	if code, issued := loginRaw(t, base, user.email); code != http.StatusUnauthorized || issued != "" {
		t.Errorf("login for a deleted account holding recruiter, freelancer and platform-admin authority: got %d", code)
	}

	// A token issued before the change stops restoring a session, so the client
	// is ejected rather than left holding a shell.
	if resp := do(t, http.MethodGet, base+"/api/v1/auth/me", token, nil); resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("/auth/me for a deleted account: got %d want 401", resp.StatusCode)
	}

	// And the records themselves are untouched - the point is that they no
	// longer help, not that something went round deleting them.
	var recruiterRows int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM recruiter_profiles WHERE user_id = $1 AND capability_status = 'active'`,
		user.id).Scan(&recruiterRows); err != nil {
		t.Fatalf("counting recruiter capability: %v", err)
	}
	if recruiterRows == 0 {
		t.Error("precondition lost: the recruiter capability was removed, so this proves nothing")
	}

	var freelancerRows int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM freelancer_profiles WHERE user_id = $1`, user.id).Scan(&freelancerRows); err != nil {
		t.Fatalf("counting freelancer profile: %v", err)
	}
	if freelancerRows == 0 {
		t.Error("precondition lost: no freelancer profile, so freelancer authority was never tested")
	}

	// freelancer_profiles has no standing column of its own - recorded in the
	// workspace audit and deliberately not solved here. This is what stands in
	// for it: the profile is untouched and confers nothing, because the account
	// it belongs to may not authenticate.
	var role string
	if err := pool.QueryRow(t.Context(),
		`SELECT role_id FROM users WHERE id = $1`, user.id).Scan(&role); err != nil {
		t.Fatalf("reading role: %v", err)
	}
	if role != "platform_admin" {
		t.Errorf("precondition lost: role_id = %q, so platform-admin authority was never tested", role)
	}
}

// The recruiter P0 fix must survive this change: an ineligible account cannot
// onboard its way back to a capability, and the capability gate is unchanged.
func TestIneligibleAccountCannotObtainRecruiterCapability(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	user := registerAndLogin(t, base)
	_, token := loginRaw(t, base, user.email)
	if token == "" {
		t.Fatal("precondition: no token")
	}

	setStatus(t, pool, user, "suspended")

	// Onboarding with a token issued before the suspension.
	resp := do(t, http.MethodPost, base+"/api/v1/recruiter/onboarding", token, map[string]any{
		"companyName":   "Should Not Exist",
		"jobTitle":      "Talent Partner",
		"recruiterRole": "Recruiter",
		"department":    "Talent Acquisition",
	})
	// Whatever the module answers, the account must not end up holding an
	// active capability, and it must not be able to sign in to use one.
	var active int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM recruiter_profiles WHERE user_id = $1 AND capability_status = 'active'`,
		user.id).Scan(&active); err != nil {
		t.Fatalf("counting recruiter capability: %v", err)
	}
	if active != 0 {
		t.Errorf("a suspended account obtained an active recruiter capability (onboarding answered %d)", resp.StatusCode)
	}
	if code, _ := loginRaw(t, base, user.email); code != http.StatusUnauthorized {
		t.Errorf("a suspended account could sign in: got %d", code)
	}
}

// Suspending through the supported administrative path ends the account's
// sessions, rather than leaving them to expire.
//
// Eligibility alone already stops a refresh, so this is not what makes the
// suspension effective - it is what makes it immediate, and what stops a
// session from becoming useful again if the account is later restored.
func TestAdminSuspensionRevokesSessions(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	admin := registerAndLogin(t, base)
	admin = makePlatformAdmin(t, pool, admin)

	target := registerAndLogin(t, base)
	jar, err := signInWithCookies(t, base, target.email)
	if err != nil {
		t.Fatal(err)
	}
	if code := refreshWith(t, base, jar); code != http.StatusOK {
		t.Fatalf("precondition: refresh got %d want 200", code)
	}

	var live int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM sessions WHERE user_id = $1 AND revoked_at IS NULL`, target.id).Scan(&live); err != nil {
		t.Fatalf("counting sessions: %v", err)
	}
	if live == 0 {
		t.Fatal("precondition: the account has no live session to revoke")
	}

	resp := do(t, http.MethodPut, base+"/api/v1/admin/users/"+target.id+"/status", admin.token, map[string]any{
		"status": "suspended",
		"reason": "CI account-standing test",
	})
	if resp.StatusCode != http.StatusOK {
		body, _ := readBody(resp)
		t.Fatalf("suspending through the admin API: got %d want 200: %s", resp.StatusCode, body)
	}

	var stillLive int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM sessions WHERE user_id = $1 AND revoked_at IS NULL`, target.id).Scan(&stillLive); err != nil {
		t.Fatalf("counting sessions: %v", err)
	}
	if stillLive != 0 {
		t.Errorf("%d sessions survived the suspension", stillLive)
	}

	if code := refreshWith(t, base, jar); code != http.StatusUnauthorized {
		t.Errorf("refresh after an administrative suspension: got %d want 401", code)
	}

	// Restoring the account lets it sign in again - and does not resurrect the
	// sessions that were revoked while it was suspended.
	setStatus(t, pool, target, "active")
	if code, _ := loginRaw(t, base, target.email); code != http.StatusOK {
		t.Errorf("a restored account cannot sign in: got %d", code)
	}

	// Refused, and the assertion is on that rather than on one status code.
	// Within ten seconds of a revocation the rotation grace answers 409, which
	// asks the client to retry with the cookie a concurrent refresh set; after
	// it, reuse detection answers 401. Both refuse and neither issues anything,
	// which is the property that matters. The window is
	// service.refreshRotationGrace and it exists so that two refreshes from one
	// page load do not sign a user out.
	if code := refreshWith(t, base, jar); code == http.StatusOK {
		t.Error("a session revoked during suspension became usable again after reactivation")
	}
}

// An administrative status change is validated against the product's
// vocabulary, so a typo cannot put an account into a standing nothing
// understands - which, under an allowlist, is an account that can never sign in
// again for a reason nobody can read.
func TestAdminCannotWriteAnUnknownStatus(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)

	admin := registerAndLogin(t, base)
	admin = makePlatformAdmin(t, pool, admin)
	target := registerAndLogin(t, base)

	resp := do(t, http.MethodPut, base+"/api/v1/admin/users/"+target.id+"/status", admin.token, map[string]any{
		"status": "susepnded",
		"reason": "CI typo test",
	})
	if resp.StatusCode == http.StatusOK {
		t.Error("the admin API accepted a misspelled status")
	}

	var stored string
	if err := pool.QueryRow(t.Context(),
		`SELECT status FROM users WHERE id = $1`, target.id).Scan(&stored); err != nil {
		t.Fatalf("reading status: %v", err)
	}
	if stored != "active" {
		t.Errorf("status = %q after a rejected change, want it untouched at active", stored)
	}
}
