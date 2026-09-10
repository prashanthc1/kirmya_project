package authz

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type stubChecker struct {
	allow  bool
	err    error
	calls  int
	lastID uuid.UUID
	lastFn string
}

func (s *stubChecker) CheckPermission(_ context.Context, adminID uuid.UUID, permission string) (bool, error) {
	s.calls++
	s.lastID = adminID
	s.lastFn = permission
	return s.allow, s.err
}

// serve runs one request through the guard, with the caller already
// established the way AuthRequired establishes it.
func serve(t *testing.T, guard *Guard, permission string, setCaller func(*gin.Context)) (int, bool) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	reached := false
	engine.GET("/probe", func(c *gin.Context) {
		if setCaller != nil {
			setCaller(c)
		}
		c.Next()
	}, guard.Require(permission), func(c *gin.Context) {
		reached = true
		c.Status(http.StatusOK)
	})

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/probe", nil))
	return rec.Code, reached
}

func withCaller(id uuid.UUID) func(*gin.Context) {
	return func(c *gin.Context) { c.Set("userID", id) }
}

func TestGuardAdmitsAHolder(t *testing.T) {
	checker := &stubChecker{allow: true}
	id := uuid.New()

	code, reached := serve(t, NewGuard(checker), "backups.read", withCaller(id))
	if code != http.StatusOK || !reached {
		t.Fatalf("holder was refused: status %d, handler reached %v", code, reached)
	}
	if checker.calls != 1 {
		t.Errorf("permission was looked up %d times, want exactly 1", checker.calls)
	}
	if checker.lastID != id {
		t.Errorf("looked up %s, want the authenticated caller %s", checker.lastID, id)
	}
	if checker.lastFn != "backups.read" {
		t.Errorf("asked for %q, want %q", checker.lastFn, "backups.read")
	}
}

func TestGuardRefusesANonHolder(t *testing.T) {
	code, reached := serve(t, NewGuard(&stubChecker{allow: false}), "backups.manage", withCaller(uuid.New()))
	if code != http.StatusForbidden {
		t.Errorf("status %d, want 403", code)
	}
	if reached {
		t.Error("the handler ran for an administrator without the permission")
	}
}

// A lookup failure is an outage, not a decision. Answering 403 would tell an
// administrator their access had been removed when the database was merely
// unreachable, and would be indistinguishable from a real narrowing in a log.
func TestGuardReportsALookupFailureAsAFailure(t *testing.T) {
	code, reached := serve(t, NewGuard(&stubChecker{err: errors.New("dial tcp: connection refused")}),
		"backups.read", withCaller(uuid.New()))
	if code != http.StatusInternalServerError {
		t.Errorf("status %d, want 500", code)
	}
	if reached {
		t.Error("the handler ran despite an unanswerable permission question")
	}
}

// A guard with no checker cannot evaluate the question. It must not answer yes.
func TestGuardWithoutACheckerFailsClosed(t *testing.T) {
	for name, guard := range map[string]*Guard{
		"nil checker": NewGuard(nil),
		"nil guard":   nil,
	} {
		t.Run(name, func(t *testing.T) {
			code, reached := serve(t, guard, "backups.read", withCaller(uuid.New()))
			if code != http.StatusInternalServerError {
				t.Errorf("status %d, want 500", code)
			}
			if reached {
				t.Error("the handler ran behind a guard that could not evaluate the permission")
			}
		})
	}
}

// Nothing established who is asking, so there is no administrator whose
// permissions could be evaluated. In the assembled router RequireAdmin has
// already read the same context, but a guard that assumed that would be a
// guard that trusted its callers.
func TestGuardWithoutACallerIsUnauthorized(t *testing.T) {
	checker := &stubChecker{allow: true}
	code, reached := serve(t, NewGuard(checker), "backups.read", nil)
	if code != http.StatusUnauthorized {
		t.Errorf("status %d, want 401", code)
	}
	if reached {
		t.Error("the handler ran for a request with no established caller")
	}
	if checker.calls != 0 {
		t.Errorf("the permission was looked up %d times for an unidentified caller, want 0", checker.calls)
	}
}

func TestGuardRefusalCarriesTheContractCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.GET("/probe", func(c *gin.Context) { c.Set("userID", uuid.New()) },
		NewGuard(&stubChecker{allow: false}).Require("security.manage"),
		func(c *gin.Context) { c.Status(http.StatusOK) })

	rec := httptest.NewRecorder()
	engine.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/probe", nil))

	body := rec.Body.String()
	for _, want := range []string{CodePermissionRequired, "security.manage"} {
		if !contains(body, want) {
			t.Errorf("refusal body %q does not name %q", body, want)
		}
	}
}

func contains(haystack, needle string) bool {
	return len(needle) > 0 && len(haystack) >= len(needle) &&
		func() bool {
			for i := 0; i+len(needle) <= len(haystack); i++ {
				if haystack[i:i+len(needle)] == needle {
					return true
				}
			}
			return false
		}()
}
