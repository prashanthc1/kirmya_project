//go:build ciintegration

package ci

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

/*
The profile avatar, end to end.

Uploading one used to do nothing at all, for four independent reasons, any one
of which alone would have left the picture missing:

  the bytes went nowhere      UploadPhoto validated the file, composed
                              "/uploads/profiles/<user id>_avatar.png" from the
                              user id, and never wrote the image anywhere
  the URL went nowhere        nothing serves /uploads, so that address answers
                              404 even when a file exists
  the row went nowhere        UPDATE user_profiles ... WHERE user_id matched no
                              row for an account with no profile yet, and
                              reported success
  the file was private        an avatar stored through the media module was
                              given "private" visibility by a handler default,
                              so nobody but its owner could fetch it

Each step below is one of those. The test asks the only question that matters:
after uploading a picture, can a browser fetch that picture back.
*/

// pngProbe is a real 1x1 PNG. Real bytes, because the upload path sniffs magic
// bytes and a placeholder would be rejected for the wrong reason.
var pngProbe = []byte{
	0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
	0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
	0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
	0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
	0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
	0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
}

// uploadImage posts one multipart image and returns the decoded JSON body.
func uploadImage(t *testing.T, base, path, token, field string) map[string]any {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile(field, "probe.png")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write(pngProbe); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequest(http.MethodPost, base+path, &body)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := httpClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("POST %s: got %d want 200: %s", path, resp.StatusCode, string(raw))
	}
	return decodeJSON(t, raw)
}

// fetchAnonymously gets a URL with no credentials at all, which is how a
// visitor's browser requests somebody else's profile picture.
func fetchAnonymously(t *testing.T, base, path string) (int, string, []byte) {
	t.Helper()
	resp, err := httpClient().Get(base + path)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	payload, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, resp.Header.Get("Content-Type"), payload
}

func storedAvatarURL(t *testing.T, pool *pgxpool.Pool, userID string) string {
	t.Helper()
	var url *string
	if err := pool.QueryRow(t.Context(),
		`SELECT avatar_url FROM user_profiles WHERE user_id = $1`, userID).Scan(&url); err != nil {
		return ""
	}
	if url == nil {
		return ""
	}
	return *url
}

// An avatar uploaded by a brand-new account - one that has never opened its
// profile page, so has no user_profiles row - comes back byte for byte.
//
// The brand-new part is deliberate. It is the case the silent UPDATE lost, so
// the very first avatar anybody uploaded was the one guaranteed to vanish.
func TestUploadedAvatarIsFetchable(t *testing.T) {
	base := required(t, "TEST_API_URL")
	pool := connectDB(t)
	user := registerAndLogin(t, base)

	var profileRows int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM user_profiles WHERE user_id = $1`, user.id).Scan(&profileRows); err != nil {
		t.Fatalf("counting profile rows: %v", err)
	}
	if profileRows != 0 {
		t.Logf("note: this account already has %d profile row(s); the no-row case is not being exercised", profileRows)
	}

	body := uploadImage(t, base, "/api/v1/profile/me/photo", user.token, "photo")
	photoURL, _ := body["photo_url"].(string)
	if photoURL == "" {
		t.Fatalf("the upload response carries no photo_url: %v", body)
	}

	// The URL must not be composed from the caller's id: that was the invented
	// path, and it named a location nothing was ever written to.
	if got := storedAvatarURL(t, pool, user.id); got != photoURL {
		t.Errorf("stored avatar_url = %q, upload returned %q; the picture is not attached to the profile", got, photoURL)
	}

	status, contentType, payload := fetchAnonymously(t, base, photoURL)
	if status != http.StatusOK {
		t.Fatalf("GET %s answered %d to a visitor, want 200: %s", photoURL, status, string(payload))
	}
	if contentType != "image/png" {
		t.Errorf("content type %q, want image/png", contentType)
	}
	if !bytes.Equal(payload, pngProbe) {
		t.Errorf("fetched %d bytes, uploaded %d; what came back is not what was sent", len(payload), len(pngProbe))
	}
}

// /profile/me must report the same URL, because that is where the web client
// reads the avatar from.
func TestProfileReportsTheUploadedAvatar(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	body := uploadImage(t, base, "/api/v1/profile/me/photo", user.token, "photo")
	photoURL, _ := body["photo_url"].(string)

	resp := do(t, http.MethodGet, base+"/api/v1/profile/me", user.token, nil)
	raw, err := readBody(resp)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /profile/me: %d %s", resp.StatusCode, raw)
	}
	profile := decodeJSON(t, []byte(raw))
	if got, _ := profile["avatarUrl"].(string); got != photoURL {
		t.Errorf("profile avatarUrl = %q, want %q", got, photoURL)
	}
}

// The cover photo travels the same path and must behave the same way.
func TestUploadedCoverIsFetchable(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	body := uploadImage(t, base, "/api/v1/profile/me/cover", user.token, "cover")
	coverURL, _ := body["cover_url"].(string)
	if coverURL == "" {
		t.Fatalf("the upload response carries no cover_url: %v", body)
	}
	if status, _, payload := fetchAnonymously(t, base, coverURL); status != http.StatusOK {
		t.Errorf("GET %s answered %d, want 200: %s", coverURL, status, string(payload))
	}
}

// The onboarding upload is a second endpoint onto the same concern. It used to
// answer every caller with one hardcoded literal -
// "/uploads/profile_photo_demo.jpg" - having stored nothing, so the photo
// belonged to nobody and existed nowhere.
func TestOnboardingPhotoUploadStoresARealFile(t *testing.T) {
	base := required(t, "TEST_API_URL")
	alice := registerAndLogin(t, base)
	bob := registerAndLogin(t, base)

	aliceBody := uploadImage(t, base, "/api/v1/profile/photo", alice.token, "photo")
	bobBody := uploadImage(t, base, "/api/v1/profile/photo", bob.token, "photo")

	aliceURL, _ := aliceBody["photo_url"].(string)
	bobURL, _ := bobBody["photo_url"].(string)

	if aliceURL == "" || bobURL == "" {
		t.Fatalf("onboarding upload returned no URL: %v / %v", aliceBody, bobBody)
	}
	// Two different people must not be handed the same picture.
	if aliceURL == bobURL {
		t.Errorf("two accounts were given the same photo URL %q; the endpoint is "+
			"returning a fixed value rather than storing what was uploaded", aliceURL)
	}
	for _, url := range []string{aliceURL, bobURL} {
		if status, _, payload := fetchAnonymously(t, base, url); status != http.StatusOK {
			t.Errorf("GET %s answered %d, want 200: %s", url, status, string(payload))
		}
	}
}

// No upload path may answer with a path under /uploads, because nothing serves
// it. This is the ratchet: the invented URL is what made the avatar missing,
// and it looked plausible enough to survive review.
func TestUploadResponsesNameAServedRoute(t *testing.T) {
	base := required(t, "TEST_API_URL")
	user := registerAndLogin(t, base)

	for _, probe := range []struct{ path, field, key string }{
		{"/api/v1/profile/me/photo", "photo", "photo_url"},
		{"/api/v1/profile/me/cover", "cover", "cover_url"},
		{"/api/v1/profile/photo", "photo", "photo_url"},
	} {
		body := uploadImage(t, base, probe.path, user.token, probe.field)
		url, _ := body[probe.key].(string)
		if url == "" {
			t.Errorf("%s returned no %s", probe.path, probe.key)
			continue
		}
		if status, _, _ := fetchAnonymously(t, base, url); status == http.StatusNotFound {
			t.Errorf("%s returned %q, which answers 404; the response names a route "+
				"this application does not serve", probe.path, url)
		}
	}
}

// decodeJSON is a small local helper: these responses are small objects whose
// shape differs per endpoint, so a map is more honest than a struct per case.
func decodeJSON(t *testing.T, raw []byte) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		t.Fatalf("decoding %s: %v", string(raw), err)
	}
	return out
}
