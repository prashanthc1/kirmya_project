package repository

import (
	"context"
	"errors"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"strings"
	"testing"

	"github.com/google/uuid"
)

// TestMissingProfileIsNotInvented is the behavioural ratchet.
//
// GetProfileByUserID used to synthesise a freelancer profile for any account
// that had none - a "Software Engineer & Consultant" charging 75 an hour, with
// a freshly minted id - so the endpoint could never answer "you are not a
// freelancer", and an existence check built on it would have said yes for the
// entire user base. That is the fabricated identity this must never allow back.
//
// It is written against behaviour rather than source text so that it cannot be
// satisfied by renaming anything, and it is scoped to a repository with no
// seeded profile so test fixtures that legitimately insert one are unaffected.
func TestMissingProfileIsNotInvented(t *testing.T) {
	repo := NewFreelanceRepository(nil)

	for i := 0; i < 3; i++ {
		prof, err := repo.GetProfileByUserID(context.Background(), uuid.New())
		if !errors.Is(err, ErrProfileNotFound) {
			t.Fatalf("a user with no profile got err = %v, want ErrProfileNotFound", err)
		}
		if prof != nil {
			t.Fatalf("a user with no profile was handed one: %+v", prof)
		}
	}
}

// And the capability derived from it says none, rather than inheriting the
// invented profile's implied "yes".
func TestMissingProfileMeansNoCapability(t *testing.T) {
	repo := NewFreelanceRepository(nil)

	capability, err := repo.FreelancerCapability(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("capability: %v", err)
	}
	if capability != CapabilityNone {
		t.Errorf("capability for an account with no profile = %q, want %q", capability, CapabilityNone)
	}
}

// A read must never be a write. Asking about a profile, repeatedly, must leave
// the repository holding exactly as many profiles as before - which is the
// property that makes "no implicit provisioning" true rather than merely
// intended.
func TestReadsCreateNoProfiles(t *testing.T) {
	repo := NewFreelanceRepository(nil).(*pgxFreelanceRepository)

	for i := 0; i < 10; i++ {
		userID := uuid.New()
		_, _ = repo.GetProfileByUserID(context.Background(), userID)
		_, _ = repo.FreelancerCapability(context.Background(), userID)
	}

	repo.mu.RLock()
	defer repo.mu.RUnlock()
	if len(repo.profiles) != 0 {
		t.Errorf("%d freelancer profiles exist after read-only calls, want 0", len(repo.profiles))
	}
}

// A repository built fresh holds no records at all.
//
// NewFreelanceRepository used to call seedDefaultData, which installed two
// projects, a proposal, a contract and a "Principal Go & Distributed Systems
// Architect" profile for one hardcoded user id - into the very maps the pooled
// read paths fell back to when a database lookup missed. A project that did not
// exist was therefore answered with a fabricated one.
func TestNewRepositoryIsEmpty(t *testing.T) {
	repo := NewFreelanceRepository(nil).(*pgxFreelanceRepository)

	repo.mu.RLock()
	defer repo.mu.RUnlock()
	for name, count := range map[string]int{
		"profiles":  len(repo.profiles),
		"projects":  len(repo.projects),
		"proposals": len(repo.proposals),
		"contracts": len(repo.contracts),
	} {
		if count != 0 {
			t.Errorf("a new repository holds %d seeded %s, want 0", count, name)
		}
	}
}

// TestNoFabricatedBusinessDataInProductionPaths is the source-level half.
//
// The behavioural tests above cover the fallback that existed. This catches the
// shape of the ones that did: a literal person, rate or company written into a
// value the production code returns. It is scoped to the non-test files of this
// package, so fixtures and tests may still contain whatever they need.
func TestNoFabricatedBusinessDataInProductionPaths(t *testing.T) {
	// Strings that only ever appeared in this module as invented business data.
	banned := []string{
		"Alex Rivera",
		"Software Engineer & Consultant",
		"Principal Go & Distributed Systems Architect",
		"Enterprise Global Partners",
	}

	fset := token.NewFileSet()
	pkgs, err := parser.ParseDir(fset, ".", func(info fs.FileInfo) bool {
		return !strings.HasSuffix(info.Name(), "_test.go")
	}, 0)
	if err != nil {
		t.Fatalf("parse package: %v", err)
	}

	for _, pkg := range pkgs {
		for path, file := range pkg.Files {
			ast.Inspect(file, func(n ast.Node) bool {
				lit, ok := n.(*ast.BasicLit)
				if !ok || lit.Kind != token.STRING {
					return true
				}
				for _, phrase := range banned {
					if strings.Contains(lit.Value, phrase) {
						t.Errorf("%s:%d: fabricated business data %q in a production path",
							path, fset.Position(lit.Pos()).Line, phrase)
					}
				}
				return true
			})
		}
	}
}
