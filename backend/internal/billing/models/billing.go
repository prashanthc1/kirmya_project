package models

import (
	"time"

	"github.com/google/uuid"
)

// BillingStatusResponse represents the status response when billing feature flags are checked.
type BillingStatusResponse struct {
	BillingEnabled        bool   `json:"billing_enabled"`
	SubscriptionsEnabled  bool   `json:"subscriptions_enabled"`
	CheckoutEnabled       bool   `json:"checkout_enabled"`
	PremiumFeaturesEnabled bool   `json:"premium_features_enabled"`
	StripeEnabled         bool   `json:"stripe_enabled"`
	Message               string `json:"message"`
}

// Plan represents a billing or pricing plan.
type Plan struct {
	ID               uuid.UUID              `json:"id" db:"id"`
	Name             string                 `json:"name" db:"name"`
	Slug             string                 `json:"slug" db:"slug"`
	Description      string                 `json:"description" db:"description"`
	PlanType         string                 `json:"plan_type" db:"plan_type"` // free, recurring, custom
	Currency         string                 `json:"currency" db:"currency"`
	BillingInterval  string                 `json:"billing_interval" db:"billing_interval"` // monthly, yearly, one_time, custom
	PriceCents       int                    `json:"price_cents" db:"price_cents"`
	TrialPeriodDays  int                    `json:"trial_period_days" db:"trial_period_days"`
	IsActive         bool                   `json:"is_active" db:"is_active"`
	IsPublic         bool                   `json:"is_public" db:"is_public"`
	Features         map[string]interface{} `json:"features" db:"features"`
	Limits           map[string]interface{} `json:"limits" db:"limits"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
}

// Entitlement represents a granular feature entitlement.
type Entitlement struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Code        string    `json:"code" db:"code"`
	Name        string    `json:"name" db:"name"`
	Category    string    `json:"category" db:"category"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Customer represents a billing customer.
type Customer struct {
	ID                 uuid.UUID              `json:"id" db:"id"`
	UserID             *uuid.UUID             `json:"user_id,omitempty" db:"user_id"`
	OrganizationID     *uuid.UUID             `json:"organization_id,omitempty" db:"organization_id"`
	CompanyID          *uuid.UUID             `json:"company_id,omitempty" db:"company_id"`
	Provider           string                 `json:"provider" db:"provider"`
	ProviderCustomerID string                 `json:"provider_customer_id" db:"provider_customer_id"`
	BillingEmail       string                 `json:"billing_email" db:"billing_email"`
	Currency           string                 `json:"currency" db:"currency"`
	TaxID              string                 `json:"tax_id,omitempty" db:"tax_id"`
	Metadata           map[string]interface{} `json:"metadata" db:"metadata"`
	CreatedAt          time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at" db:"updated_at"`
}

// Subscription represents an active or past billing subscription.
type Subscription struct {
	ID                     uuid.UUID  `json:"id" db:"id"`
	CustomerID             uuid.UUID  `json:"customer_id" db:"customer_id"`
	PlanID                 uuid.UUID  `json:"plan_id" db:"plan_id"`
	Status                 string     `json:"status" db:"status"` // trialing, active, past_due, paused, cancelled, expired, incomplete
	ProviderSubscriptionID string     `json:"provider_subscription_id,omitempty" db:"provider_subscription_id"`
	CurrentPeriodStart     time.Time  `json:"current_period_start" db:"current_period_start"`
	CurrentPeriodEnd       time.Time  `json:"current_period_end" db:"current_period_end"`
	CancelAtPeriodEnd      bool       `json:"cancel_at_period_end" db:"cancel_at_period_end"`
	CancelledAt            *time.Time `json:"cancelled_at,omitempty" db:"cancelled_at"`
	EndedAt                *time.Time `json:"ended_at,omitempty" db:"ended_at"`
	TrialStart             *time.Time `json:"trial_start,omitempty" db:"trial_start"`
	TrialEnd               *time.Time `json:"trial_end,omitempty" db:"trial_end"`
	CreatedAt              time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at" db:"updated_at"`
}

// PaymentMethod represents masked payment card details.
type PaymentMethod struct {
	ID                      uuid.UUID `json:"id" db:"id"`
	CustomerID              uuid.UUID `json:"customer_id" db:"customer_id"`
	ProviderPaymentMethodID string    `json:"provider_payment_method_id" db:"provider_payment_method_id"`
	Brand                   string    `json:"brand" db:"brand"`
	LastFour                string    `json:"last_four" db:"last_four"`
	ExpMonth                int       `json:"exp_month" db:"exp_month"`
	ExpYear                 int       `json:"exp_year" db:"exp_year"`
	IsDefault               bool      `json:"is_default" db:"is_default"`
	CreatedAt               time.Time `json:"created_at" db:"created_at"`
}

// Invoice represents a billing invoice.
type Invoice struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	InvoiceNumber     string     `json:"invoice_number" db:"invoice_number"`
	CustomerID        uuid.UUID  `json:"customer_id" db:"customer_id"`
	SubscriptionID    *uuid.UUID `json:"subscription_id,omitempty" db:"subscription_id"`
	SubtotalCents     int        `json:"subtotal_cents" db:"subtotal_cents"`
	TaxCents          int        `json:"tax_cents" db:"tax_cents"`
	DiscountCents     int        `json:"discount_cents" db:"discount_cents"`
	TotalCents        int        `json:"total_cents" db:"total_cents"`
	Currency          string     `json:"currency" db:"currency"`
	Status            string     `json:"status" db:"status"` // draft, open, paid, past_due, void
	DueDate           *time.Time `json:"due_date,omitempty" db:"due_date"`
	PaidAt            *time.Time `json:"paid_at,omitempty" db:"paid_at"`
	PDFURL            string     `json:"pdf_url,omitempty" db:"pdf_url"`
	ProviderInvoiceID string     `json:"provider_invoice_id,omitempty" db:"provider_invoice_id"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

// UsageRecord represents feature usage tracking against limits.
type UsageRecord struct {
	ID              uuid.UUID `json:"id" db:"id"`
	EntityType      string    `json:"entity_type" db:"entity_type"` // user, organization, company
	EntityID        uuid.UUID `json:"entity_id" db:"entity_id"`
	EntitlementCode string    `json:"entitlement_code" db:"entitlement_code"`
	PeriodStart     time.Time `json:"period_start" db:"period_start"`
	PeriodEnd       time.Time `json:"period_end" db:"period_end"`
	CurrentUsage    int       `json:"current_usage" db:"current_usage"`
	UsageLimit      *int      `json:"usage_limit,omitempty" db:"usage_limit"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// WebhookEvent represents an incoming webhook log.
type WebhookEvent struct {
	ID              uuid.UUID              `json:"id" db:"id"`
	Provider        string                 `json:"provider" db:"provider"`
	ProviderEventID string                 `json:"provider_event_id" db:"provider_event_id"`
	EventType       string                 `json:"event_type" db:"event_type"`
	Payload         map[string]interface{} `json:"payload" db:"payload"`
	Status          string                 `json:"status" db:"status"` // pending, processed, failed
	ErrorMessage    string                 `json:"error_message,omitempty" db:"error_message"`
	ProcessedAt     *time.Time             `json:"processed_at,omitempty" db:"processed_at"`
	CreatedAt       time.Time              `json:"created_at" db:"created_at"`
}

// CheckoutRequest DTO for checkout sessions.
type CheckoutRequest struct {
	PlanID       uuid.UUID `json:"plan_id" binding:"required"`
	SuccessURL   string    `json:"success_url" binding:"required"`
	CancelURL    string    `json:"cancel_url" binding:"required"`
	BillingEmail string    `json:"billing_email"`
}
