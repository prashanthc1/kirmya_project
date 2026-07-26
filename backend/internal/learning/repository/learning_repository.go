package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/learning/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LearningRepository interface {
	GetCourses(ctx context.Context, category, provider, level string) ([]domain.Course, error)
	GetCourseByID(ctx context.Context, id uuid.UUID) (*domain.Course, error)
	CreateCourse(ctx context.Context, course *domain.Course) error

	GetLearningPaths(ctx context.Context, category string) ([]domain.LearningPath, error)
	GetLearningPathByID(ctx context.Context, id uuid.UUID) (*domain.LearningPath, error)
	CreateLearningPath(ctx context.Context, path *domain.LearningPath) error

	GetUserProgress(ctx context.Context, userID uuid.UUID) ([]domain.UserLearningProgress, error)
	GetProgressByCourse(ctx context.Context, userID, courseID uuid.UUID) (*domain.UserLearningProgress, error)
	UpsertUserProgress(ctx context.Context, progress *domain.UserLearningProgress) error

	GetCertificates(ctx context.Context, userID uuid.UUID) ([]domain.Certificate, error)
	IssueCertificate(ctx context.Context, cert *domain.Certificate) error

	SaveSkillAssessment(ctx context.Context, assessment *domain.SkillAssessment) error
	GetLatestAssessment(ctx context.Context, userID uuid.UUID) (*domain.SkillAssessment, error)
}

type pgxLearningRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	courses       map[uuid.UUID]*domain.Course
	paths         map[uuid.UUID]*domain.LearningPath
	progress      map[string]*domain.UserLearningProgress // key: userID_courseID
	certificates  map[uuid.UUID]*domain.Certificate
	assessments   map[uuid.UUID]*domain.SkillAssessment
}

func NewLearningRepository(pool *pgxpool.Pool) LearningRepository {
	repo := &pgxLearningRepository{
		pool:         pool,
		courses:      make(map[uuid.UUID]*domain.Course),
		paths:        make(map[uuid.UUID]*domain.LearningPath),
		progress:     make(map[string]*domain.UserLearningProgress),
		certificates: make(map[uuid.UUID]*domain.Certificate),
		assessments:  make(map[uuid.UUID]*domain.SkillAssessment),
	}
	repo.seedInitialData()
	return repo
}

func (r *pgxLearningRepository) seedInitialData() {
	r.mu.Lock()
	defer r.mu.Unlock()

	// Seed Courses across all 5 requested categories
	c1ID := uuid.MustParse("a1111111-1111-1111-1111-111111111111")
	c2ID := uuid.MustParse("a2222222-2222-2222-2222-222222222222")
	c3ID := uuid.MustParse("a3333333-3333-3333-3333-333333333333")
	c4ID := uuid.MustParse("a4444444-4444-4444-4444-444444444444")
	c5ID := uuid.MustParse("a5555555-5555-5555-5555-555555555555")

	r.courses[c1ID] = &domain.Course{
		ID:              c1ID,
		Title:           "Full-Stack Web Development with Go & Next.js",
		Description:     "Master modern full-stack web applications, REST APIs, database indexing, and React state management.",
		Category:        domain.CategoryTechnology,
		DifficultyLevel: "intermediate",
		Provider:        domain.ProviderKirmya,
		DurationHours:   18,
		TotalLessons:    16,
		Rating:          4.9,
		SkillsCovered:   []string{"Go", "Next.js", "PostgreSQL", "TypeScript", "REST API"},
		CreatedAt:       time.Now(),
	}

	r.courses[c2ID] = &domain.Course{
		ID:              c2ID,
		Title:           "Agile Product Management & Scrum Leadership",
		Description:     "Learn sprint planning, backlog prioritization, stakeholder management, and product roadmap execution.",
		Category:        domain.CategoryManagement,
		DifficultyLevel: "intermediate",
		Provider:        domain.ProviderKirmya,
		DurationHours:   12,
		TotalLessons:    10,
		Rating:          4.8,
		SkillsCovered:   []string{"Agile", "Scrum", "Product Roadmap", "Jira", "Prioritization"},
		CreatedAt:       time.Now(),
	}

	r.courses[c3ID] = &domain.Course{
		ID:              c3ID,
		Title:           "Executive Communication & Salary Negotiation",
		Description:     "Build persuasive presentation skills, emotional intelligence, cross-team influence, and career negotiation tactics.",
		Category:        domain.CategorySoftSkills,
		DifficultyLevel: "all_levels",
		Provider:        domain.ProviderKirmya,
		DurationHours:   8,
		TotalLessons:    8,
		Rating:          4.95,
		SkillsCovered:   []string{"Public Speaking", "Negotiation", "Emotional Intelligence", "Conflict Resolution"},
		CreatedAt:       time.Now(),
	}

	r.courses[c4ID] = &domain.Course{
		ID:              c4ID,
		Title:           "FAANG Technical Interview & System Design Masterclass",
		Description:     "Cracking coding interviews: Data structures, algorithm optimization, system design blueprints, and mock interviews.",
		Category:        domain.CategoryInterviewPrep,
		DifficultyLevel: "advanced",
		Provider:        domain.ProviderKirmya,
		DurationHours:   20,
		TotalLessons:    18,
		Rating:          4.9,
		SkillsCovered:   []string{"Algorithms", "Data Structures", "System Design", "Mock Interviews"},
		CreatedAt:       time.Now(),
	}

	r.courses[c5ID] = &domain.Course{
		ID:              c5ID,
		Title:           "AWS Certified Solutions Architect Official Prep",
		Description:     "Comprehensive preparation for AWS SAA-C03 certification exam covering S3, EC2, VPC, Lambda, and IAM security.",
		Category:        domain.CategoryCertifications,
		DifficultyLevel: "intermediate",
		Provider:        domain.ProviderCoursera,
		ExternalURL:     "https://coursera.org/learn/aws-architect",
		DurationHours:   24,
		TotalLessons:    20,
		Rating:          4.85,
		SkillsCovered:   []string{"AWS", "Cloud Architecture", "IAM", "Serverless", "Security"},
		CreatedAt:       time.Now(),
	}

	// Seed Learning Paths
	p1ID := uuid.MustParse("b1111111-1111-1111-1111-111111111111")
	r.paths[p1ID] = &domain.LearningPath{
		ID:             p1ID,
		Title:          "Job-Ready Senior Software Engineer Track",
		Description:    "Step-by-step career transformation path from technical coding to system architecture and FAANG interview readiness.",
		TargetRole:     "Senior Full-Stack Engineer",
		Category:       domain.CategoryTechnology,
		EstimatedWeeks: 6,
		CourseIDs:      []uuid.UUID{c1ID, c4ID, c5ID},
		BadgeName:      "Certified Job-Ready Engineer",
		CreatedAt:      time.Now(),
	}

	p2ID := uuid.MustParse("b2222222-2222-2222-2222-222222222222")
	r.paths[p2ID] = &domain.LearningPath{
		ID:             p2ID,
		Title:          "Product Manager & Technical Leadership Accelerator",
		Description:    "Transition into high-impact management with mastery over agile methodologies, executive communication, and team leadership.",
		TargetRole:     "Technical Product Manager",
		Category:       domain.CategoryManagement,
		EstimatedWeeks: 4,
		CourseIDs:      []uuid.UUID{c2ID, c3ID},
		BadgeName:      "Certified Product Leader",
		CreatedAt:      time.Now(),
	}
}

func (r *pgxLearningRepository) GetCourses(ctx context.Context, category, provider, level string) ([]domain.Course, error) {
	if r.pool != nil {
		query := `
			SELECT id, title, description, category, difficulty_level, provider, 
			       external_course_id, external_url, thumbnail_url, duration_hours, 
			       total_lessons, rating, skills_covered, created_at
			FROM courses
			WHERE ($1 = '' OR category = $1)
			  AND ($2 = '' OR provider = $2)
			  AND ($3 = '' OR difficulty_level = $3)
			ORDER BY created_at DESC
		`
		rows, err := r.pool.Query(ctx, query, category, provider, level)
		if err == nil {
			defer rows.Close()
			var list []domain.Course
			for rows.Next() {
				var item domain.Course
				if err := rows.Scan(
					&item.ID, &item.Title, &item.Description, &item.Category, &item.DifficultyLevel,
					&item.Provider, &item.ExternalCourseID, &item.ExternalURL, &item.ThumbnailURL,
					&item.DurationHours, &item.TotalLessons, &item.Rating, &item.SkillsCovered, &item.CreatedAt,
				); err == nil {
					list = append(list, item)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.Course
	for _, item := range r.courses {
		if category != "" && item.Category != category {
			continue
		}
		if provider != "" && item.Provider != provider {
			continue
		}
		if level != "" && item.DifficultyLevel != level {
			continue
		}
		list = append(list, *item)
	}
	return list, nil
}

func (r *pgxLearningRepository) GetCourseByID(ctx context.Context, id uuid.UUID) (*domain.Course, error) {
	if r.pool != nil {
		query := `
			SELECT id, title, description, category, difficulty_level, provider, 
			       external_course_id, external_url, thumbnail_url, duration_hours, 
			       total_lessons, rating, skills_covered, created_at
			FROM courses WHERE id = $1
		`
		row := r.pool.QueryRow(ctx, query, id)
		var item domain.Course
		err := row.Scan(
			&item.ID, &item.Title, &item.Description, &item.Category, &item.DifficultyLevel,
			&item.Provider, &item.ExternalCourseID, &item.ExternalURL, &item.ThumbnailURL,
			&item.DurationHours, &item.TotalLessons, &item.Rating, &item.SkillsCovered, &item.CreatedAt,
		)
		if err == nil {
			return &item, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	if item, exists := r.courses[id]; exists {
		return item, nil
	}
	return nil, fmt.Errorf("course not found: %s", id)
}

func (r *pgxLearningRepository) CreateCourse(ctx context.Context, course *domain.Course) error {
	if course.ID == uuid.Nil {
		course.ID = uuid.New()
	}
	course.CreatedAt = time.Now()

	if r.pool != nil {
		query := `
			INSERT INTO courses (
				id, title, description, category, difficulty_level, provider,
				external_course_id, external_url, thumbnail_url, duration_hours,
				total_lessons, rating, skills_covered, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		`
		_, _ = r.pool.Exec(ctx, query,
			course.ID, course.Title, course.Description, course.Category, course.DifficultyLevel,
			course.Provider, course.ExternalCourseID, course.ExternalURL, course.ThumbnailURL,
			course.DurationHours, course.TotalLessons, course.Rating, course.SkillsCovered, course.CreatedAt,
		)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.courses[course.ID] = course
	return nil
}

func (r *pgxLearningRepository) GetLearningPaths(ctx context.Context, category string) ([]domain.LearningPath, error) {
	if r.pool != nil {
		query := `
			SELECT id, title, description, target_role, category, estimated_weeks, course_ids, badge_name, created_at
			FROM learning_paths WHERE ($1 = '' OR category = $1)
		`
		rows, err := r.pool.Query(ctx, query, category)
		if err == nil {
			defer rows.Close()
			var list []domain.LearningPath
			for rows.Next() {
				var item domain.LearningPath
				if err := rows.Scan(
					&item.ID, &item.Title, &item.Description, &item.TargetRole, &item.Category,
					&item.EstimatedWeeks, &item.CourseIDs, &item.BadgeName, &item.CreatedAt,
				); err == nil {
					list = append(list, item)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.LearningPath
	for _, item := range r.paths {
		if category != "" && item.Category != category {
			continue
		}
		// Populate course details
		var courses []domain.Course
		for _, cID := range item.CourseIDs {
			if c, exists := r.courses[cID]; exists {
				courses = append(courses, *c)
			}
		}
		itemCopy := *item
		itemCopy.Courses = courses
		list = append(list, itemCopy)
	}
	return list, nil
}

func (r *pgxLearningRepository) GetLearningPathByID(ctx context.Context, id uuid.UUID) (*domain.LearningPath, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if item, exists := r.paths[id]; exists {
		var courses []domain.Course
		for _, cID := range item.CourseIDs {
			if c, exists := r.courses[cID]; exists {
				courses = append(courses, *c)
			}
		}
		itemCopy := *item
		itemCopy.Courses = courses
		return &itemCopy, nil
	}
	return nil, fmt.Errorf("learning path not found: %s", id)
}

func (r *pgxLearningRepository) CreateLearningPath(ctx context.Context, path *domain.LearningPath) error {
	if path.ID == uuid.Nil {
		path.ID = uuid.New()
	}
	path.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.paths[path.ID] = path
	return nil
}

func (r *pgxLearningRepository) GetUserProgress(ctx context.Context, userID uuid.UUID) ([]domain.UserLearningProgress, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.UserLearningProgress
	for _, p := range r.progress {
		if p.UserID == userID {
			list = append(list, *p)
		}
	}
	return list, nil
}

func (r *pgxLearningRepository) GetProgressByCourse(ctx context.Context, userID, courseID uuid.UUID) (*domain.UserLearningProgress, error) {
	key := fmt.Sprintf("%s_%s", userID, courseID)
	r.mu.RLock()
	defer r.mu.RUnlock()
	if p, exists := r.progress[key]; exists {
		return p, nil
	}
	return nil, fmt.Errorf("progress not found")
}

func (r *pgxLearningRepository) UpsertUserProgress(ctx context.Context, progress *domain.UserLearningProgress) error {
	if progress.ID == uuid.Nil {
		progress.ID = uuid.New()
	}
	progress.LastAccessedAt = time.Now()

	key := fmt.Sprintf("%s_%s", progress.UserID, progress.CourseID)
	r.mu.Lock()
	defer r.mu.Unlock()
	r.progress[key] = progress
	return nil
}

func (r *pgxLearningRepository) GetCertificates(ctx context.Context, userID uuid.UUID) ([]domain.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []domain.Certificate
	for _, cert := range r.certificates {
		if cert.UserID == userID {
			list = append(list, *cert)
		}
	}
	return list, nil
}

func (r *pgxLearningRepository) IssueCertificate(ctx context.Context, cert *domain.Certificate) error {
	if cert.ID == uuid.Nil {
		cert.ID = uuid.New()
	}
	cert.IssueDate = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.certificates[cert.ID] = cert
	return nil
}

func (r *pgxLearningRepository) SaveSkillAssessment(ctx context.Context, assessment *domain.SkillAssessment) error {
	if assessment.ID == uuid.Nil {
		assessment.ID = uuid.New()
	}
	assessment.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.assessments[assessment.ID] = assessment
	return nil
}

func (r *pgxLearningRepository) GetLatestAssessment(ctx context.Context, userID uuid.UUID) (*domain.SkillAssessment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var latest *domain.SkillAssessment
	for _, a := range r.assessments {
		if a.UserID == userID {
			if latest == nil || a.CreatedAt.After(latest.CreatedAt) {
				latest = a
			}
		}
	}
	if latest != nil {
		return latest, nil
	}
	return nil, fmt.Errorf("no assessment found for user")
}
