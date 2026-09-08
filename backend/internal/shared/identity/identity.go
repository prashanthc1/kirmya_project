// Package identity resolves who an authenticated caller is, from the database
// rather than from anything the caller sent.
//
// Three modules used to stamp a display name onto records they created -
// assessment results and the skill badges issued from them, event attendee
// rows, interview feedback - and all three read it from a gin context key that
// no middleware ever sets. The fallback filled in a person who does not exist:
// "Alex Rivera", with the address alex.rivera@example.com, on real records. The
// event module went further and accepted the name and email from the request
// body, so an attendee list could be filled with anyone.
package identity

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Person is the identity a record should be attributed to.
type Person struct {
	Name  string
	Email string
}

// ErrUnavailable is returned when there is no database to resolve against.
var ErrUnavailable = errors.New("identity lookup requires PostgreSQL")

// Resolve returns the name and address recorded for a user. The name falls back
// to the address when the account has no name, because an address is at least
// theirs.
func Resolve(ctx context.Context, pool *pgxpool.Pool, userID uuid.UUID) (Person, error) {
	if pool == nil {
		return Person{}, ErrUnavailable
	}
	var p Person
	err := pool.QueryRow(ctx, `
		SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), email), email
		FROM users
		WHERE id = $1`, userID).Scan(&p.Name, &p.Email)
	if err != nil {
		return Person{}, err
	}
	return p, nil
}
