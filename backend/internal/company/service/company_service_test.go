package service

import (
	"context"
	"errors"
	"testing"

	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"

	"github.com/google/uuid"
)

// offlineService builds the service the way a process that failed to reach
// PostgreSQL would: real repositories, no pool behind them.
func offlineService() *CompanyService {
	return NewCompanyService(
		repository.NewCompanyRepository(nil),
		repository.NewManagementRepository(nil),
	)
}

// A company registration that cannot reach the database must fail. An earlier
// version of this service answered from a fixture instead, so a caller could
// not tell a stored company from an invented one.
func TestRegisterCompanyRequiresDatabase(t *testing.T) {
	svc := offlineService()

	payload := &models.RegisterCompanyPayload{
		Name:        "Acme Middle East",
		Handle:      "acme-me",
		Industry:    "Logistics",
		Location:    "Dubai, UAE",
		Website:     "https://acme.ae",
		CompanySize: "51-200 employees",
		FoundedYear: 2018,
	}

	company, profile, err := svc.RegisterCompany(context.Background(), uuid.New(), payload)
	if !errors.Is(err, repository.ErrNoDatabase) {
		t.Fatalf("expected ErrNoDatabase, got company=%v profile=%v err=%v", company, profile, err)
	}
}

// Profile edits are authorized against the caller's stored grant. With no
// database there is no grant, and the previous behaviour — treating an
// unreadable membership as "admin" — would hand the profile to anyone.
func TestUpdateProfileDeniesWhenGrantCannotBeRead(t *testing.T) {
	svc := offlineService()

	payload := &models.UpdateProfilePayload{
		About:            "New overview about Acme",
		Website:          "https://acme-new.ae",
		Location:         "Abu Dhabi, UAE",
		CompanySize:      "500-1000 employees",
		Culture:          "Excellent",
		Benefits:         []string{"Healthcare", "Equity Options"},
		EmployeeInsights: "High satisfaction rate.",
	}

	err := svc.UpdateProfile(context.Background(), uuid.New(), uuid.New(), payload)
	if err == nil {
		t.Fatal("expected the update to be refused when the caller's membership cannot be read")
	}
}

// Following is a write. It reports the state it actually persisted, so with no
// database it reports an error rather than a cheerful "true".
func TestFollowCompanyRequiresDatabase(t *testing.T) {
	svc := offlineService()

	following, err := svc.FollowCompany(context.Background(), uuid.New(), uuid.New())
	if err == nil {
		t.Fatalf("expected an error following without a database, got following=%v", following)
	}
	if following {
		t.Error("a follow that was never stored must not report itself as active")
	}
}

// Recommendations come from the discovery shelves, which come from the
// database. No database means no recommendations — not a hardcoded list of
// real companies the platform has no data for.
func TestGetRecommendationsReturnsNothingWithoutDatabase(t *testing.T) {
	svc := offlineService()

	companies, profiles, err := svc.GetRecommendations(context.Background(), uuid.New(), 3)
	if err == nil && len(companies) != 0 {
		t.Errorf("expected no recommended companies, got %d", len(companies))
	}
	if err == nil && len(profiles) != 0 {
		t.Errorf("expected no recommended profiles, got %d", len(profiles))
	}
}
