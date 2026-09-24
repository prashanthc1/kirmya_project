package payments

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// Stripe Connect payouts.
//
// Separate charges and transfers: the client's payment lands in the platform's
// balance (stripe.go), and releasing a milestone transfers its value to the
// freelancer's Express connected account. Stripe then pays that account out to
// the freelancer's bank on the account's payout schedule.

var _ PayoutGateway = (*StripeGateway)(nil)

// CreatePayoutAccount creates an Express connected account that can receive
// transfers. Idempotent per user for as long as Stripe keeps the key, so two
// clicks on "Set up payouts" make one account.
func (g *StripeGateway) CreatePayoutAccount(ctx context.Context, req PayoutAccountRequest) (string, error) {
	form := url.Values{}
	form.Set("type", "express")
	form.Set("capabilities[transfers][requested]", "true")
	form.Set("metadata[kirmya_user_id]", req.UserID.String())
	if email := strings.TrimSpace(req.Email); email != "" {
		form.Set("email", email)
	}
	var account struct {
		ID string `json:"id"`
	}
	if err := g.do(ctx, http.MethodPost, "/v1/accounts", form,
		"kirmya-payout-account-"+req.UserID.String(), &account); err != nil {
		return "", err
	}
	if account.ID == "" {
		return "", errors.New("stripe: account has no id")
	}
	return account.ID, nil
}

// PayoutOnboardingLink returns an Account Link into Stripe's hosted onboarding.
// Links are single-use and expire within minutes, so one is made per click and
// never stored. Stripe sends the freelancer back to the payouts page either
// way: ?onboarding=return when they leave the flow, ?onboarding=refresh when the
// link had expired and a new one is needed.
func (g *StripeGateway) PayoutOnboardingLink(ctx context.Context, accountID string) (string, error) {
	page := g.cfg.AppBaseURL + "/freelance/payouts"
	form := url.Values{}
	form.Set("account", accountID)
	form.Set("type", "account_onboarding")
	form.Set("refresh_url", page+"?onboarding=refresh")
	form.Set("return_url", page+"?onboarding=return")
	var link struct {
		URL string `json:"url"`
	}
	if err := g.do(ctx, http.MethodPost, "/v1/account_links", form, "", &link); err != nil {
		return "", err
	}
	if link.URL == "" {
		return "", errors.New("stripe: account link has no url")
	}
	return link.URL, nil
}

// stripeAccount is the part of a connected account payouts read.
type stripeAccount struct {
	ID               string `json:"id"`
	Object           string `json:"object"`
	DetailsSubmitted bool   `json:"details_submitted"`
	PayoutsEnabled   bool   `json:"payouts_enabled"`
	Capabilities     struct {
		Transfers string `json:"transfers"`
	} `json:"capabilities"`
	Requirements struct {
		CurrentlyDue   []string `json:"currently_due"`
		PastDue        []string `json:"past_due"`
		DisabledReason string   `json:"disabled_reason"`
	} `json:"requirements"`
}

func (a stripeAccount) state() PayoutAccountState {
	return PayoutAccountState{
		AccountID:        a.ID,
		DetailsSubmitted: a.DetailsSubmitted,
		PayoutsEnabled:   a.PayoutsEnabled,
		TransfersActive:  a.Capabilities.Transfers == "active",
		RequirementsDue:  len(a.Requirements.CurrentlyDue)+len(a.Requirements.PastDue) > 0,
		DisabledReason:   a.Requirements.DisabledReason,
	}
}

// GetPayoutAccount reads a connected account.
func (g *StripeGateway) GetPayoutAccount(ctx context.Context, accountID string) (PayoutAccountState, error) {
	var account stripeAccount
	if err := g.do(ctx, http.MethodGet, "/v1/accounts/"+url.PathEscape(accountID), nil, "", &account); err != nil {
		return PayoutAccountState{}, err
	}
	if account.ID == "" {
		return PayoutAccountState{}, errors.New("stripe: account has no id")
	}
	return account.state(), nil
}

// parseAccountEvent maps a verified account.updated onto AccountUpdated.
func parseAccountEvent(payload []byte) (WebhookEvent, error) {
	var event struct {
		Data struct {
			Object stripeAccount `json:"object"`
		} `json:"data"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		return WebhookEvent{}, ErrMalformedEvent
	}
	account := event.Data.Object
	if account.Object != "account" || account.ID == "" {
		return WebhookEvent{Kind: EventIgnored}, nil
	}
	state := account.state()
	return WebhookEvent{Kind: AccountUpdated, Reference: account.ID, Account: &state}, nil
}

// SendPayout transfers a payout to the freelancer's connected account.
//
// When the payout names the escrowed charge, the transfer is tied to that
// charge with source_transaction: Stripe then funds it from that payment - even
// while the payment is still settling - rather than from the balance at large.
// The payout id is the idempotency key and is in the metadata, so a retried
// send names the same transfer and any transfer traces back to its payout.
func (g *StripeGateway) SendPayout(ctx context.Context, req PayoutRequest) (string, error) {
	if req.AmountMinorUnits <= 0 {
		return "", errors.New("stripe: payout amount must be positive")
	}
	if strings.TrimSpace(req.Destination) == "" {
		return "", errors.New("stripe: payout has no destination account")
	}

	form := url.Values{}
	form.Set("amount", strconv.FormatInt(req.AmountMinorUnits, 10))
	form.Set("currency", strings.ToLower(req.Currency))
	form.Set("destination", req.Destination)
	form.Set("transfer_group", "kirmya-contract-"+req.ContractID.String())
	form.Set("metadata[kirmya_payout_id]", req.PayoutID.String())
	form.Set("metadata[kirmya_contract_id]", req.ContractID.String())
	if req.SourceReference != "" {
		charge, err := g.chargeOfSession(ctx, req.SourceReference)
		if err != nil {
			return "", err
		}
		form.Set("source_transaction", charge)
	}

	var transfer struct {
		ID string `json:"id"`
	}
	if err := g.do(ctx, http.MethodPost, "/v1/transfers", form,
		"kirmya-payout-"+req.PayoutID.String(), &transfer); err != nil {
		return "", err
	}
	if transfer.ID == "" {
		return "", errors.New("stripe: transfer has no id")
	}
	return transfer.ID, nil
}

// chargeOfSession finds the charge behind a paid Checkout Session.
func (g *StripeGateway) chargeOfSession(ctx context.Context, sessionID string) (string, error) {
	var session struct {
		PaymentIntent struct {
			LatestCharge string `json:"latest_charge"`
		} `json:"payment_intent"`
	}
	path := "/v1/checkout/sessions/" + url.PathEscape(sessionID) + "?" + url.Values{"expand[]": {"payment_intent"}}.Encode()
	if err := g.do(ctx, http.MethodGet, path, nil, "", &session); err != nil {
		return "", err
	}
	if session.PaymentIntent.LatestCharge == "" {
		return "", errors.New("stripe: checkout session has no charge to pay out from")
	}
	return session.PaymentIntent.LatestCharge, nil
}
