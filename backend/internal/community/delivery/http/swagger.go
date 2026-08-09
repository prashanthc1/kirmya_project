package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the community module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerListCommunities documents GET /api/v1/communities.
//
// @Summary      List communities
// @Description  Returns a list of communities via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities [get]
func swaggerListCommunities() {}

// swaggerCreateCommunity documents POST /api/v1/communities.
//
// @Summary      Create community
// @Description  Creates community via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  CreateCommPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities [post]
func swaggerCreateCommunity() {}

// swaggerJoinCommunity documents POST /api/v1/communities/{id}/join.
//
// @Summary      Join community
// @Description  Joins community via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/join [post]
func swaggerJoinCommunity() {}

// swaggerApproveMembership documents PUT /api/v1/communities/{id}/memberships.
//
// @Summary      Approve membership
// @Description  Approves membership via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  ApproveMemberPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/memberships [put]
func swaggerApproveMembership() {}

// swaggerAssignRole documents PUT /api/v1/communities/{id}/roles.
//
// @Summary      Assign role
// @Description  Assigns role via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  AssignRolePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/roles [put]
func swaggerAssignRole() {}

// swaggerCreatePost documents POST /api/v1/communities/{id}/posts.
//
// @Summary      Create post
// @Description  Creates post via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  CreatePostPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts [post]
func swaggerCreatePost() {}

// swaggerListPosts documents GET /api/v1/communities/{id}/posts.
//
// @Summary      List posts
// @Description  Returns a list of posts via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts [get]
func swaggerListPosts() {}

// swaggerDeletePost documents DELETE /api/v1/communities/{id}/posts/{postId}.
//
// @Summary      Delete post
// @Description  Deletes post via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        postId  path  string  true  "Post id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts/{postId} [delete]
func swaggerDeletePost() {}

// swaggerReportPost documents POST /api/v1/communities/reports.
//
// @Summary      Report post
// @Description  Reports post via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  ReportPostPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/reports [post]
func swaggerReportPost() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ swagger.ErrorResponse
)
