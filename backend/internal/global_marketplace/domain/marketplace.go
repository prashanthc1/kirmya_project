package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	ArrangementRemote = "remote"
	ArrangementHybrid = "hybrid"
	ArrangementOnsite = "onsite"

	RegionGCC    = "ME_GCC"
	RegionAPAC   = "APAC"
	RegionNA     = "NA"
	RegionEU     = "EU"
	RegionGlobal = "GLOBAL"
)

type Region struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Code        string    `json:"code"`
	Description string    `json:"description"`
}

type Country struct {
	ID           uuid.UUID `json:"id"`
	RegionID     uuid.UUID `json:"region_id"`
	Name         string    `json:"name"`
	Code         string    `json:"code"` // ISO-2 e.g. 'AE', 'IN', 'SA', 'US'
	CurrencyCode string    `json:"currency_code"`
	FlagEmoji    string    `json:"flag_emoji"`
	IsActive     bool      `json:"is_active"`
}

type Currency struct {
	ID              uuid.UUID `json:"id"`
	Code            string    `json:"code"` // 'AED', 'INR', 'SAR', 'USD', 'EUR', 'GBP', 'SGD'
	Symbol          string    `json:"symbol"`
	Name            string    `json:"name"`
	USDExchangeRate float64   `json:"usd_exchange_rate"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type JobLocation struct {
	ID              uuid.UUID `json:"id"`
	JobID           uuid.UUID `json:"job_id"`
	CountryID       uuid.UUID `json:"country_id"`
	CountryName     string    `json:"country_name"`
	CountryCode     string    `json:"country_code"`
	FlagEmoji       string    `json:"flag_emoji"`
	City            string    `json:"city"`
	WorkArrangement string    `json:"work_arrangement"` // 'remote', 'hybrid', 'onsite'
}

type InternationalJobItem struct {
	JobID           uuid.UUID   `json:"job_id"`
	Title           string      `json:"title"`
	Company         string      `json:"company"`
	RegionCode      string      `json:"region_code"`
	PrimaryLocation JobLocation `json:"primary_location"`
	MinSalary       float64     `json:"min_salary"`
	MaxSalary       float64     `json:"max_salary"`
	CurrencyCode    string      `json:"currency_code"`
	FormattedSalary string      `json:"formatted_salary"`
	MatchScore      int         `json:"match_score"`
	PostedTime      string      `json:"posted_time"`
}
