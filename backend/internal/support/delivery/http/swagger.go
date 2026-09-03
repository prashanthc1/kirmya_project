package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/support/models"
)

// swaggerHelpCategories documents GET /api/v1/help/categories
//
// @Summary      Get knowledge base categories
// @Description  Returns categorized topic groups for public help and documentation
// @Tags         Support & Help
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/help/categories [get]
func swaggerHelpCategories() {}

// swaggerHelpArticles documents GET /api/v1/help/articles
//
// @Summary      List help articles
// @Description  Returns list of published help articles filtered by category or search query
// @Tags         Support & Help
// @Produce      json
// @Param        category  query     string  false  "Category slug"
// @Param        q         query     string  false  "Search query"
// @Success      200       {object}  swagger.SuccessResponse
// @Failure      400       {object}  swagger.ErrorResponse
// @Router       /api/v1/help/articles [get]
func swaggerHelpArticles() {}

// swaggerHelpArticleBySlug documents GET /api/v1/help/articles/{slug}
//
// @Summary      Get help article by slug
// @Description  Returns full markdown/HTML content of a single help article
// @Tags         Support & Help
// @Produce      json
// @Param        slug  path      string  true  "Article slug"
// @Success      200   {object}  swagger.SuccessResponse
// @Failure      404   {object}  swagger.ErrorResponse
// @Router       /api/v1/help/articles/{slug} [get]
func swaggerHelpArticleBySlug() {}

// swaggerHelpArticleFeedback documents POST /api/v1/help/articles/{id}/feedback
//
// @Summary      Submit article helpfulness feedback
// @Description  Records whether an article was helpful to a user
// @Tags         Support & Help
// @Accept       json
// @Produce      json
// @Param        id       path      string                        true  "Article ID"
// @Param        request  body      models.ArticleFeedbackPayload  true  "Feedback"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Router       /api/v1/help/articles/{id}/feedback [post]
func swaggerHelpArticleFeedback() {}

// swaggerHelpFAQ documents GET /api/v1/help/faq
//
// @Summary      List FAQs
// @Description  Returns frequently asked questions
// @Tags         Support & Help
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/help/faq [get]
func swaggerHelpFAQ() {}

// swaggerHelpKnownIssues documents GET /api/v1/help/known-issues
//
// @Summary      List known issues
// @Description  Returns active system bug notices and workarounds
// @Tags         Support & Help
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/help/known-issues [get]
func swaggerHelpKnownIssues() {}

// swaggerPlatformStatus documents GET /api/v1/status
//
// @Summary      Get platform operational status
// @Description  Returns high-level status of core services
// @Tags         Support & Help
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Router       /api/v1/status [get]
func swaggerPlatformStatus() {}

// swaggerSupportTicketsGet documents GET /api/v1/support/tickets
//
// @Summary      List user support tickets
// @Description  Returns all support tickets opened by the authenticated user
// @Tags         Support & Help
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets [get]
func swaggerSupportTicketsGet() {}

// swaggerSupportTicketsPost documents POST /api/v1/support/tickets
//
// @Summary      Create support ticket
// @Description  Opens a new customer support ticket
// @Tags         Support & Help
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateTicketPayload  true  "Ticket details"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets [post]
func swaggerSupportTicketsPost() {}

// swaggerSupportTicketByID documents GET /api/v1/support/tickets/{id}
//
// @Summary      Get support ticket details
// @Description  Returns ticket metadata and current status
// @Tags         Support & Help
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Ticket ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets/{id} [get]
func swaggerSupportTicketByID() {}

// swaggerSupportTicketMessagesGet documents GET /api/v1/support/tickets/{id}/messages
//
// @Summary      Get ticket message thread
// @Description  Returns messages in a ticket thread
// @Tags         Support & Help
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Ticket ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets/{id}/messages [get]
func swaggerSupportTicketMessagesGet() {}

// swaggerSupportTicketMessagesPost documents POST /api/v1/support/tickets/{id}/messages
//
// @Summary      Add message to support ticket
// @Description  Sends a reply on an open support ticket
// @Tags         Support & Help
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                       true  "Ticket ID"
// @Param        request  body      models.CreateMessagePayload  true  "Message content"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets/{id}/messages [post]
func swaggerSupportTicketMessagesPost() {}

// swaggerSupportTicketClose documents POST /api/v1/support/tickets/{id}/close
//
// @Summary      Close support ticket
// @Description  Marks a support ticket as resolved by the customer
// @Tags         Support & Help
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Ticket ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets/{id}/close [post]
func swaggerSupportTicketClose() {}

// swaggerSupportTicketReopen documents POST /api/v1/support/tickets/{id}/reopen
//
// @Summary      Reopen support ticket
// @Description  Reopens a previously closed support ticket
// @Tags         Support & Help
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Ticket ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets/{id}/reopen [post]
func swaggerSupportTicketReopen() {}

// swaggerSupportTicketFeedback documents POST /api/v1/support/tickets/{id}/feedback
//
// @Summary      Rate support experience (CSAT)
// @Description  Submits 1-5 star CSAT rating and qualitative feedback on ticket resolution
// @Tags         Support & Help
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                       true  "Ticket ID"
// @Param        request  body      models.CSATFeedbackPayload   true  "CSAT Rating"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/support/tickets/{id}/feedback [post]
func swaggerSupportTicketFeedback() {}

// swaggerFeedbackFeature documents POST /api/v1/feedback
//
// @Summary      Submit feature request
// @Description  Submits a feature idea or UX improvement suggestion
// @Tags         Feedback
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateFeatureRequestPayload  true  "Feature suggestion"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/feedback [post]
func swaggerFeedbackFeature() {}

// swaggerFeedbackBugs documents POST /api/v1/feedback/bugs
//
// @Summary      Report a bug
// @Description  Submits an issue report with reproduction steps and browser metadata
// @Tags         Feedback
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateBugReportPayload  true  "Bug report"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Router       /api/v1/feedback/bugs [post]
func swaggerFeedbackBugs() {}

// swaggerAdminSupportSummary documents GET /api/v1/admin/support
//
// @Summary      Get support desk overview (Admin)
// @Description  Returns ticket volume, SLA health, and resolution metrics
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support [get]
func swaggerAdminSupportSummary() {}

// swaggerAdminSupportAnalytics documents GET /api/v1/admin/support/analytics
//
// @Summary      Get detailed support analytics (Admin)
// @Description  Returns ticket inflow, CSAT scores, and agent response metrics
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/analytics [get]
func swaggerAdminSupportAnalytics() {}

// swaggerAdminSupportSLA documents GET /api/v1/admin/support/sla
//
// @Summary      Get SLA compliance metrics (Admin)
// @Description  Returns SLA attainment percentage and breached ticket counts
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/sla [get]
func swaggerAdminSupportSLA() {}

// swaggerAdminSupportTickets documents GET /api/v1/admin/support/tickets
//
// @Summary      List all support tickets (Admin)
// @Description  Returns filtered ticket queue across all users
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/tickets [get]
func swaggerAdminSupportTickets() {}

// swaggerAdminSupportTicketByID documents GET /api/v1/admin/support/tickets/{id}
//
// @Summary      Get support ticket details (Admin)
// @Description  Returns full ticket context for agent handling
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Ticket ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/tickets/{id} [get]
func swaggerAdminSupportTicketByID() {}

// swaggerAdminSupportMessagesGet documents GET /api/v1/admin/support/tickets/{id}/messages
//
// @Summary      Get ticket thread and internal notes (Admin)
// @Description  Returns customer messages and staff-only internal notes
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Ticket ID"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/tickets/{id}/messages [get]
func swaggerAdminSupportMessagesGet() {}

// swaggerAdminSupportMessagesPost documents POST /api/v1/admin/support/tickets/{id}/messages
//
// @Summary      Send agent reply to ticket (Admin)
// @Description  Dispatches public staff reply to the customer
// @Tags         Admin Support
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                       true  "Ticket ID"
// @Param        request  body      models.CreateMessagePayload  true  "Reply content"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/tickets/{id}/messages [post]
func swaggerAdminSupportMessagesPost() {}

// swaggerAdminSupportNotesPost documents POST /api/v1/admin/support/tickets/{id}/notes
//
// @Summary      Add internal note to ticket (Admin)
// @Description  Appends staff-only note not visible to the customer
// @Tags         Admin Support
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                       true  "Ticket ID"
// @Param        request  body      models.CreateMessagePayload  true  "Internal note"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/tickets/{id}/notes [post]
func swaggerAdminSupportNotesPost() {}

// swaggerAdminSupportAssign documents POST /api/v1/admin/support/tickets/{id}/assign
//
// @Summary      Assign ticket to agent (Admin)
// @Description  Assigns ticket ownership to a support staff member
// @Tags         Admin Support
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                      true  "Ticket ID"
// @Param        request  body      models.AssignTicketPayload  true  "Assignee"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/tickets/{id}/assign [post]
func swaggerAdminSupportAssign() {}

// swaggerAdminSupportResolve documents POST /api/v1/admin/support/tickets/{id}/resolve
//
// @Summary      Resolve ticket (Admin)
// @Description  Marks ticket as resolved with resolution summary
// @Tags         Admin Support
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id       path      string                       true  "Ticket ID"
// @Param        request  body      models.ResolveTicketPayload  true  "Resolution"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/tickets/{id}/resolve [post]
func swaggerAdminSupportResolve() {}

// swaggerAdminSupportArticlesGet documents GET /api/v1/admin/support/articles
//
// @Summary      List all articles for curation (Admin)
// @Description  Returns draft, published, and archived knowledge base articles
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/articles [get]
func swaggerAdminSupportArticlesGet() {}

// swaggerAdminSupportArticlesPost documents POST /api/v1/admin/support/articles
//
// @Summary      Create knowledge base article (Admin)
// @Description  Publishes a new help article
// @Tags         Admin Support
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateArticlePayload  true  "Article content"
// @Success      201      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/articles [post]
func swaggerAdminSupportArticlesPost() {}

// swaggerAdminSupportFeedback documents GET /api/v1/admin/support/feedback
//
// @Summary      List feature suggestions (Admin)
// @Description  Returns user-submitted feature requests and vote counts
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/feedback [get]
func swaggerAdminSupportFeedback() {}

// swaggerAdminSupportBugs documents GET /api/v1/admin/support/bugs
//
// @Summary      List bug reports (Admin)
// @Description  Returns user-submitted issue reports for engineering triage
// @Tags         Admin Support
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/support/bugs [get]
func swaggerAdminSupportBugs() {}

var (
	_ models.SupportTicket
	_ swagger.ErrorResponse
)

