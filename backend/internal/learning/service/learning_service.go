package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"time"

	"kirmya/internal/learning/domain"
	"kirmya/internal/learning/provider"
	"kirmya/internal/learning/repository"

	"github.com/google/uuid"
)

type LearningService interface {
	GetCourses(ctx context.Context, category, providerName, level string) ([]domain.Course, error)
	GetCourseByID(ctx context.Context, id uuid.UUID) (*domain.Course, error)
	GetLearningPaths(ctx context.Context, category string) ([]domain.LearningPath, error)

	EnrollUser(ctx context.Context, userID, courseID uuid.UUID, pathID *uuid.UUID) (*domain.UserLearningProgress, error)
	UpdateProgress(ctx context.Context, userID uuid.UUID, req domain.UpdateProgressRequest) (*domain.UserLearningProgress, error)
	GetUserProgress(ctx context.Context, userID uuid.UUID) ([]domain.UserLearningProgress, error)

	GetUserCertificates(ctx context.Context, userID uuid.UUID) ([]domain.Certificate, error)
	SubmitSkillAssessment(ctx context.Context, userID uuid.UUID, req domain.SubmitAssessmentRequest) (*domain.SkillAssessment, error)
}

type learningService struct {
	repo              repository.LearningRepository
	externalProviders map[string]provider.ExternalCourseProvider
}

func NewLearningService(repo repository.LearningRepository, providers ...provider.ExternalCourseProvider) LearningService {
	providerMap := make(map[string]provider.ExternalCourseProvider)
	for _, p := range providers {
		providerMap[p.GetProviderName()] = p
	}

	return &learningService{
		repo:              repo,
		externalProviders: providerMap,
	}
}

func (s *learningService) GetCourses(ctx context.Context, category, providerName, level string) ([]domain.Course, error) {
	courses, err := s.repo.GetCourses(ctx, category, providerName, level)
	if err != nil {
		return nil, err
	}

	// Fetch from external course provider integrations if requested
	if providerName != "" && providerName != domain.ProviderKirmya {
		if extProvider, exists := s.externalProviders[providerName]; exists {
			extCourses, err := extProvider.FetchCourses(ctx, category)
			if err == nil {
				courses = append(courses, extCourses...)
			} else {
				slog.Error("External course provider fetch error", slog.String("provider", providerName), slog.String("error", err.Error()))
			}
		}
	}

	return courses, nil
}

func (s *learningService) GetCourseByID(ctx context.Context, id uuid.UUID) (*domain.Course, error) {
	return s.repo.GetCourseByID(ctx, id)
}

func (s *learningService) GetLearningPaths(ctx context.Context, category string) ([]domain.LearningPath, error) {
	return s.repo.GetLearningPaths(ctx, category)
}

func (s *learningService) EnrollUser(ctx context.Context, userID, courseID uuid.UUID, pathID *uuid.UUID) (*domain.UserLearningProgress, error) {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, fmt.Errorf("cannot enroll in non-existent course: %w", err)
	}

	existing, err := s.repo.GetProgressByCourse(ctx, userID, courseID)
	if err == nil && existing != nil {
		return existing, nil
	}

	progress := &domain.UserLearningProgress{
		ID:                   uuid.New(),
		UserID:               userID,
		CourseID:             courseID,
		CourseTitle:          course.Title,
		LearningPathID:       pathID,
		Status:               domain.StatusEnrolled,
		CompletedLessons:     0,
		TotalLessons:         course.TotalLessons,
		CompletionPercentage: 0,
		TimeSpentMinutes:     0,
		LastAccessedAt:       time.Now(),
		CreatedAt:            time.Now(),
	}

	if err := s.repo.UpsertUserProgress(ctx, progress); err != nil {
		return nil, err
	}

	return progress, nil
}

func (s *learningService) UpdateProgress(ctx context.Context, userID uuid.UUID, req domain.UpdateProgressRequest) (*domain.UserLearningProgress, error) {
	course, err := s.repo.GetCourseByID(ctx, req.CourseID)
	if err != nil {
		return nil, err
	}

	progress, err := s.repo.GetProgressByCourse(ctx, userID, req.CourseID)
	if err != nil || progress == nil {
		progress = &domain.UserLearningProgress{
			ID:           uuid.New(),
			UserID:       userID,
			CourseID:     req.CourseID,
			CourseTitle:  course.Title,
			TotalLessons: course.TotalLessons,
			CreatedAt:    time.Now(),
		}
	}

	progress.CompletedLessons = req.CompletedLessons
	progress.TimeSpentMinutes += req.TimeSpentMinutes
	if course.TotalLessons > 0 {
		progress.CompletionPercentage = (req.CompletedLessons * 100) / course.TotalLessons
		if progress.CompletionPercentage > 100 {
			progress.CompletionPercentage = 100
		}
	}

	if progress.CompletionPercentage == 100 {
		progress.Status = domain.StatusCompleted
	} else if progress.CompletedLessons > 0 {
		progress.Status = domain.StatusInProgress
	} else {
		progress.Status = domain.StatusEnrolled
	}

	if err := s.repo.UpsertUserProgress(ctx, progress); err != nil {
		return nil, err
	}

	// Automated Certificate Generation on 100% Course Completion!
	if progress.Status == domain.StatusCompleted {
		existingCerts, _ := s.repo.GetCertificates(ctx, userID)
		hasCert := false
		for _, cert := range existingCerts {
			if cert.CourseID != nil && *cert.CourseID == req.CourseID {
				hasCert = true
				break
			}
		}

		if !hasCert {
			certCode := fmt.Sprintf("KIRMYA-%X-%d", rand.Intn(0xFFFFFF), time.Now().Unix())
			cert := &domain.Certificate{
				ID:               uuid.New(),
				UserID:           userID,
				UserName:         "Alex Rivera",
				CourseID:         &req.CourseID,
				Title:            fmt.Sprintf("Certified Professional: %s", course.Title),
				VerificationCode: certCode,
				SkillsMastered:   course.SkillsCovered,
				IssueDate:        time.Now(),
			}
			_ = s.repo.IssueCertificate(ctx, cert)
			slog.Info("Automated certificate issued for user course completion", slog.String("user_id", userID.String()), slog.String("course", course.Title))
		}
	}

	return progress, nil
}

func (s *learningService) GetUserProgress(ctx context.Context, userID uuid.UUID) ([]domain.UserLearningProgress, error) {
	return s.repo.GetUserProgress(ctx, userID)
}

func (s *learningService) GetUserCertificates(ctx context.Context, userID uuid.UUID) ([]domain.Certificate, error) {
	return s.repo.GetCertificates(ctx, userID)
}

func (s *learningService) SubmitSkillAssessment(ctx context.Context, userID uuid.UUID, req domain.SubmitAssessmentRequest) (*domain.SkillAssessment, error) {
	totalScore := 0
	count := 0
	for _, rating := range req.Answers {
		totalScore += rating
		count++
	}

	scorePct := 50
	if count > 0 {
		scorePct = (totalScore * 100) / (count * 5)
	}

	readiness := "Junior/Entry"
	if scorePct >= 80 {
		readiness = "Job Ready"
	} else if scorePct >= 65 {
		readiness = "Intermediate"
	}

	paths, _ := s.repo.GetLearningPaths(ctx, req.Domain)
	var recPathID *uuid.UUID
	if len(paths) > 0 {
		recPathID = &paths[0].ID
	}

	ansJSON, _ := json.Marshal(req.Answers)

	assessment := &domain.SkillAssessment{
		ID:                 uuid.New(),
		UserID:             userID,
		Domain:             req.Domain,
		Score:              scorePct,
		ReadinessLevel:     readiness,
		RecommendedPathID: recPathID,
		AnswersJSON:        string(ansJSON),
		CreatedAt:          time.Now(),
	}

	if err := s.repo.SaveSkillAssessment(ctx, assessment); err != nil {
		return nil, err
	}

	return assessment, nil
}
