package http

import (
	"kirmya/internal/common/swagger"
)

// swaggerSelectWorkspace documents PUT /api/v1/workspace/preference.
//
// @Summary      Remember the chosen workspace
// @Description  Records which workspace this account last chose to enter, so a later sign-in with no returnUrl opens there instead of the feed. The key must be one the account's own workspace list contains, as served by GET /api/v1/auth/me. Selecting a workspace grants no access: the routes it leads to authorize their own requests, and the stored key is checked again against the live list whenever it is served.
// @Tags         Workspace
// @Accept       json
// @Produce      json
// @Param        request  body      selectRequest  true  "The workspace key to remember"
// @Success      204      "The choice was recorded"
// @Failure      400      {object}  swagger.ErrorResponse  "No workspace key, or one too long to be a key"
// @Failure      401      {object}  swagger.ErrorResponse  "Not authenticated"
// @Failure      403      {object}  swagger.ErrorResponse  "That workspace is not in this account's list"
// @Failure      500      {object}  swagger.ErrorResponse  "The workspace list could not be resolved"
// @Security     BearerAuth
// @Router       /api/v1/workspace/preference [put]
func swaggerSelectWorkspace() {}

// Anchor symbols for compilation check
var (
	_ swagger.ErrorResponse
)
