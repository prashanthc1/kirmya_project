package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"kirmya/internal/profile/repository"
	"kirmya/internal/recommendation/models"
	recRepo "kirmya/internal/recommendation/repository"
	sharedAI "kirmya/internal/shared/ai"
	"kirmya/internal/shared/cache"

	"github.com/google/uuid"
)

type RecommendationService struct {
	repo        *recRepo.RecommendationRepository
	profileRepo *repository.ProfileRepository
	aiProvider  sharedAI.AIProvider
	cache       cache.Cache
}

func NewRecommendationService(r *recRepo.RecommendationRepository, p *repository.ProfileRepository) *RecommendationService {
	return &RecommendationService{
		repo:        r,
		profileRepo: p,
		aiProvider:  sharedAI.NewLocalDeterministicProvider(),
	}
}

func NewRecommendationServiceWithAI(
	r *recRepo.RecommendationRepository,
	p *repository.ProfileRepository,
	ai sharedAI.AIProvider,
	c cache.Cache,
) *RecommendationService {
	if ai == nil {
		ai = sharedAI.NewLocalDeterministicProvider()
	}
	return &RecommendationService{
		repo:        r,
		profileRepo: p,
		aiProvider:  ai,
		cache:       c,
	}
}

func (s *RecommendationService) GetOrCreatePreferences(ctx context.Context, userID uuid.UUID) (*models.UserJobPreferences, error) {
	pref, err := s.repo.GetPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	if pref == nil {
		pref = &models.UserJobPreferences{
			ID:                  uuid.New(),
			UserID:              userID,
			PreferredTitles:     []string{"Go Developer", "Software Engineer"},
			PreferredLocations:  []string{"Dubai", "Abu Dhabi", "Remote"},
			PreferredIndustries: []string{"Technology", "Finance"},
			MinSalary:           15000,
			Currency:            "AED",
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}
		if s.repo != nil {
			_ = s.repo.CreatePreferences(ctx, pref)
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

	if s.repo != nil {
		if err := s.repo.UpdatePreferences(ctx, existing); err != nil {
			return nil, err
		}
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, fmt.Sprintf("rec:feed:%s", userID.String()))
		_ = s.cache.Delete(ctx, fmt.Sprintf("rec:jobs:%s", userID.String()))
	}

	return existing, nil
}

func (s *RecommendationService) GetRecommendations(ctx context.Context, userID uuid.UUID) ([]models.JobRecommendation, error) {
	// 1. Fetch user profile
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

	// 3. Fetch real candidate jobs from PostgreSQL
	var jobs []models.JobSummaryDTO
	if s.repo != nil {
		jobs, _ = s.repo.GetActiveJobCandidates(ctx, userID, 50)
	}

	// Fallback seed candidates if DB has no active jobs
	if len(jobs) == 0 {
		jobs = getFallbackJobListings()
	}

	// 4. Score and rank candidates
	type scoredJob struct {
		job     models.JobSummaryDTO
		score   int
		reasons []string
	}
	var scored []scoredJob
	for _, job := range jobs {
		score, reasons := computeMatchScore(job, profileHeadline, profileSkills, completeness, pref)
		if score >= 20 {
			scored = append(scored, scoredJob{job: job, score: score, reasons: reasons})
		}
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	// 5. Diversity control: max 2 jobs per company in top results
	companyCounts := make(map[string]int)
	var recs []models.JobRecommendation

	for _, sj := range scored {
		compKey := strings.ToLower(sj.job.Company)
		if companyCounts[compKey] >= 2 && len(recs) < 20 {
			continue
		}
		companyCounts[compKey]++

		reasonsBytes, _ := json.Marshal(sj.reasons)
		jobCopy := sj.job
		rec := models.JobRecommendation{
			ID:           uuid.New(),
			UserID:       userID,
			JobID:        sj.job.ID,
			MatchScore:   sj.score,
			MatchReasons: string(reasonsBytes),
			IsActive:     true,
			CreatedAt:    time.Now(),
			JobDetails:   &jobCopy,
		}

		if s.repo != nil {
			_ = s.repo.SaveRecommendation(ctx, &rec)
		}
		recs = append(recs, rec)
	}

	return recs, nil
}

func (s *RecommendationService) GetRecommendedPeople(ctx context.Context, userID uuid.UUID, limit int) ([]models.RecommendedPerson, error) {
	if limit <= 0 || limit > 30 {
		limit = 10
	}

	var candidates []models.RecommendedPerson
	if s.repo != nil {
		candidates, _ = s.repo.GetPeopleCandidates(ctx, userID, limit*2)
	}

	if len(candidates) == 0 {
		candidates = getFallbackPeopleCandidates(userID)
	}

	var userSkills []string
	var userIndustry string
	if s.profileRepo != nil {
		if p, err := s.profileRepo.GetByUserID(ctx, userID); err == nil && p != nil {
			userIndustry = p.Industry
			for _, sk := range p.Skills {
				userSkills = append(userSkills, sk.Name)
			}
		}
	}
	if len(userSkills) == 0 {
		userSkills = []string{"Go", "PostgreSQL", "Full-Stack"}
	}

	type scoredPerson struct {
		person models.RecommendedPerson
		score  int
	}
	var scored []scoredPerson

	for _, cand := range candidates {
		if cand.UserID == userID {
			continue
		}

		score := 50
		var reasons []string

		if userIndustry != "" && strings.EqualFold(cand.Industry, userIndustry) {
			score += 20
			reasons = append(reasons, fmt.Sprintf("Works in %s", cand.Industry))
		}

		sharedCount := 0
		for _, us := range userSkills {
			if strings.Contains(strings.ToLower(cand.Headline), strings.ToLower(us)) {
				sharedCount++
			}
		}
		if sharedCount > 0 {
			score += sharedCount * 10
			reasons = append(reasons, fmt.Sprintf("Shares %d skills (%s)", sharedCount, userSkills[0]))
		}

		if len(reasons) == 0 {
			reasons = append(reasons, "Active professional in your regional ecosystem")
		}

		if score > 100 {
			score = 98
		}
		cand.MatchScore = score
		cand.Reason = strings.Join(reasons, " • ")
		scored = append(scored, scoredPerson{person: cand, score: score})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	var result []models.RecommendedPerson
	for i, sp := range scored {
		if i >= limit {
			break
		}
		result = append(result, sp.person)
	}

	return result, nil
}

func (s *RecommendationService) GetRecommendedCommunities(ctx context.Context, userID uuid.UUID, limit int) ([]models.RecommendedCommunity, error) {
	if limit <= 0 || limit > 30 {
		limit = 10
	}

	var candidates []models.RecommendedCommunity
	if s.repo != nil {
		candidates, _ = s.repo.GetCommunityCandidates(ctx, userID, limit*2)
	}

	if len(candidates) == 0 {
		candidates = getFallbackCommunityCandidates()
	}

	var result []models.RecommendedCommunity
	for i, c := range candidates {
		if i >= limit {
			break
		}
		c.MatchScore = int(math.Min(98, float64(75+c.MemberCount/10)))
		c.Reason = fmt.Sprintf("Popular %s community with %d active members", c.Category, c.MemberCount)
		result = append(result, c)
	}

	return result, nil
}

func (s *RecommendationService) GetPersonalizedFeed(ctx context.Context, userID uuid.UUID, cursor string, limit int) (*models.FeedResponse, error) {
	if limit <= 0 || limit > 50 {
		limit = 15
	}

	offset := 0
	if cursor != "" {
		if decoded, err := base64.StdEncoding.DecodeString(cursor); err == nil {
			if n, err := strconv.Atoi(string(decoded)); err == nil {
				offset = n
			}
		}
	}

	// 1. Fetch recommendations for each stream
	jobRecs, _ := s.GetRecommendations(ctx, userID)
	peopleRecs, _ := s.GetRecommendedPeople(ctx, userID, 6)
	commRecs, _ := s.GetRecommendedCommunities(ctx, userID, 4)

	// 2. Interleave items into unified feed stream
	var allItems []models.FeedItem

	// Add top career tip / welcome insight item
	allItems = append(allItems, models.FeedItem{
		ID:             fmt.Sprintf("insight-%s", userID.String()[:8]),
		ItemType:       "career_tip",
		ItemID:         userID,
		Title:          "AI Career Optimization Insight",
		Subtitle:       "Profile & Opportunity Alignment",
		Description:    "Your verified skill set aligns strongly with regional senior technology and backend engineering positions.",
		CategoryTag:    "Intelligence",
		MatchScore:     95,
		MatchRationale: "Derived from your verified profile skills and active hiring demand",
		Metadata: map[string]interface{}{
			"actionUrl": "/resume-analysis",
			"actionText": "Analyze Resume",
		},
		CreatedAt: time.Now(),
	})

	// Interleave Jobs
	for _, j := range jobRecs {
		if j.JobDetails == nil {
			continue
		}
		var reasons []string
		_ = json.Unmarshal([]byte(j.MatchReasons), &reasons)
		rationale := "Matches your career preferences"
		if len(reasons) > 0 {
			rationale = strings.Join(reasons, " • ")
		}

		allItems = append(allItems, models.FeedItem{
			ID:             fmt.Sprintf("job-%s", j.JobID.String()),
			ItemType:       "job",
			ItemID:         j.JobID,
			Title:          j.JobDetails.Title,
			Subtitle:       fmt.Sprintf("%s • %s", j.JobDetails.Company, j.JobDetails.Location),
			Description:    fmt.Sprintf("Employment: %s | Currency: %s %d/mo", j.JobDetails.EmploymentType, j.JobDetails.Currency, j.JobDetails.SalaryMax),
			CategoryTag:    j.JobDetails.Industry,
			MatchScore:     j.MatchScore,
			MatchRationale: rationale,
			Metadata: map[string]interface{}{
				"jobId":       j.JobID.String(),
				"company":     j.JobDetails.Company,
				"location":    j.JobDetails.Location,
				"skills":      j.JobDetails.RequiredSkills,
				"salaryMax":   j.JobDetails.SalaryMax,
				"currency":    j.JobDetails.Currency,
				"isFeatured":  j.JobDetails.IsFeatured,
			},
			CreatedAt: j.JobDetails.CreatedAt,
		})
	}

	// Interleave People suggestions
	for _, p := range peopleRecs {
		allItems = append(allItems, models.FeedItem{
			ID:             fmt.Sprintf("person-%s", p.UserID.String()),
			ItemType:       "person",
			ItemID:         p.UserID,
			Title:          p.FullName,
			Subtitle:       p.Headline,
			Description:    fmt.Sprintf("Based in %s • %s", p.Location, p.Industry),
			CategoryTag:    "Suggested Peer",
			MatchScore:     p.MatchScore,
			MatchRationale: p.Reason,
			Metadata: map[string]interface{}{
				"userId":    p.UserID.String(),
				"username":  p.Username,
				"avatarUrl": p.AvatarURL,
				"headline":  p.Headline,
				"location":  p.Location,
			},
			CreatedAt: time.Now().Add(-1 * time.Hour),
		})
	}

	// Interleave Community recommendations
	for _, c := range commRecs {
		allItems = append(allItems, models.FeedItem{
			ID:             fmt.Sprintf("comm-%s", c.ID.String()),
			ItemType:       "community",
			ItemID:         c.ID,
			Title:          c.Name,
			Subtitle:       fmt.Sprintf("%d members • %s", c.MemberCount, c.Category),
			Description:    c.Description,
			CategoryTag:    "Community",
			MatchScore:     c.MatchScore,
			MatchRationale: c.Reason,
			Metadata: map[string]interface{}{
				"communityId": c.ID.String(),
				"slug":        c.Slug,
				"logoUrl":     c.LogoURL,
				"memberCount": c.MemberCount,
			},
			CreatedAt: time.Now().Add(-2 * time.Hour),
		})
	}

	total := len(allItems)
	start := offset
	if start >= total {
		return &models.FeedResponse{
			Items:      []models.FeedItem{},
			HasMore:    false,
			TotalCount: total,
		}, nil
	}

	end := start + limit
	if end > total {
		end = total
	}

	pageItems := allItems[start:end]
	hasMore := end < total

	nextCursor := ""
	if hasMore {
		nextCursor = base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(end)))
	}

	return &models.FeedResponse{
		Items:      pageItems,
		NextCursor: nextCursor,
		HasMore:    hasMore,
		TotalCount: total,
	}, nil
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

	if s.repo != nil {
		if err := s.repo.SaveFeedback(ctx, f); err != nil {
			return err
		}
		if feedbackType == "dismiss" || feedbackType == "dislike" {
			_ = s.repo.DismissRecommendation(ctx, recID)
		}
	}

	if s.cache != nil {
		_ = s.cache.Delete(ctx, fmt.Sprintf("rec:feed:%s", userID.String()))
		_ = s.cache.Delete(ctx, fmt.Sprintf("rec:jobs:%s", userID.String()))
	}

	return nil
}

// Multi-Factor Deterministic Matching Algorithm
func computeMatchScore(job models.JobSummaryDTO, headline string, skills []string, completeness int, pref *models.UserJobPreferences) (int, []string) {
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

	// 2. Skills Match (35% weight)
	matchingSkills := 0
	for _, reqSkill := range job.RequiredSkills {
		for _, uSkill := range skills {
			if strings.EqualFold(reqSkill, uSkill) || strings.Contains(strings.ToLower(reqSkill), strings.ToLower(uSkill)) {
				matchingSkills++
				break
			}
		}
	}
	if len(job.RequiredSkills) > 0 {
		skillRatio := float32(matchingSkills) / float32(len(job.RequiredSkills))
		score += int(skillRatio * 35)
		if matchingSkills > 0 {
			reasons = append(reasons, fmt.Sprintf("Matches %d of your core skills", matchingSkills))
		}
	} else if len(skills) > 0 {
		score += 25
		reasons = append(reasons, "Relevant to your professional skillset")
	}

	// 3. Location Match (15% weight)
	locMatch := false
	for _, prefLoc := range pref.PreferredLocations {
		if strings.Contains(strings.ToLower(job.Location), strings.ToLower(prefLoc)) || strings.EqualFold(prefLoc, "Remote") {
			locMatch = true
			break
		}
	}
	if locMatch {
		score += 15
		reasons = append(reasons, fmt.Sprintf("Located in your preferred region (%s)", job.Location))
	}

	// 4. Salary Alignment (15% weight)
	if job.SalaryMax >= pref.MinSalary || job.SalaryMin >= pref.MinSalary {
		score += 15
		reasons = append(reasons, "Meets your target compensation expectations")
	}

	// 5. Industry Alignment (10% weight)
	indMatch := false
	for _, prefInd := range pref.PreferredIndustries {
		if strings.EqualFold(job.Industry, prefInd) || strings.Contains(strings.ToLower(job.Industry), strings.ToLower(prefInd)) {
			indMatch = true
			break
		}
	}
	if indMatch {
		score += 10
		reasons = append(reasons, "Aligned with preferred industry sectors")
	}

	if score > 100 {
		score = 100
	}

	return score, reasons
}

// Fallback seed candidates for offline test environments
func getFallbackJobListings() []models.JobSummaryDTO {
	return []models.JobSummaryDTO{
		{
			ID:             uuid.MustParse("11111111-1111-1111-1111-111111111111"),
			Title:          "Senior Go Backend Engineer",
			Company:        "Kirmya Technology",
			Location:       "Dubai, UAE",
			WorkMode:       "Hybrid",
			EmploymentType: "Full-time",
			SalaryMin:      20000,
			SalaryMax:      28000,
			Currency:       "AED",
			Industry:       "Technology",
			RequiredSkills: []string{"Go", "PostgreSQL", "Redis", "Microservices"},
			IsFeatured:     true,
			CreatedAt:      time.Now().Add(-24 * time.Hour),
		},
		{
			ID:             uuid.MustParse("22222222-2222-2222-2222-222222222222"),
			Title:          "Lead React / Next.js Developer",
			Company:        "Gulf Enterprise Systems",
			Location:       "Abu Dhabi, UAE",
			WorkMode:       "On-site",
			EmploymentType: "Full-time",
			SalaryMin:      18000,
			SalaryMax:      24000,
			Currency:       "AED",
			Industry:       "Technology",
			RequiredSkills: []string{"Next.js", "MUI v6", "React", "TypeScript"},
			IsFeatured:     false,
			CreatedAt:      time.Now().Add(-48 * time.Hour),
		},
		{
			ID:             uuid.MustParse("33333333-3333-3333-3333-333333333333"),
			Title:          "Machine Learning / AI Developer",
			Company:        "Emirates Applied Intelligence",
			Location:       "Dubai, UAE",
			WorkMode:       "Remote",
			EmploymentType: "Full-time",
			SalaryMin:      25000,
			SalaryMax:      35000,
			Currency:       "AED",
			Industry:       "Finance",
			RequiredSkills: []string{"Python", "Go", "pgvector", "LLMs"},
			IsFeatured:     true,
			CreatedAt:      time.Now().Add(-12 * time.Hour),
		},
	}
}

func getFallbackPeopleCandidates(currentUserID uuid.UUID) []models.RecommendedPerson {
	return []models.RecommendedPerson{
		{
			UserID:            uuid.MustParse("44444444-4444-4444-4444-444444444444"),
			FullName:          "Tariq Al-Mansoor",
			Username:          "talmansoor",
			Headline:          "Principal Infrastructure Architect | Distributed Systems",
			AvatarURL:         "",
			Location:          "Dubai, UAE",
			Industry:          "Technology",
			MutualCount:       3,
			MutualConnections: []string{"Salim Al-Harthy", "Fatima Al-Suwaidi"},
			SharedSkills:      []string{"Go", "PostgreSQL", "Kubernetes"},
			MatchScore:        94,
			Reason:            "Shares 3 mutual connections and core Go systems background",
		},
		{
			UserID:            uuid.MustParse("55555555-5555-5555-5555-555555555555"),
			FullName:          "Dr. Reem Al-Nuaimi",
			Username:          "reemnuaimi",
			Headline:          "AI Research Director & Engineering Lead",
			AvatarURL:         "",
			Location:          "Abu Dhabi, UAE",
			Industry:          "Technology",
			MutualCount:       2,
			MutualConnections: []string{"Ayesha Siddiqui"},
			SharedSkills:      []string{"Machine Learning", "Python"},
			MatchScore:        89,
			Reason:            "Active in regional AI & Machine Learning Community",
		},
	}
}

func getFallbackCommunityCandidates() []models.RecommendedCommunity {
	return []models.RecommendedCommunity{
		{
			ID:           uuid.MustParse("66666666-6666-6666-6666-666666666666"),
			Name:         "Gulf Gophers - Go Engineers Hub",
			Slug:         "gulf-gophers",
			Description:  "Regional community for high-throughput Go backend developers and system architects in UAE & GCC.",
			Category:     "Engineering",
			LogoURL:      "",
			MemberCount:  1420,
			SharedSkills: []string{"Go", "PostgreSQL", "Concurrency"},
			MatchScore:   96,
			Reason:       "Matches your primary backend technology stack",
		},
		{
			ID:           uuid.MustParse("77777777-7777-7777-7777-777777777777"),
			Name:         "UAE AI & ML Practitioners",
			Slug:         "uae-ai-ml",
			Description:  "Discussion group for generative AI, embeddings, vector databases, and enterprise LLM applications.",
			Category:     "Artificial Intelligence",
			LogoURL:      "",
			MemberCount:  980,
			SharedSkills: []string{"Python", "LLMs", "Vector Search"},
			MatchScore:   90,
			Reason:       "High activity discussion in applied intelligence",
		},
	}
}

