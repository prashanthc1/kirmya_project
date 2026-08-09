package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"

	"github.com/google/uuid"
)

// This file produces the company insights shown to authorized company users.
//
// Every insight is computed from rows the company already owns — its profile,
// its analytics aggregates and its own job postings — and every one carries the
// figures it was derived from. Nothing here asks a language model to write
// prose about a company, because a generative summary of sparse data is exactly
// how a system ends up stating things about an employer that are not true. The
// rule is narrow and deliberate: report the company's numbers and what they
// imply, and say nothing that is not traceable to one of them.

// insightsMinSample is the number of applications below which funnel rates are
// too noisy to draw a conclusion from. Under it, the funnel insight reports the
// counts and says so rather than quoting a percentage.
const insightsMinSample = 20

// GenerateInsights builds the insight report for a company over a date range,
// defaulting to the last 30 days.
func (s *ManagementService) GenerateInsights(ctx context.Context, actor Actor, companyID uuid.UUID, from, to time.Time) (*models.CompanyInsightsReport, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermAIInsights); err != nil {
		return nil, err
	}

	if to.IsZero() {
		to = time.Now().UTC()
	}
	if from.IsZero() {
		from = to.AddDate(0, 0, -30)
	}
	if from.After(to) {
		return nil, fmt.Errorf("%w: the start date must be before the end date", domain.ErrValidation)
	}
	if to.Sub(from) > 366*24*time.Hour {
		return nil, fmt.Errorf("%w: the range cannot exceed one year", domain.ErrValidation)
	}

	detail, err := s.repo.GetDetail(ctx, companyID, actor.UserID)
	if err != nil {
		return nil, err
	}
	analytics, err := s.repo.Analytics(ctx, companyID, from, to)
	if err != nil {
		return nil, err
	}
	// Unpublished jobs are included: drafts left unpublished are one of the
	// findings, and the caller already holds ai:insights on this company.
	jobs, err := s.repo.ListCompanyJobs(ctx, companyID, "", true, 1, 200)
	if err != nil {
		return nil, err
	}

	report := &models.CompanyInsightsReport{
		CompanyID:   companyID,
		GeneratedAt: time.Now().UTC(),
		From:        from,
		To:          to,
		Insights:    make([]models.CompanyInsight, 0, 8),
	}

	report.Insights = append(report.Insights, profileInsights(detail)...)
	report.Insights = append(report.Insights, verificationInsight(detail)...)
	report.Insights = append(report.Insights, funnelInsights(analytics)...)
	report.Insights = append(report.Insights, trendInsights(analytics)...)
	report.Insights = append(report.Insights, jobPostingInsights(jobs)...)
	report.Insights = append(report.Insights, recruiterInsights(analytics)...)

	report.SuggestedSkills = topJobSkills(jobs, 12)
	report.Summary = summarize(analytics, jobs)

	s.audit(ctx, actor, companyID, domain.AuditSensitiveDataAccessed, "insights", nil, map[string]any{
		"from": from.Format("2006-01-02"),
		"to":   to.Format("2006-01-02"),
	})

	return report, nil
}

// profileInsights reports what the public profile is missing. It names the
// empty sections; it never proposes wording, because copy invented here would
// be a claim about the company.
func profileInsights(detail *models.CompanyDetail) []models.CompanyInsight {
	var out []models.CompanyInsight

	missing := missingProfileSections(detail)
	if len(missing) > 0 {
		out = append(out, models.CompanyInsight{
			ID:       "profile.incomplete",
			Category: "profile",
			Severity: models.InsightSuggestion,
			Title:    "Complete your company profile",
			Detail: fmt.Sprintf(
				"%d profile section(s) are still empty: %s. Candidates filter on industry, size and location, and an empty section removes you from those results.",
				len(missing), strings.Join(missing, ", ")),
			Evidence: []string{
				fmt.Sprintf("Profile completion: %d%%", detail.ProfileCompletion),
				fmt.Sprintf("Empty sections: %d", len(missing)),
			},
			Actions: []string{"Open Dashboard → Profile and fill the listed sections"},
		})
	}

	// A description too short to answer "what does this company do" is the
	// single most common reason a company page fails to convert a visitor.
	if words := len(strings.Fields(detail.Description)); words < 60 {
		detailText := "Your company description is empty."
		if words > 0 {
			detailText = fmt.Sprintf(
				"Your company description is %d words. Descriptions that answer what the company builds, who it serves and how the team works give candidates enough to self-select.", words)
		}
		out = append(out, models.CompanyInsight{
			ID:       "profile.description",
			Category: "description",
			Severity: models.InsightSuggestion,
			Title:    "Expand your company description",
			Detail:   detailText,
			Evidence: []string{fmt.Sprintf("Description length: %d words", words)},
			Actions: []string{
				"Describe what the company builds and for whom",
				"State how the team works day to day",
				"List the specialties you want to be found for",
			},
		})
	}

	if len(detail.Specialties) == 0 {
		out = append(out, models.CompanyInsight{
			ID:       "profile.specialties",
			Category: "discovery",
			Severity: models.InsightSuggestion,
			Title:    "Add specialties so candidates can find you",
			Detail:   "No specialties are listed. Specialties feed company search and the skill-based discovery shelves.",
			Evidence: []string{"Specialties listed: 0"},
			Actions:  []string{"Add the specialties your company hires and delivers on"},
		})
	}

	return out
}

// missingProfileSections lists the empty public sections, in the order the
// settings page presents them.
func missingProfileSections(detail *models.CompanyDetail) []string {
	sections := []struct {
		name  string
		empty bool
	}{
		{"description", strings.TrimSpace(detail.Description) == ""},
		{"tagline", strings.TrimSpace(detail.Tagline) == ""},
		{"logo", strings.TrimSpace(detail.LogoURL) == ""},
		{"cover image", strings.TrimSpace(detail.CoverURL) == ""},
		{"industry", strings.TrimSpace(detail.Industry) == ""},
		{"company size", strings.TrimSpace(detail.CompanySize) == ""},
		{"headquarters", strings.TrimSpace(detail.Headquarters) == ""},
		{"website", strings.TrimSpace(detail.Website) == ""},
		{"mission", strings.TrimSpace(detail.Mission) == ""},
		{"vision", strings.TrimSpace(detail.Vision) == ""},
		{"work culture", strings.TrimSpace(detail.WorkCulture) == ""},
		{"benefits", len(detail.Benefits) == 0},
		{"values", len(detail.Values) == 0},
	}
	var missing []string
	for _, section := range sections {
		if section.empty {
			missing = append(missing, section.name)
		}
	}
	return missing
}

// verificationInsight surfaces the verification state. It never implies the
// company is verified; that flag is set only by an administrator's decision.
func verificationInsight(detail *models.CompanyDetail) []models.CompanyInsight {
	if detail.IsVerified {
		return nil
	}

	insight := models.CompanyInsight{
		ID:       "verification.status",
		Category: "verification",
		Severity: models.InsightSuggestion,
		Title:    "Your company is not verified",
		Detail:   "Unverified companies do not carry a verification badge, which candidates use to tell real employers from impersonators.",
		Evidence: []string{fmt.Sprintf("Verification status: %s", detail.VerificationStatus)},
		Actions:  []string{"Submit business documentation from Dashboard → Verification"},
	}

	switch detail.VerificationStatus {
	case domain.VerificationPending:
		insight.Severity = models.InsightInfo
		insight.Title = "Verification is under review"
		insight.Detail = "A Kirmya administrator is reviewing your submission. No further action is needed until a decision is recorded."
		insight.Actions = nil
	case domain.VerificationRejected:
		insight.Severity = models.InsightWarning
		insight.Title = "Verification was rejected"
		insight.Detail = "Your last verification submission was rejected. The rejection reason is on the verification page."
		insight.Actions = []string{"Review the rejection reason and resubmit with corrected documentation"}
	case domain.VerificationExpired:
		insight.Severity = models.InsightWarning
		insight.Title = "Verification has expired"
		insight.Detail = "Your verification is no longer current, so the badge no longer shows on your public page."
		insight.Actions = []string{"Resubmit current business documentation"}
	}

	return []models.CompanyInsight{insight}
}

// funnelInsights analyses the hiring funnel and names the weakest stage.
func funnelInsights(a *models.CompanyAnalytics) []models.CompanyInsight {
	var out []models.CompanyInsight

	if a.JobViews == 0 && a.Applications == 0 {
		return nil
	}

	if a.Applications < insightsMinSample {
		out = append(out, models.CompanyInsight{
			ID:       "funnel.sample",
			Category: "funnel",
			Severity: models.InsightInfo,
			Title:    "Not enough applications to read the funnel yet",
			Detail: fmt.Sprintf(
				"%d application(s) were received in this range. Conversion rates are reported once there are at least %d, so early noise is not mistaken for a trend.",
				a.Applications, insightsMinSample),
			Evidence: []string{
				fmt.Sprintf("Applications: %d", a.Applications),
				fmt.Sprintf("Job views: %d", a.JobViews),
			},
		})
		return out
	}

	// The weakest stage is the one losing the largest share of candidates that
	// reached it.
	stages := []struct {
		name string
		rate float64
		hint string
	}{
		{"view to application", a.ApplicationConversion, "Job posts are being seen but not applied to. Check that salary, location and workplace type are filled in."},
		{"application to interview", a.InterviewRate, "Applications are arriving but few reach interview. Check screening criteria and time to first review."},
		{"interview to offer", a.OfferRate, "Interviews are happening but few become offers. Check that the interview loop matches the role's requirements."},
		{"offer to hire", a.HireRate, "Offers are being made but few are accepted. Compensation and time to decision are the usual causes."},
	}

	weakest := stages[0]
	for _, stage := range stages[1:] {
		if stage.rate > 0 && stage.rate < weakest.rate {
			weakest = stage
		}
	}

	out = append(out, models.CompanyInsight{
		ID:       "funnel.weakest",
		Category: "funnel",
		Severity: models.InsightSuggestion,
		Title:    fmt.Sprintf("Your weakest funnel stage is %s", weakest.name),
		Detail:   weakest.hint,
		Evidence: []string{
			fmt.Sprintf("View to application: %.1f%%", a.ApplicationConversion),
			fmt.Sprintf("Application to interview: %.1f%%", a.InterviewRate),
			fmt.Sprintf("Interview to offer: %.1f%%", a.OfferRate),
			fmt.Sprintf("Offer to hire: %.1f%%", a.HireRate),
		},
		Actions: []string{"Open Dashboard → Analytics and compare this stage across your jobs"},
	})

	return out
}

// trendInsights compares the first and second halves of the series to report
// direction. It needs both halves to be non-empty to say anything.
func trendInsights(a *models.CompanyAnalytics) []models.CompanyInsight {
	if len(a.Series) < 4 {
		return nil
	}

	mid := len(a.Series) / 2
	var firstViews, secondViews, firstApps, secondApps int
	for i, point := range a.Series {
		if i < mid {
			firstViews += point.JobViews
			firstApps += point.Applications
		} else {
			secondViews += point.JobViews
			secondApps += point.Applications
		}
	}

	if firstViews == 0 && firstApps == 0 {
		return nil
	}

	viewChange := percentChange(firstViews, secondViews)
	appChange := percentChange(firstApps, secondApps)

	severity := models.InsightInfo
	title := "Hiring interest is steady"
	detail := "Job views and applications are broadly flat across the two halves of this range."

	switch {
	case appChange <= -25:
		severity = models.InsightWarning
		title = "Applications are falling"
		detail = fmt.Sprintf("Applications fell %.0f%% between the first and second half of this range.", -appChange)
	case appChange >= 25:
		title = "Applications are growing"
		detail = fmt.Sprintf("Applications rose %.0f%% between the first and second half of this range.", appChange)
	case viewChange <= -25:
		severity = models.InsightSuggestion
		title = "Job views are falling"
		detail = fmt.Sprintf("Job views fell %.0f%% between the first and second half of this range, which usually precedes a drop in applications.", -viewChange)
	}

	return []models.CompanyInsight{{
		ID:       "trends.direction",
		Category: "trends",
		Severity: severity,
		Title:    title,
		Detail:   detail,
		Evidence: []string{
			fmt.Sprintf("Job views: %d then %d (%+.0f%%)", firstViews, secondViews, viewChange),
			fmt.Sprintf("Applications: %d then %d (%+.0f%%)", firstApps, secondApps, appChange),
		},
	}}
}

// jobPostingInsights inspects the company's own postings for the fields that
// measurably change how a job performs.
func jobPostingInsights(jobs *models.CompanyJobsPage) []models.CompanyInsight {
	if jobs == nil || len(jobs.Items) == 0 {
		return nil
	}

	var noSalary, noSkills, drafts, expiringSoon int
	var starved []string
	soon := time.Now().UTC().AddDate(0, 0, 7)

	for _, job := range jobs.Items {
		switch job.Status {
		case "draft":
			drafts++
			continue
		case "closed", "expired", "archived":
			continue
		}

		if strings.TrimSpace(job.SalaryRange) == "" {
			noSalary++
		}
		if len(job.Skills) == 0 {
			noSkills++
		}
		if job.ExpiresAt != nil && job.ExpiresAt.Before(soon) {
			expiringSoon++
		}
		// A posting seen a lot and applied to rarely is the clearest signal
		// that the post itself, not the traffic, is the problem.
		if job.ViewsCount >= 50 && job.ApplicationsCount == 0 {
			starved = append(starved, job.Title)
		}
	}

	var out []models.CompanyInsight

	if noSalary > 0 || noSkills > 0 {
		var parts, evidence []string
		if noSalary > 0 {
			parts = append(parts, fmt.Sprintf("%d have no salary range", noSalary))
			evidence = append(evidence, fmt.Sprintf("Open jobs without a salary range: %d", noSalary))
		}
		if noSkills > 0 {
			parts = append(parts, fmt.Sprintf("%d list no skills", noSkills))
			evidence = append(evidence, fmt.Sprintf("Open jobs without skills: %d", noSkills))
		}
		out = append(out, models.CompanyInsight{
			ID:       "jobs.fields",
			Category: "jobs",
			Severity: models.InsightSuggestion,
			Title:    "Some job posts are missing fields candidates filter on",
			Detail: fmt.Sprintf(
				"Of your open jobs, %s. Salary and skills are both filters in job search, so a post missing them is excluded from those searches.",
				strings.Join(parts, " and ")),
			Evidence: evidence,
			Actions:  []string{"Open Dashboard → Jobs and complete the missing fields"},
		})
	}

	if len(starved) > 0 {
		sort.Strings(starved)
		out = append(out, models.CompanyInsight{
			ID:       "jobs.no_applications",
			Category: "jobs",
			Severity: models.InsightWarning,
			Title:    "Some jobs are seen but never applied to",
			Detail: fmt.Sprintf(
				"%d job(s) have 50 or more views and no applications: %s. The traffic is arriving, so the posting itself is where candidates stop.",
				len(starved), strings.Join(starved, ", ")),
			Evidence: []string{fmt.Sprintf("Jobs with 50+ views and 0 applications: %d", len(starved))},
			Actions: []string{
				"Check the requirements list for must-haves that are really nice-to-haves",
				"Add a salary range and workplace type",
			},
		})
	}

	if drafts > 0 {
		out = append(out, models.CompanyInsight{
			ID:       "jobs.drafts",
			Category: "jobs",
			Severity: models.InsightInfo,
			Title:    "You have unpublished drafts",
			Detail:   fmt.Sprintf("%d job(s) are still drafts and are not visible to candidates.", drafts),
			Evidence: []string{fmt.Sprintf("Draft jobs: %d", drafts)},
			Actions:  []string{"Publish or delete the drafts from Dashboard → Jobs"},
		})
	}

	if expiringSoon > 0 {
		out = append(out, models.CompanyInsight{
			ID:       "jobs.expiring",
			Category: "jobs",
			Severity: models.InsightWarning,
			Title:    "Jobs are expiring within a week",
			Detail:   fmt.Sprintf("%d open job(s) expire in the next 7 days and will stop appearing in search.", expiringSoon),
			Evidence: []string{fmt.Sprintf("Jobs expiring within 7 days: %d", expiringSoon)},
			Actions:  []string{"Extend or close the expiring jobs"},
		})
	}

	return out
}

// recruiterInsights reports throughput across the recruiting team. It reports
// totals and spread, not rankings of individuals.
func recruiterInsights(a *models.CompanyAnalytics) []models.CompanyInsight {
	if len(a.RecruiterActivity) == 0 {
		return nil
	}

	var reviewed, interviews, hires, idle int
	for _, r := range a.RecruiterActivity {
		reviewed += r.ApplicationsRead
		interviews += r.Interviews
		hires += r.Hires
		if r.ApplicationsRead == 0 && r.JobsPosted == 0 {
			idle++
		}
	}

	severity := models.InsightInfo
	title := "Recruiting activity for this range"
	detail := fmt.Sprintf(
		"%d recruiter(s) reviewed %d application(s), ran %d interview(s) and closed %d hire(s).",
		len(a.RecruiterActivity), reviewed, interviews, hires)

	if idle > 0 {
		severity = models.InsightSuggestion
		title = "Some recruiters had no recorded activity"
		detail = fmt.Sprintf(
			"%d of %d recruiter(s) posted no jobs and reviewed no applications in this range. Unreviewed applications are the most common cause of candidates going cold.",
			idle, len(a.RecruiterActivity))
	}

	return []models.CompanyInsight{{
		ID:       "recruiters.activity",
		Category: "recruiters",
		Severity: severity,
		Title:    title,
		Detail:   detail,
		Evidence: []string{
			fmt.Sprintf("Recruiters: %d", len(a.RecruiterActivity)),
			fmt.Sprintf("Applications reviewed: %d", reviewed),
			fmt.Sprintf("Interviews: %d", interviews),
			fmt.Sprintf("Hires: %d", hires),
		},
	}}
}

// topJobSkills counts the skills the company's own open jobs ask for, most
// frequent first. Ties break alphabetically so the list is stable between
// requests.
func topJobSkills(jobs *models.CompanyJobsPage, limit int) []string {
	if jobs == nil {
		return []string{}
	}

	counts := map[string]int{}
	for _, job := range jobs.Items {
		switch job.Status {
		case "closed", "expired", "archived", "draft":
			continue
		}
		seen := map[string]bool{}
		for _, skill := range job.Skills {
			normalized := strings.TrimSpace(skill)
			if normalized == "" || seen[strings.ToLower(normalized)] {
				continue
			}
			seen[strings.ToLower(normalized)] = true
			counts[normalized]++
		}
	}

	skills := make([]string, 0, len(counts))
	for skill := range counts {
		skills = append(skills, skill)
	}
	sort.Slice(skills, func(i, j int) bool {
		if counts[skills[i]] != counts[skills[j]] {
			return counts[skills[i]] > counts[skills[j]]
		}
		return skills[i] < skills[j]
	})

	if len(skills) > limit {
		skills = skills[:limit]
	}
	return skills
}

// summarize states the range's headline figures. It asserts nothing that is not
// one of the counts it was given.
func summarize(a *models.CompanyAnalytics, jobs *models.CompanyJobsPage) string {
	open := 0
	if jobs != nil {
		for _, job := range jobs.Items {
			switch job.Status {
			case "closed", "expired", "archived", "draft":
				continue
			}
			open++
		}
	}

	return fmt.Sprintf(
		"Over this range your company page drew %d view(s) from %d unique visitor(s), your %d open job(s) drew %d job view(s), and you received %d application(s). Followers changed by %+d.",
		a.ProfileViews, a.UniqueVisitors, open, a.JobViews, a.Applications, a.FollowerGrowth)
}

// percentChange reports the move from before to after as a percentage. A zero
// baseline has no defined percentage change, so it reports 0 rather than an
// infinity that would render as a nonsense figure.
func percentChange(before, after int) float64 {
	if before == 0 {
		return 0
	}
	return (float64(after-before) / float64(before)) * 100
}
