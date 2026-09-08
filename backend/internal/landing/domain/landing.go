package domain

import (
	"errors"
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

// ErrStatisticsUnavailable reports that no true platform figures could be
// produced. Callers render nothing rather than substituting an invented number.
var ErrStatisticsUnavailable = errors.New("platform statistics are unavailable")

// PlatformStatistics are counts of real rows, not editorial copy.
//
// Every field is an integer counted at request time. The landing page used to
// read pre-formatted strings out of a content table ("18,450+", "78%"), which
// meant nothing verified them and a fresh deployment served the seeded
// placeholders as fact. A number here is either counted or absent.
type PlatformStatistics struct {
	// OpenJobs counts postings a visitor can actually find on the public board:
	// the predicate matches the board's own filter exactly.
	OpenJobs int64 `json:"open_jobs"`

	// HiringCompanies counts distinct companies with at least one open job.
	HiringCompanies int64 `json:"hiring_companies"`

	// Members counts active accounts.
	Members int64 `json:"members"`

	// ApplicationsSubmitted counts applications people have actually sent.
	ApplicationsSubmitted int64 `json:"applications_submitted"`
}

type LandingContentResponse struct {
	Statistics        []LandingStatistic `json:"statistics"`
	FeaturedJobs      []FeaturedJob      `json:"featured_jobs"`
	FeaturedCompanies []FeaturedCompany  `json:"featured_companies"`
	Testimonials      []Testimonial      `json:"testimonials"`

	// PlatformStatistics is nil when no true figures could be counted. The web
	// client renders the statistics band only when it is present.
	PlatformStatistics *PlatformStatistics `json:"platform_statistics,omitempty"`
}
