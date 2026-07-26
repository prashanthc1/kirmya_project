package service

import (
	"context"
	"encoding/json"
	"fmt"
	"kirmya/internal/profile/repository"
	"kirmya/internal/recommendation/models"
	recRepo "kirmya/internal/recommendation/repository"
	"strings"
	"time"

	"github.com/google/uuid"
)

type RecommendationService struct {
	repo        *recRepo.RecommendationRepository
	profileRepo *repository.ProfileRepository
}

func NewRecommendationService(r *recRepo.RecommendationRepository, p *repository.ProfileRepository) *RecommendationService {
	return &RecommendationService{repo: r, profileRepo: p}
}

func (s *RecommendationService) GetOrCreatePreferences(ctx context.Context, userID uuid.UUID) (*models.UserJobPreferences, error) {
	pref, err := s.repo.GetPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	if pref == nil {
		pref = &models.UserJobPreferences{
			ID:                 uuid.New(),
			UserID:             userID,
			PreferredTitles:    []string{"Go Developer", "Software Engineer"},
			PreferredLocations: []string{"Dubai", "Abu Dhabi"},
			PreferredIndustries: []string{"Technology", "Finance"},
			MinSalary:          15000,
			Currency:           "AED",
			CreatedAt:          time.Now(),
			UpdatedAt:          time.Now(),
		}
		if err := s.repo.CreatePreferences(ctx, pref); err != nil {
			return nil, err
		}
	}

	return pref, nil
}

func (s *RecommendationService) UpdatePreferences(ctx context.Context, userID uuid.UUID, pref *models.UserJobPreferences) (*models.UserJobPreferences, error) {
	existing, err := s.GetOrCreatePreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	existing.PreferredTitles = pref.PreferredTitles
	existing.PreferredLocations = pref.PreferredLocations
	existing.PreferredIndustries = pref.PreferredIndustries
	existing.MinSalary = pref.MinSalary
	existing.Currency = pref.Currency

	if err := s.repo.UpdatePreferences(ctx, existing); err != nil {
		return nil, err
	}

	return s.repo.GetPreferences(ctx, userID)
}

func (s *RecommendationService) GetRecommendations(ctx context.Context, userID uuid.UUID) ([]models.JobRecommendation, error) {
	// 1. Fetch user profile (to extract skills, headline, completeness)
	var profileSkills []string
	var profileHeadline string
	var completeness int = 50

	if s.profileRepo != nil {
		p, err := s.profileRepo.GetByUserID(ctx, userID)
		if err == nil && p != nil {
			profileHeadline = p.Headline
			completeness = p.ProfileCompletedPercentage
			for _, sk := range p.Skills {
				profileSkills = append(profileSkills, sk.Name)
			}
		}
	}

	// Fallback skills if profile doesn't have any
	if len(profileSkills) == 0 {
		profileSkills = []string{"Go", "PostgreSQL", "Next.js"}
	}
	if profileHeadline == "" {
		profileHeadline = "Software Developer"
	}

	// 2. Fetch user preferences
	pref, err := s.GetOrCreatePreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	// 3. Define target Mock Jobs
	mockJobs := getMockJobListings()

	// 4. Run matching algorithm and save recommendations
	var recs []models.JobRecommendation
	for _, job := range mockJobs {
		score, reasons := computeMatchScore(job, profileHeadline, profileSkills, completeness, pref)
		
		reasonsBytes, _ := json.Marshal(reasons)
		rec := models.JobRecommendation{
			ID:           uuid.New(),
			UserID:       userID,
			JobID:        job.ID,
			MatchScore:   score,
			MatchReasons: string(reasonsBytes),
			IsActive:     true,
			CreatedAt:    time.Now(),
			JobDetails:   &job,
		}

		// Save recommendations to database if pool is active
		if s.repo != nil {
			_ = s.repo.SaveRecommendation(ctx, &rec)
		}
		recs = append(recs, rec)
	}

	return recs, nil
}

func (s *RecommendationService) SubmitFeedback(ctx context.Context, userID uuid.UUID, recID uuid.UUID, feedbackType string, comments string) error {
	f := &models.RecommendationFeedback{
		ID:               uuid.New(),
		RecommendationID: recID,
		UserID:           userID,
		FeedbackType:     feedbackType,
		Comments:         comments,
		CreatedAt:        time.Now(),
	}

	if err := s.repo.SaveFeedback(ctx, f); err != nil {
		return err
	}

	// If candidate dismissed, mark recommendation inactive
	if feedbackType == "dismiss" || feedbackType == "dislike" {
		_ = s.repo.DismissRecommendation(ctx, recID)
	}

	return nil
}

// Matching Algorithm Core Logic
func computeMatchScore(job models.MockJob, headline string, skills []string, completeness int, pref *models.UserJobPreferences) (int, []string) {
	score := 0
	var reasons []string

	// 1. Job Title Match (25% weight)
	titleMatch := false
	for _, prefTitle := range pref.PreferredTitles {
		if strings.Contains(strings.ToLower(job.Title), strings.ToLower(prefTitle)) || 
		   strings.Contains(strings.ToLower(headline), strings.ToLower(job.Title)) {
			titleMatch = true
			break
		}
	}
	if titleMatch {
		score += 25
		reasons = append(reasons, "Matches your target job titles")
	}

	// 2. Skills Match (25% weight)
	matchingSkills := 0
	for _, reqSkill := range job.RequiredSkills {
		for _, uSkill := range skills {
			if strings.EqualFold(reqSkill, uSkill) {
				matchingSkills++
				break
			}
		}
	}
	if len(job.RequiredSkills) > 0 {
		skillRatio := float32(matchingSkills) / float32(len(job.RequiredSkills))
		score += int(skillRatio * 25)
		if matchingSkills > 0 {
			reasons = append(reasons, fmt.Sprintf("Matches %d of your core skills", matchingSkills))
		}
	}

	// 3. Location Match (15% weight)
	locMatch := false
	for _, prefLoc := range pref.PreferredLocations {
		if strings.EqualFold(job.Location, prefLoc) {
			locMatch = true
			break
		}
	}
	if locMatch {
		score += 15
		reasons = append(reasons, fmt.Sprintf("Located in your preferred city (%s)", job.Location))
	}

	// 4. Salary Alignment (15% weight)
	if job.SalaryMax >= pref.MinSalary {
		score += 15
		reasons = append(reasons, "Meets your salary expectations")
	}

	// 5. Industry Alignment (10% weight)
	indMatch := false
	for _, prefInd := range pref.PreferredIndustries {
		if strings.EqualFold(job.Industry, prefInd) {
			indMatch = true
			break
		}
	}
	if indMatch {
		score += 10
		reasons = append(reasons, "Aligned with preferred industry sectors")
	}

	// 6. Profile Completeness (10% weight)
	score += int(float32(completeness) / 100.0 * 10.0)

	if score > 100 {
		score = 100
	}

	return score, reasons
}

func getMockJobListings() []models.MockJob {
	return []models.MockJob{
		{
			ID:             uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			Title:          "Senior Go Backend Engineer",
			Company:        "Kirmya Technology",
			Location:       "Dubai",
			SalaryMax:      25000,
			Currency:       "AED",
			Industry:       "Technology",
			RequiredSkills: []string{"Go", "PostgreSQL", "Redis"},
		},
		{
			ID:             uuid.MustParse("22222222-2222-2222-2222-222222222222"),
			Title:          "Lead React / Next.js Developer",
			Company:        "E-Commerce Solutions",
			Location:       "Abu Dhabi",
			SalaryMax:      20000,
			Currency:       "AED",
			Industry:       "Technology",
			RequiredSkills: []string{"Next.js", "MUI v6", "React"},
		},
		{
			ID:             uuid.MustParse("33333333-3333-3333-3333-333333333333"),
			Title:          "Machine Learning / AI Developer",
			Company:        "Gemini Labs",
			Location:       "Dubai",
			SalaryMax:      30000,
			Currency:       "AED",
			Industry:       "Finance",
			RequiredSkills: []string{"Python", "Vertex AI", "pgvector"},
		},
	}
}

// Helper to format string printouts
func fmtstring(str string) string {
	return str
}
