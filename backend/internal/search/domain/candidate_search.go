package domain

import (
	"time"

	"github.com/google/uuid"
)

type UUID = uuid.UUID

func MustParseUUID(str string) uuid.UUID {
	u, err := uuid.Parse(str)
	if err != nil {
		return uuid.New()
	}
	return u
}

type CandidateSearchQuery struct {
	Query               string   `json:"query"`
	BooleanMode         bool     `json:"boolean_mode"`
	CurrentTitle        string   `json:"current_title"`
	PreviousTitle       string   `json:"previous_title"`
	Industry            string   `json:"industry"`
	Department          string   `json:"department"`
	ExperienceLevel     string   `json:"experience_level"`
	MinYearsExp         int      `json:"min_years_exp"`
	MaxYearsExp         int      `json:"max_years_exp"`
	RequiredSkills      []string `json:"required_skills"`
	OptionalSkills      []string `json:"optional_skills"`
	Country             string   `json:"country"`
	City                string   `json:"city"`
	RemoteAvailability  string   `json:"remote_availability"`
	OpenToWork          bool     `json:"open_to_work"`
	Availability        string   `json:"availability"`
	NoticePeriod        string   `json:"notice_period"`
	EmploymentType      string   `json:"employment_type"`
	WorkPreference      string   `json:"work_preference"`
	MinExpectedSalary   int      `json:"min_expected_salary"`
	MaxExpectedSalary   int      `json:"max_expected_salary"`
	Currency            string   `json:"currency"`
	Degree              string   `json:"degree"`
	Institution         string   `json:"institution"`
	Certification       string   `json:"certification"`
	Language            string   `json:"language"`
	Page                int      `json:"page"`
	Limit               int      `json:"limit"`
	SortBy              string   `json:"sort_by"` // 'match_score', 'relevance', 'experience', 'newest'
}

type AIMatchBreakdown struct {
	OverallScore           int      `json:"overall_score"`
	MatchingSkills         []string `json:"matching_skills"`
	MissingSkills          []string `json:"missing_skills"`
	ExperienceAlignment    string   `json:"experience_alignment"`
	LocationCompatibility string   `json:"location_compatibility"`
	SalaryAlignment        string   `json:"salary_alignment"`
	SummaryNote            string   `json:"summary_note"`
}

type CandidateSearchResultItem struct {
	ID                 uuid.UUID        `json:"id"`
	UserID             uuid.UUID        `json:"user_id"`
	Name               string           `json:"name"`
	Headline           string           `json:"headline"`
	CurrentPosition    string           `json:"current_position"`
	Company            string           `json:"company"`
	Location           string           `json:"location"`
	YearsExperience    int              `json:"years_experience"`
	Skills             []string         `json:"skills"`
	ProfileCompletion  int              `json:"profile_completion"`
	AIMatch            AIMatchBreakdown `json:"ai_match"`
	Availability       string           `json:"availability"`
	OpenToWork         bool             `json:"open_to_work"`
	NoticePeriod       string           `json:"notice_period"`
	ExpectedSalary     string           `json:"expected_salary"`
	EducationDegree    string           `json:"education_degree"`
	Certifications     []string         `json:"certifications"`
	AvatarURL          string           `json:"avatar_url"`
	ResumeURL          string           `json:"resume_url"`
	Saved              bool             `json:"saved"`
	Contacted          bool             `json:"contacted"`
}

type CandidateSearchResponse struct {
	Query        string                      `json:"query"`
	TotalResults int                         `json:"total_results"`
	Page         int                         `json:"page"`
	Limit        int                         `json:"limit"`
	EngineUsed   string                      `json:"engine_used"`
	Candidates   []CandidateSearchResultItem `json:"candidates"`
	Facets       map[string]map[string]int   `json:"facets"`
}

type TalentPoolDTO struct {
	ID              uuid.UUID `json:"id"`
	RecruiterID     uuid.UUID `json:"recruiter_id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	SharedWithTeam  bool      `json:"shared_with_team"`
	CandidatesCount int       `json:"candidates_count"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type AddCandidateToPoolPayload struct {
	PoolID      uuid.UUID `json:"pool_id" binding:"required"`
	CandidateID uuid.UUID `json:"candidate_id" binding:"required"`
	Notes       string    `json:"notes"`
}

type SavedSearchDTO struct {
	ID             uuid.UUID              `json:"id"`
	RecruiterID    uuid.UUID              `json:"recruiter_id"`
	SearchName     string                 `json:"search_name"`
	Query          string                 `json:"query"`
	Filters        map[string]interface{} `json:"filters"`
	AlertFrequency string                 `json:"alert_frequency"`
	CreatedAt      time.Time              `json:"created_at"`
}

type CandidateComparisonPayload struct {
	CandidateIDs []uuid.UUID `json:"candidate_ids" binding:"required"`
}

type CandidateComparisonItem struct {
	CandidateID     uuid.UUID `json:"candidate_id"`
	Name            string    `json:"name"`
	Headline        string    `json:"headline"`
	YearsExperience int       `json:"years_experience"`
	Skills          []string  `json:"skills"`
	Education       string    `json:"education"`
	Certifications  []string  `json:"certifications"`
	AIMatchScore    int       `json:"ai_match_score"`
	ExpectedSalary  string    `json:"expected_salary"`
	Availability    string    `json:"availability"`
	NoticePeriod    string    `json:"notice_period"`
}
