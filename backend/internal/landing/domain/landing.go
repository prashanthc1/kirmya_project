package domain

import (
	"time"

	"github.com/google/uuid"
)

type Testimonial struct {
	ID          uuid.UUID `json:"id"`
	AuthorName  string    `json:"author_name"`
	AuthorRole  string    `json:"author_role"`
	CompanyName string    `json:"company_name"`
	AvatarURL   string    `json:"avatar_url"`
	Quote       string    `json:"quote"`
	Achievement string    `json:"achievement"`
	Rating      float64   `json:"rating"`
	IsFeatured  bool      `json:"is_featured"`
	CreatedAt   time.Time `json:"created_at"`
}

type FeaturedJob struct {
	ID              uuid.UUID `json:"id"`
	Title           string    `json:"title"`
	Company         string    `json:"company"`
	Location        string    `json:"location"`
	MatchPercentage int       `json:"match_percentage"`
	SalaryRange     string    `json:"salary_range"`
	Tags            []string  `json:"tags"`
	CreatedAt       time.Time `json:"created_at"`
}

type FeaturedCompany struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	LogoURL       string    `json:"logo_url"`
	OpenPositions int       `json:"open_positions"`
	Industry      string    `json:"industry"`
	Location      string    `json:"location"`
	CreatedAt     time.Time `json:"created_at"`
}

type LandingStatistic struct {
	ID           uuid.UUID `json:"id"`
	StatKey      string    `json:"stat_key"`
	StatValue    string    `json:"stat_value"`
	StatLabel    string    `json:"stat_label"`
	DisplayOrder int       `json:"display_order"`
}

type LandingContentResponse struct {
	Statistics        []LandingStatistic `json:"statistics"`
	FeaturedJobs      []FeaturedJob      `json:"featured_jobs"`
	FeaturedCompanies []FeaturedCompany  `json:"featured_companies"`
	Testimonials      []Testimonial      `json:"testimonials"`
}
