package http

import (
	"log/slog"
	"net/http"
	"net/mail"
	"strings"

	"kirmya/internal/landing/repository"

	"github.com/gin-gonic/gin"
)

// NewsletterHandler serves the footer subscription form.
//
// F09. The form previously set a local flag and rendered "Subscribed
// successfully!" without making a request at all, so the address was discarded
// at the moment the visitor was told it had been kept.
type NewsletterHandler struct {
	repo *repository.NewsletterRepository
}

func NewNewsletterHandler(repo *repository.NewsletterRepository) *NewsletterHandler {
	return &NewsletterHandler{repo: repo}
}

type subscribeRequest struct {
	Email  string `json:"email"`
	Source string `json:"source"`
}

// Subscribe handles POST /api/v1/newsletter/subscribe.
//
// The response is identical whether the address was new, already subscribed, or
// previously unsubscribed. An endpoint that distinguished them would be a way
// for anyone to test whether a given address is on the list.
func (h *NewsletterHandler) Subscribe(c *gin.Context) {
	var payload subscribeRequest
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A valid email address is required"})
		return
	}

	address := strings.TrimSpace(payload.Email)
	if _, err := mail.ParseAddress(address); err != nil || len(address) > 320 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Enter a valid email address."})
		return
	}

	source := strings.TrimSpace(payload.Source)
	if source == "" {
		source = "footer"
	}
	if len(source) > 64 {
		source = source[:64]
	}

	if _, err := h.repo.Subscribe(c.Request.Context(), address, source, c.ClientIP()); err != nil {
		// A subscription that could not be stored must not be reported as
		// stored. That equivalence — success in the UI, nothing in the
		// database — is the whole of the defect this endpoint exists to fix.
		slog.Error("newsletter subscription could not be stored", slog.String("error", err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "We could not save your subscription. Please try again.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "You are subscribed. Every email includes a one-click unsubscribe link.",
	})
}

// Unsubscribe handles POST /api/v1/newsletter/unsubscribe.
//
// It takes the opaque token from the link, never an email address: a URL
// containing the address would let anyone unsubscribe anyone by editing it.
func (h *NewsletterHandler) Unsubscribe(c *gin.Context) {
	token := strings.TrimSpace(c.Query("token"))
	if token == "" {
		var payload struct {
			Token string `json:"token"`
		}
		_ = c.ShouldBindJSON(&payload)
		token = strings.TrimSpace(payload.Token)
	}

	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This unsubscribe link is incomplete."})
		return
	}

	found, err := h.repo.Unsubscribe(c.Request.Context(), token)
	if err != nil {
		slog.Error("newsletter unsubscribe failed", slog.String("error", err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "We could not process that right now. Please try again.",
		})
		return
	}
	if !found {
		// An unknown token and an already-unsubscribed one answer the same way.
		// Someone following a stale link should be told they are unsubscribed,
		// which is true, rather than shown an error they cannot act on.
		c.JSON(http.StatusOK, gin.H{"message": "You are unsubscribed."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "You are unsubscribed. You will not receive further emails."})
}
