package repository

import (
	"context"
	"sync"
	"time"

	"kirmya/internal/global_marketplace/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MarketplaceRepository interface {
	GetCountries(ctx context.Context) ([]domain.Country, error)
	GetRegions(ctx context.Context) ([]domain.Region, error)
	GetCurrencies(ctx context.Context) ([]domain.Currency, error)
	SearchInternationalJobs(ctx context.Context, regionCode, countryCode, arrangement string) ([]domain.InternationalJobItem, error)
}

type pgxMarketplaceRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	countries  []domain.Country
	regions    []domain.Region
	currencies []domain.Currency
	jobs       []domain.InternationalJobItem
}

func NewMarketplaceRepository(pool *pgxpool.Pool) MarketplaceRepository {
	repo := &pgxMarketplaceRepository{pool: pool}
	repo.seedDefaultData()
	return repo
}

func (r *pgxMarketplaceRepository) seedDefaultData() {
	r.regions = []domain.Region{
		{ID: uuid.New(), Name: "Middle East & GCC", Code: domain.RegionGCC, Description: "UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman"},
		{ID: uuid.New(), Name: "India & APAC", Code: domain.RegionAPAC, Description: "India, Singapore, APAC Tech Hubs"},
		{ID: uuid.New(), Name: "Global Remote", Code: domain.RegionGlobal, Description: "Worldwide Remote Work Opportunities"},
		{ID: uuid.New(), Name: "North America", Code: domain.RegionNA, Description: "US & Canada Tech Hubs"},
	}

	r.countries = []domain.Country{
		{ID: uuid.New(), Name: "United Arab Emirates", Code: "AE", CurrencyCode: "AED", FlagEmoji: "🇦🇪", IsActive: true},
		{ID: uuid.New(), Name: "India", Code: "IN", CurrencyCode: "INR", FlagEmoji: "🇮🇳", IsActive: true},
		{ID: uuid.New(), Name: "Saudi Arabia", Code: "SA", CurrencyCode: "SAR", FlagEmoji: "🇸🇦", IsActive: true},
		{ID: uuid.New(), Name: "United States", Code: "US", CurrencyCode: "USD", FlagEmoji: "🇺🇸", IsActive: true},
		{ID: uuid.New(), Name: "United Kingdom", Code: "GB", CurrencyCode: "GBP", FlagEmoji: "🇬🇧", IsActive: true},
		{ID: uuid.New(), Name: "Singapore", Code: "SG", CurrencyCode: "SGD", FlagEmoji: "🇸🇬", IsActive: true},
	}

	now := time.Now()
	r.currencies = []domain.Currency{
		{ID: uuid.New(), Code: "USD", Symbol: "$", Name: "US Dollar", USDExchangeRate: 1.0, UpdatedAt: now},
		{ID: uuid.New(), Code: "AED", Symbol: "AED ", Name: "UAE Dirham", USDExchangeRate: 3.67, UpdatedAt: now},
		{ID: uuid.New(), Code: "INR", Symbol: "₹", Name: "Indian Rupee", USDExchangeRate: 83.25, UpdatedAt: now},
		{ID: uuid.New(), Code: "SAR", Symbol: "SAR ", Name: "Saudi Riyal", USDExchangeRate: 3.75, UpdatedAt: now},
		{ID: uuid.New(), Code: "EUR", Symbol: "€", Name: "Euro", USDExchangeRate: 0.92, UpdatedAt: now},
		{ID: uuid.New(), Code: "GBP", Symbol: "£", Name: "British Pound", USDExchangeRate: 0.79, UpdatedAt: now},
	}

	r.jobs = []domain.InternationalJobItem{
		{
			JobID:      uuid.MustParse("j1111111-1111-1111-1111-111111111111"),
			Title:      "Senior Go Backend Architect",
			Company:    "Stripe Global (UAE Hub)",
			RegionCode: domain.RegionGCC,
			PrimaryLocation: domain.JobLocation{
				ID:              uuid.New(),
				JobID:           uuid.MustParse("j1111111-1111-1111-1111-111111111111"),
				CountryName:     "United Arab Emirates",
				CountryCode:     "AE",
				FlagEmoji:       "🇦🇪",
				City:            "Dubai / DIFC",
				WorkArrangement: domain.ArrangementHybrid,
			},
			MinSalary:       22000,
			MaxSalary:       28000,
			CurrencyCode:    "AED",
			FormattedSalary: "AED 22,000 - 28,000 / month",
			MatchScore:      96,
			PostedTime:      "2 hours ago",
		},
		{
			JobID:      uuid.MustParse("j2222222-2222-2222-2222-222222222222"),
			Title:      "Lead Distributed Systems Engineer",
			Company:    "TechCorp Cloud (India R&D)",
			RegionCode: domain.RegionAPAC,
			PrimaryLocation: domain.JobLocation{
				ID:              uuid.New(),
				JobID:           uuid.MustParse("j2222222-2222-2222-2222-222222222222"),
				CountryName:     "India",
				CountryCode:     "IN",
				FlagEmoji:       "🇮🇳",
				City:            "Bengaluru / Hyderabad",
				WorkArrangement: domain.ArrangementRemote,
			},
			MinSalary:       3500000,
			MaxSalary:       4800000,
			CurrencyCode:    "INR",
			FormattedSalary: "₹35,00,000 - 48,00,000 / year",
			MatchScore:      92,
			PostedTime:      "5 hours ago",
		},
		{
			JobID:      uuid.MustParse("j3333333-3333-3333-3333-333333333333"),
			Title:      "Principal Cloud Infrastructure Architect",
			Company:    "Neom Digital (Saudi Arabia)",
			RegionCode: domain.RegionGCC,
			PrimaryLocation: domain.JobLocation{
				ID:              uuid.New(),
				JobID:           uuid.MustParse("j3333333-3333-3333-3333-333333333333"),
				CountryName:     "Saudi Arabia",
				CountryCode:     "SA",
				FlagEmoji:       "🇸🇦",
				City:            "Riyadh",
				WorkArrangement: domain.ArrangementHybrid,
			},
			MinSalary:       30000,
			MaxSalary:       40000,
			CurrencyCode:    "SAR",
			FormattedSalary: "SAR 30,000 - 40,000 / month",
			MatchScore:      89,
			PostedTime:      "1 day ago",
		},
	}
}

func (r *pgxMarketplaceRepository) GetCountries(ctx context.Context) ([]domain.Country, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.countries, nil
}

func (r *pgxMarketplaceRepository) GetRegions(ctx context.Context) ([]domain.Region, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.regions, nil
}

func (r *pgxMarketplaceRepository) GetCurrencies(ctx context.Context) ([]domain.Currency, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.currencies, nil
}

func (r *pgxMarketplaceRepository) SearchInternationalJobs(ctx context.Context, regionCode, countryCode, arrangement string) ([]domain.InternationalJobItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []domain.InternationalJobItem
	for _, j := range r.jobs {
		if regionCode != "" && regionCode != "ALL" && j.RegionCode != regionCode {
			continue
		}
		if countryCode != "" && countryCode != "ALL" && j.PrimaryLocation.CountryCode != countryCode {
			continue
		}
		if arrangement != "" && arrangement != "ALL" && j.PrimaryLocation.WorkArrangement != arrangement {
			continue
		}
		result = append(result, j)
	}
	return result, nil
}
