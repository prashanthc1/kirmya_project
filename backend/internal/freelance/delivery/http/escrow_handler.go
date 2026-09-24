package http

import (
	"errors"
	"io"
	"net/http"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/payments"
	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// The escrow surface: a contract's milestones, the disputes and refunds over
// their money, and the processor webhook that confirms their funding.
//
// Every authenticated handler here passes the verified caller to the service,
// which decides - per contract - whether they are the client, the freelancer, or
// nobody. No handler reads a party id from the request.

// Machine-readable codes for the escrow refusals a client has to tell apart.
const (
	CodePaymentsUnavailable = "FREELANCE_PAYMENTS_UNAVAILABLE"
	CodePaymentProvider     = "FREELANCE_PAYMENT_PROVIDER_ERROR"
	CodeEscrowConflict      = "FREELANCE_ESCROW_CONFLICT"
)

// maxWebhookBody bounds a processor notification. Real ones are a few
// kilobytes; the bound stops an anonymous endpoint from buffering anything
// larger before the signature check can refuse it.
const maxWebhookBody = 1 << 20

// EscrowHandler serves the milestone and escrow routes.
type EscrowHandler struct {
	svc service.EscrowService
}

// NewEscrowHandler builds the handler.
func NewEscrowHandler(svc service.EscrowService) *EscrowHandler {
	return &EscrowHandler{svc: svc}
}

// respondEscrowError maps an escrow refusal onto a status code.
//
// The escrow-specific cases first, then everything the project surface already
// maps - with a not-found message that does not say "project" about a contract.
func respondEscrowError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	case errors.Is(err, service.ErrPaymentsUnavailable):
		// 503: the request is valid and the caller may make it, but this
		// deployment cannot take payments.
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Payments are not available yet. Please try again later.",
			"code":  CodePaymentsUnavailable,
		})
	case errors.Is(err, service.ErrPaymentProvider):
		c.JSON(http.StatusBadGateway, gin.H{
			"error": "The payment processor could not start this payment. Please try again.",
			"code":  CodePaymentProvider,
		})
	case errors.Is(err, domain.ErrConflict):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "code": CodeEscrowConflict})
	default:
		respondDomainError(c, err)
	}
}

func (h *EscrowHandler) caller(c *gin.Context) (uuid.UUID, bool) {
	userID, ok := sharedMiddleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return uuid.Nil, false
	}
	return userID, true
}

// ids parses the caller and the path's contract (and milestone, when named).
func (h *EscrowHandler) ids(c *gin.Context, withMilestone bool) (userID, contractID, milestoneID uuid.UUID, ok bool) {
	if userID, ok = h.caller(c); !ok {
		return
	}
	var err error
	if contractID, err = uuid.Parse(c.Param("id")); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contract ID format"})
		return userID, contractID, milestoneID, false
	}
	if withMilestone {
		if milestoneID, err = uuid.Parse(c.Param("milestoneId")); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid milestone ID format"})
			return userID, contractID, milestoneID, false
		}
	}
	return userID, contractID, milestoneID, true
}

// GetContract handles GET /freelance/contracts/:id
func (h *EscrowHandler) GetContract(c *gin.Context) {
	userID, contractID, _, ok := h.ids(c, false)
	if !ok {
		return
	}
	detail, err := h.svc.GetContract(c.Request.Context(), userID, contractID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, detail)
}

// AddMilestone handles POST /freelance/contracts/:id/milestones
func (h *EscrowHandler) AddMilestone(c *gin.Context) {
	userID, contractID, _, ok := h.ids(c, false)
	if !ok {
		return
	}
	var payload domain.CreateMilestonePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid milestone payload", "details": err.Error()})
		return
	}
	m, err := h.svc.AddMilestone(c.Request.Context(), userID, contractID, payload)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusCreated, m)
}

// CancelMilestone handles POST /freelance/contracts/:id/milestones/:milestoneId/cancel
func (h *EscrowHandler) CancelMilestone(c *gin.Context) {
	userID, contractID, milestoneID, ok := h.ids(c, true)
	if !ok {
		return
	}
	m, err := h.svc.CancelMilestone(c.Request.Context(), userID, contractID, milestoneID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, m)
}

// FundMilestone handles POST /freelance/contracts/:id/milestones/:milestoneId/fund
//
// 202, not 200: the payment has been requested, not taken. The milestone is
// funded when the processor confirms it.
func (h *EscrowHandler) FundMilestone(c *gin.Context) {
	userID, contractID, milestoneID, ok := h.ids(c, true)
	if !ok {
		return
	}
	result, err := h.svc.FundMilestone(c.Request.Context(), userID, contractID, milestoneID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusAccepted, result)
}

// SubmitMilestone handles POST /freelance/contracts/:id/milestones/:milestoneId/submit
func (h *EscrowHandler) SubmitMilestone(c *gin.Context) {
	userID, contractID, milestoneID, ok := h.ids(c, true)
	if !ok {
		return
	}
	var payload domain.SubmitMilestonePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid delivery payload", "details": err.Error()})
		return
	}
	m, err := h.svc.SubmitMilestone(c.Request.Context(), userID, contractID, milestoneID, payload)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, m)
}

// RequestRevision handles POST /freelance/contracts/:id/milestones/:milestoneId/request-revision
func (h *EscrowHandler) RequestRevision(c *gin.Context) {
	userID, contractID, milestoneID, ok := h.ids(c, true)
	if !ok {
		return
	}
	var payload domain.RequestRevisionPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid revision payload", "details": err.Error()})
		return
	}
	m, err := h.svc.RequestRevision(c.Request.Context(), userID, contractID, milestoneID, payload)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, m)
}

// ApproveMilestone handles POST /freelance/contracts/:id/milestones/:milestoneId/approve
func (h *EscrowHandler) ApproveMilestone(c *gin.Context) {
	userID, contractID, milestoneID, ok := h.ids(c, true)
	if !ok {
		return
	}
	m, err := h.svc.ApproveMilestone(c.Request.Context(), userID, contractID, milestoneID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, m)
}

// OpenDispute handles POST /freelance/contracts/:id/milestones/:milestoneId/dispute
func (h *EscrowHandler) OpenDispute(c *gin.Context) {
	userID, contractID, milestoneID, ok := h.ids(c, true)
	if !ok {
		return
	}
	var payload domain.OpenDisputePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dispute payload", "details": err.Error()})
		return
	}
	d, err := h.svc.OpenDispute(c.Request.Context(), userID, contractID, milestoneID, payload)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusCreated, d)
}

// RefundMilestone handles POST /freelance/contracts/:id/milestones/:milestoneId/refund
func (h *EscrowHandler) RefundMilestone(c *gin.Context) {
	userID, contractID, milestoneID, ok := h.ids(c, true)
	if !ok {
		return
	}
	var payload domain.RefundMilestonePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A reason is required", "details": err.Error()})
		return
	}
	m, err := h.svc.RefundMilestone(c.Request.Context(), userID, contractID, milestoneID, payload)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, m)
}

// ListContractDisputes handles GET /freelance/contracts/:id/disputes
func (h *EscrowHandler) ListContractDisputes(c *gin.Context) {
	userID, contractID, _, ok := h.ids(c, false)
	if !ok {
		return
	}
	disputes, err := h.svc.ListContractDisputes(c.Request.Context(), userID, contractID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": disputes, "count": len(disputes)})
}

// disputeIDs parses the caller and the path's dispute.
func (h *EscrowHandler) disputeIDs(c *gin.Context) (uuid.UUID, uuid.UUID, bool) {
	userID, ok := h.caller(c)
	if !ok {
		return uuid.Nil, uuid.Nil, false
	}
	disputeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dispute ID format"})
		return uuid.Nil, uuid.Nil, false
	}
	return userID, disputeID, true
}

// GetDispute handles GET /freelance/disputes/:id
func (h *EscrowHandler) GetDispute(c *gin.Context) {
	userID, disputeID, ok := h.disputeIDs(c)
	if !ok {
		return
	}
	detail, err := h.svc.GetDispute(c.Request.Context(), userID, disputeID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, detail)
}

// AddEvidence handles POST /freelance/disputes/:id/evidence
func (h *EscrowHandler) AddEvidence(c *gin.Context) {
	userID, disputeID, ok := h.disputeIDs(c)
	if !ok {
		return
	}
	var payload domain.AddEvidencePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid evidence payload", "details": err.Error()})
		return
	}
	e, err := h.svc.AddEvidence(c.Request.Context(), userID, disputeID, payload)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusCreated, e)
}

// WithdrawDispute handles POST /freelance/disputes/:id/withdraw
func (h *EscrowHandler) WithdrawDispute(c *gin.Context) {
	userID, disputeID, ok := h.disputeIDs(c)
	if !ok {
		return
	}
	d, err := h.svc.WithdrawDispute(c.Request.Context(), userID, disputeID)
	if err != nil {
		respondEscrowError(c, err)
		return
	}
	c.JSON(http.StatusOK, d)
}

// PaymentWebhook handles POST /freelance/payments/webhooks/:provider
//
// Anonymous by necessity - the processor has no Kirmya session - so the
// signature is the whole of its authentication. The raw body is read once,
// bounded, and verified before anything is parsed or written; an unverifiable
// request changes nothing and is told only that it was refused.
func (h *EscrowHandler) PaymentWebhook(c *gin.Context) {
	provider := c.Param("provider")
	body, err := io.ReadAll(http.MaxBytesReader(c.Writer, c.Request.Body, maxWebhookBody))
	if err != nil {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Payload too large"})
		return
	}

	event, err := h.svc.VerifyPaymentWebhook(provider, body, c.Request.Header)
	if err != nil {
		if errors.Is(err, service.ErrUnknownProvider) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Webhook could not be verified"})
		return
	}

	if event.Kind == payments.EventIgnored {
		// Verified, and nothing escrow acts on: acknowledged so it is not retried.
		c.JSON(http.StatusOK, gin.H{"received": true, "applied": false})
		return
	}
	if err := h.svc.HandlePaymentWebhook(c.Request.Context(), provider, event); err != nil {
		switch {
		case errors.Is(err, domain.ErrNotFound):
			// A verified event for a charge this deployment never created.
			// Acknowledged, so the processor stops redelivering something that
			// can never apply; nothing was written.
			c.JSON(http.StatusOK, gin.H{"received": true, "applied": false})
		case errors.Is(err, domain.ErrConflict):
			// The charge exists but its milestone is not in a state the event
			// can apply to. Refused, so the processor redelivers and the event
			// stays visible rather than being silently dropped.
			c.JSON(http.StatusConflict, gin.H{"error": "Event cannot be applied in the current state"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not process the event"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"received": true, "applied": true})
}

// RegisterEscrowRoutes mounts the escrow surface under /freelance.
//
// The contract routes are authenticated but not behind the freelancer
// capability gate, for the reasons GET /contracts is not: a client is not a
// freelancer, and a suspended freelancer is still bound by - and entitled to
// see - contracts they already hold. Which of the two parties may take each
// action is decided per contract by the service.
//
// The webhook is public and authenticated by its signature alone.
func RegisterEscrowRoutes(api *gin.RouterGroup, handler *EscrowHandler) {
	freelanceGroup := api.Group("/freelance")
	{
		freelanceGroup.POST("/payments/webhooks/:provider", handler.PaymentWebhook)

		contracts := freelanceGroup.Group("/contracts")
		contracts.Use(sharedMiddleware.AuthRequired())
		{
			contracts.GET("/:id", handler.GetContract)
			contracts.POST("/:id/milestones", handler.AddMilestone)
			contracts.POST("/:id/milestones/:milestoneId/cancel", handler.CancelMilestone)
			contracts.POST("/:id/milestones/:milestoneId/fund", handler.FundMilestone)
			contracts.POST("/:id/milestones/:milestoneId/submit", handler.SubmitMilestone)
			contracts.POST("/:id/milestones/:milestoneId/request-revision", handler.RequestRevision)
			contracts.POST("/:id/milestones/:milestoneId/approve", handler.ApproveMilestone)
			contracts.POST("/:id/milestones/:milestoneId/dispute", handler.OpenDispute)
			contracts.POST("/:id/milestones/:milestoneId/refund", handler.RefundMilestone)
			contracts.GET("/:id/disputes", handler.ListContractDisputes)
		}

		// A dispute is read and added to by either party to its contract; the
		// service decides which contract that is from the dispute itself.
		disputes := freelanceGroup.Group("/disputes")
		disputes.Use(sharedMiddleware.AuthRequired())
		{
			disputes.GET("/:id", handler.GetDispute)
			disputes.POST("/:id/evidence", handler.AddEvidence)
			disputes.POST("/:id/withdraw", handler.WithdrawDispute)
		}
	}
}
