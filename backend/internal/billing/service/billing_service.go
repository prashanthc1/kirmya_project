package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"strings"

	"github.com/google/uuid"
	"kirmya/internal/billing/models"
	"kirmya/internal/billing/repository"
)

// PaymentProvider defines provider-agnostic interface methods.
type PaymentProvider interface {
	CreateCustomer(ctx context.Context, email string, name string) (string, error)
	CreateCheckoutSession(ctx context.Context, customerID string, planID string, successURL string, cancelURL string) (string, error)
	CreateSubscription(ctx context.Context, customerID string, planID string) (*models.Subscription, error)
	CancelSubscription(ctx context.Context, subscriptionID string) error
	RefundPayment(ctx context.Context, paymentID string, amountCents int, reason string) error
	VerifyWebhookSignature(payload []byte, signature string, secret string) bool
}

// MockPaymentProvider for billing-disabled / development fallback.
type MockPaymentProvider struct{}

func (m *MockPaymentProvider) CreateCustomer(ctx context.Context, email string, name string) (string, error) {
	return "cus_mock_123456", nil
}
func (m *MockPaymentProvider) CreateCheckoutSession(ctx context.Context, customerID string, planID string, successURL string, cancelURL string) (string, error) {
	return "https://kirmya.com/billing/mock-checkout", nil
}
func (m *MockPaymentProvider) CreateSubscription(ctx context.Context, customerID string, planID string) (*models.Subscription, error) {
	return &models.Subscription{ID: uuid.New(), Status: "active"}, nil
}
func (m *MockPaymentProvider) CancelSubscription(ctx context.Context, subscriptionID string) error {
	return nil
}
func (m *MockPaymentProvider) RefundPayment(ctx context.Context, paymentID string, amountCents int, reason string) error {
	return nil
}

// VerifyWebhookSignature checks an HMAC-SHA256 of the raw request body against
// the signature the caller supplied, in the shape every major payment provider
// uses.
//
// This previously returned true unconditionally. It is the provider wired by
// NewBillingService, so an unconditional true is not a harmless development
// stub: it means the webhook endpoint accepts a forged "payment succeeded" from
// anyone on the internet the moment BILLING_ENABLED is turned on. A mock may
// return canned data; it must not weaken a security control.
//
// An empty secret fails closed. Comparison is constant-time so the check does
// not leak the expected signature a byte at a time.
func (m *MockPaymentProvider) VerifyWebhookSignature(payload []byte, signature string, secret string) bool {
	if secret == "" || signature == "" {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))

	// Providers commonly prefix the scheme, e.g. "sha256=<hex>".
	supplied := strings.TrimPrefix(signature, "sha256=")

	return hmac.Equal([]byte(expected), []byte(supplied))
}

type BillingService interface {
	GetBillingStatus(ctx context.Context) models.BillingStatusResponse
	GetPlans(ctx context.Context) ([]models.Plan, error)
	GetEntitlements(ctx context.Context) ([]models.Entitlement, error)
	HasEntitlement(ctx context.Context, userID uuid.UUID, feature string) (bool, error)
	HasOrganizationEntitlement(ctx context.Context, orgID uuid.UUID, feature string) (bool, error)
	CheckLimit(ctx context.Context, entityType string, entityID uuid.UUID, feature string) (bool, int, error)
	CreateCheckoutSession(ctx context.Context, req models.CheckoutRequest) (string, error)
	ProcessWebhook(ctx context.Context, provider string, payload []byte, signature string) error
}

type billingService struct {
	repo            repository.BillingRepository
	paymentProvider PaymentProvider
}

func NewBillingService(repo repository.BillingRepository) BillingService {
	return &billingService{
		repo:            repo,
		paymentProvider: &MockPaymentProvider{},
	}
}

func isBillingEnabled() bool {
	val := os.Getenv("BILLING_ENABLED")
	return val == "true"
}

func (s *billingService) GetBillingStatus(ctx context.Context) models.BillingStatusResponse {
	enabled := isBillingEnabled()
	return models.BillingStatusResponse{
		BillingEnabled:         enabled,
		SubscriptionsEnabled:   os.Getenv("SUBSCRIPTIONS_ENABLED") == "true",
		CheckoutEnabled:        os.Getenv("CHECKOUT_ENABLED") == "true",
		PremiumFeaturesEnabled: os.Getenv("PREMIUM_FEATURES_ENABLED") == "true",
		StripeEnabled:          os.Getenv("STRIPE_ENABLED") == "true",
		Message:                "Kirmya is 100% Free. Billing, subscriptions, and payment requirements are disabled.",
	}
}

func (s *billingService) GetPlans(ctx context.Context) ([]models.Plan, error) {
	return s.repo.GetPlans(ctx)
}

func (s *billingService) GetEntitlements(ctx context.Context) ([]models.Entitlement, error) {
	return s.repo.GetEntitlements(ctx)
}

func (s *billingService) HasEntitlement(ctx context.Context, userID uuid.UUID, feature string) (bool, error) {
	// If billing is disabled or in FREE mode, all valid features are granted
	if !isBillingEnabled() {
		return true, nil
	}
	return s.repo.CheckEntitlement(ctx, "user", userID, feature)
}

func (s *billingService) HasOrganizationEntitlement(ctx context.Context, orgID uuid.UUID, feature string) (bool, error) {
	if !isBillingEnabled() {
		return true, nil
	}
	return s.repo.CheckEntitlement(ctx, "organization", orgID, feature)
}

func (s *billingService) CheckLimit(ctx context.Context, entityType string, entityID uuid.UUID, feature string) (bool, int, error) {
	if !isBillingEnabled() {
		// Unlimited access under free tier
		return true, -1, nil
	}
	usage, err := s.repo.GetUsage(ctx, entityType, entityID, feature)
	if err != nil {
		return true, -1, nil
	}
	if usage.UsageLimit == nil || *usage.UsageLimit < 0 {
		return true, -1, nil
	}
	allowed := usage.CurrentUsage < *usage.UsageLimit
	return allowed, *usage.UsageLimit - usage.CurrentUsage, nil
}

func (s *billingService) CreateCheckoutSession(ctx context.Context, req models.CheckoutRequest) (string, error) {
	if !isBillingEnabled() {
		return "", errors.New("BILLING_DISABLED: Kirmya is currently 100% free. Checkout is disabled.")
	}
	return s.paymentProvider.CreateCheckoutSession(ctx, "cus_free", req.PlanID.String(), req.SuccessURL, req.CancelURL)
}

// ErrWebhookSignatureInvalid is returned when a webhook cannot be attributed to
// the payment provider. Callers map it to 401: the request is unauthenticated,
// not malformed.
var ErrWebhookSignatureInvalid = errors.New("WEBHOOK_SIGNATURE_INVALID: webhook could not be verified as originating from the payment provider")

// webhookSecret is the shared secret the provider signs its payloads with.
func webhookSecret() string {
	return os.Getenv("BILLING_WEBHOOK_SECRET")
}

// ProcessWebhook records a verified provider event.
//
// The signature is checked before anything is recorded. This endpoint cannot be
// protected by AuthRequired — a payment provider has no user token — so the
// signature is the only thing separating a genuine event from an attacker
// asserting that they have paid. It previously did no verification at all: the
// handler passed a nil payload and an empty signature, and this method used
// neither, so any unauthenticated POST recorded a payment_succeeded event.
func (s *billingService) ProcessWebhook(ctx context.Context, provider string, payload []byte, signature string) error {
	if !isBillingEnabled() {
		return nil // Graceful no-op when billing is disabled
	}

	// Fails closed: with no configured secret there is no way to establish that
	// the request came from the provider, so nothing is recorded.
	if !s.paymentProvider.VerifyWebhookSignature(payload, signature, webhookSecret()) {
		return ErrWebhookSignatureInvalid
	}

	event := &models.WebhookEvent{
		ID:              uuid.New(),
		Provider:        provider,
		ProviderEventID: "evt_mock_123",
		EventType:       "payment_succeeded",
		Payload:         map[string]interface{}{"status": "success"},
		Status:          "processed",
	}
	return s.repo.RecordWebhookEvent(ctx, event)
}
