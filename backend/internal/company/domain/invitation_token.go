package domain

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"strings"
)

// invitationTokenBytes is the entropy behind an invitation link. 32 bytes is
// past the point where guessing is a consideration, and the base64url encoding
// keeps the link copy-pasteable.
const invitationTokenBytes = 32

// NewInvitationToken mints an invitation token and returns the plaintext to put
// in the link alongside the hash to store.
//
// The plaintext is never persisted. An attacker with a database dump gets the
// hashes, which cannot be turned back into working invitation links.
func NewInvitationToken() (plaintext string, hash string, err error) {
	raw := make([]byte, invitationTokenBytes)
	if _, err := rand.Read(raw); err != nil {
		return "", "", fmt.Errorf("generate invitation token: %w", err)
	}
	plaintext = base64.RawURLEncoding.EncodeToString(raw)
	return plaintext, HashInvitationToken(plaintext), nil
}

// HashInvitationToken is the one-way transform applied before storage and
// before lookup. SHA-256 rather than bcrypt: the token is 256 bits of random
// data, so there is no dictionary to defend against, and lookups must be a
// single indexed query.
func HashInvitationToken(plaintext string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(plaintext)))
	return hex.EncodeToString(sum[:])
}

// InvitationTokenMatches compares a presented token against a stored hash in
// constant time, so a caller cannot learn a prefix from response timing.
func InvitationTokenMatches(plaintext, storedHash string) bool {
	if plaintext == "" || storedHash == "" {
		return false
	}
	computed := HashInvitationToken(plaintext)
	return subtle.ConstantTimeCompare([]byte(computed), []byte(strings.ToLower(storedHash))) == 1
}
