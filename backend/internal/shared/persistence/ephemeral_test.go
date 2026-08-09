package persistence

import (
	"strings"
	"testing"
)

func TestRegisteredIsDeduplicatedAndOrdered(t *testing.T) {
	Reset()
	t.Cleanup(Reset)

	RegisterEphemeral(Ephemeral{Module: "verification", Data: "codes", Consequence: "codes stop validating"})
	RegisterEphemeral(Ephemeral{Module: "referral", Data: "referrals", Consequence: "rewards vanish"})
	// Constructors run per test binary and per wiring pass, so a module must
	// not accumulate entries.
	RegisterEphemeral(Ephemeral{Module: "verification", Data: "codes", Consequence: "codes stop validating"})

	got := Registered()
	if len(got) != 2 {
		t.Fatalf("expected 2 modules, got %d: %+v", len(got), got)
	}
	if got[0].Module != "referral" || got[1].Module != "verification" {
		t.Errorf("expected modules ordered by name, got %s then %s", got[0].Module, got[1].Module)
	}
}

func TestAuditAllowsAnEmptyRegistry(t *testing.T) {
	Reset()
	t.Cleanup(Reset)

	if err := Audit("production", false); err != nil {
		t.Fatalf("expected a clean registry to pass in production, got %v", err)
	}
}

func TestAuditBlocksProductionByDefault(t *testing.T) {
	Reset()
	t.Cleanup(Reset)
	RegisterEphemeral(Ephemeral{Module: "verification", Data: "codes", Consequence: "codes stop validating"})

	err := Audit("production", false)
	if err == nil {
		t.Fatal("expected production to refuse memory-only repositories")
	}
	// The operator has to be able to act on the message without reading source.
	if !strings.Contains(err.Error(), "verification") {
		t.Errorf("expected the offending module named, got %q", err)
	}
	if !strings.Contains(err.Error(), "ALLOW_EPHEMERAL_REPOS") {
		t.Errorf("expected the override documented in the error, got %q", err)
	}
}

func TestAuditAllowsProductionWhenAcknowledged(t *testing.T) {
	Reset()
	t.Cleanup(Reset)
	RegisterEphemeral(Ephemeral{Module: "landing", Data: "seeded marketing copy", Consequence: "content resets"})

	if err := Audit("production", true); err != nil {
		t.Fatalf("expected an acknowledged deployment to start, got %v", err)
	}
}

// TestAuditAllowsNonProduction pins that local development and CI keep working:
// these repositories are what let the API boot without a database.
func TestAuditAllowsNonProduction(t *testing.T) {
	Reset()
	t.Cleanup(Reset)
	RegisterEphemeral(Ephemeral{Module: "search", Data: "indexed documents", Consequence: "results empty out"})

	for _, env := range []string{"development", "staging", ""} {
		if err := Audit(env, false); err != nil {
			t.Errorf("expected %q to start, got %v", env, err)
		}
	}
}
