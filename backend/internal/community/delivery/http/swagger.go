package http

import (
	"kirmya/internal/common/swagger"
)

// This file carries the OpenAPI (swagger) contract for the community module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.

// swaggerListCommunities documents GET /api/v1/communities.
//
// @Summary      List communities
// @Description  Returns a list of communities via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        category    query  string  false  "Filter by category"
// @Param        location    query  string  false  "Filter by location"
// @Param        visibility  query  string  false  "Filter by visibility (public, private, invite_only)"
// @Param        query       query  string  false  "Search query"
// @Success      200  {array}   models.Community
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities [get]
func swaggerListCommunities() {}

// swaggerGetRecommendedCommunities documents GET /api/v1/communities/recommendations.
//
// @Summary      Get recommended communities
// @Description  Returns community recommendations tailored to user skills and industry.
// @Tags         Communities
// @Produce      json
// @Param        skills    query  string  false  "Comma separated skills"
// @Param        industry  query  string  false  "User industry"
// @Success      200  {array}   models.Community
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/recommendations [get]
func swaggerGetRecommendedCommunities() {}

// swaggerCreateCommunity documents POST /api/v1/communities.
//
// @Summary      Create community
// @Description  Creates community via the Kirmya community module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  models.CreateCommunityDTO  true  "Request payload"
// @Success      201  {object}  models.Community
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities [post]
func swaggerCreateCommunity() {}

// swaggerGetCommunity documents GET /api/v1/communities/{id}.
//
// @Summary      Get community details
// @Description  Returns details for a specific community.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {object}  models.Community
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id} [get]
func swaggerGetCommunity() {}

// swaggerUpdateCommunity documents PUT /api/v1/communities/{id}.
//
// @Summary      Update community details
// @Description  Updates settings for a specific community workspace.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id       path  string                     true  "Community ID"
// @Param        request  body  models.UpdateCommunityDTO  true  "Request payload"
// @Success      200  {object}  models.Community
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id} [put]
func swaggerUpdateCommunity() {}

// swaggerJoinCommunity documents POST /api/v1/communities/{id}/join.
//
// @Summary      Join community
// @Description  Joins community workspace via request.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/join [post]
func swaggerJoinCommunity() {}

// swaggerLeaveCommunity documents POST /api/v1/communities/{id}/leave.
//
// @Summary      Leave community
// @Description  Leaves community workspace.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/leave [post]
func swaggerLeaveCommunity() {}

// swaggerListMembers documents GET /api/v1/communities/{id}/members.
//
// @Summary      List community members
// @Description  Returns member directory for a community.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {array}   models.CommunityMember
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/members [get]
func swaggerListMembers() {}

// swaggerApproveMembership documents PUT /api/v1/communities/{id}/memberships.
//
// @Summary      Approve membership
// @Description  Approves or rejects pending join request.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id       path  string                true  "Community ID"
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
// @Description  Assigns owner/admin/moderator/member role to a user in community.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id       path  string             true  "Community ID"
// @Param        request  body  AssignRolePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/roles [put]
func swaggerAssignRole() {}

// swaggerListPendingRequests documents GET /api/v1/communities/{id}/requests.
//
// @Summary      List pending join requests
// @Description  Lists pending join requests for community workspace.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {array}   models.CommunityMember
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/requests [get]
func swaggerListPendingRequests() {}

// swaggerInviteUser documents POST /api/v1/communities/{id}/invites.
//
// @Summary      Invite user to community
// @Description  Sends an invite to a user to join community.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id       path  string             true  "Community ID"
// @Param        request  body  InviteUserPayload  true  "Request payload"
// @Success      201  {object}  models.CommunityInvite
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/invites [post]
func swaggerInviteUser() {}

// swaggerRespondToInvite documents POST /api/v1/communities/invites/{inviteId}/respond.
//
// @Summary      Respond to community invitation
// @Description  Accepts or declines a community invitation.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        inviteId  path  string                true  "Invite ID"
// @Param        request   body  RespondInvitePayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/invites/{inviteId}/respond [post]
func swaggerRespondToInvite() {}

// swaggerCreatePost documents POST /api/v1/communities/{id}/posts.
//
// @Summary      Create discussion post
// @Description  Creates a discussion post in community.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id       path  string                    true  "Community ID"
// @Param        request  body  models.CreateDiscussionDTO true "Request payload"
// @Success      201  {object}  models.CommunityPost
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts [post]
func swaggerCreatePost() {}

// swaggerListPosts documents GET /api/v1/communities/{id}/posts.
//
// @Summary      List community posts
// @Description  Returns list of discussion posts in community.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {array}   models.CommunityPost
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts [get]
func swaggerListPosts() {}

// swaggerGetPost documents GET /api/v1/communities/{id}/posts/{postId}.
//
// @Summary      Get post details
// @Description  Returns details for a specific post.
// @Tags         Communities
// @Produce      json
// @Param        id      path  string  true  "Community ID"
// @Param        postId  path  string  true  "Post ID"
// @Success      200  {object}  models.CommunityPost
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts/{postId} [get]
func swaggerGetPost() {}

// swaggerDeletePost documents DELETE /api/v1/communities/{id}/posts/{postId}.
//
// @Summary      Delete post
// @Description  Deletes discussion post from community.
// @Tags         Communities
// @Produce      json
// @Param        id      path  string  true  "Community ID"
// @Param        postId  path  string  true  "Post ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts/{postId} [delete]
func swaggerDeletePost() {}

// swaggerPinPost documents PUT /api/v1/communities/{id}/posts/{postId}/pin.
//
// @Summary      Pin post
// @Description  Pins or unpins post in community.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id      path  string          true  "Community ID"
// @Param        postId  path  string          true  "Post ID"
// @Param        request body  PinPostPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts/{postId}/pin [put]
func swaggerPinPost() {}

// swaggerLockPost documents PUT /api/v1/communities/{id}/posts/{postId}/lock.
//
// @Summary      Lock post
// @Description  Locks or unlocks discussion thread.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id      path  string           true  "Community ID"
// @Param        postId  path  string           true  "Post ID"
// @Param        request body  LockPostPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts/{postId}/lock [put]
func swaggerLockPost() {}

// swaggerCreateComment documents POST /api/v1/communities/{id}/posts/{postId}/comments.
//
// @Summary      Create comment
// @Description  Adds comment to a community post.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id      path  string                 true  "Community ID"
// @Param        postId  path  string                 true  "Post ID"
// @Param        request body  models.CreateCommentDTO true  "Request payload"
// @Success      201  {object}  models.CommunityComment
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts/{postId}/comments [post]
func swaggerCreateComment() {}

// swaggerListComments documents GET /api/v1/communities/{id}/posts/{postId}/comments.
//
// @Summary      List post comments
// @Description  Returns comments on a post.
// @Tags         Communities
// @Produce      json
// @Param        id      path  string  true  "Community ID"
// @Param        postId  path  string  true  "Post ID"
// @Success      200  {array}   models.CommunityComment
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/posts/{postId}/comments [get]
func swaggerListComments() {}

// swaggerCreateEvent documents POST /api/v1/communities/{id}/events.
//
// @Summary      Create event
// @Description  Schedules a new community event.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id      path  string                          true  "Community ID"
// @Param        request body  models.CreateCommunityEventDTO  true  "Request payload"
// @Success      201  {object}  models.CommunityEvent
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/events [post]
func swaggerCreateEvent() {}

// swaggerListEvents documents GET /api/v1/communities/{id}/events.
//
// @Summary      List community events
// @Description  Returns upcoming community events.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {array}   models.CommunityEvent
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/events [get]
func swaggerListEvents() {}

// swaggerCreateResource documents POST /api/v1/communities/{id}/resources.
//
// @Summary      Create resource
// @Description  Shares a knowledge resource in community.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id      path  string                           true  "Community ID"
// @Param        request body  models.CreateCommunityResourceDTO true  "Request payload"
// @Success      201  {object}  models.CommunityResource
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/resources [post]
func swaggerCreateResource() {}

// swaggerListResources documents GET /api/v1/communities/{id}/resources.
//
// @Summary      List community resources
// @Description  Returns shared resources in community.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {array}   models.CommunityResource
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/resources [get]
func swaggerListResources() {}

// swaggerModerateMember documents POST /api/v1/communities/{id}/moderation/moderate.
//
// @Summary      Moderate member
// @Description  Applies moderation action (warn, remove_post, lock_discussion, ban_member).
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id      path  string                   true  "Community ID"
// @Param        request body  models.ModerateMemberDTO true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/moderation/moderate [post]
func swaggerModerateMember() {}

// swaggerListModerationActions documents GET /api/v1/communities/{id}/moderation/actions.
//
// @Summary      List moderation log
// @Description  Returns audit log of moderation actions in community.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {array}   models.CommunityModerationAction
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/moderation/actions [get]
func swaggerListModerationActions() {}

// swaggerReportPost documents POST /api/v1/communities/reports.
//
// @Summary      Report post
// @Description  Flags post for moderation review.
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

// swaggerListReports documents GET /api/v1/communities/{id}/reports.
//
// @Summary      List reported content
// @Description  Returns list of reported posts for moderation.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Community ID"
// @Success      200  {array}   models.CommunityReport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/communities/{id}/reports [get]
func swaggerListReports() {}

var (
	_ swagger.ErrorResponse
)
