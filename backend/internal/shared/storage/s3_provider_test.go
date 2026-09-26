package storage

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
	"time"
)

// The S3 provider against a fake S3. The signatures themselves are pinned by
// sigv4_test.go against AWS's published examples; these pin what reaches the
// wire: SigV4 on every request (never Basic auth), the body hash, the object's
// address, and that refusals are reported as refusals.

type recorded struct {
	method, host, path, rawPath, auth, contentSHA, contentType string
	body                                                       []byte
}

func fakeS3(t *testing.T, status func(r *http.Request) int) (*httptest.Server, *[]recorded) {
	t.Helper()
	var mu sync.Mutex
	var seen []recorded
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		mu.Lock()
		seen = append(seen, recorded{
			method: r.Method, host: r.Host, path: r.URL.Path, rawPath: r.URL.EscapedPath(),
			auth: r.Header.Get("Authorization"), contentSHA: r.Header.Get("X-Amz-Content-Sha256"),
			contentType: r.Header.Get("Content-Type"), body: body,
		})
		mu.Unlock()
		code := status(r)
		if code == http.StatusOK && r.Method == http.MethodGet {
			w.Header().Set("Content-Type", "application/pdf")
			w.WriteHeader(code)
			_, _ = w.Write([]byte("stored bytes"))
			return
		}
		w.WriteHeader(code)
	}))
	t.Cleanup(srv.Close)
	return srv, &seen
}

func providerFor(endpoint string) *S3StorageProvider {
	return NewS3StorageProvider(S3Config{
		Endpoint: endpoint, Bucket: "kirmya-uploads", Region: "auto",
		AccessKeyID: "AKIDTEST", SecretAccessKey: "secret", UsePathStyle: true,
	}, nil)
}

func TestS3RequestsAreSigV4Signed(t *testing.T) {
	srv, seen := fakeS3(t, func(*http.Request) int { return http.StatusOK })
	p := providerFor(srv.URL)
	ctx := context.Background()
	body := []byte("%PDF-1.4 resume")

	if _, err := p.Upload(ctx, "resumes/u1/cv.pdf", bytes.NewReader(body), int64(len(body)), "application/pdf"); err != nil {
		t.Fatal(err)
	}
	rc, ct, _, err := p.Download(ctx, "resumes/u1/cv.pdf")
	if err != nil || ct != "application/pdf" {
		t.Fatalf("download: %v %s", err, ct)
	}
	rc.Close()
	if ok, err := p.Exists(ctx, "resumes/u1/cv.pdf"); !ok || err != nil {
		t.Fatalf("exists: %v %v", ok, err)
	}
	if err := p.Delete(ctx, "resumes/u1/cv.pdf"); err != nil {
		t.Fatal(err)
	}

	sum := sha256.Sum256(body)
	for _, r := range *seen {
		if !strings.HasPrefix(r.auth, "AWS4-HMAC-SHA256 Credential=AKIDTEST/") || strings.HasPrefix(r.auth, "Basic ") {
			t.Errorf("%s was not SigV4-signed: %q", r.method, r.auth)
		}
		if r.path != "/kirmya-uploads/resumes/u1/cv.pdf" {
			t.Errorf("%s path = %s", r.method, r.path)
		}
		want := emptyPayloadHash
		if r.method == http.MethodPut {
			want = hex.EncodeToString(sum[:])
			if !bytes.Equal(r.body, body) || r.contentType != "application/pdf" {
				t.Errorf("PUT carried %q as %s", r.body, r.contentType)
			}
		}
		if r.contentSHA != want {
			t.Errorf("%s X-Amz-Content-Sha256 = %s, want %s", r.method, r.contentSHA, want)
		}
	}
}

// The service checks the signature against the path it received, so the path
// sent must be the one signed: a '+' or a space left as Go would send it is a
// refused request.
func TestS3SendsThePathItSigns(t *testing.T) {
	srv, seen := fakeS3(t, func(*http.Request) int { return http.StatusOK })
	p := providerFor(srv.URL)
	if _, err := p.Upload(context.Background(), "avatars/user 1/résumé+v2.pdf", strings.NewReader("x"), 1, ""); err != nil {
		t.Fatal(err)
	}
	got := (*seen)[0].rawPath
	if got != "/kirmya-uploads/avatars/user%201/r%C3%A9sum%C3%A9%2Bv2.pdf" {
		t.Fatalf("path sent = %s", got)
	}
}

func TestS3VirtualHostedAddressing(t *testing.T) {
	p := NewS3StorageProvider(S3Config{Endpoint: "https://t3.storageapi.dev", Bucket: "kirmya-uploads-ab12", Region: "auto",
		AccessKeyID: "AKIDTEST", SecretAccessKey: "secret"}, nil)
	u, err := p.objectURL("/avatars/a.png")
	if err != nil {
		t.Fatal(err)
	}
	if u.String() != "https://kirmya-uploads-ab12.t3.storageapi.dev/avatars/a.png" {
		t.Fatalf("object URL = %s", u)
	}
	signed, err := p.GenerateSignedURL(context.Background(), "avatars/a.png", 10*time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	parsed, _ := url.Parse(signed)
	q := parsed.Query()
	if parsed.Host != "kirmya-uploads-ab12.t3.storageapi.dev" || q.Get("X-Amz-Algorithm") != "AWS4-HMAC-SHA256" ||
		q.Get("X-Amz-Expires") != "600" || q.Get("X-Amz-Signature") == "" || strings.Contains(signed, "AWSAccessKeyId") {
		t.Fatalf("presigned URL = %s", signed)
	}
}

func TestS3RefusalsAreErrors(t *testing.T) {
	srv, _ := fakeS3(t, func(*http.Request) int { return http.StatusForbidden })
	p := providerFor(srv.URL)
	ctx := context.Background()
	if _, err := p.Upload(ctx, "k", strings.NewReader("x"), 1, ""); err == nil {
		t.Error("a refused upload was reported stored")
	}
	// The health probe relies on this: wrong credentials must not read as "absent".
	if _, err := p.Exists(ctx, "health-probe/.keep-absent"); err == nil {
		t.Error("a refused HEAD was reported as a missing object")
	}
	if err := p.Delete(ctx, "k"); err == nil {
		t.Error("a refused delete was reported done")
	}

	missing, _ := fakeS3(t, func(*http.Request) int { return http.StatusNotFound })
	q := providerFor(missing.URL)
	if ok, err := q.Exists(ctx, "absent"); ok || err != nil {
		t.Errorf("absent object: %v %v, want false with no error", ok, err)
	}
	if err := q.Delete(ctx, "absent"); err != nil {
		t.Errorf("deleting an absent object: %v", err)
	}
}

func TestS3PublicURLOnlyWithAPublicBase(t *testing.T) {
	ctx := context.Background()
	private := providerFor("https://t3.storageapi.dev")
	if got := private.GetPublicURL(ctx, "avatars/a.png"); got != "" {
		t.Errorf("a private bucket offered a public URL: %s", got)
	}
	public := NewS3StorageProvider(S3Config{Endpoint: "https://t3.storageapi.dev", Bucket: "b", AccessKeyID: "a", SecretAccessKey: "s",
		PublicBaseURL: "https://cdn.kirmya.example/"}, nil)
	if got := public.GetPublicURL(ctx, "/avatars/a.png"); got != "https://cdn.kirmya.example/avatars/a.png" {
		t.Errorf("public URL = %s", got)
	}
}

func TestPathStyleFor(t *testing.T) {
	cases := []struct {
		endpoint, setting string
		want              bool
	}{
		{"https://t3.storageapi.dev", "", false},
		{"https://abc.r2.cloudflarestorage.com", "", false},
		{"http://localhost:9000", "", true},
		{"http://127.0.0.1:9000", "", true},
		{"https://t3.storageapi.dev", "true", true},
		{"http://localhost:9000", "false", false},
	}
	for _, c := range cases {
		if got := PathStyleFor(c.endpoint, c.setting); got != c.want {
			t.Errorf("PathStyleFor(%q, %q) = %v, want %v", c.endpoint, c.setting, got, c.want)
		}
	}
}
