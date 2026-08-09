package http

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func testContext(t *testing.T) (*gin.Context, *httptest.ResponseRecorder) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/companies", nil)
	return c, rec
}

// The status code is the client's whole signal for what to do next: log in,
// give up, or retry. Each sentinel maps to exactly one code, wrapped or not.
func TestRespondErrorStatusMapping(t *testing.T) {
	cases := []struct {
		name string
		err  error
		want int
	}{
		{"unauthenticated", domain.ErrUnauthenticated, http.StatusUnauthorized},
		{"forbidden", domain.ErrForbidden, http.StatusForbidden},
		{"not found", domain.ErrNotFound, http.StatusNotFound},
		{"conflict", domain.ErrConflict, http.StatusConflict},
		{"validation", domain.ErrValidation, http.StatusBadRequest},
		{"no database", repository.ErrNoDatabase, http.StatusServiceUnavailable},
		{"wrapped forbidden", fmt.Errorf("%w: you cannot do that", domain.ErrForbidden), http.StatusForbidden},
		{"wrapped validation", fmt.Errorf("%w: slug is invalid", domain.ErrValidation), http.StatusBadRequest},
		{"doubly wrapped", fmt.Errorf("update company: %w", fmt.Errorf("%w: nope", domain.ErrNotFound)), http.StatusNotFound},
		{"unknown", errors.New("boom"), http.StatusInternalServerError},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			c, rec := testContext(t)
			respondError(c, tc.err)
			if rec.Code != tc.want {
				t.Errorf("status = %d, want %d (body %s)", rec.Code, tc.want, rec.Body.String())
			}
		})
	}
}

// An unexpected error is usually a database error, and database errors quote
// table names, column names and sometimes row values. None of that may reach
// the response body.
func TestRespondErrorDoesNotLeakInternals(t *testing.T) {
	leaky := errors.New(`ERROR: duplicate key value violates unique constraint "uq_company_members_user" (SQLSTATE 23505) on table company_members for user f4c1@example.com`)

	c, rec := testContext(t)
	respondError(c, leaky)

	body := rec.Body.String()
	for _, secret := range []string{"company_members", "SQLSTATE", "uq_company_members_user", "f4c1@example.com", "constraint"} {
		if strings.Contains(body, secret) {
			t.Errorf("the response body leaked %q: %s", secret, body)
		}
	}
	if !strings.Contains(body, "Something went wrong") {
		t.Errorf("expected the fixed message, got %s", body)
	}

	// The original error is still handed to the logging middleware.
	if len(c.Errors) == 0 {
		t.Error("the underlying error was not recorded for the logs")
	}
}

// A not-found answer is deliberately identical whether the resource is missing
// or merely off-limits, so ids cannot be probed by reading the message.
func TestNotFoundRevealsNothing(t *testing.T) {
	c1, rec1 := testContext(t)
	respondError(c1, domain.ErrNotFound)

	c2, rec2 := testContext(t)
	respondError(c2, fmt.Errorf("%w: company 0c8d…f1 is not visible to user 44a…9", domain.ErrNotFound))

	if rec1.Body.String() != rec2.Body.String() {
		t.Errorf("a not-found body varied with the reason:\n%s\n%s", rec1.Body.String(), rec2.Body.String())
	}
	if strings.Contains(rec2.Body.String(), "0c8d") {
		t.Errorf("the not-found body echoed an id: %s", rec2.Body.String())
	}
}

// The explanatory half of a wrapped sentinel is what the user reads, so it is
// surfaced; an unwrapped sentinel falls back to a generic sentence rather than
// printing "company: permission denied".
func TestUserMessage(t *testing.T) {
	got := userMessage(fmt.Errorf("%w: that company address is already in use", domain.ErrConflict), "fallback")
	if !strings.Contains(got, "already in use") {
		t.Errorf("userMessage dropped the explanation: %q", got)
	}
	if strings.HasPrefix(got, "company:") {
		t.Errorf("userMessage leaked the sentinel prefix: %q", got)
	}
	if got[0] < 'A' || got[0] > 'Z' {
		t.Errorf("userMessage did not capitalise the sentence: %q", got)
	}

	if got := userMessage(errors.New("boom"), "fallback"); got != "fallback" {
		t.Errorf("userMessage(%q) = %q, want the fallback", "boom", got)
	}
}

// A request with no authenticated user must produce the zero Actor. Anything
// else — a demo account, a nil-uuid stand-in — would let an unauthenticated
// caller write under an identity.
func TestActorFromWithoutAuthentication(t *testing.T) {
	c, _ := testContext(t)

	actor := actorFrom(c)
	if actor.IsAuthenticated() {
		t.Error("an unauthenticated request produced an authenticated actor")
	}
	if actor.UserID != uuid.Nil {
		t.Errorf("actor carries a user id: %s", actor.UserID)
	}
	if actor.Email != "" || actor.PlatformRole != "" {
		t.Errorf("actor carries an identity: %+v", actor)
	}
}

// The two auth middlewares in the codebase store the user id differently — one
// as a uuid.UUID, one as a string — so both have to resolve.
func TestActorFromReadsBothMiddlewareShapes(t *testing.T) {
	id := uuid.New()

	t.Run("uuid value", func(t *testing.T) {
		c, _ := testContext(t)
		c.Set("userID", id)
		c.Set("email", "owner@example.com")
		c.Set("role", "admin")

		actor := actorFrom(c)
		if actor.UserID != id {
			t.Errorf("UserID = %s, want %s", actor.UserID, id)
		}
		if actor.Email != "owner@example.com" {
			t.Errorf("Email = %q", actor.Email)
		}
		if !actor.IsPlatformAdmin() {
			t.Error("the platform role did not survive")
		}
	})

	t.Run("string value", func(t *testing.T) {
		c, _ := testContext(t)
		c.Set("userID", id.String())

		if actor := actorFrom(c); actor.UserID != id {
			t.Errorf("UserID = %s, want %s", actor.UserID, id)
		}
	})
}

// A malformed or hostile value in the context must not become an identity.
func TestActorFromRejectsMalformedIdentity(t *testing.T) {
	cases := map[string]any{
		"not a uuid":  "definitely-not-a-uuid",
		"empty":       "",
		"nil uuid":    uuid.Nil.String(),
		"wrong type":  12345,
		"nil literal": nil,
	}

	for name, value := range cases {
		t.Run(name, func(t *testing.T) {
			c, _ := testContext(t)
			c.Set("userID", value)

			if actor := actorFrom(c); actor.IsAuthenticated() {
				t.Errorf("value %v produced an authenticated actor with id %s", value, actor.UserID)
			}
		})
	}
}

// Non-string values in the email and role keys must not panic or be coerced.
func TestActorFromIgnoresWrongTypedClaims(t *testing.T) {
	c, _ := testContext(t)
	c.Set("userID", uuid.New())
	c.Set("email", 42)
	c.Set("role", []string{"admin"})

	actor := actorFrom(c)
	if actor.Email != "" {
		t.Errorf("Email = %q, want empty", actor.Email)
	}
	if actor.PlatformRole != "" {
		t.Errorf("PlatformRole = %q, want empty", actor.PlatformRole)
	}
	if actor.IsPlatformAdmin() {
		t.Error("a non-string role produced a platform administrator")
	}
}

// A malformed id in the path is a bad request, and the handler must stop rather
// than continue with the nil uuid — which is a real, addressable row.
func TestPathUUID(t *testing.T) {
	id := uuid.New()

	c, rec := testContext(t)
	c.Params = gin.Params{{Key: "id", Value: id.String()}}
	got, ok := pathUUID(c, "id")
	if !ok || got != id {
		t.Fatalf("pathUUID = %s, %v; want %s, true", got, ok, id)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("a valid id wrote a response: %d", rec.Code)
	}

	for _, bad := range []string{"", "123", "../../admin", "0c8d-f1", "' OR 1=1--"} {
		c, rec := testContext(t)
		c.Params = gin.Params{{Key: "id", Value: bad}}

		got, ok := pathUUID(c, "id")
		if ok {
			t.Errorf("pathUUID accepted %q", bad)
		}
		if got != uuid.Nil {
			t.Errorf("pathUUID returned %s for %q", got, bad)
		}
		if rec.Code != http.StatusBadRequest {
			t.Errorf("pathUUID(%q) status = %d, want 400", bad, rec.Code)
		}
	}
}

// Paging inputs are caller-supplied, so a missing, zero, negative or
// unparseable value has to land somewhere sane rather than becoming an offset.
func TestPagination(t *testing.T) {
	cases := []struct {
		query     string
		wantPage  int
		wantLimit int
	}{
		{"", 1, 20},
		{"?page=3&limit=50", 3, 50},
		{"?page=0", 1, 20},
		{"?page=-5&limit=-5", 1, 20},
		{"?page=abc&limit=abc", 1, 20},
		{"?limit=0", 1, 20},
	}

	for _, tc := range cases {
		t.Run("query="+tc.query, func(t *testing.T) {
			c, _ := testContext(t)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/v1/companies"+tc.query, nil)

			page, limit := pagination(c, 20)
			if page != tc.wantPage || limit != tc.wantLimit {
				t.Errorf("pagination = %d, %d; want %d, %d", page, limit, tc.wantPage, tc.wantLimit)
			}
			if page < 1 || limit < 1 {
				t.Errorf("pagination produced a non-positive value: %d, %d", page, limit)
			}
		})
	}
}
