package service

import (
	"strings"
	"unicode/utf8"

	"kirmya/internal/freelance/domain"
)

// Server-side validation for everything the module accepts.
//
// Gin's `binding` tags catch a missing field and nothing else: they cannot
// express "a title is at most 200 characters", "a currency is one this module
// can do arithmetic in", or "these milestones must sum to the bid". Those rules
// live here, where they run on every path into the service regardless of which
// handler - or which test - called it.
//
// The frontend validates the same things. That is a convenience for the person
// typing, not a control: a request that never touches the frontend reaches these
// functions all the same.

// Field bounds. These match the column widths migration 0102 declares, so a
// value that passes here cannot be truncated or rejected by PostgreSQL
// afterwards - the error the caller gets names the field rather than being a
// driver's "value too long for type character varying(200)".
const (
	maxTitleLen       = 200
	maxDescriptionLen = 8000
	maxTaglineLen     = 280
	maxCoverLetterLen = 8000
	maxSkillLen       = 80
	maxSkills         = 30
	maxPortfolioItems = 50
	maxURLLen         = 2048

	// maxEstimatedDays is five years. Not a business rule so much as a bound:
	// without one, an estimate of 10^9 days is storable and renders as a date
	// beyond the range of every calendar widget that will ever read it.
	maxEstimatedDays = 1825
)

// resolveCurrency picks the currency for a write and rejects an unsupported one.
//
// requested wins when present, otherwise the context's currency - the project's
// for a bid, the module default for a new profile. A bid in a different currency
// from the project it answers is refused at the point it is written rather than
// discovered when somebody tries to compare the two.
func resolveCurrency(requested, fallback string) (string, error) {
	candidate := strings.TrimSpace(requested)
	if candidate == "" {
		candidate = fallback
	}
	if strings.TrimSpace(candidate) == "" {
		candidate = domain.DefaultCurrency
	}
	normalized, err := domain.NormalizeCurrency(candidate)
	if err != nil {
		return "", domain.NewValidationError("currency",
			"must be one of "+strings.Join(domain.SupportedCurrencies(), ", "))
	}
	return normalized, nil
}

// normalizeSkills trims, drops blanks, caps length and removes duplicates.
//
// Case-insensitive de-duplication, keeping the first spelling the caller used:
// "Go" and "go" are one skill, and storing both would split every search over
// that skill in two. The kept spelling is theirs rather than a lower-cased one
// so the profile still reads the way they wrote it.
func normalizeSkills(raw []string) []string {
	seen := make(map[string]bool, len(raw))
	out := make([]string, 0, len(raw))
	for _, skill := range raw {
		trimmed := strings.TrimSpace(skill)
		if trimmed == "" {
			continue
		}
		if utf8.RuneCountInString(trimmed) > maxSkillLen {
			trimmed = string([]rune(trimmed)[:maxSkillLen])
		}
		key := strings.ToLower(trimmed)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, trimmed)
	}
	return out
}

// validateSkills applies the bounds a normalized list must still satisfy.
func validateSkills(skills []string) error {
	if len(skills) > maxSkills {
		return domain.NewValidationError("skills", "may not list more than 30 entries")
	}
	return nil
}

// checkText enforces a required-ness and a maximum length in runes.
//
// Runes rather than bytes: a 200-byte limit on a field a person types in Arabic
// is a 100-character limit, and the column is declared in characters.
func checkText(field, value string, required bool, max int) error {
	trimmed := strings.TrimSpace(value)
	if required && trimmed == "" {
		return domain.NewValidationError(field, "is required")
	}
	if utf8.RuneCountInString(trimmed) > max {
		return domain.NewValidationError(field, "is longer than the maximum allowed")
	}
	return nil
}

// checkURL bounds a URL and rejects a scheme a browser would not follow.
//
// Deliberately not a full URL parse: the value is displayed as a link and never
// fetched by the server, so what matters is that it cannot carry javascript: or
// data: into somebody's browser. An empty URL is allowed - a portfolio entry may
// be a description of work that is not online.
func checkURL(field, value string) error {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	if utf8.RuneCountInString(trimmed) > maxURLLen {
		return domain.NewValidationError(field, "is longer than the maximum allowed")
	}
	lowered := strings.ToLower(trimmed)
	if !strings.HasPrefix(lowered, "http://") && !strings.HasPrefix(lowered, "https://") {
		return domain.NewValidationError(field, "must be an http or https URL")
	}
	return nil
}

// validateProfilePayload checks a freelancer's own profile draft.
//
// The rate is allowed to be zero: a draft in progress has not settled on one,
// and RequiredForActivation is what refuses to complete onboarding without it.
// What is refused here is a rate so large it is certainly a unit mistake -
// 10,000,000.00 an hour in minor units - because the alternative is discovering
// it when a contract is written against it.
func validateProfilePayload(payload domain.SaveProfilePayload) error {
	if err := checkText("tagline", payload.Tagline, false, maxTaglineLen); err != nil {
		return err
	}
	if payload.HourlyRate < 0 {
		return domain.NewValidationError("hourly_rate", "cannot be negative")
	}
	if int64(payload.HourlyRate) > 1_000_000_00 {
		return domain.NewValidationError("hourly_rate", "is implausibly large")
	}
	if err := validateSkills(normalizeSkills(payload.Skills)); err != nil {
		return err
	}
	if len(payload.PortfolioLinks) > maxPortfolioItems {
		return domain.NewValidationError("portfolio_links", "may not list more than 50 entries")
	}
	for _, item := range payload.PortfolioLinks {
		if err := checkText("portfolio_links.title", item.Title, true, maxTitleLen); err != nil {
			return err
		}
		if err := checkURL("portfolio_links.url", item.URL); err != nil {
			return err
		}
	}
	return nil
}

// validateProjectPayload checks a client's new project.
func validateProjectPayload(payload domain.CreateProjectPayload) error {
	if err := checkText("title", payload.Title, true, maxTitleLen); err != nil {
		return err
	}
	if err := checkText("description", payload.Description, true, maxDescriptionLen); err != nil {
		return err
	}
	if payload.Budget < 0 {
		return domain.NewValidationError("budget", "cannot be negative")
	}
	if err := validateSkills(normalizeSkills(payload.SkillsRequired)); err != nil {
		return err
	}
	return nil
}

// validateProposalPayload checks a freelancer's bid.
func validateProposalPayload(payload domain.SubmitProposalPayload) error {
	if err := checkText("cover_letter", payload.CoverLetter, true, maxCoverLetterLen); err != nil {
		return err
	}
	if payload.BidAmount <= 0 {
		return domain.NewValidationError("bid_amount", "must be greater than zero")
	}
	if payload.EstimatedDays <= 0 {
		return domain.NewValidationError("estimated_days", "must be greater than zero")
	}
	if payload.EstimatedDays > maxEstimatedDays {
		return domain.NewValidationError("estimated_days", "is implausibly large")
	}
	return nil
}

// ValidateMilestoneTotal checks that a set of milestone amounts sums exactly to
// the agreed total.
//
// Exported because it is the rule two future flows share - proposal milestones
// against the bid, contract milestones against the contract value - and it is
// the rule most obviously broken by floating-point money: the sum is integer
// minor units, so 33.33 + 33.33 + 33.34 is 10000 and not 9999.999999999998.
//
// The currencies must match too. Milestones in a different currency from the
// total they belong to cannot be summed against it at all.
func ValidateMilestoneTotal(milestones []domain.Money, total domain.Money) error {
	if len(milestones) == 0 {
		return nil
	}
	sum := domain.Money{Currency: total.Currency}
	for _, milestone := range milestones {
		if milestone.Currency != total.Currency {
			return domain.NewValidationError("milestones",
				"must all be in the same currency as the total")
		}
		if milestone.MinorUnits < 0 {
			return domain.NewValidationError("milestones", "cannot contain a negative amount")
		}
		next, err := sum.Add(milestone)
		if err != nil {
			return domain.NewValidationError("milestones", "could not be summed")
		}
		sum = next
	}
	if !sum.Equal(total) {
		return domain.NewValidationError("milestones",
			"must sum to exactly the agreed total ("+total.String()+"), not "+sum.String())
	}
	return nil
}
