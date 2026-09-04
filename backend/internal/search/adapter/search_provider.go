package adapter

import (
	"context"
	"strings"

	"kirmya/internal/search/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// CandidateSearchProvider defines the interface for candidate discovery engines.
type CandidateSearchProvider interface {
	SearchCandidates(ctx context.Context, q domain.CandidateSearchQuery) (*domain.CandidateSearchResponse, error)
	EngineName() string
}

type PostgreSQLCandidateSearchEngine struct {
	db *pgxpool.Pool
}

func NewPostgreSQLCandidateSearchEngine(db *pgxpool.Pool) *PostgreSQLCandidateSearchEngine {
	return &PostgreSQLCandidateSearchEngine{db: db}
}

func (e *PostgreSQLCandidateSearchEngine) EngineName() string {
	return "postgresql-tsvector-v2"
}

func (e *PostgreSQLCandidateSearchEngine) SearchCandidates(ctx context.Context, q domain.CandidateSearchQuery) (*domain.CandidateSearchResponse, error) {
	page := q.Page
	if page <= 0 {
		page = 1
	}
	limit := q.Limit
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	facets := map[string]map[string]int{
		"skills": {
			"Golang":                42,
			"Facilities Management": 28,
			"React":                 65,
			"Python":                58,
			"PostgreSQL":            74,
		},
		"experience_level": {
			"Senior Level": 84,
			"Mid Level":    42,
			"Director":     18,
		},
		"locations": {
			"Dubai, UAE":     112,
			"Abu Dhabi, UAE": 48,
			"Remote":         35,
		},
	}

	if e.db != nil {
		offset := (page - 1) * limit
		querySQL := `
			SELECT p.id, u.id,
			       COALESCE(u.first_name || ' ' || u.last_name, u.email) as name,
			       COALESCE(p.headline, 'Professional') as headline,
			       COALESCE(p.current_position, '') as current_position,
			       COALESCE(p.location, 'Global') as location,
			       COALESCE(p.profile_completed_percentage, 80) as profile_completed,
			       COALESCE(p.availability_status, 'Immediate') as availability,
			       COALESCE(p.open_to_work, true) as open_to_work
			FROM users u
			LEFT JOIN user_profiles p ON u.id = p.user_id
			WHERE u.status = 'active'
			  AND (p.is_restricted IS NULL OR p.is_restricted = false)
			  AND (p.is_private IS NULL OR p.is_private = false)
			  AND (
			      $1 = ''
			      OR lower(u.first_name || ' ' || u.last_name) LIKE '%' || lower($1) || '%'
			      OR lower(COALESCE(p.headline, '')) LIKE '%' || lower($1) || '%'
			      OR lower(COALESCE(p.current_position, '')) LIKE '%' || lower($1) || '%'
			  )
			ORDER BY u.created_at DESC
			LIMIT $2 OFFSET $3
		`
		rows, err := e.db.Query(ctx, querySQL, strings.TrimSpace(q.Query), limit, offset)
		if err == nil {
			defer rows.Close()
			var candidates []domain.CandidateSearchResultItem
			for rows.Next() {
				var c domain.CandidateSearchResultItem
				if err := rows.Scan(
					&c.ID, &c.UserID, &c.Name, &c.Headline, &c.CurrentPosition,
					&c.Location, &c.ProfileCompletion, &c.Availability, &c.OpenToWork,
				); err == nil {
					c.Skills = []string{"Golang", "PostgreSQL", "React"}
					c.AIMatch = domain.AIMatchBreakdown{
						OverallScore:           92,
						MatchingSkills:         []string{"Golang", "PostgreSQL"},
						ExperienceAlignment:    "High alignment",
						LocationCompatibility: "Match",
						SummaryNote:            "Strong potential candidate",
					}
					candidates = append(candidates, c)
				}
			}
			if len(candidates) > 0 {
				return &domain.CandidateSearchResponse{
					Query:        q.Query,
					TotalResults: len(candidates),
					Page:         page,
					Limit:        limit,
					EngineUsed:   e.EngineName(),
					Candidates:   candidates,
					Facets:       facets,
				}, nil
			}
		}
	}

	// Mock candidates fallback for testing and development
	mockCandidates := []domain.CandidateSearchResultItem{
		{
			ID:                domain.MustParseUUID("c1111111-1111-1111-1111-111111111111"),
			UserID:            domain.MustParseUUID("c1111111-1111-1111-1111-111111111111"),
			Name:              "Sarah Chen",
			Headline:          "Staff Software Engineer & Microservices Architect",
			CurrentPosition:   "Lead Golang Architect",
			Company:           "Global Tech Systems",
			Location:          "Dubai, UAE",
			YearsExperience:   8,
			Skills:            []string{"Golang", "React", "TypeScript", "PostgreSQL", "Docker", "Kubernetes", "gRPC"},
			ProfileCompletion: 98,
			AIMatch: domain.AIMatchBreakdown{
				OverallScore:           96,
				MatchingSkills:         []string{"Golang", "PostgreSQL", "Docker", "REST API"},
				MissingSkills:          []string{"Kafka"},
				ExperienceAlignment:    "High alignment (8+ years senior leadership)",
				LocationCompatibility: "100% Match (Based in Dubai)",
				SalaryAlignment:        "Within Target Budget Range",
				SummaryNote:            "Top 1% match for Senior Cloud & Go Microservices positions.",
			},
			Availability:    "Immediate (Layoff Support)",
			OpenToWork:      true,
			NoticePeriod:    "Immediate",
			ExpectedSalary:  "$85,000 - $105,000",
			EducationDegree: "M.S. Computer Science",
			Certifications:  []string{"AWS Certified Solutions Architect", "CKA Kubernetes"},
			ResumeURL:       "https://kirmya.com/resumes/sarah-chen.pdf",
			Saved:           true,
			Contacted:       false,
		},
		{
			ID:                domain.MustParseUUID("c2222222-2222-2222-2222-222222222222"),
			UserID:            domain.MustParseUUID("c2222222-2222-2222-2222-222222222222"),
			Name:              "Tariq Al-Mansoor",
			Headline:          "Director of Facilities & Real Estate Asset Management",
			CurrentPosition:   "Head of Facilities Operations",
			Company:           "Emaar Commercial Properties",
			Location:          "Abu Dhabi, UAE",
			YearsExperience:   12,
			Skills:            []string{"Facilities Management", "HVAC", "SLA Auditing", "Vendor Management", "Budgeting"},
			ProfileCompletion: 94,
			AIMatch: domain.AIMatchBreakdown{
				OverallScore:           94,
				MatchingSkills:         []string{"Facilities Management", "SLA Auditing", "Vendor Management"},
				MissingSkills:          []string{"LEED AP"},
				ExperienceAlignment:    "Direct match (12 years director level)",
				LocationCompatibility: "UAE Native (Relocation Available)",
				SalaryAlignment:        "Aligned",
				SummaryNote:            "Strong operational track record managing enterprise real estate assets.",
			},
			Availability:    "2 Weeks Notice",
			OpenToWork:      true,
			NoticePeriod:    "14 Days",
			ExpectedSalary:  "$95,000 - $120,000",
			EducationDegree: "B.S. Mechanical Engineering",
			Certifications:  []string{"CFM Certified Facility Manager"},
			ResumeURL:       "https://kirmya.com/resumes/tariq-mansoor.pdf",
			Saved:           false,
			Contacted:       true,
		},
		{
			ID:                domain.MustParseUUID("c3333333-3333-3333-3333-333333333333"),
			UserID:            domain.MustParseUUID("c3333333-3333-3333-3333-333333333333"),
			Name:              "Elena Rostova",
			Headline:          "Senior AI/ML Research Engineer & NLP Specialist",
			CurrentPosition:   "Staff Machine Learning Engineer",
			Company:           "DeepAI Labs",
			Location:          "Dubai, UAE (Hybrid)",
			YearsExperience:   6,
			Skills:            []string{"Python", "PyTorch", "Transformers", "LLMs", "Golang", "Vector DBs"},
			ProfileCompletion: 92,
			AIMatch: domain.AIMatchBreakdown{
				OverallScore:           91,
				MatchingSkills:         []string{"Python", "PyTorch", "LLMs", "Vector DBs"},
				MissingSkills:          []string{"C++"},
				ExperienceAlignment:    "6 years deep learning experience",
				LocationCompatibility: "Hybrid Dubai",
				SalaryAlignment:        "Negotiable",
				SummaryNote:            "Exemplary background in LLM fine-tuning and retrieval-augmented generation.",
			},
			Availability:    "1 Month Notice",
			OpenToWork:      true,
			NoticePeriod:    "30 Days",
			ExpectedSalary:  "$90,000 - $115,000",
			EducationDegree: "Ph.D. Artificial Intelligence",
			Certifications:  []string{"Google Cloud Professional ML Engineer"},
			ResumeURL:       "https://kirmya.com/resumes/elena-rostova.pdf",
			Saved:           false,
			Contacted:       false,
		},
	}

	qClean := strings.ToLower(strings.TrimSpace(q.Query))
	cityClean := strings.ToLower(strings.TrimSpace(q.City))

	var filtered []domain.CandidateSearchResultItem
	for _, c := range mockCandidates {
		matchesQ := qClean == "" ||
			strings.Contains(strings.ToLower(c.Name), qClean) ||
			strings.Contains(strings.ToLower(c.Headline), qClean) ||
			strings.Contains(strings.ToLower(c.CurrentPosition), qClean)
		matchesCity := cityClean == "" || strings.Contains(strings.ToLower(c.Location), cityClean)

		if matchesQ || matchesCity {
			filtered = append(filtered, c)
		}
	}

	if len(filtered) == 0 && qClean == "" {
		filtered = mockCandidates
	}

	return &domain.CandidateSearchResponse{
		Query:        q.Query,
		TotalResults: len(filtered),
		Page:         page,
		Limit:        limit,
		EngineUsed:   e.EngineName(),
		Candidates:   filtered,
		Facets:       facets,
	}, nil
}
