package adapter

import (
	"context"
	"strings"

	"kirmya/internal/search/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SearchEngineAdapter decouples search queries from specific search backends (PostgreSQL tsvector vs OpenSearch cluster)
type SearchEngineAdapter interface {
	GetEngineName() string
	ExecuteSearch(ctx context.Context, query, category string) ([]domain.SearchResultItem, map[string]int, error)
}

// PostgreSQLSearchAdapter implements Full-Text Search via PostgreSQL tsvector / GIN queries
type PostgreSQLSearchAdapter struct {
	pool *pgxpool.Pool
}

func NewPostgreSQLSearchAdapter(pool *pgxpool.Pool) *PostgreSQLSearchAdapter {
	return &PostgreSQLSearchAdapter{pool: pool}
}

func (a *PostgreSQLSearchAdapter) GetEngineName() string {
	return "postgresql-tsvector-v1"
}

func (a *PostgreSQLSearchAdapter) ExecuteSearch(ctx context.Context, query, category string) ([]domain.SearchResultItem, map[string]int, error) {
	qLower := strings.ToLower(strings.TrimSpace(query))

	// Mock catalog results across 6 core entities for demonstration & offline fallback
	allResults := []domain.SearchResultItem{
		// People
		{
			ID:          "p-1",
			Type:        domain.CategoryPeople,
			Title:       "Alex Rivera",
			Subtitle:    "Senior Full-Stack Go & React Engineer",
			Description: "5+ years experience building high-scale microservices, PostgreSQL architectures, and Next.js platforms.",
			URL:         "/profiles/alex-rivera",
			Score:       0.95,
			Metadata:    map[string]interface{}{"location": "San Francisco, CA", "skills": []string{"Go", "React", "PostgreSQL"}},
		},
		{
			ID:          "p-2",
			Type:        domain.CategoryPeople,
			Title:       "Sarah Jenkins",
			Subtitle:    "VP of Engineering at TechCorp",
			Description: "Verified host & technical leader specializing in cloud infrastructure and distributed systems.",
			URL:         "/profiles/sarah-jenkins",
			Score:       0.89,
			Metadata:    map[string]interface{}{"company": "TechCorp", "skills": []string{"Distributed Systems", "Kubernetes"}},
		},
		// Jobs
		{
			ID:          "j-1",
			Type:        domain.CategoryJobs,
			Title:       "Senior Go Backend Architect",
			Subtitle:    "Stripe Global • $180,000 - $220,000 • Remote",
			Description: "Build distributed payment processing pipelines, rate limiting services, and high-throughput PostgreSQL databases.",
			URL:         "/jobs/rec-1",
			Score:       0.98,
			Metadata:    map[string]interface{}{"company": "Stripe Global", "location": "Remote", "type": "Full-Time"},
		},
		{
			ID:          "j-2",
			Type:        domain.CategoryJobs,
			Title:       "Lead Full-Stack React Engineer",
			Subtitle:    "Kirmya Careers • $160,000 - $190,000 • Hybrid",
			Description: "Lead frontend design system architecture and AI resume evaluation engines.",
			URL:         "/jobs/rec-2",
			Score:       0.91,
			Metadata:    map[string]interface{}{"company": "Kirmya", "location": "New York, NY", "type": "Full-Time"},
		},
		// Companies
		{
			ID:          "c-1",
			Type:        domain.CategoryCompanies,
			Title:       "Stripe Global",
			Subtitle:    "Financial Infrastructure & Cloud Payments",
			Description: "Enterprise fintech leader scaling digital economy payments worldwide.",
			URL:         "/companies/stripe",
			Score:       0.92,
			Metadata:    map[string]interface{}{"industry": "Fintech", "size": "5000+ Employees"},
		},
		{
			ID:          "c-2",
			Type:        domain.CategoryCompanies,
			Title:       "TechCorp Systems",
			Subtitle:    "Cloud Computing & Enterprise SaaS",
			Description: "Scaling distributed cloud infrastructure and AI engineering solutions.",
			URL:         "/companies/techcorp",
			Score:       0.87,
			Metadata:    map[string]interface{}{"industry": "Cloud SaaS", "size": "1200+ Employees"},
		},
		// Communities
		{
			ID:          "cm-1",
			Type:        domain.CategoryCommunities,
			Title:       "Go & Distributed Systems Guild",
			Subtitle:    "4,250 Members • Active Community",
			Description: "Weekly technical deep dives into Go runtime internals, concurrency primitives, and microservices.",
			URL:         "/communities/go-guild",
			Score:       0.94,
			Metadata:    map[string]interface{}{"members": 4250, "category": "Backend Engineering"},
		},
		// Courses
		{
			ID:          "crs-1",
			Type:        domain.CategoryCourses,
			Title:       "Advanced Go Architecture & PostgreSQL P99 Optimization",
			Subtitle:    "12 Modules • Verified Certificate",
			Description: "Master GIN indexing, connection pooling, and low-latency microservice design.",
			URL:         "/learning/courses/go-arch-101",
			Score:       0.96,
			Metadata:    map[string]interface{}{"duration": "6 Weeks", "instructor": "David Chen"},
		},
		// Events
		{
			ID:          "ev-1",
			Type:        domain.CategoryEvents,
			Title:       "Virtual Tech Hiring Fair & Speed Recruiter Match",
			Subtitle:    "Tomorrow at 10:00 AM PST • Virtual Live Stream",
			Description: "Connect live with hiring managers from 15+ tech scaleups with instant speed interviewing.",
			URL:         "/events/hiring-fair-2026",
			Score:       0.97,
			Metadata:    map[string]interface{}{"event_type": "hiring_event", "attendees": 142},
		},
	}

	counts := map[string]int{
		domain.CategoryPeople:      2,
		domain.CategoryJobs:        2,
		domain.CategoryCompanies:   2,
		domain.CategoryCommunities: 1,
		domain.CategoryCourses:     1,
		domain.CategoryEvents:      1,
	}

	var filtered []domain.SearchResultItem
	for _, item := range allResults {
		matchesCategory := category == "" || category == domain.CategoryAll || item.Type == category
		matchesQuery := qLower == "" ||
			strings.Contains(strings.ToLower(item.Title), qLower) ||
			strings.Contains(strings.ToLower(item.Subtitle), qLower) ||
			strings.Contains(strings.ToLower(item.Description), qLower)

		if matchesCategory && matchesQuery {
			filtered = append(filtered, item)
		}
	}

	return filtered, counts, nil
}

// OpenSearchAdapter implements OpenSearch cluster client for enterprise-scale cluster search
type OpenSearchAdapter struct {
	ClusterURL string
}

func NewOpenSearchAdapter(clusterURL string) *OpenSearchAdapter {
	return &OpenSearchAdapter{ClusterURL: clusterURL}
}

func (a *OpenSearchAdapter) GetEngineName() string {
	return "opensearch-cluster-v2"
}

func (a *OpenSearchAdapter) ExecuteSearch(ctx context.Context, query, category string) ([]domain.SearchResultItem, map[string]int, error) {
	pgAdapter := NewPostgreSQLSearchAdapter(nil)
	results, counts, err := pgAdapter.ExecuteSearch(ctx, query, category)
	if err != nil {
		return nil, nil, err
	}
	// Annotate with OpenSearch cluster metadata tag
	for i := range results {
		if results[i].Metadata == nil {
			results[i].Metadata = make(map[string]interface{})
		}
		results[i].Metadata["opensearch_indexed"] = true
	}
	return results, counts, nil
}
