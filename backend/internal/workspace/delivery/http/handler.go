// Package http exposes the one workspace operation a client performs: choosing
// which workspace to come back to.
//
// There is deliberately no endpoint here that lists workspaces. The list is
// served by /auth/me, with the account's profile and permissions, because it is
// bootstrap data that every page needs and a second endpoint serving the same
// list would be a second answer free to disagree with the first.
//
// Nothing in this package authorizes anything. Choosing a workspace grants no
// access; the routes a chosen workspace leads to authorize their own requests,
// exactly as they did before any of this existed.
package http

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	sharedMiddleware "kirmya/internal/shared/middleware"
	"kirmya/internal/workspace/domain"
	"kirmya/internal/workspace/service"
)

// CodeWorkspaceNotAvailable means the caller asked to remember a workspace that
// is not in their own list.
const CodeWorkspaceNotAvailable = "WORKSPACE_NOT_AVAILABLE"

// maxKeyLength bounds the stored key. A key is a type name or type:uuid, so
// this is far above any legitimate value and exists only so an unbounded body
// cannot become an unbounded row.
const maxKeyLength = 128

// WorkspaceHandler serves the workspace preference.
type WorkspaceHandler struct {
	preferences *service.PreferenceService
}

// NewWorkspaceHandler builds the handler.
func NewWorkspaceHandler(preferences *service.PreferenceService) *WorkspaceHandler {
	return &WorkspaceHandler{preferences: preferences}
}

// selectRequest is the body of a workspace selection.
type selectRequest struct {
	// Key is the workspace to remember, as served in /auth/me's workspaces.
	Key string `json:"key" binding:"required"`
}

// SelectWorkspace records which workspace the caller last chose to enter.
//
// PUT rather than POST: there is one preference per account and writing it
// twice with the same key leaves the same state, so the operation is idempotent
// and the verb should say so.
//
// The key is checked against the caller's own resolved workspace list before it
// is stored. That check protects no data - a stored key confers nothing - but it
// keeps the store meaningful: a key that resolves to nothing would be discarded
// when served, leaving a row that looks like a preference and behaves like none.
func (h *WorkspaceHandler) SelectWorkspace(c *gin.Context) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		// AuthRequired runs first on this group, so reaching here means the
		// group was wired without it. Refuse rather than assume.
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
			"code":  "UNAUTHENTICATED",
		})
		return
	}

	var req selectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"error": "A workspace key is required",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	key := strings.TrimSpace(req.Key)
	if key == "" || len(key) > maxKeyLength {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
			"error": "A workspace key is required",
			"code":  "INVALID_REQUEST",
		})
		return
	}

	// The user id comes from the verified token, never from the body, so one
	// account cannot write another's preference by naming it.
	err := h.preferences.Select(c.Request.Context(), userID, key)
	switch {
	case err == nil:
		c.Status(http.StatusNoContent)
	case errors.Is(err, service.ErrWorkspaceNotAvailable),
		errors.Is(err, domain.ErrAccountNotEligible):
		// Both mean the same thing to the caller: this is not one of your
		// workspaces. They are not distinguished, because which of the two it
		// is describes the account rather than the request.
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": "That workspace is not available to this account.",
			"code":  CodeWorkspaceNotAvailable,
		})
	default:
		// A failed resolution is an outage, not a refusal. Answering 403 here
		// would report one as the other.
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"error": "The workspace selection could not be saved",
			"code":  "INTERNAL_ERROR",
		})
	}
}
