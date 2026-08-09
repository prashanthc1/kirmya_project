package http

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/repository"
	"kirmya/internal/company/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// respondError turns a domain error into a status code and a message the caller
// can act on.
//
// Anything unrecognised becomes a flat 500 with a fixed message: an unexpected
// error is usually a database error, and database errors quote table names,
// column names and sometimes row values. Those belong in the log, not in a
// response body.
func respondError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrUnauthenticated):
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sign in to continue"})
	case errors.Is(err, domain.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"error": userMessage(err, "You do not have permission to do that")})
	case errors.Is(err, domain.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	case errors.Is(err, domain.ErrConflict):
		c.JSON(http.StatusConflict, gin.H{"error": userMessage(err, "That conflicts with something that already exists")})
	case errors.Is(err, domain.ErrValidation):
		c.JSON(http.StatusBadRequest, gin.H{"error": userMessage(err, "The request was not valid")})
	case errors.Is(err, repository.ErrNoDatabase):
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Company data is unavailable"})
	default:
		c.Error(err) //nolint:errcheck // recorded for the logging middleware
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Something went wrong"})
	}
}

// userMessage extracts the explanatory half of a wrapped sentinel error, which
// the service layer writes as "sentinel: explanation".
func userMessage(err error, fallback string) string {
	msg := err.Error()
	if idx := strings.Index(msg, ": "); idx >= 0 && idx+2 < len(msg) {
		return strings.ToUpper(msg[idx+2:idx+3]) + msg[idx+3:]
	}
	return fallback
}

// actorFrom builds the caller identity from the context the auth middleware
// populated.
//
// An absent user is the zero Actor, not a stand-in account. The service layer
// refuses writes from an unauthenticated actor, so a route that loses its
// middleware fails closed instead of writing under somebody else's id.
func actorFrom(c *gin.Context) service.Actor {
	actor := service.Actor{
		IP:        c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}
	if val, ok := c.Get("userID"); ok {
		switch id := val.(type) {
		case uuid.UUID:
			actor.UserID = id
		case string:
			if parsed, err := uuid.Parse(id); err == nil {
				actor.UserID = parsed
			}
		}
	}
	if val, ok := c.Get("email"); ok {
		if email, ok := val.(string); ok {
			actor.Email = email
		}
	}
	if val, ok := c.Get("role"); ok {
		if role, ok := val.(string); ok {
			actor.PlatformRole = role
		}
	}
	return actor
}

// pathUUID reads a uuid path parameter, answering with 400 when it is malformed.
func pathUUID(c *gin.Context, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(name))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid " + name})
		return uuid.Nil, false
	}
	return id, true
}

// pagination reads page and limit from the query string.
func pagination(c *gin.Context, defaultLimit int) (int, int) {
	page, _ := strconv.Atoi(c.Query("page"))
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = defaultLimit
	}
	return page, limit
}
