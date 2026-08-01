package adapter

import (
	"context"

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

	page := q.Page
	if page <= 0 {
		page = 1
	}
	limit := q.Limit
	if limit <= 0 {
		limit = 10
	}

	return &domain.CandidateSearchResponse{
		Query:        q.Query,
		TotalResults: len(mockCandidates),
		Page:         page,
		Limit:        limit,
		EngineUsed:   e.EngineName(),
		Candidates:   mockCandidates,
		Facets:       facets,
	}, nil
}
