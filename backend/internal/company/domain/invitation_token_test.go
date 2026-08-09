package domain

import (
	"encoding/base64"
	"strings"
	"testing"
	"time"
)

// Two invitations must never share a token, and the token must carry the full
// entropy it claims. A repeat here would mean one recipient's link opening
// another recipient's invitation.
func TestNewInvitationTokenIsUniqueAndFullLength(t *testing.T) {
	const iterations = 500
	seen := make(map[string]bool, iterations)

	for i := 0; i < iterations; i++ {
		plaintext, hash, err := NewInvitationToken()
		if err != nil {
			t.Fatalf("mint token: %v", err)
		}
		if seen[plaintext] {
			t.Fatalf("token repeated after %d mints", i)
		}
		if seen[hash] {
			t.Fatalf("hash repeated after %d mints", i)
		}
		seen[plaintext] = true
		seen[hash] = true

		raw, err := base64.RawURLEncoding.DecodeString(plaintext)
		if err != nil {
			t.Fatalf("token is not base64url: %v", err)
		}
		if len(raw) != invitationTokenBytes {
			t.Fatalf("token carries %d bytes of entropy, want %d", len(raw), invitationTokenBytes)
		}
	}
}

// The stored value must not be the link. A database dump has to be useless for
// accepting invitations.
func TestStoredHashIsNotThePlaintext(t *testing.T) {
	plaintext, hash, err := NewInvitationToken()
	if err != nil {
		t.Fatalf("mint token: %v", err)
	}

	if hash == plaintext {
		t.Fatal("the stored hash is the plaintext token")
	}
	if strings.Contains(hash, plaintext) || strings.Contains(plaintext, hash) {
		t.Fatal("the stored hash embeds the plaintext token")
	}
	if len(hash) != 64 {
		t.Fatalf("hash is %d characters, want a 64-character sha256 digest", len(hash))
	}
}

// Only the token that was minted opens the invitation.
func TestInvitationTokenMatches(t *testing.T) {
	plaintext, hash, err := NewInvitationToken()
	if err != nil {
		t.Fatalf("mint token: %v", err)
	}
	other, _, err := NewInvitationToken()
	if err != nil {
		t.Fatalf("mint token: %v", err)
	}

	if !InvitationTokenMatches(plaintext, hash) {
		t.Error("the minted token did not match its own hash")
	}
	if InvitationTokenMatches(other, hash) {
		t.Error("a different invitation's token matched")
	}
	if InvitationTokenMatches(plaintext[:len(plaintext)-1], hash) {
		t.Error("a truncated token matched")
	}
	if InvitationTokenMatches(plaintext+"a", hash) {
		t.Error("an extended token matched")
	}
	if InvitationTokenMatches(hash, hash) {
		t.Error("presenting the stored hash as the token was accepted")
	}
}

// Whitespace from a copied link is tolerated; the hash is stored uppercase or
// lowercase by nobody's choice, so casing must not decide access either way.
func TestInvitationTokenMatchesNormalises(t *testing.T) {
	plaintext, hash, err := NewInvitationToken()
	if err != nil {
		t.Fatalf("mint token: %v", err)
	}

	if !InvitationTokenMatches("  "+plaintext+"\n", hash) {
		t.Error("a token with surrounding whitespace was rejected")
	}
	if !InvitationTokenMatches(plaintext, strings.ToUpper(hash)) {
		t.Error("an uppercase stored hash was rejected")
	}
}

// Empty is never a match. Without this an invitation row whose hash failed to
// load would accept a caller presenting nothing.
func TestInvitationTokenRejectsEmptyValues(t *testing.T) {
	_, hash, err := NewInvitationToken()
	if err != nil {
		t.Fatalf("mint token: %v", err)
	}

	if InvitationTokenMatches("", hash) {
		t.Error("an empty token matched a real hash")
	}
	if InvitationTokenMatches("anything", "") {
		t.Error("a token matched an empty hash")
	}
	if InvitationTokenMatches("", "") {
		t.Error("empty matched empty")
	}
	if InvitationTokenMatches("   ", hash) {
		t.Error("whitespace matched a real hash")
	}
}

// The link has to stop working. A week is the documented window; the point of
// asserting it is that removing the expiry would otherwise be invisible.
func TestInvitationTTLIsBounded(t *testing.T) {
	if InvitationTTL <= 0 {
		t.Fatal("invitations never expire")
	}
	if InvitationTTL > 30*24*time.Hour {
		t.Fatalf("invitation window of %v is too long to be a security boundary", InvitationTTL)
	}
	if InvitationTTL != 7*24*time.Hour {
		t.Errorf("InvitationTTL = %v, want 7 days", InvitationTTL)
	}
}
