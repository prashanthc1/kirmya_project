package service

import (
	"context"
	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"
	"testing"

	"github.com/google/uuid"
)

func TestRegisterCompanyFlow(t *testing.T) {
	repo := repository.NewCompanyRepository(nil)
	svc := NewCompanyService(repo)

	creatorID := uuid.New()
	payload := &models.RegisterCompanyPayload{
		Name:        "Acme Middle East",
		Handle:      "acme-me",
		Industry:    "Logistics",
		Location:    "Dubai, UAE",
		Website:     "https://acme.ae",
		CompanySize: "51-200 employees",
		FoundedYear: 2018,
	}

	c, p, err := svc.RegisterCompany(context.Background(), creatorID, payload)
	if err != nil {
		t.Fatalf("Expected no error registering company, got %v", err)
	}

	if c.Name != "Acme Middle East" {
		t.Errorf("Expected name 'Acme Middle East', got %s", c.Name)
	}

	if p.Industry != "Logistics" {
		t.Errorf("Expected industry 'Logistics', got %s", p.Industry)
	}
}

func TestUpdateProfileAuthorizationCheck(t *testing.T) {
	repo := repository.NewCompanyRepository(nil)
	svc := NewCompanyService(repo)

	// Since database pool is nil, GetMemberRole returns "admin" by default in our repo offline stub mode
	userID := uuid.New()
	companyID := uuid.New()

	payload := &models.UpdateProfilePayload{
		About:            "New overview about Acme",
		Website:          "https://acme-new.ae",
		Location:         "Abu Dhabi, UAE",
		CompanySize:      "500-1000 employees",
		Culture:          "Excellent",
		Benefits:         []string{"Healthcare", "Equity Options"},
		EmployeeInsights: "High satisfaction rate.",
	}

	// Should succeed because GetMemberRole returns "admin" by default in offline tests
	err := svc.UpdateProfile(context.Background(), userID, companyID, payload)
	if err != nil {
		t.Fatalf("Expected update to succeed for admin user, got %v", err)
	}
}

func TestFollowCompanyOffline(t *testing.T) {
	repo := repository.NewCompanyRepository(nil)
	svc := NewCompanyService(repo)

	companyID := uuid.New()
	userID := uuid.New()

	following, err := svc.FollowCompany(context.Background(), companyID, userID)
	if err != nil {
		t.Fatalf("Expected no error toggling follow status, got %v", err)
	}

	if !following {
		t.Errorf("Expected following state to toggle to true, got false")
	}
}

func TestGetRecommendationsStubs(t *testing.T) {
	repo := repository.NewCompanyRepository(nil)
	svc := NewCompanyService(repo)

	companies, profiles, err := svc.GetRecommendations(context.Background(), 3)
	if err != nil {
		t.Fatalf("Expected no error fetching recommendations stubs, got %v", err)
	}

	if len(companies) != 3 {
		t.Errorf("Expected exactly 3 recommended companies, got %d", len(companies))
	}

	if len(profiles) != 3 {
		t.Errorf("Expected exactly 3 recommended profiles, got %d", len(profiles))
	}

	if companies[0].Handle != "emaar" {
		t.Errorf("Expected first recommendation handle to be 'emaar', got %s", companies[0].Handle)
	}
}
