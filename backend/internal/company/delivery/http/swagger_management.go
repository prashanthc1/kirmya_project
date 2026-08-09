package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/company/models"
	"kirmya/internal/company/service"
)

// This file carries the OpenAPI (swagger) contract for the company and
// organization management module — the half of /api/v1/companies that a company
// runs itself, plus the admin desk that decides verification.
//
// The functions below have no runtime role: swaggo reads their annotations to
// build internal/docs. Regenerate with `make swagger` after changing anything
// here, and `make swagger-validate` will refuse a route that drifts.
//
// Two conventions run through the whole file. Every management route answers
// 404, not 403, when the caller holds nothing on the company named in the path,
// so an outsider cannot learn that a company id exists by probing it; the 403
// documented alongside is for a member who holds a grant on the company but not
// the permission the operation needs. And 503 is the reply when the company
// store is unreachable, which is distinct from the 500 an unexpected fault gets.

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

// swaggerCreateCompany documents POST /api/v1/companies.
//
// @Summary      Create a company
// @Description  Registers a new company and makes the caller its owner. The company starts unverified: a verification badge is only ever granted by a Kirmya administrator, never by this call.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        request  body      models.CompanyCreatePayload  true  "Company to create"
// @Success      201      {object}  models.CompanyDetail
// @Failure      400      {object}  swagger.ErrorResponse  "Payload failed validation"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      409      {object}  swagger.ErrorResponse  "Name or slug already taken"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies [post]
func swaggerCreateCompany() {}

// swaggerGetCompanyByID documents GET /api/v1/companies/{id}.
//
// @Summary      Get a company
// @Description  Returns the public company profile. The path segment accepts either the company id or its slug. A signed-in caller also receives viewer state — whether they follow the company and what they may manage — and the visit is counted towards the company's profile views once the page is known to be visible. Employment relationships are filtered by each person's own privacy setting.
// @Tags         Organizations
// @Produce      json
// @Param        id      path      string  true   "Company id or slug"
// @Param        source  query     string  false  "Where the visit came from, recorded against profile views"
// @Success      200     {object}  models.CompanyDetail
// @Failure      400     {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404     {object}  swagger.ErrorResponse  "No such company"
// @Failure      503     {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/companies/{id} [get]
func swaggerGetCompanyByID() {}

// swaggerUpdateCompany documents PUT /api/v1/companies/{id}.
//
// @Summary      Update a company profile
// @Description  Edits the company profile. Requires the company:edit permission on this company. Verification state is not editable here.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                       true  "Company id"
// @Param        request  body      models.CompanyUpdatePayload  true  "Fields to change"
// @Success      200      {object}  models.CompanyDetail
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403      {object}  swagger.ErrorResponse  "Member without company:edit"
// @Failure      404      {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id} [put]
func swaggerUpdateCompany() {}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

// swaggerDiscovery documents GET /api/v1/companies/discovery.
//
// @Summary      Company discovery shelves
// @Description  Returns the shelves the discovery page is built from — trending, hiring now, and industries — each holding a short list of company summaries. Open to anonymous callers; a signed-in caller's shelves are ordered against their profile.
// @Tags         Organizations
// @Produce      json
// @Param        limit  query     int  false  "Companies per shelf"  default(8)
// @Success      200    {object}  models.CompanyDiscovery
// @Failure      500    {object}  swagger.ErrorResponse  "Something went wrong"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/companies/discovery [get]
func swaggerDiscovery() {}

// swaggerListFollowing documents GET /api/v1/companies/following.
//
// @Summary      List followed companies
// @Description  Returns the companies the signed-in caller follows, newest first.
// @Tags         Organizations
// @Produce      json
// @Param        page   query     int  false  "Page number (1-based)"  default(1)
// @Param        limit  query     int  false  "Items per page"         default(20)
// @Success      200    {object}  models.CompanyListPage
// @Failure      401    {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/following [get]
func swaggerListFollowing() {}

// swaggerFollowCompanyByID documents POST /api/v1/companies/{id}/follow.
//
// @Summary      Follow a company
// @Description  Follows the company on the caller's behalf. Following twice is not an error.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                true   "Company id"
// @Param        request  body      models.FollowPayload  false  "Optional follow preferences"
// @Success      200      {object}  swagger.SuccessResponse  "{\"following\": true}"
// @Failure      400      {object}  swagger.ErrorResponse    "Invalid id"
// @Failure      401      {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      404      {object}  swagger.ErrorResponse    "No such company"
// @Failure      503      {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/follow [post]
func swaggerFollowCompanyByID() {}

// swaggerUnfollowCompanyByID documents DELETE /api/v1/companies/{id}/follow.
//
// @Summary      Unfollow a company
// @Description  Stops following the company. Unfollowing a company the caller does not follow is not an error.
// @Tags         Organizations
// @Produce      json
// @Param        id   path      string                   true  "Company id"
// @Success      200  {object}  swagger.SuccessResponse  "{\"following\": false}"
// @Failure      400  {object}  swagger.ErrorResponse    "Invalid id"
// @Failure      401  {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      503  {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/follow [delete]
func swaggerUnfollowCompanyByID() {}

// ---------------------------------------------------------------------------
// People and team
// ---------------------------------------------------------------------------

// swaggerGetPeople documents GET /api/v1/companies/{id}/people.
//
// @Summary      List the people at a company
// @Description  Returns approved employee associations. The path segment accepts an id or a slug. Only people who have chosen to show their company association publicly appear to an outside caller, and no employment detail beyond title and department is exposed. Pending association requests are visible only to a member holding people:manage.
// @Tags         Organizations
// @Produce      json
// @Param        id          path      string  true   "Company id or slug"
// @Param        q           query     string  false  "Free-text name filter"
// @Param        department  query     string  false  "Department filter"
// @Param        status      query     string  false  "Association status filter"
// @Param        page        query     int     false  "Page number (1-based)"  default(1)
// @Param        limit       query     int     false  "Items per page"         default(20)
// @Success      200         {object}  models.CompanyPeoplePage
// @Failure      400         {object}  swagger.ErrorResponse  "Invalid query"
// @Failure      404         {object}  swagger.ErrorResponse  "No such company"
// @Failure      503         {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/companies/{id}/people [get]
func swaggerGetPeople() {}

// swaggerRequestAssociation documents POST /api/v1/companies/{id}/people.
//
// @Summary      Request an employee association
// @Description  Asks to be listed as an employee of the company. The request is recorded as pending and confers nothing until somebody holding people:manage approves it, so this endpoint cannot be used to claim a company.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                             true  "Company id"
// @Param        request  body      models.AssociationRequestPayload   true  "Claimed role at the company"
// @Success      202      {object}  models.CompanyPerson               "Recorded as pending"
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      409      {object}  swagger.ErrorResponse  "A request or membership already exists"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/people [post]
func swaggerRequestAssociation() {}

// swaggerDecideAssociation documents PUT /api/v1/companies/{id}/people/{memberId}.
//
// @Summary      Approve or reject an association request
// @Description  Decides a pending employee association. Requires people:manage on this company.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id        path      string                   true  "Company id"
// @Param        memberId  path      string                   true  "Membership id of the pending request"
// @Param        request   body      AssociationDecisionBody  true  "approve or reject"
// @Success      200       {object}  swagger.SuccessResponse  "{\"status\": \"approve\"}"
// @Failure      400       {object}  swagger.ErrorResponse    "Invalid id or decision"
// @Failure      401       {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse    "Member without people:manage"
// @Failure      404       {object}  swagger.ErrorResponse    "No such company or request"
// @Failure      503       {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/people/{memberId} [put]
func swaggerDecideAssociation() {}

// swaggerGetTeam documents GET /api/v1/companies/{id}/team.
//
// @Summary      List the company team
// @Description  Returns everyone holding a management role at the company, with the roles and effective permissions each holds. Requires team:view on this company; an outside caller gets 404 rather than a hint that the company exists.
// @Tags         Organizations
// @Produce      json
// @Param        id          path      string  true   "Company id"
// @Param        q           query     string  false  "Free-text name filter"
// @Param        department  query     string  false  "Department filter"
// @Param        status      query     string  false  "Membership status filter"
// @Param        page        query     int     false  "Page number (1-based)"  default(1)
// @Param        limit       query     int     false  "Items per page"         default(20)
// @Success      200         {object}  models.CompanyPeoplePage
// @Failure      400         {object}  swagger.ErrorResponse  "Invalid id or query"
// @Failure      401         {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403         {object}  swagger.ErrorResponse  "Member without team:view"
// @Failure      404         {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503         {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/team [get]
func swaggerGetTeam() {}

// swaggerInviteTeamMember documents POST /api/v1/companies/{id}/team/invite.
//
// @Summary      Invite someone to the company team
// @Description  Issues a single-use invitation carrying the role named in the payload. The invitation expires, and the token in the response is the only time it is returned in full. The caller must hold the permission that matches the role being granted, so an invitation cannot hand out authority the inviter does not have.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                     true  "Company id"
// @Param        request  body      models.TeamInvitePayload   true  "Who to invite and as what"
// @Success      201      {object}  models.InvitationIssued
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403      {object}  swagger.ErrorResponse  "Caller may not grant that role"
// @Failure      404      {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      409      {object}  swagger.ErrorResponse  "Already invited or already a member"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/team/invite [post]
func swaggerInviteTeamMember() {}

// swaggerUpdateTeamMember documents PUT /api/v1/companies/{id}/team/{memberId}.
//
// @Summary      Change a team member's role
// @Description  Changes the role or status of an existing team member. Requires team:manage on this company, and the caller may not grant a role above their own.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id        path      string                            true  "Company id"
// @Param        memberId  path      string                            true  "Membership id"
// @Param        request   body      models.TeamMemberUpdatePayload    true  "New role or status"
// @Success      200       {object}  swagger.SuccessResponse           "{\"updated\": true}"
// @Failure      400       {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401       {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse  "Member without team:manage, or role escalation refused"
// @Failure      404       {object}  swagger.ErrorResponse  "No such company or member"
// @Failure      503       {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/team/{memberId} [put]
func swaggerUpdateTeamMember() {}

// swaggerRemoveTeamMember documents DELETE /api/v1/companies/{id}/team/{memberId}.
//
// @Summary      Remove a team member
// @Description  Removes somebody from the company team. Requires team:manage on this company. The last owner cannot be removed, so a company can never be left with nobody able to administer it.
// @Tags         Organizations
// @Produce      json
// @Param        id        path      string                   true  "Company id"
// @Param        memberId  path      string                   true  "Membership id"
// @Success      200       {object}  swagger.SuccessResponse  "{\"removed\": true}"
// @Failure      400       {object}  swagger.ErrorResponse    "Invalid id"
// @Failure      401       {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse    "Member without team:manage"
// @Failure      404       {object}  swagger.ErrorResponse    "No such company or member"
// @Failure      409       {object}  swagger.ErrorResponse    "Removing the last owner"
// @Failure      503       {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/team/{memberId} [delete]
func swaggerRemoveTeamMember() {}

// swaggerSetMemberPermissions documents PUT /api/v1/companies/{id}/team/{memberId}/permissions.
//
// @Summary      Set a team member's permissions
// @Description  Replaces the member's explicit permission grants. Requires team:manage on this company. Permissions are named individually — there is no wildcard and no implicit inheritance — and the caller cannot grant a permission they do not themselves hold. Use GET /api/v1/companies/permissions for the vocabulary.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id        path      string                   true  "Company id"
// @Param        memberId  path      string                   true  "Membership id"
// @Param        request   body      MemberPermissionsBody    true  "Permissions to grant"
// @Success      200       {object}  swagger.SuccessResponse  "{\"updated\": true}"
// @Failure      400       {object}  swagger.ErrorResponse    "Invalid id, payload or permission name"
// @Failure      401       {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse    "Member without team:manage, or privilege escalation refused"
// @Failure      404       {object}  swagger.ErrorResponse    "No such company or member"
// @Failure      503       {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/team/{memberId}/permissions [put]
func swaggerSetMemberPermissions() {}

// swaggerGetPermissionCatalog documents GET /api/v1/companies/permissions.
//
// @Summary      Company role and permission catalogue
// @Description  Describes every company role and the permissions it carries, so a settings screen does not have to keep its own copy that can drift from the server's. Static reference data; no authentication required.
// @Tags         Organizations
// @Produce      json
// @Success      200  {array}   service.RoleDescriptor
// @Failure      500  {object}  swagger.ErrorResponse  "Something went wrong"
// @Router       /api/v1/companies/permissions [get]
func swaggerGetPermissionCatalog() {}

// ---------------------------------------------------------------------------
// Recruiters
// ---------------------------------------------------------------------------

// swaggerGetRecruiters documents GET /api/v1/companies/{id}/recruiters.
//
// @Summary      List the recruiting team
// @Description  Returns the company's recruiters and hiring managers with their status. Requires recruiter:view on this company.
// @Tags         Organizations
// @Produce      json
// @Param        id          path      string  true   "Company id"
// @Param        q           query     string  false  "Free-text name filter"
// @Param        department  query     string  false  "Department filter"
// @Param        status      query     string  false  "Status filter"
// @Param        page        query     int     false  "Page number (1-based)"  default(1)
// @Param        limit       query     int     false  "Items per page"         default(20)
// @Success      200         {object}  models.CompanyPeoplePage
// @Failure      400         {object}  swagger.ErrorResponse  "Invalid id or query"
// @Failure      401         {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403         {object}  swagger.ErrorResponse  "Member without recruiter:view"
// @Failure      404         {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503         {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/recruiters [get]
func swaggerGetRecruiters() {}

// swaggerInviteRecruiter documents POST /api/v1/companies/{id}/recruiters/invite.
//
// @Summary      Invite a recruiter
// @Description  Issues a single-use, expiring invitation for a recruiting role. This is the team invitation with a recruiting role attached: the permission checked is the one that matches the role in the payload, so the route cannot be used to grant a role the caller could not grant on the team page.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                    true  "Company id"
// @Param        request  body      models.TeamInvitePayload  true  "Who to invite and as what"
// @Success      201      {object}  models.InvitationIssued
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403      {object}  swagger.ErrorResponse  "Caller may not grant that role"
// @Failure      404      {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      409      {object}  swagger.ErrorResponse  "Already invited or already a member"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/recruiters/invite [post]
func swaggerInviteRecruiter() {}

// swaggerSuspendRecruiter documents PUT /api/v1/companies/{id}/recruiters/{recruiterId}.
//
// @Summary      Suspend or reinstate a recruiter
// @Description  Suspends a recruiter's access to the company's hiring surfaces, or lifts a suspension. Requires recruiter:manage on this company. The membership is kept, so the history of what the recruiter did is not lost.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id           path      string                    true  "Company id"
// @Param        recruiterId  path      string                    true  "Membership id of the recruiter"
// @Param        request      body      RecruiterSuspensionBody   true  "Whether the recruiter is suspended"
// @Success      200          {object}  swagger.SuccessResponse   "{\"suspended\": true}"
// @Failure      400          {object}  swagger.ErrorResponse     "Invalid id or payload"
// @Failure      401          {object}  swagger.ErrorResponse     "Not signed in"
// @Failure      403          {object}  swagger.ErrorResponse     "Member without recruiter:manage"
// @Failure      404          {object}  swagger.ErrorResponse     "No such company or recruiter"
// @Failure      503          {object}  swagger.ErrorResponse     "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/recruiters/{recruiterId} [put]
func swaggerSuspendRecruiter() {}

// swaggerRemoveRecruiter documents DELETE /api/v1/companies/{id}/recruiters/{recruiterId}.
//
// @Summary      Remove a recruiter
// @Description  Removes a recruiter from the company's recruiting team. Requires recruiter:manage on this company.
// @Tags         Organizations
// @Produce      json
// @Param        id           path      string                   true  "Company id"
// @Param        recruiterId  path      string                   true  "Membership id of the recruiter"
// @Success      200          {object}  swagger.SuccessResponse  "{\"removed\": true}"
// @Failure      400          {object}  swagger.ErrorResponse    "Invalid id"
// @Failure      401          {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403          {object}  swagger.ErrorResponse    "Member without recruiter:manage"
// @Failure      404          {object}  swagger.ErrorResponse    "No such company or recruiter"
// @Failure      503          {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/recruiters/{recruiterId} [delete]
func swaggerRemoveRecruiter() {}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

// swaggerListInvitations documents GET /api/v1/companies/{id}/invitations.
//
// @Summary      List a company's invitations
// @Description  Returns the invitations issued for this company with their status and expiry. Requires team:view on this company. The invitation tokens themselves are not returned — they are shown once, when the invitation is issued.
// @Tags         Organizations
// @Produce      json
// @Param        id      path      string  true   "Company id"
// @Param        status  query     string  false  "Filter by status: pending, accepted, declined, revoked or expired"
// @Success      200     {array}   models.CompanyInvitation
// @Failure      400     {object}  swagger.ErrorResponse  "Invalid id"
// @Failure      401     {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403     {object}  swagger.ErrorResponse  "Member without team:view"
// @Failure      404     {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503     {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/invitations [get]
func swaggerListInvitations() {}

// swaggerRevokeInvitation documents DELETE /api/v1/companies/{id}/invitations/{invitationId}.
//
// @Summary      Revoke an invitation
// @Description  Cancels an outstanding invitation so its token can no longer be redeemed. Requires team:manage on this company.
// @Tags         Organizations
// @Produce      json
// @Param        id            path      string                   true  "Company id"
// @Param        invitationId  path      string                   true  "Invitation id"
// @Success      200           {object}  swagger.SuccessResponse  "{\"revoked\": true}"
// @Failure      400           {object}  swagger.ErrorResponse    "Invalid id"
// @Failure      401           {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403           {object}  swagger.ErrorResponse    "Member without team:manage"
// @Failure      404           {object}  swagger.ErrorResponse    "No such company or invitation"
// @Failure      503           {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/invitations/{invitationId} [delete]
func swaggerRevokeInvitation() {}

// swaggerPreviewInvitation documents GET /api/v1/companies/invitations/{token}.
//
// @Summary      Preview an invitation
// @Description  Names the company and the role behind an invitation token so the accept screen can be rendered. It joins nobody to anything. A token that has expired, been redeemed or been revoked reads as not found, so a guessed token reveals nothing.
// @Tags         Organizations
// @Produce      json
// @Param        token  path      string  true  "Invitation token"
// @Success      200    {object}  InvitationPreviewResponse
// @Failure      401    {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      404    {object}  swagger.ErrorResponse  "Token unknown, expired, revoked or already used"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/invitations/{token} [get]
func swaggerPreviewInvitation() {}

// swaggerAcceptInvitation documents POST /api/v1/companies/invitations/{token}/accept.
//
// @Summary      Accept an invitation
// @Description  Redeems the invitation and joins the signed-in caller to the company with the role the invitation carries. The token is single use and is spent by this call. An invitation addressed to a different email cannot be redeemed by the caller.
// @Tags         Organizations
// @Produce      json
// @Param        token  path      string  true  "Invitation token"
// @Success      200    {object}  AcceptedInvitationResponse
// @Failure      401    {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403    {object}  swagger.ErrorResponse  "Invitation was addressed to somebody else"
// @Failure      404    {object}  swagger.ErrorResponse  "Token unknown, expired, revoked or already used"
// @Failure      409    {object}  swagger.ErrorResponse  "Caller is already a member"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/invitations/{token}/accept [post]
func swaggerAcceptInvitation() {}

// swaggerDeclineInvitation documents POST /api/v1/companies/invitations/{token}/decline.
//
// @Summary      Decline an invitation
// @Description  Turns the invitation down and spends its token, so it cannot be redeemed later.
// @Tags         Organizations
// @Produce      json
// @Param        token  path      string                   true  "Invitation token"
// @Success      200    {object}  swagger.SuccessResponse  "{\"declined\": true}"
// @Failure      401    {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403    {object}  swagger.ErrorResponse    "Invitation was addressed to somebody else"
// @Failure      404    {object}  swagger.ErrorResponse    "Token unknown, expired, revoked or already used"
// @Failure      503    {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/invitations/{token}/decline [post]
func swaggerDeclineInvitation() {}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

// swaggerGetVerification documents GET /api/v1/companies/{id}/verification.
//
// @Summary      Get a company's verification state
// @Description  Returns the company's verification status and, if one has been made, its submission. Requires verification:view on this company. Supporting documents are referenced, never inlined, and the references are only readable by the reviewer and the submitting company.
// @Tags         Organizations
// @Produce      json
// @Param        id   path      string  true  "Company id"
// @Success      200  {object}  VerificationStateResponse
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid id"
// @Failure      401  {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403  {object}  swagger.ErrorResponse  "Member without verification:view"
// @Failure      404  {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503  {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/verification [get]
func swaggerGetVerification() {}

// swaggerSubmitVerification documents POST /api/v1/companies/{id}/verification.
//
// @Summary      Submit a company for verification
// @Description  Files the company's registration details and supporting documents for review. Requires verification:submit on this company. The result is always a pending review — this call can never mark a company verified, and the badge appears only after an administrator decides in the company's favour.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                              true  "Company id"
// @Param        request  body      models.VerificationSubmitPayload    true  "Registration details and documents"
// @Success      202      {object}  models.CompanyVerification          "Recorded as pending review"
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid id, payload or document reference"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403      {object}  swagger.ErrorResponse  "Member without verification:submit"
// @Failure      404      {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      409      {object}  swagger.ErrorResponse  "A submission is already under review"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/verification [post]
func swaggerSubmitVerification() {}

// swaggerListPendingVerifications documents GET /api/v1/admin/company-verifications.
//
// @Summary      List company verifications awaiting review
// @Description  The administrator's queue of pending company verification submissions. Restricted to Kirmya platform administrators; the platform role is checked by the service as well as by the route, so neither alone is load-bearing.
// @Tags         Admin
// @Produce      json
// @Param        page   query     int  false  "Page number (1-based)"  default(1)
// @Param        limit  query     int  false  "Items per page"         default(20)
// @Success      200    {object}  PendingVerificationsPage
// @Failure      401    {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403    {object}  swagger.ErrorResponse  "Not a platform administrator"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/admin/company-verifications [get]
func swaggerListPendingVerifications() {}

// swaggerDecideVerification documents PUT /api/v1/admin/company-verifications/{verificationId}.
//
// @Summary      Decide a company verification
// @Description  Approves or rejects a pending submission. This is the only way a company becomes verified, and it is restricted to Kirmya platform administrators. A rejection carries a reason back to the company.
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Param        verificationId  path      string                                true  "Verification id"
// @Param        request         body      models.VerificationDecisionPayload    true  "Decision and reason"
// @Success      200             {object}  swagger.SuccessResponse               "{\"status\": \"verified\"}"
// @Failure      400             {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401             {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403             {object}  swagger.ErrorResponse  "Not a platform administrator"
// @Failure      404             {object}  swagger.ErrorResponse  "No such submission"
// @Failure      503             {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/admin/company-verifications/{verificationId} [put]
func swaggerDecideVerification() {}

// ---------------------------------------------------------------------------
// Dashboard, analytics and audit
// ---------------------------------------------------------------------------

// swaggerGetDashboard documents GET /api/v1/companies/{id}/dashboard.
//
// @Summary      Company dashboard summary
// @Description  The headline figures behind the company dashboard: open jobs, applications in flight, team size and recent recruiter activity. Requires dashboard:view on this company.
// @Tags         Organizations
// @Produce      json
// @Param        id   path      string  true  "Company id"
// @Success      200  {object}  models.CompanyDashboard
// @Failure      400  {object}  swagger.ErrorResponse  "Invalid id"
// @Failure      401  {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403  {object}  swagger.ErrorResponse  "Member without dashboard:view"
// @Failure      404  {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503  {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/dashboard [get]
func swaggerGetDashboard() {}

// swaggerGetCompanyAnalytics documents GET /api/v1/companies/{id}/analytics.
//
// @Summary      Company analytics
// @Description  Profile views, job views, applications, follower growth and the hiring funnel over a date range, with a daily series. Requires analytics:view on this company. Figures are aggregates: no individual visitor is identified.
// @Tags         Organizations
// @Produce      json
// @Param        id    path      string  true   "Company id"
// @Param        from  query     string  false  "Start of the range, YYYY-MM-DD"
// @Param        to    query     string  false  "End of the range, YYYY-MM-DD"
// @Success      200   {object}  models.CompanyAnalytics
// @Failure      400   {object}  swagger.ErrorResponse  "Invalid id, or from/to is not YYYY-MM-DD"
// @Failure      401   {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403   {object}  swagger.ErrorResponse  "Member without analytics:view"
// @Failure      404   {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503   {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/analytics [get]
func swaggerGetCompanyAnalytics() {}

// swaggerGetJobAnalytics documents GET /api/v1/companies/{id}/jobs/{jobId}/analytics.
//
// @Summary      Analytics for one job
// @Description  Views, applications and funnel figures for a single job posting. Requires analytics:view on this company, and the job must belong to it — a job id from another company reads as not found.
// @Tags         Organizations
// @Produce      json
// @Param        id     path      string  true  "Company id"
// @Param        jobId  path      string  true  "Job id"
// @Success      200    {object}  models.JobAnalytics
// @Failure      400    {object}  swagger.ErrorResponse  "Invalid id"
// @Failure      401    {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403    {object}  swagger.ErrorResponse  "Member without analytics:view"
// @Failure      404    {object}  swagger.ErrorResponse  "No such company or job"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/jobs/{jobId}/analytics [get]
func swaggerGetJobAnalytics() {}

// swaggerGetInsights documents GET /api/v1/companies/{id}/insights.
//
// @Summary      Company hiring insights
// @Description  Observations drawn from the company's own analytics over a date range — where the funnel narrows, which sources convert, how the team's response times are moving. Requires analytics:view on this company. Every insight is derived from figures the company already holds; nothing about the company is invented.
// @Tags         Organizations
// @Produce      json
// @Param        id    path      string  true   "Company id"
// @Param        from  query     string  false  "Start of the range, YYYY-MM-DD"
// @Param        to    query     string  false  "End of the range, YYYY-MM-DD"
// @Success      200   {object}  models.CompanyInsightsReport
// @Failure      400   {object}  swagger.ErrorResponse  "Invalid id, or from/to is not YYYY-MM-DD"
// @Failure      401   {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403   {object}  swagger.ErrorResponse  "Member without analytics:view"
// @Failure      404   {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503   {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/insights [get]
func swaggerGetInsights() {}

// swaggerGetAuditLog documents GET /api/v1/companies/{id}/audit.
//
// @Summary      Company audit log
// @Description  The record of who changed what on this company — profile edits, role and permission changes, invitations, verification submissions. Requires audit:view on this company. Entries are append-only and cannot be edited or deleted through the API.
// @Tags         Organizations
// @Produce      json
// @Param        id     path      string  true   "Company id"
// @Param        page   query     int     false  "Page number (1-based)"  default(1)
// @Param        limit  query     int     false  "Items per page"         default(50)
// @Success      200    {object}  AuditLogPage
// @Failure      400    {object}  swagger.ErrorResponse  "Invalid id"
// @Failure      401    {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403    {object}  swagger.ErrorResponse  "Member without audit:view"
// @Failure      404    {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/audit [get]
func swaggerGetAuditLog() {}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

// swaggerGetCompanyReviews documents GET /api/v1/companies/{id}/reviews.
//
// @Summary      List company reviews
// @Description  Returns published reviews of the company with their rating breakdown. The path segment accepts an id or a slug. Reviews are written by people, never generated: no review in this response is machine-authored.
// @Tags         Organizations
// @Produce      json
// @Param        id     path      string  true   "Company id or slug"
// @Param        page   query     int     false  "Page number (1-based)"  default(1)
// @Param        limit  query     int     false  "Items per page"         default(10)
// @Success      200    {object}  models.CompanyReviewsPage
// @Failure      400    {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404    {object}  swagger.ErrorResponse  "No such company"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/companies/{id}/reviews [get]
func swaggerGetCompanyReviews() {}

// swaggerCreateReview documents POST /api/v1/companies/{id}/reviews.
//
// @Summary      Write a company review
// @Description  Publishes the signed-in caller's review of the company. One review per person per company.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                true  "Company id"
// @Param        request  body      models.ReviewPayload  true  "The review"
// @Success      201      {object}  models.CompanyReview
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      404      {object}  swagger.ErrorResponse  "No such company"
// @Failure      409      {object}  swagger.ErrorResponse  "The caller has already reviewed this company"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/reviews [post]
func swaggerCreateReview() {}

// swaggerUpdateReview documents PUT /api/v1/companies/{id}/reviews/{reviewId}.
//
// @Summary      Edit a review
// @Description  Edits a review. Only its author may edit it — the company cannot alter what was written about it.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id        path      string                true  "Company id"
// @Param        reviewId  path      string                true  "Review id"
// @Param        request   body      models.ReviewPayload  true  "The revised review"
// @Success      200       {object}  models.CompanyReview
// @Failure      400       {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401       {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse  "Not the author"
// @Failure      404       {object}  swagger.ErrorResponse  "No such company or review"
// @Failure      503       {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/reviews/{reviewId} [put]
func swaggerUpdateReview() {}

// swaggerDeleteReview documents DELETE /api/v1/companies/{id}/reviews/{reviewId}.
//
// @Summary      Delete a review
// @Description  Deletes a review. Its author may delete it; a company may not delete a review of itself, only respond to it or report it.
// @Tags         Organizations
// @Produce      json
// @Param        id        path      string                   true  "Company id"
// @Param        reviewId  path      string                   true  "Review id"
// @Success      200       {object}  swagger.SuccessResponse  "{\"deleted\": true}"
// @Failure      400       {object}  swagger.ErrorResponse    "Invalid id"
// @Failure      401       {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse    "Not the author"
// @Failure      404       {object}  swagger.ErrorResponse    "No such company or review"
// @Failure      503       {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/reviews/{reviewId} [delete]
func swaggerDeleteReview() {}

// swaggerReportReview documents POST /api/v1/companies/{id}/reviews/{reviewId}/report.
//
// @Summary      Report a review
// @Description  Flags a review for moderation. The report is queued for a human to look at; the review stays published in the meantime, so reporting cannot be used to silence criticism.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id        path      string                      true  "Company id"
// @Param        reviewId  path      string                      true  "Review id"
// @Param        request   body      models.ReviewReportPayload  true  "Why the review is being reported"
// @Success      202       {object}  swagger.SuccessResponse     "{\"reported\": true}"
// @Failure      400       {object}  swagger.ErrorResponse       "Invalid id or payload"
// @Failure      401       {object}  swagger.ErrorResponse       "Not signed in"
// @Failure      404       {object}  swagger.ErrorResponse       "No such company or review"
// @Failure      503       {object}  swagger.ErrorResponse       "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/reviews/{reviewId}/report [post]
func swaggerReportReview() {}

// swaggerRespondToReview documents POST /api/v1/companies/{id}/reviews/{reviewId}/response.
//
// @Summary      Respond to a review
// @Description  Attaches the company's public reply to a review. Requires review:respond on this company. The reply is added alongside the review; the review itself is left untouched.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id        path      string                        true  "Company id"
// @Param        reviewId  path      string                        true  "Review id"
// @Param        request   body      models.ReviewResponsePayload  true  "The company's reply"
// @Success      200       {object}  swagger.SuccessResponse       "{\"responded\": true}"
// @Failure      400       {object}  swagger.ErrorResponse         "Invalid id or payload"
// @Failure      401       {object}  swagger.ErrorResponse         "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse         "Member without review:respond"
// @Failure      404       {object}  swagger.ErrorResponse         "No such company or review"
// @Failure      503       {object}  swagger.ErrorResponse         "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/reviews/{reviewId}/response [post]
func swaggerRespondToReview() {}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

// swaggerGetCompanyUpdates documents GET /api/v1/companies/{id}/updates.
//
// @Summary      List company updates
// @Description  Returns the company's posted updates, newest first. The path segment accepts an id or a slug. Public.
// @Tags         Organizations
// @Produce      json
// @Param        id     path      string  true   "Company id or slug"
// @Param        page   query     int     false  "Page number (1-based)"  default(1)
// @Param        limit  query     int     false  "Items per page"         default(10)
// @Success      200    {object}  models.CompanyUpdatesPage
// @Failure      400    {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404    {object}  swagger.ErrorResponse  "No such company"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/companies/{id}/updates [get]
func swaggerGetCompanyUpdates() {}

// swaggerCreateUpdate documents POST /api/v1/companies/{id}/updates.
//
// @Summary      Post a company update
// @Description  Publishes an update on the company page. Requires update:publish on this company.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id       path      string                true  "Company id"
// @Param        request  body      models.UpdatePayload  true  "The update to publish"
// @Success      201      {object}  models.CompanyUpdate
// @Failure      400      {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401      {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403      {object}  swagger.ErrorResponse  "Member without update:publish"
// @Failure      404      {object}  swagger.ErrorResponse  "No such company, or the caller is not a member"
// @Failure      503      {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/updates [post]
func swaggerCreateUpdate() {}

// swaggerEditUpdate documents PUT /api/v1/companies/{id}/updates/{updateId}.
//
// @Summary      Edit a company update
// @Description  Revises a published update. Requires update:publish on this company.
// @Tags         Organizations
// @Accept       json
// @Produce      json
// @Param        id        path      string                true  "Company id"
// @Param        updateId  path      string                true  "Update id"
// @Param        request   body      models.UpdatePayload  true  "The revised update"
// @Success      200       {object}  models.CompanyUpdate
// @Failure      400       {object}  swagger.ErrorResponse  "Invalid id or payload"
// @Failure      401       {object}  swagger.ErrorResponse  "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse  "Member without update:publish"
// @Failure      404       {object}  swagger.ErrorResponse  "No such company or update"
// @Failure      503       {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/updates/{updateId} [put]
func swaggerEditUpdate() {}

// swaggerDeleteUpdate documents DELETE /api/v1/companies/{id}/updates/{updateId}.
//
// @Summary      Delete a company update
// @Description  Removes a published update from the company page. Requires update:publish on this company.
// @Tags         Organizations
// @Produce      json
// @Param        id        path      string                   true  "Company id"
// @Param        updateId  path      string                   true  "Update id"
// @Success      200       {object}  swagger.SuccessResponse  "{\"deleted\": true}"
// @Failure      400       {object}  swagger.ErrorResponse    "Invalid id"
// @Failure      401       {object}  swagger.ErrorResponse    "Not signed in"
// @Failure      403       {object}  swagger.ErrorResponse    "Member without update:publish"
// @Failure      404       {object}  swagger.ErrorResponse    "No such company or update"
// @Failure      503       {object}  swagger.ErrorResponse    "Company data is unavailable"
// @Security     BearerAuth
// @Router       /api/v1/companies/{id}/updates/{updateId} [delete]
func swaggerDeleteUpdate() {}

// ---------------------------------------------------------------------------
// The public company page, reached by slug
//
// These mirror the /companies/{id} reads above. They exist as their own paths
// because the public page is linked by slug, and the handler resolves either
// form, so the two are the same resource under two names.
// ---------------------------------------------------------------------------

// swaggerPublicCompanyPeople documents GET /api/v1/company/{slug}/people.
//
// @Summary      People at a company, by slug
// @Description  As GET /api/v1/companies/{id}/people, addressed by the company's public slug. Only associations their owner has chosen to show publicly are returned.
// @Tags         Organizations
// @Produce      json
// @Param        slug        path      string  true   "Company slug"
// @Param        q           query     string  false  "Free-text name filter"
// @Param        department  query     string  false  "Department filter"
// @Param        page        query     int     false  "Page number (1-based)"  default(1)
// @Param        limit       query     int     false  "Items per page"         default(20)
// @Success      200         {object}  models.CompanyPeoplePage
// @Failure      400         {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404         {object}  swagger.ErrorResponse  "No such company"
// @Failure      503         {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/company/{slug}/people [get]
func swaggerPublicCompanyPeople() {}

// swaggerPublicCompanyJobs documents GET /api/v1/company/{slug}/jobs.
//
// @Summary      Jobs at a company, by slug
// @Description  As GET /api/v1/companies/{id}/jobs, addressed by the company's public slug. Only published jobs are returned to a caller who is not on the company's team.
// @Tags         Organizations
// @Produce      json
// @Param        slug    path      string  true   "Company slug"
// @Param        status  query     string  false  "Filter by job status"
// @Param        page    query     int     false  "Page number (1-based)"  default(1)
// @Param        limit   query     int     false  "Items per page"         default(20)
// @Success      200     {object}  models.CompanyJobsPage
// @Failure      400     {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404     {object}  swagger.ErrorResponse  "No such company"
// @Failure      503     {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/company/{slug}/jobs [get]
func swaggerPublicCompanyJobs() {}

// swaggerPublicCompanyReviews documents GET /api/v1/company/{slug}/reviews.
//
// @Summary      Reviews of a company, by slug
// @Description  As GET /api/v1/companies/{id}/reviews, addressed by the company's public slug.
// @Tags         Organizations
// @Produce      json
// @Param        slug   path      string  true   "Company slug"
// @Param        page   query     int     false  "Page number (1-based)"  default(1)
// @Param        limit  query     int     false  "Items per page"         default(10)
// @Success      200    {object}  models.CompanyReviewsPage
// @Failure      400    {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404    {object}  swagger.ErrorResponse  "No such company"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/company/{slug}/reviews [get]
func swaggerPublicCompanyReviews() {}

// swaggerPublicCompanyUpdates documents GET /api/v1/company/{slug}/updates.
//
// @Summary      Updates from a company, by slug
// @Description  As GET /api/v1/companies/{id}/updates, addressed by the company's public slug.
// @Tags         Organizations
// @Produce      json
// @Param        slug   path      string  true   "Company slug"
// @Param        page   query     int     false  "Page number (1-based)"  default(1)
// @Param        limit  query     int     false  "Items per page"         default(10)
// @Success      200    {object}  models.CompanyUpdatesPage
// @Failure      400    {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404    {object}  swagger.ErrorResponse  "No such company"
// @Failure      503    {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/company/{slug}/updates [get]
func swaggerPublicCompanyUpdates() {}

// swaggerPublicCompanyDepartments documents GET /api/v1/company/{slug}/departments.
//
// @Summary      Departments at a company, by slug
// @Description  Returns the company's departments with headcounts. Public: a department carries a count, never the list of people behind it.
// @Tags         Organizations
// @Produce      json
// @Param        slug  path      string  true  "Company slug"
// @Success      200   {array}   models.CompanyDepartment
// @Failure      400   {object}  swagger.ErrorResponse  "Company is required"
// @Failure      404   {object}  swagger.ErrorResponse  "No such company"
// @Failure      503   {object}  swagger.ErrorResponse  "Company data is unavailable"
// @Router       /api/v1/company/{slug}/departments [get]
func swaggerPublicCompanyDepartments() {}

// ---------------------------------------------------------------------------
// Request and response shapes that the handlers declare inline.
//
// These types exist so the contract can name them. They are declared here
// rather than in the handler because they have no runtime use of their own —
// the handlers bind to anonymous structs and answer with gin.H — but a
// documented operation cannot describe an unnamed shape.
// ---------------------------------------------------------------------------

// AssociationDecisionBody is the body of PUT /api/v1/companies/{id}/people/{memberId}.
type AssociationDecisionBody struct {
	// Decision is either "approve" or "reject". Nothing else is accepted.
	Decision string `json:"decision" binding:"required,oneof=approve reject" example:"approve"`
}

// MemberPermissionsBody is the body of
// PUT /api/v1/companies/{id}/team/{memberId}/permissions. The list replaces the
// member's current grants outright, so an omitted permission is a revoked one.
type MemberPermissionsBody struct {
	Permissions []string `json:"permissions" example:"recruiter:view,recruiter:manage"`
}

// RecruiterSuspensionBody is the body of
// PUT /api/v1/companies/{id}/recruiters/{recruiterId}.
type RecruiterSuspensionBody struct {
	// Suspended true withdraws the recruiter's access; false restores it.
	Suspended bool `json:"suspended" example:"true"`
}

// InvitationPreviewResponse is what GET /api/v1/companies/invitations/{token}
// answers with: enough to render the accept screen, and no more.
type InvitationPreviewResponse struct {
	Invitation models.CompanyInvitation `json:"invitation"`
	Company    models.CompanySummary    `json:"company"`
}

// AcceptedInvitationResponse names the company the caller has just joined.
type AcceptedInvitationResponse struct {
	CompanyID string `json:"companyId" example:"6f1f8f3a-6d1e-4a6e-9c53-2f1b8b0f0c11"`
}

// VerificationStateResponse is the reply to
// GET /api/v1/companies/{id}/verification. Verification is null when the
// company has never submitted, in which case status reads "not_verified".
type VerificationStateResponse struct {
	Status       string                      `json:"status" example:"pending"`
	Verification *models.CompanyVerification `json:"verification"`
}

// PendingVerificationsPage is the administrator's review queue.
type PendingVerificationsPage struct {
	Items []models.CompanyVerification `json:"items"`
	Total int                          `json:"total" example:"7"`
	Page  int                          `json:"page" example:"1"`
	Limit int                          `json:"limit" example:"20"`
}

// AuditLogPage is a page of the company audit log.
type AuditLogPage struct {
	Items []models.AuditEntry `json:"items"`
	Total int                 `json:"total" example:"124"`
	Page  int                 `json:"page" example:"1"`
	Limit int                 `json:"limit" example:"50"`
}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set, and
// package names such as `models` and `service` are not unique across modules,
// so the imports have to be explicit rather than inferred.
var (
	_ models.CompanyDetail
	_ service.RoleDescriptor
	_ swagger.ErrorResponse
)
