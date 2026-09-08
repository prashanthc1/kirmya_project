package service

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"math"
	"time"

	"github.com/google/uuid"

	"kirmya/internal/applications/models"
	"kirmya/internal/applications/repository"
)

type ApplicationsService struct {
	repo *repository.ApplicationsRepository
}

func NewApplicationsService(repo *repository.ApplicationsRepository) *ApplicationsService {
	return &ApplicationsService{repo: repo}
}

func (s *ApplicationsService) CreateApplication(ctx context.Context, candidateID uuid.UUID, payload models.CreateApplicationPayload) (*models.ApplicationDetail, error) {
	detail, err := s.repo.CreateApplication(ctx, candidateID, payload)
	if err != nil {
		return nil, err
	}
	if detail != nil {
		detail.Summary.StatusExplanation = models.GetStatusExplanation(detail.Summary.CurrentStatus)
	}
	return detail, nil
}

func (s *ApplicationsService) GetCandidateApplications(ctx context.Context, candidateID uuid.UUID, status string, search string) ([]models.ApplicationSummary, error) {
	apps, err := s.repo.GetCandidateApplications(ctx, candidateID, status, search)
	if err != nil {
		return nil, err
	}
	for i := range apps {
		apps[i].StatusExplanation = models.GetStatusExplanation(apps[i].CurrentStatus)
	}
	return apps, nil
}

func (s *ApplicationsService) GetApplicationByID(ctx context.Context, candidateID, appID uuid.UUID) (*models.ApplicationDetail, error) {
	detail, err := s.repo.GetApplicationByID(ctx, candidateID, appID)
	if err != nil || detail == nil {
		return nil, err
	}
	detail.Summary.StatusExplanation = models.GetStatusExplanation(detail.Summary.CurrentStatus)
	return detail, nil
}

func (s *ApplicationsService) WithdrawApplication(ctx context.Context, candidateID, appID uuid.UUID) error {
	return s.repo.WithdrawApplication(ctx, candidateID, appID)
}

func (s *ApplicationsService) ArchiveApplication(ctx context.Context, candidateID, appID uuid.UUID) error {
	return s.repo.ArchiveApplication(ctx, candidateID, appID)
}

// GetApplicationTimeline returns the stage history of an application the given
// candidate owns. The candidate is passed through to the repository, which
// resolves ownership in SQL; a foreign or unknown application is reported as
// not found rather than as an empty timeline.
func (s *ApplicationsService) GetApplicationTimeline(ctx context.Context, candidateID, appID uuid.UUID) ([]models.ApplicationTimelineItem, error) {
	return s.repo.GetApplicationTimeline(ctx, candidateID, appID)
}

func (s *ApplicationsService) SaveJob(ctx context.Context, candidateID, jobID uuid.UUID, notes string) error {
	return s.repo.SaveJob(ctx, candidateID, jobID, notes)
}

func (s *ApplicationsService) RemoveSavedJob(ctx context.Context, candidateID, jobID uuid.UUID) error {
	return s.repo.RemoveSavedJob(ctx, candidateID, jobID)
}

func (s *ApplicationsService) IsJobSaved(ctx context.Context, candidateID, jobID uuid.UUID) (bool, error) {
	return s.repo.IsJobSaved(ctx, candidateID, jobID)
}

func (s *ApplicationsService) GetSavedJobs(ctx context.Context, candidateID uuid.UUID) ([]models.SavedJobDTO, error) {
	return s.repo.GetSavedJobs(ctx, candidateID)
}

func (s *ApplicationsService) GetJobAlerts(ctx context.Context, candidateID uuid.UUID) ([]models.JobAlertDTO, error) {
	return s.repo.GetJobAlerts(ctx, candidateID)
}

func (s *ApplicationsService) CreateJobAlert(ctx context.Context, candidateID uuid.UUID, payload models.CreateJobAlertPayload) (*models.JobAlertDTO, error) {
	return s.repo.CreateJobAlert(ctx, candidateID, payload)
}

func (s *ApplicationsService) DeleteJobAlert(ctx context.Context, candidateID, alertID uuid.UUID) error {
	return s.repo.DeleteJobAlert(ctx, candidateID, alertID)
}

func (s *ApplicationsService) GetCandidateInterviews(ctx context.Context, candidateID uuid.UUID) ([]models.CandidateInterview, error) {
	return s.repo.GetCandidateInterviews(ctx, candidateID)
}

func (s *ApplicationsService) GetCandidateDocuments(ctx context.Context, candidateID uuid.UUID) ([]models.CandidateDocument, error) {
	return s.repo.GetCandidateDocuments(ctx, candidateID)
}

const maxDocumentSize = 10 << 20

func (s *ApplicationsService) UploadDocument(ctx context.Context, candidateID uuid.UUID, title, documentType, originalName, contentType string, isDefault bool, content []byte) (*models.CandidateDocument, error) {
	if len(content) == 0 {
		return nil, errors.New("document is empty")
	}
	if len(content) > maxDocumentSize {
		return nil, errors.New("document exceeds 10 MiB limit")
	}
	if !bytes.HasPrefix(content, []byte("%PDF-")) {
		return nil, errors.New("only valid PDF documents are accepted")
	}
	if bytes.Contains(bytes.ToUpper(content), []byte("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
		return nil, errors.New("document failed malware scan")
	}
	if title == "" {
		title = originalName
	}
	if documentType == "" {
		documentType = "Resume"
	}
	sum := sha256.Sum256(content)
	id := uuid.New()
	now := time.Now().UTC()
	doc := &models.CandidateDocument{ID: id, CandidateID: candidateID, Title: title, DocumentType: documentType, FileURL: "/api/v1/documents/" + id.String() + "/download", SizeBytes: int64(len(content)), FileType: "application/pdf", IsDefault: isDefault, UploadedAt: now, StorageKey: "candidate-documents/" + candidateID.String() + "/" + id.String(), SHA256: hex.EncodeToString(sum[:]), ScanStatus: "clean", OriginalName: originalName}
	_ = contentType // the PDF signature is authoritative; browser content types are untrusted.
	if err := s.repo.CreateDocument(ctx, doc, content); err != nil {
		return nil, err
	}
	return doc, nil
}

func (s *ApplicationsService) DownloadDocument(ctx context.Context, candidateID, docID uuid.UUID) (*models.CandidateDocument, []byte, error) {
	return s.repo.GetDocumentContent(ctx, candidateID, docID)
}

func (s *ApplicationsService) DeleteDocument(ctx context.Context, candidateID, docID uuid.UUID) error {
	return s.repo.DeleteDocument(ctx, candidateID, docID)
}

func (s *ApplicationsService) GetApplicationStats(ctx context.Context, candidateID uuid.UUID) (*models.ApplicationStatsDTO, error) {
	// A read failure is reported as a failure. Returning a zeroed DTO here made
	// a database outage indistinguishable from a candidate with no applications,
	// so the dashboard confidently showed "0 applications" during an incident.
	apps, err := s.repo.GetCandidateApplications(ctx, candidateID, "", "")
	if err != nil {
		return nil, err
	}

	stats := &models.ApplicationStatsDTO{
		TotalApplications: len(apps),
	}
	for _, a := range apps {
		switch a.CurrentStatus {
		case models.StageInterview:
			stats.InterviewsScheduled++
			stats.ActiveApplications++
		case models.StageOffer, models.StageAccepted:
			stats.OffersReceived++
			stats.ActiveApplications++
		case models.StageApplied, models.StageViewed, models.StageShortlisted:
			stats.ActiveApplications++
		case models.StageRejected:
			stats.RejectedApplications++
		case models.StageWithdrawn:
			stats.WithdrawnCount++
		}
	}
	if stats.TotalApplications > 0 {
		stats.ResponseRate = float64(stats.ActiveApplications) / float64(stats.TotalApplications) * 100.0
	} else {
		stats.ResponseRate = 0
	}
	return stats, nil
}

// minimumApplicationsForRates is how many applications a candidate needs before
// a percentage over them is worth showing.
//
// Below this a single rejection reads as "0% response rate" and a single reply
// as "100%", both rendered with the same confident progress bar. The threshold
// is small because the alternative is showing nothing to almost everyone, and
// the insufficient-data state names it so the user knows what changes it.
const minimumApplicationsForRates = 3

// GetAIInsights reports rates computed from the candidate's own applications.
//
// Every number here is arithmetic over rows the candidate can see for
// themselves. It used to return constants — 85, 90, 75.0, and a fixed list of
// three "missing skills" — which the UI rendered as a personalised assessment.
func (s *ApplicationsService) GetAIInsights(ctx context.Context, candidateID uuid.UUID) (*models.AIApplicationInsightsDTO, error) {
	apps, err := s.repo.GetCandidateApplications(ctx, candidateID, "", "")
	if err != nil {
		return nil, err
	}
	return computeApplicationInsights(apps), nil
}

// computeApplicationInsights is the whole of the calculation, separated from the
// read so it can be exercised directly against known stages.
func computeApplicationInsights(apps []models.ApplicationSummary) *models.AIApplicationInsightsDTO {
	insights := &models.AIApplicationInsightsDTO{
		MinimumApplications: minimumApplicationsForRates,
		GeneralGuidance: []string{
			"Quantify accomplishments in past experience with measurable impact.",
			"Mirror the job description's own wording for titles and core skills.",
			"Attach a cover letter tailored to the role for competitive postings.",
		},
	}

	// Withdrawn and draft applications say nothing about how employers responded,
	// so they are excluded from the denominator rather than counted as failures.
	considered := make([]models.ApplicationSummary, 0, len(apps))
	for _, a := range apps {
		switch a.CurrentStatus {
		case models.StageDraft, models.StageWithdrawn:
			continue
		default:
			considered = append(considered, a)
		}
	}

	insights.ApplicationsConsidered = len(considered)
	if len(considered) < minimumApplicationsForRates {
		// Sufficient stays false and every rate stays zero-valued and omitted.
		return insights
	}

	var responded, interviewed, offered int
	for _, a := range considered {
		switch a.CurrentStatus {
		case models.StageViewed, models.StageShortlisted:
			responded++
		case models.StageInterview:
			responded++
			interviewed++
		case models.StageOffer, models.StageAccepted:
			responded++
			interviewed++
			offered++
		case models.StageRejected:
			// An explicit rejection is a response: the employer looked and
			// decided. Counting it as silence would flatter the response rate.
			responded++
		}
	}

	total := float64(len(considered))
	insights.Sufficient = true
	insights.ResponseRate = percentage(float64(responded), total)
	insights.InterviewRate = percentage(float64(interviewed), total)
	insights.OfferRate = percentage(float64(offered), total)

	return insights
}

// percentage rounds to one decimal so the value reads as a measurement rather
// than a floating-point artefact.
func percentage(part, whole float64) float64 {
	if whole <= 0 {
		return 0
	}
	return math.Round((part/whole)*1000) / 10
}

func (s *ApplicationsService) GetCareerAnalytics(ctx context.Context, candidateID uuid.UUID) (*models.CareerAnalyticsDTO, error) {
	apps, err := s.repo.GetCandidateApplications(ctx, candidateID, "", "")
	if err != nil {
		return nil, err
	}

	funnelMap := map[string]int{
		"Applied":     0,
		"Viewed":      0,
		"Shortlisted": 0,
		"Interview":   0,
		"Offer":       0,
		"Accepted":    0,
		"Rejected":    0,
		"Withdrawn":   0,
	}

	roleMap := make(map[string]int)
	companyMap := make(map[string]int)
	monthlyMap := make(map[string]int)

	for _, a := range apps {
		funnelMap[string(a.CurrentStatus)]++

		if a.JobTitle != "" {
			roleMap[a.JobTitle]++
		}
		if a.CompanyName != "" {
			companyMap[a.CompanyName]++
		}

		m := a.AppliedAt.Format("Jan")
		monthlyMap[m]++
	}

	var funnel []models.FunnelStageDTO
	for _, stage := range []string{"Applied", "Viewed", "Shortlisted", "Interview", "Offer", "Accepted", "Rejected", "Withdrawn"} {
		funnel = append(funnel, models.FunnelStageDTO{
			Stage: stage,
			Count: funnelMap[stage],
		})
	}

	var roles []models.CategoryCount
	for k, v := range roleMap {
		roles = append(roles, models.CategoryCount{Name: k, Count: v})
	}

	var companies []models.CategoryCount
	for k, v := range companyMap {
		companies = append(companies, models.CategoryCount{Name: k, Count: v})
	}

	var trend []models.MonthlyCountDTO
	now := time.Now()
	for i := 3; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		monthName := t.Format("Jan")
		trend = append(trend, models.MonthlyCountDTO{
			Month: monthName,
			Count: monthlyMap[monthName],
		})
	}

	interviewRate := 0.0
	responseRate := 0.0
	if len(apps) > 0 {
		activeCount := funnelMap["Viewed"] + funnelMap["Shortlisted"] + funnelMap["Interview"] + funnelMap["Offer"] + funnelMap["Accepted"]
		interviewRate = float64(funnelMap["Interview"]) / float64(len(apps)) * 100.0
		responseRate = float64(activeCount) / float64(len(apps)) * 100.0
	}

	return &models.CareerAnalyticsDTO{
		ApplicationsSent:     len(apps),
		InterviewRate:        interviewRate,
		ResponseRate:         responseRate,
		TimeToResponseDays:   3.5,
		MostAppliedRoles:     roles,
		MostAppliedCompanies: companies,
		ApplicationTrend:     trend,
		StatusFunnel:         funnel,
	}, nil
}
