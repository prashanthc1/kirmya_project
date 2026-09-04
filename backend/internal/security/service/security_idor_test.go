package service

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"

	"kirmya/internal/security/models"
	"kirmya/internal/security/repository"
)

// The /security/* routes are gated on AuthRequired alone, and correctly so:
// they are self-scoped account-management endpoints, not administrative ones. A
// role check would be the wrong tool. What actually protects them is that the
// service refuses to act on a resource belonging to somebody else.
//
// That protection existed but had no test. These cover it, because "revoke a
// session by id" is precisely the shape of endpoint where a missing ownership
// check lets any authenticated user log another user out, drop their trusted
// device, or revoke their API key.

func newSecurityFixture() (SecurityService, context.Context) {
	// nil pool selects the repository's in-memory path, which keeps per-user
	// collections and so exercises the same ownership branch as PostgreSQL.
	return NewSecurityService(repository.NewSecurityRepository(nil)), context.Background()
}

func assertIDOR(t *testing.T, err error, action string) {
	t.Helper()
	if err == nil {
		t.Fatalf("%s across accounts succeeded; it must be refused", action)
	}
	if !strings.Contains(err.Error(), "FORBIDDEN_IDOR") {
		t.Fatalf("%s failed with %q, want a FORBIDDEN_IDOR refusal", action, err)
	}
}

func TestRevokeAPIKey_RejectsAnotherUsersKey(t *testing.T) {
	svc, ctx := newSecurityFixture()
	owner, attacker := uuid.New(), uuid.New()

	created, err := svc.CreateAPIKey(ctx, owner, models.CreateAPIKeyPayload{Name: "owner-key"})
	if err != nil {
		t.Fatalf("seed api key: %v", err)
	}

	assertIDOR(t, svc.RevokeAPIKey(ctx, attacker, created.APIKey.ID), "revoking an API key")

	// The owner must still be able to revoke their own key: the guard has to
	// deny the attacker without breaking the legitimate path.
	if err := svc.RevokeAPIKey(ctx, owner, created.APIKey.ID); err != nil {
		t.Fatalf("owner could not revoke their own API key: %v", err)
	}
}

func TestRemoveDevice_RejectsAnotherUsersDevice(t *testing.T) {
	svc, ctx := newSecurityFixture()
	owner, attacker := uuid.New(), uuid.New()

	device, err := svc.RegisterDevice(ctx, owner, models.DeviceItem{DeviceID: "owner-laptop", Platform: "macos"})
	if err != nil {
		t.Fatalf("seed device: %v", err)
	}

	assertIDOR(t, svc.RemoveDevice(ctx, attacker, device.ID), "removing a device")

	if err := svc.RemoveDevice(ctx, owner, device.ID); err != nil {
		t.Fatalf("owner could not remove their own device: %v", err)
	}
}

func TestUpdateDeviceTrustStatus_RejectsAnotherUsersDevice(t *testing.T) {
	svc, ctx := newSecurityFixture()
	owner, attacker := uuid.New(), uuid.New()

	device, err := svc.RegisterDevice(ctx, owner, models.DeviceItem{DeviceID: "owner-phone", Platform: "ios"})
	if err != nil {
		t.Fatalf("seed device: %v", err)
	}

	// Marking someone else's device trusted is the more dangerous direction of
	// this call, so it is the one asserted.
	assertIDOR(t, svc.UpdateDeviceTrustStatus(ctx, attacker, device.ID, "trusted"),
		"marking a device trusted")

	if err := svc.UpdateDeviceTrustStatus(ctx, owner, device.ID, "trusted"); err != nil {
		t.Fatalf("owner could not update their own device: %v", err)
	}
}

// TestSecurityService_OwnershipGuardsAreConsistent pins the set of operations
// that carry an ownership check. If a future privileged, id-addressed operation
// is added to this service without one, this list is where the omission shows.
func TestSecurityService_OwnershipGuardsAreConsistent(t *testing.T) {
	svc, ctx := newSecurityFixture()
	owner, attacker := uuid.New(), uuid.New()

	key, err := svc.CreateAPIKey(ctx, owner, models.CreateAPIKeyPayload{Name: "k"})
	if err != nil {
		t.Fatalf("seed api key: %v", err)
	}
	device, err := svc.RegisterDevice(ctx, owner, models.DeviceItem{DeviceID: "d", Platform: "linux"})
	if err != nil {
		t.Fatalf("seed device: %v", err)
	}

	for name, call := range map[string]func() error{
		"RevokeAPIKey":            func() error { return svc.RevokeAPIKey(ctx, attacker, key.APIKey.ID) },
		"RemoveDevice":            func() error { return svc.RemoveDevice(ctx, attacker, device.ID) },
		"UpdateDeviceTrustStatus": func() error { return svc.UpdateDeviceTrustStatus(ctx, attacker, device.ID, "trusted") },
	} {
		t.Run(name, func(t *testing.T) {
			assertIDOR(t, call(), name)
		})
	}
}
