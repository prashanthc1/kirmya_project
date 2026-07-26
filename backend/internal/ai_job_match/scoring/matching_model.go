package scoring

import (
	"fmt"
	"strings"

	"kirmya/internal/ai_job_match/domain"

	"github.com/google/uuid"
)

type MatchingModel struct{}

func NewMatchingModel() *MatchingModel {
	return &MatchingModel{}
}

// CalculateMatchScore computes the multi-dimensional weighted score across 8 factors
func (m *MatchingModel) CalculateMatchScore(candidate *domain.CandidateProfile, job *domain.JobRequirement) (*domain.AIJobMatch, *domain.MatchingScore) {
	// 1. Skills Overlap (Weight: 30%)
	matchedSkills, missingSkills, skillsScore := m.calculateSkillsScore(candidate.Skills, job.RequiredSkills)

	// 2. Experience Level (Weight: 20%)
	expScore := m.calculateExperienceScore(candidate.YearsExperience, job.MinExperience)

	// 3. Career Goals (Weight: 15%)
	goalsScore := m.calculateGoalsScore(candidate.TargetRole, job.JobTitle)

	// 4. Salary Expectations (Weight: 10%)
	salaryScore := m.calculateSalaryScore(candidate.MinSalaryExpect, job.SalaryOffered)

	// 5. Location & Remote Preference (Weight: 10%)
	locationScore := m.calculateLocationScore(candidate.PreferredLocation, candidate.IsRemotePreferred, job.Location, job.IsRemoteAllowed)

	// 6. Learning & Upskilling Progress (Weight: 10%)
	learningScore := m.calculateLearningScore(candidate.CompletedCourses, missingSkills)

	// 7. Previous Applications History (Weight: 5%)
	appScore := m.calculateApplicationsScore(candidate.AppliedJobIDs, job.JobID)

	// Weighted Total Score Calculation
	totalWeightedScore := float64(skillsScore)*0.30 +
		float64(expScore)*0.20 +
		float64(goalsScore)*0.15 +
		float64(salaryScore)*0.10 +
		float64(locationScore)*0.10 +
		float64(learningScore)*0.10 +
		float64(appScore)*0.05

	overallScore := int(totalWeightedScore)
	if overallScore > 100 {
		overallScore = 100
	}

	// Match Tier Classification
	tier := domain.TierPotentialMatch
	if overallScore >= 85 {
		tier = domain.TierStrongMatch
	} else if overallScore >= 70 {
		tier = domain.TierGoodMatch
	}

	// Natural Language Explanation
	explanation := fmt.Sprintf("You match %d%% of the core requirements for %s at %s. Your experience with %s directly aligns with their backend stack.",
		overallScore, job.JobTitle, job.CompanyName, strings.Join(matchedSkills, ", "))

	// Actionable Recommended Upskilling Actions
	var recommendedActions []domain.RecommendedAction
	for _, missing := range missingSkills {
		recommendedActions = append(recommendedActions, domain.RecommendedAction{
			Type:        "course",
			Title:       fmt.Sprintf("Master %s Architecture", missing),
			Description: fmt.Sprintf("Complete the 3-hour Kirmya module to bridge your %s requirement gap.", missing),
			ActionURL:   fmt.Sprintf("/learning/courses/%s-mastery", strings.ToLower(missing)),
		})
	}

	// Machine Learning Feature Vector Dataset Extractor
	featureVector := map[string]interface{}{
		"skills_overlap_ratio":   float64(len(matchedSkills)) / float64(len(job.RequiredSkills)+1),
		"exp_years_delta":        candidate.YearsExperience - job.MinExperience,
		"salary_match_ratio":     float64(job.SalaryOffered) / float64(candidate.MinSalaryExpect+1),
		"is_remote_compatible":   job.IsRemoteAllowed || candidate.IsRemotePreferred,
		"learning_progress_cnt":  len(candidate.CompletedCourses),
		"raw_overall_score":      overallScore,
		"model_version":          "v1.2.0-xgboost-ready",
	}

	match := &domain.AIJobMatch{
		JobID:              job.JobID,
		JobTitle:           job.JobTitle,
		CompanyName:        job.CompanyName,
		OverallScore:       overallScore,
		MatchTier:          tier,
		Explanation:        explanation,
		MatchedSkills:      matchedSkills,
		MissingSkills:      missingSkills,
		RecommendedActions: recommendedActions,
	}

	scoreBreakdown := &domain.MatchingScore{
		SkillsScore:       skillsScore,
		ExperienceScore:   expScore,
		GoalsScore:        goalsScore,
		LocationScore:     locationScore,
		SalaryScore:       salaryScore,
		LearningScore:     learningScore,
		ApplicationsScore: appScore,
		FeatureVector:     featureVector,
	}

	return match, scoreBreakdown
}

func (m *MatchingModel) calculateSkillsScore(candSkills, reqSkills []string) ([]string, []string, int) {
	candMap := make(map[string]bool)
	for _, s := range candSkills {
		candMap[strings.ToLower(s)] = true
	}

	var matched []string
	var missing []string

	for _, req := range reqSkills {
		if candMap[strings.ToLower(req)] {
			matched = append(matched, req)
		} else {
			missing = append(missing, req)
		}
	}

	if len(reqSkills) == 0 {
		return matched, missing, 100
	}
	ratio := float64(len(matched)) / float64(len(reqSkills))
	return matched, missing, int(ratio * 100)
}

func (m *MatchingModel) calculateExperienceScore(candExp, reqExp int) int {
	if candExp >= reqExp {
		return 100
	}
	delta := reqExp - candExp
	if delta == 1 {
		return 80
	} else if delta == 2 {
		return 60
	}
	return 40
}

func (m *MatchingModel) calculateGoalsScore(targetRole, jobTitle string) int {
	if strings.Contains(strings.ToLower(jobTitle), strings.ToLower(targetRole)) {
		return 100
	}
	return 80
}

func (m *MatchingModel) calculateSalaryScore(expectSalary, offerSalary int) int {
	if offerSalary >= expectSalary {
		return 100
	}
	return 85
}

func (m *MatchingModel) calculateLocationScore(candLoc string, candRemote bool, jobLoc string, jobRemote bool) int {
	if jobRemote || candRemote {
		return 100
	}
	if strings.EqualFold(candLoc, jobLoc) {
		return 100
	}
	return 70
}

func (m *MatchingModel) calculateLearningScore(courses []string, missingSkills []string) int {
	if len(courses) > 0 {
		return 90
	}
	return 75
}

func (m *MatchingModel) calculateApplicationsScore(appliedIDs []uuid.UUID, jobID uuid.UUID) int {
	for _, id := range appliedIDs {
		if id == jobID {
			return 50 // Already applied
		}
	}
	return 100
}
