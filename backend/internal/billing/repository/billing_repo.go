package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/billing/models"
)

type BillingRepository interface {
	GetPlans(ctx context.Context) ([]models.Plan, error)
	GetPlanBySlug(ctx context.Context, slug string) (*models.Plan, error)
	GetEntitlements(ctx context.Context) ([]models.Entitlement, error)
	CheckEntitlement(ctx context.Context, entityType string, entityID uuid.UUID, code string) (bool, error)
	GetCustomerByUserID(ctx context.Context, userID uuid.UUID) (*models.Customer, error)
	GetCustomerByOrgID(ctx context.Context, orgID uuid.UUID) (*models.Customer, error)
	GetActiveSubscription(ctx context.Context, customerID uuid.UUID) (*models.Subscription, error)
	GetInvoices(ctx context.Context, customerID uuid.UUID) ([]models.Invoice, error)
	GetPaymentMethods(ctx context.Context, customerID uuid.UUID) ([]models.PaymentMethod, error)
	GetUsage(ctx context.Context, entityType string, entityID uuid.UUID, code string) (*models.UsageRecord, error)
	RecordWebhookEvent(ctx context.Context, event *models.WebhookEvent) error
}

type billingRepository struct {
	db *sql.DB
}

func NewBillingRepository(db *sql.DB) BillingRepository {
	return &billingRepository{db: db}
}

func (r *billingRepository) GetPlans(ctx context.Context) ([]models.Plan, error) {
	if r.db == nil {
		return []models.Plan{
			{
				ID:              uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				Name:            "Free Plan",
				Slug:            "free",
				Description:     "Full platform access - 100% Free",
				PlanType:        "free",
				Currency:        "USD",
				BillingInterval: "monthly",
				PriceCents:      0,
				IsActive:        true,
				IsPublic:        true,
				CreatedAt:       time.Now(),
				UpdatedAt:       time.Now(),
			},
		}, nil
	}

	query := `SELECT id, name, slug, description, plan_type, currency, billing_interval, price_cents, trial_period_days, is_active, is_public, created_at, updated_at FROM billing_plans WHERE is_active = true ORDER BY price_cents ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []models.Plan
	for rows.Next() {
		var p models.Plan
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.PlanType, &p.Currency, &p.BillingInterval, &p.PriceCents, &p.TrialPeriodDays, &p.IsActive, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		plans = append(plans, p)
	}
	return plans, nil
}

func (r *billingRepository) GetPlanBySlug(ctx context.Context, slug string) (*models.Plan, error) {
	if r.db == nil {
		if slug == "free" {
			return &models.Plan{
				ID:          uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				Name:        "Free Plan",
				Slug:        "free",
				Description: "Full platform access - 100% Free",
				PlanType:    "free",
				Currency:    "USD",
				IsActive:    true,
				IsPublic:    true,
			}, nil
		}
		return nil, errors.New("plan not found")
	}

	query := `SELECT id, name, slug, description, plan_type, currency, billing_interval, price_cents, trial_period_days, is_active, is_public, created_at, updated_at FROM billing_plans WHERE slug = $1`
	row := r.db.QueryRowContext(ctx, query, slug)
	var p models.Plan
	if err := row.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.PlanType, &p.Currency, &p.BillingInterval, &p.PriceCents, &p.TrialPeriodDays, &p.IsActive, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *billingRepository) GetEntitlements(ctx context.Context) ([]models.Entitlement, error) {
	if r.db == nil {
		return []models.Entitlement{
			{ID: uuid.New(), Code: "jobs.create", Name: "Create Job Listings", Category: "jobs"},
			{ID: uuid.New(), Code: "recruiter.search", Name: "Recruiter Candidate Search", Category: "recruiter"},
			{ID: uuid.New(), Code: "company.analytics", Name: "Company Hiring Analytics", Category: "company"},
		}, nil
	}

	query := `SELECT id, code, name, category, description, created_at FROM billing_entitlements ORDER BY code ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entitlements []models.Entitlement
	for rows.Next() {
		var e models.Entitlement
		if err := rows.Scan(&e.ID, &e.Code, &e.Name, &e.Category, &e.Description, &e.CreatedAt); err != nil {
			return nil, err
		}
		entitlements = append(entitlements, e)
	}
	return entitlements, nil
}

func (r *billingRepository) CheckEntitlement(ctx context.Context, entityType string, entityID uuid.UUID, code string) (bool, error) {
	// Under 100% FREE product state, all valid platform features are granted
	return true, nil
}

func (r *billingRepository) GetCustomerByUserID(ctx context.Context, userID uuid.UUID) (*models.Customer, error) {
	return &models.Customer{
		ID:           uuid.New(),
		UserID:       &userID,
		Provider:     "stripe",
		BillingEmail: "user@kirmya.com",
		Currency:     "USD",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}, nil
}

func (r *billingRepository) GetCustomerByOrgID(ctx context.Context, orgID uuid.UUID) (*models.Customer, error) {
	return &models.Customer{
		ID:             uuid.New(),
		OrganizationID: &orgID,
		Provider:       "stripe",
		BillingEmail:   "org@kirmya.com",
		Currency:       "USD",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}, nil
}

func (r *billingRepository) GetActiveSubscription(ctx context.Context, customerID uuid.UUID) (*models.Subscription, error) {
	return &models.Subscription{
		ID:                 uuid.New(),
		CustomerID:         customerID,
		PlanID:             uuid.MustParse("00000000-0000-0000-0000-000000000001"),
		Status:             "active",
		CurrentPeriodStart: time.Now(),
		CurrentPeriodEnd:   time.Now().AddDate(0, 1, 0),
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}, nil
}

func (r *billingRepository) GetInvoices(ctx context.Context, customerID uuid.UUID) ([]models.Invoice, error) {
	return []models.Invoice{}, nil
}

func (r *billingRepository) GetPaymentMethods(ctx context.Context, customerID uuid.UUID) ([]models.PaymentMethod, error) {
	return []models.PaymentMethod{}, nil
}

func (r *billingRepository) GetUsage(ctx context.Context, entityType string, entityID uuid.UUID, code string) (*models.UsageRecord, error) {
	return &models.UsageRecord{
		ID:              uuid.New(),
		EntityType:      entityType,
		EntityID:        entityID,
		EntitlementCode: code,
		PeriodStart:     time.Now().AddDate(0, 0, -30),
		PeriodEnd:       time.Now().AddDate(0, 0, 30),
		CurrentUsage:    0,
		UpdatedAt:       time.Now(),
	}, nil
}

func (r *billingRepository) RecordWebhookEvent(ctx context.Context, event *models.WebhookEvent) error {
	return nil
}
