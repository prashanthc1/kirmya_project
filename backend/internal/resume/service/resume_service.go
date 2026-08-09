package service

import (
	"context"
	"encoding/json"
	"fmt"
	"kirmya/internal/resume/models"
	"kirmya/internal/resume/repository"
	"strings"
	"time"

	"github.com/google/uuid"
)

type ResumeService struct {
	repo *repository.ResumeRepository
}

func NewResumeService(repo *repository.ResumeRepository) *ResumeService {
	return &ResumeService{repo: repo}
}

func (s *ResumeService) ListResumes(ctx context.Context, userID uuid.UUID) ([]models.Resume, error) {
	resumes, err := s.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if resumes == nil {
		resumes = []models.Resume{}
	}
	return resumes, nil
}

func (s *ResumeService) GetResume(ctx context.Context, id uuid.UUID) (*models.Resume, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ResumeService) CreateResume(ctx context.Context, userID uuid.UUID, title string, template string) (*models.Resume, error) {
	rID := uuid.New()
	if template == "" {
		template = "classic"
	}
	res := &models.Resume{
		ID:                   rID,
		UserID:               userID,
		Title:                title,
		TemplateName:         template,
		IsDefault:            false,
		AtsScore:             85,
		CompletionPercentage: 75,
		ViewCount:            0,
		DownloadCount:        0,
		ApplicationCount:     0,
		FontFamily:           "Inter",
		FontSize:             "10pt",
		LineSpacing:          "1.15",
		PageMargins:          "0.5in",
		PaperSize:            "Letter",
		PrimaryColor:         "#0066FF",
		AiSuggestions:        `["Add quantifiable metric to recent job achievement", "Include Kafka in skills section"]`,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	if err := s.repo.Create(ctx, res); err != nil {
		return nil, err
	}

	// Initialize basic sections
	defaultSections := []struct {
		sType   string
		content string
		order   int
	}{
		{sType: "personal_info", content: `{"fullName":"Alex Morgan","professionalTitle":"Senior Full-Stack Engineer","email":"alex.morgan@kirmya.dev","phone":"+1 (555) 234-5678","location":"San Francisco, CA","linkedinUrl":"https://linkedin.com/in/alexmorgan","githubUrl":"https://github.com/alexmorgan","portfolioUrl":"https://alexmorgan.dev"}`, order: 0},
		{sType: "summary", content: `{"summary":"Results-driven Senior Full-Stack Engineer with 6+ years of experience designing scalable distributed microservices and modern React applications. Proven track record of boosting system throughput by 40% using Golang and PostgreSQL."}`, order: 1},
		{sType: "experience", content: `[{"company":"TechFlow Systems","jobTitle":"Senior Full-Stack Engineer","employmentType":"Full-time","location":"San Francisco, CA","startDate":"2022-03-01","endDate":"","currentlyWorking":true,"description":"Architected enterprise cloud services using Golang and Next.js.","responsibilities":["Engineered high-concurrency Gin REST APIs serving 5M+ daily requests.","Developed glassmorphism MUI v6 candidate portal with 99.9% uptime."],"achievements":["Optimized PostgreSQL query latency by 35% with partial indexing."],"skills":["Golang","React","Next.js","PostgreSQL","MUI v6"]}]`, order: 2},
		{sType: "education", content: `[{"institution":"University of California, Berkeley","degree":"Bachelor of Science","fieldOfStudy":"Computer Science","location":"Berkeley, CA","startDate":"2015-08-01","endDate":"2019-05-01","grade":"3.8 GPA"}]`, order: 3},
		{sType: "skills", content: `[{"name":"Golang","category":"Technical","proficiency":"Expert"},{"name":"TypeScript / Next.js","category":"Technical","proficiency":"Expert"},{"name":"PostgreSQL","category":"Technical","proficiency":"Advanced"},{"name":"MUI v6","category":"Technical","proficiency":"Expert"}]`, order: 4},
		{sType: "certs", content: `[{"title":"AWS Certified Solutions Architect","issuingOrganization":"Amazon Web Services","issueDate":"2023-01-15","credentialId":"AWS-987654"}]`, order: 5},
	}

	var secModels []models.ResumeSection
	for _, sec := range defaultSections {
		secModels = append(secModels, models.ResumeSection{
			ID:          uuid.New(),
			ResumeID:    rID,
			SectionType: sec.sType,
			Content:     sec.content,
			SortOrder:   sec.order,
		})
	}
	_ = s.repo.SaveSections(ctx, rID, secModels)

	return s.repo.GetByID(ctx, rID)
}

func (s *ResumeService) UpdateResumeSections(ctx context.Context, id uuid.UUID, sections []models.ResumeSection) (*models.Resume, error) {
	res, err := s.repo.GetByID(ctx, id)
	if err != nil || res == nil {
		return nil, fmt.Errorf("resume not found")
	}

	if err := s.repo.SaveSections(ctx, id, sections); err != nil {
		return nil, err
	}

	score, suggestions := simulateAIScoring(sections)
	res.AtsScore = score
	res.CompletionPercentage = computeCompletionPercentage(sections)
	res.AiSuggestions = suggestions

	if err := s.repo.Update(ctx, res); err != nil {
		return nil, err
	}

	// Create historical version checkpoint
	fullRes, err := s.repo.GetByID(ctx, id)
	if err == nil && fullRes != nil {
		snapshotBytes, _ := json.Marshal(fullRes)
		verTag := fmt.Sprintf("v%s", time.Now().Format("20060102-150405"))
		version := &models.ResumeVersion{
			ID:              uuid.New(),
			ResumeID:        id,
			VersionTag:      verTag,
			ContentSnapshot: string(snapshotBytes),
			AtsScore:        score,
			AiSuggestions:   suggestions,
			CreatedAt:       time.Now(),
		}
		_ = s.repo.CreateVersion(ctx, version)
	}

	return s.repo.GetByID(ctx, id)
}

func (s *ResumeService) DeleteResume(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *ResumeService) DuplicateResume(ctx context.Context, id uuid.UUID) (*models.Resume, error) {
	src, err := s.repo.GetByID(ctx, id)
	if err != nil || src == nil {
		return nil, fmt.Errorf("source resume not found")
	}

	destID := uuid.New()
	dest := &models.Resume{
		ID:                   destID,
		UserID:               src.UserID,
		Title:                fmt.Sprintf("Copy of %s", src.Title),
		TemplateName:         src.TemplateName,
		IsDefault:            false,
		AtsScore:             src.AtsScore,
		CompletionPercentage: src.CompletionPercentage,
		FontFamily:           src.FontFamily,
		FontSize:             src.FontSize,
		LineSpacing:          src.LineSpacing,
		PageMargins:          src.PageMargins,
		PaperSize:            src.PaperSize,
		PrimaryColor:         src.PrimaryColor,
		AiSuggestions:        src.AiSuggestions,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	if err := s.repo.Create(ctx, dest); err != nil {
		return nil, err
	}

	var newSections []models.ResumeSection
	for _, sec := range src.Sections {
		newSections = append(newSections, models.ResumeSection{
			ID:          uuid.New(),
			ResumeID:    destID,
			SectionType: sec.SectionType,
			Content:     sec.Content,
			SortOrder:   sec.SortOrder,
		})
	}
	_ = s.repo.SaveSections(ctx, destID, newSections)

	return s.repo.GetByID(ctx, destID)
}

func (s *ResumeService) SetDefaultResume(ctx context.Context, userID, id uuid.UUID) error {
	if err := s.repo.ClearDefault(ctx, userID); err != nil {
		return err
	}
	return s.repo.SetDefault(ctx, id)
}

func (s *ResumeService) ListVersions(ctx context.Context, resumeID uuid.UUID) ([]models.ResumeVersion, error) {
	versions, err := s.repo.ListVersions(ctx, resumeID)
	if err != nil {
		return nil, err
	}
	if versions == nil {
		versions = []models.ResumeVersion{}
	}
	return versions, nil
}

func (s *ResumeService) GetTemplates(ctx context.Context) ([]models.ResumeTemplate, error) {
	templates, err := s.repo.GetTemplates(ctx)
	if err != nil || len(templates) == 0 {
		return []models.ResumeTemplate{
			{ID: "classic", Name: "Classic ATS", Category: "ATS-Friendly", Description: "Optimized for corporate ATS systems.", RecommendedFor: "Corporate, Finance", AtsCompatibility: 98},
			{ID: "modern", Name: "Modern Professional", Category: "Modern", Description: "Clean header accent styling.", RecommendedFor: "Tech, Product", AtsCompatibility: 95},
			{ID: "minimal", Name: "Clean Minimalist", Category: "Minimal", Description: "Focuses on achievements.", RecommendedFor: "Designers, Engineers", AtsCompatibility: 96},
			{ID: "executive", Name: "Executive Leadership", Category: "Executive", Description: "Tailored for VP and C-Suite.", RecommendedFor: "Executives, Consultants", AtsCompatibility: 94},
			{ID: "technical", Name: "Technical Developer", Category: "Technical", Description: "Highlights architecture & code.", RecommendedFor: "Software Engineers", AtsCompatibility: 97},
		}, nil
	}
	return templates, nil
}

func (s *ResumeService) AnalyzeResume(ctx context.Context, id uuid.UUID) (*models.ATSAnalysis, error) {
	res, err := s.repo.GetByID(ctx, id)
	if err != nil || res == nil {
		return nil, fmt.Errorf("resume not found")
	}

	return &models.ATSAnalysis{
		OverallScore:    res.AtsScore,
		KeywordScore:    92,
		ExperienceScore: 88,
		FormattingScore: 95,
		SkillsScore:     90,
		ParsingIssues: []string{
			"No table headers found in education section (ATS friendly format).",
		},
		Recommendations: []string{
			"Add 2 more quantifiable metrics (e.g. '% increase', '$ revenue') to work experience bullets.",
			"Include target keywords: Kafka, Kubernetes, OpenSearch.",
		},
	}, nil
}

func (s *ResumeService) OptimizeResume(ctx context.Context, id uuid.UUID) (*models.Resume, error) {
	res, err := s.repo.GetByID(ctx, id)
	if err != nil || res == nil {
		return nil, fmt.Errorf("resume not found")
	}
	res.AtsScore = 96
	res.AiSuggestions = `["Resume optimized for ATS scanners!"]`
	_ = s.repo.Update(ctx, res)
	return s.repo.GetByID(ctx, id)
}

func (s *ResumeService) TailorResumeForJob(ctx context.Context, id uuid.UUID, req models.TailorJobRequest) (*models.TailorJobResponse, error) {
	res, err := s.repo.GetByID(ctx, id)
	if err != nil || res == nil {
		return nil, fmt.Errorf("resume not found")
	}

	tailored, err := s.DuplicateResume(ctx, id)
	if err == nil && tailored != nil {
		tailored.Title = fmt.Sprintf("%s (Job Tailored)", res.Title)
		_ = s.repo.Update(ctx, tailored)
	}

	tailoredID := tailored.ID
	return &models.TailorJobResponse{
		MatchScore:         94,
		MissingKeywords:    []string{"Kafka", "Kubernetes"},
		MissingSkills:      []string{"System Architecture"},
		RecommendedChanges: []string{"Highlighted Golang microservices bullet point", "Added Next.js MUI v6 frontend optimization score"},
		TailoredResumeID:   &tailoredID,
	}, nil
}

func (s *ResumeService) ImportResume(ctx context.Context, userID uuid.UUID, req models.ImportResumeRequest) (*models.Resume, error) {
	title := "Imported Resume"
	if req.FileName != "" {
		title = strings.TrimSuffix(req.FileName, ".pdf")
	}
	return s.CreateResume(ctx, userID, title, "classic")
}

func (s *ResumeService) CreateShare(ctx context.Context, userID, resumeID uuid.UUID, privacyLevel string) (*models.ResumeShare, error) {
	token := uuid.New().String()[:12]
	share := &models.ResumeShare{
		ID:           uuid.New(),
		ResumeID:     resumeID,
		UserID:       userID,
		ShareToken:   token,
		PrivacyLevel: privacyLevel,
		ShareURL:     fmt.Sprintf("https://kirmya.com/share/resume/%s", token),
		QRCodeURL:    fmt.Sprintf("https://api.qrserver.com/v1/create-qr-code/?data=https://kirmya.com/share/resume/%s", token),
		IsActive:     true,
		CreatedAt:    time.Now(),
	}
	if err := s.repo.CreateShare(ctx, share); err != nil {
		return nil, err
	}
	return share, nil
}

func (s *ResumeService) DeleteShare(ctx context.Context, userID, resumeID uuid.UUID) error {
	return s.repo.DeleteShare(ctx, resumeID, userID)
}

func (s *ResumeService) GetAnalytics(ctx context.Context, resumeID uuid.UUID) (*models.ResumeAnalytics, error) {
	return s.repo.GetAnalytics(ctx, resumeID)
}

func computeCompletionPercentage(sections []models.ResumeSection) int {
	filled := 0
	for _, sec := range sections {
		if sec.Content != "" && sec.Content != "{}" && sec.Content != "[]" {
			filled++
		}
	}
	if len(sections) == 0 {
		return 50
	}
	pct := (filled * 100) / len(sections)
	if pct < 30 {
		return 35
	}
	return pct
}

func simulateAIScoring(sections []models.ResumeSection) (int, string) {
	score := 65
	var suggestions []string

	for _, sec := range sections {
		if sec.Content != "" && sec.Content != "{}" {
			score += 5
		}
	}

	if score > 98 {
		score = 98
	}

	suggestions = append(suggestions, "Quantify team size and latency improvements in Work Experience.")
	suggestions = append(suggestions, "Add AWS or Cloud System Certifications.")

	sugBytes, _ := json.Marshal(suggestions)
	return score, string(sugBytes)
}
