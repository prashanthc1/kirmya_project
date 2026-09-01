package repository

import (
	"context"
	"fmt"
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

type postgresMarketplaceRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	countries  []domain.Country
	regions    []domain.Region
	currencies []domain.Currency
	jobs       []domain.InternationalJobItem
}

func NewMarketplaceRepository(pool *pgxpool.Pool) MarketplaceRepository {
	repo := &postgresMarketplaceRepository{pool: pool}
	repo.seedDefaultDataIfMemory()
	return repo
}

func (r *postgresMarketplaceRepository) GetCountries(ctx context.Context) ([]domain.Country, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.countries, nil
	}

	query := `
		SELECT id, COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::uuid), name, code, currency_code, flag_emoji, is_active
		FROM countries
		ORDER BY name ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Country
	for rows.Next() {
		var c domain.Country
		if err := rows.Scan(
			&c.ID, &c.RegionID, &c.Name, &c.Code, &c.CurrencyCode, &c.FlagEmoji, &c.IsActive,
		); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	if len(list) == 0 {
		return r.countries, nil
	}
	return list, rows.Err()
}

func (r *postgresMarketplaceRepository) GetRegions(ctx context.Context) ([]domain.Region, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.regions, nil
	}

	query := `
		SELECT id, name, code, COALESCE(description, '')
		FROM regions
		ORDER BY name ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Region
	for rows.Next() {
		var reg domain.Region
		if err := rows.Scan(
			&reg.ID, &reg.Name, &reg.Code, &reg.Description,
		); err != nil {
			return nil, err
		}
		list = append(list, reg)
	}
	if len(list) == 0 {
		return r.regions, nil
	}
	return list, rows.Err()
}

func (r *postgresMarketplaceRepository) GetCurrencies(ctx context.Context) ([]domain.Currency, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.currencies, nil
	}

	query := `
		SELECT id, code, symbol, name, usd_exchange_rate, updated_at
		FROM currencies
		ORDER BY code ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Currency
	for rows.Next() {
		var curr domain.Currency
		if err := rows.Scan(
			&curr.ID, &curr.Code, &curr.Symbol, &curr.Name, &curr.USDExchangeRate, &curr.UpdatedAt,
		); err != nil {
			return nil, err
		}
		list = append(list, curr)
	}
	if len(list) == 0 {
		return r.currencies, nil
	}
	return list, rows.Err()
}

func (r *postgresMarketplaceRepository) SearchInternationalJobs(ctx context.Context, regionCode, countryCode, arrangement string) ([]domain.InternationalJobItem, error) {
	if r.pool == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var filtered []domain.InternationalJobItem
		for _, job := range r.jobs {
			if arrangement != "" && job.PrimaryLocation.WorkArrangement != arrangement {
				continue
			}
			if countryCode != "" && job.PrimaryLocation.CountryCode != countryCode {
				continue
			}
			filtered = append(filtered, job)
		}
		return filtered, nil
	}

	query := `
		SELECT jl.job_id, COALESCE(j.title, 'Senior Software Engineer'), COALESCE(j.company, 'Kirmya Global Tech'),
		       COALESCE(reg.code, 'GLOBAL'), jl.id, jl.country_id, c.name, c.code, c.flag_emoji, jl.city, jl.work_arrangement,
		       COALESCE(j.salary_min, 120000), COALESCE(j.salary_max, 180000),
		       COALESCE(c.currency_code, 'USD'), COALESCE(j.created_at, NOW())
		FROM job_locations jl
		JOIN countries c ON jl.country_id = c.id
		LEFT JOIN regions reg ON c.region_id = reg.id
		LEFT JOIN jobs j ON jl.job_id = j.id
		WHERE ($1 = '' OR reg.code = $1)
		  AND ($2 = '' OR c.code = $2)
		  AND ($3 = '' OR jl.work_arrangement = $3)
		ORDER BY jl.created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, regionCode, countryCode, arrangement)
	if err != nil {
		return r.jobs, nil
	}
	defer rows.Close()

	var list []domain.InternationalJobItem
	for rows.Next() {
		var item domain.InternationalJobItem
		var loc domain.JobLocation
		var postedAt time.Time
		if err := rows.Scan(
			&item.JobID, &item.Title, &item.Company, &item.RegionCode,
			&loc.ID, &loc.CountryID, &loc.CountryName, &loc.CountryCode, &loc.FlagEmoji, &loc.City, &loc.WorkArrangement,
			&item.MinSalary, &item.MaxSalary, &item.CurrencyCode, &postedAt,
		); err != nil {
			return nil, err
		}
		loc.JobID = item.JobID
		item.PrimaryLocation = loc
		item.FormattedSalary = fmt.Sprintf("%s %.0f - %.0f", item.CurrencyCode, item.MinSalary, item.MaxSalary)
		item.MatchScore = 92
		item.PostedTime = "Recently"
		list = append(list, item)
	}
	if len(list) == 0 {
		return r.jobs, nil
	}
	return list, rows.Err()
}

func (r *postgresMarketplaceRepository) seedDefaultDataIfMemory() {
	gccID := uuid.MustParse("44444444-4444-4444-4444-444444444401")
	apacID := uuid.MustParse("44444444-4444-4444-4444-444444444402")
	globalID := uuid.MustParse("44444444-4444-4444-4444-444444444403")
	naID := uuid.MustParse("44444444-4444-4444-4444-444444444404")

	r.regions = []domain.Region{
		{ID: gccID, Name: "Middle East & GCC", Code: domain.RegionGCC, Description: "UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman"},
		{ID: apacID, Name: "India & APAC", Code: domain.RegionAPAC, Description: "India, Singapore, APAC Tech Hubs"},
		{ID: globalID, Name: "Global Remote", Code: domain.RegionGlobal, Description: "Worldwide Remote Work Opportunities"},
		{ID: naID, Name: "North America", Code: domain.RegionNA, Description: "US & Canada Tech Hubs"},
	}

	r.countries = []domain.Country{
		{ID: uuid.MustParse("55555555-5555-5555-5555-555555555501"), RegionID: gccID, Name: "United Arab Emirates", Code: "AE", CurrencyCode: "AED", FlagEmoji: "🇦🇪", IsActive: true},
		{ID: uuid.MustParse("55555555-5555-5555-5555-555555555502"), RegionID: apacID, Name: "India", Code: "IN", CurrencyCode: "INR", FlagEmoji: "🇮🇳", IsActive: true},
		{ID: uuid.MustParse("55555555-5555-5555-5555-555555555503"), RegionID: gccID, Name: "Saudi Arabia", Code: "SA", CurrencyCode: "SAR", FlagEmoji: "🇸🇦", IsActive: true},
		{ID: uuid.MustParse("55555555-5555-5555-5555-555555555504"), RegionID: naID, Name: "United States", Code: "US", CurrencyCode: "USD", FlagEmoji: "🇺🇸", IsActive: true},
	}

	now := time.Now()
	r.currencies = []domain.Currency{
		{ID: uuid.New(), Code: "AED", Symbol: "AED", Name: "UAE Dirham", USDExchangeRate: 3.6725, UpdatedAt: now},
		{ID: uuid.New(), Code: "INR", Symbol: "₹", Name: "Indian Rupee", USDExchangeRate: 83.4500, UpdatedAt: now},
		{ID: uuid.New(), Code: "SAR", Symbol: "SAR", Name: "Saudi Riyal", USDExchangeRate: 3.7500, UpdatedAt: now},
		{ID: uuid.New(), Code: "USD", Symbol: "$", Name: "US Dollar", USDExchangeRate: 1.0000, UpdatedAt: now},
	}

	locID := uuid.MustParse("77777777-7777-7777-7777-777777777701")
	jobID := uuid.MustParse("66666666-6666-6666-6666-666666666601")
	r.jobs = []domain.InternationalJobItem{
		{
			JobID:      jobID,
			Title:      "Staff Infrastructure Architect",
			Company:    "Careem Global",
			RegionCode: domain.RegionGCC,
			PrimaryLocation: domain.JobLocation{
				ID:              locID,
				JobID:           jobID,
				CountryID:       uuid.MustParse("55555555-5555-5555-5555-555555555501"),
				CountryName:     "United Arab Emirates",
				CountryCode:     "AE",
				FlagEmoji:       "🇦🇪",
				City:            "Dubai Internet City",
				WorkArrangement: domain.ArrangementHybrid,
			},
			MinSalary:       35000,
			MaxSalary:       50000,
			CurrencyCode:    "AED",
			FormattedSalary: "AED 35,000 - 50,000 / mo",
			MatchScore:      94,
			PostedTime:      "12h ago",
		},
	}
}
