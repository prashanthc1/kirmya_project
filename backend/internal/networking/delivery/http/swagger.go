package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the networking module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetRecommendations documents GET /api/v1/networking/recommendations.
//
// @Summary      Get recommendations
// @Description  Returns recommendations via the Kirmya networking module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/networking/recommendations [get]
func swaggerGetRecommendations() {}

// swaggerListConnections documents GET /api/v1/networking/connections.
//
// @Summary      List connections
// @Description  Returns a list of connections via the Kirmya networking module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/networking/connections [get]
func swaggerListConnections() {}

// swaggerListIncomingRequests documents GET /api/v1/networking/requests.
//
// @Summary      List incoming requests
// @Description  Returns a list of incoming requests via the Kirmya networking module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/networking/requests [get]
func swaggerListIncomingRequests() {}

// swaggerSendRequest documents POST /api/v1/networking/requests.
//
// @Summary      Send request
// @Description  Sends request via the Kirmya networking module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  SendRequestPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/networking/requests [post]
func swaggerSendRequest() {}

// swaggerUpdateRequest documents PUT /api/v1/networking/requests/{id}.
//
// @Summary      Update request
// @Description  Updates request via the Kirmya networking module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  UpdateRequestPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/networking/requests/{id} [put]
func swaggerUpdateRequest() {}

// swaggerBlockUser documents POST /api/v1/networking/blocks.
//
// @Summary      Block user
// @Description  Blocks user via the Kirmya networking module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  BlockUserPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/networking/blocks [post]
func swaggerBlockUser() {}

// swaggerUnblockUser documents DELETE /api/v1/networking/blocks/{userId}.
//
// @Summary      Unblock user
// @Description  Unblocks user via the Kirmya networking module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        userId  path  string  true  "User id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/networking/blocks/{userId} [delete]
func swaggerUnblockUser() {}

// swaggerSaveNote documents POST /api/v1/network/notes.
//
// @Summary      Save connection note
// @Description  Saves or updates a private note attached to a connection.
// @Tags         Networking
// @Accept       json
// @Produce      json
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/notes [post]
func swaggerSaveNote() {}

// swaggerGetNote documents GET /api/v1/network/notes/{targetUserId}.
//
// @Summary      Get connection note
// @Description  Retrieves a private note attached to a connection.
// @Tags         Networking
// @Produce      json
// @Param        targetUserId  path  string  true  "Target User ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/notes/{targetUserId} [get]
func swaggerGetNote() {}

// swaggerDeleteNote documents DELETE /api/v1/network/notes/{targetUserId}.
//
// @Summary      Delete connection note
// @Description  Deletes a private note attached to a connection.
// @Tags         Networking
// @Produce      json
// @Param        targetUserId  path  string  true  "Target User ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/notes/{targetUserId} [delete]
func swaggerDeleteNote() {}

// swaggerAddLabel documents POST /api/v1/network/labels.
//
// @Summary      Add connection label
// @Description  Assigns a tag or label to a connection.
// @Tags         Networking
// @Accept       json
// @Produce      json
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/labels [post]
func swaggerAddLabel() {}

// swaggerGetLabels documents GET /api/v1/network/labels/{targetUserId}.
//
// @Summary      Get connection labels
// @Description  Retrieves all labels assigned to a connection.
// @Tags         Networking
// @Produce      json
// @Param        targetUserId  path  string  true  "Target User ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/labels/{targetUserId} [get]
func swaggerGetLabels() {}

// swaggerRemoveLabel documents DELETE /api/v1/network/labels/{targetUserId}/{label}.
//
// @Summary      Remove connection label
// @Description  Removes a specific label from a connection.
// @Tags         Networking
// @Produce      json
// @Param        targetUserId  path  string  true  "Target User ID"
// @Param        label         path  string  true  "Label text"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/labels/{targetUserId}/{label} [delete]
func swaggerRemoveLabel() {}

// swaggerCreateGoal documents POST /api/v1/network/goals.
//
// @Summary      Create networking goal
// @Description  Creates a new professional networking objective.
// @Tags         Networking
// @Accept       json
// @Produce      json
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/goals [post]
func swaggerCreateGoal() {}

// swaggerGetGoals documents GET /api/v1/network/goals.
//
// @Summary      Get networking goals
// @Description  Retrieves all networking goals for the current user.
// @Tags         Networking
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/goals [get]
func swaggerGetGoals() {}

// swaggerUpdateGoal documents PUT /api/v1/network/goals/{id}.
//
// @Summary      Update networking goal
// @Description  Updates progress or details for a networking goal.
// @Tags         Networking
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Goal ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/goals/{id} [put]
func swaggerUpdateGoal() {}

// swaggerDeleteGoal documents DELETE /api/v1/network/goals/{id}.
//
// @Summary      Delete networking goal
// @Description  Deletes a networking goal.
// @Tags         Networking
// @Produce      json
// @Param        id  path  string  true  "Goal ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/goals/{id} [delete]
func swaggerDeleteGoal() {}

// swaggerGetCompanyConnections documents GET /api/v1/network/company-connections/{companyId}.
//
// @Summary      Get company connections
// @Description  Discovers active connections working at a specific company.
// @Tags         Networking
// @Produce      json
// @Param        companyId  path  string  true  "Company ID or Name"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/company-connections/{companyId} [get]
func swaggerGetCompanyConnections() {}

// swaggerGetFollowing documents GET /api/v1/network/following.
//
// @Summary      Get following users
// @Description  Retrieves all users the current user is following.
// @Tags         Networking
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/following [get]
func swaggerGetFollowing() {}

// swaggerGetFollowers documents GET /api/v1/network/followers.
//
// @Summary      Get followers
// @Description  Retrieves all users following the current user.
// @Tags         Networking
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/network/followers [get]
func swaggerGetFollowers() {}


// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
