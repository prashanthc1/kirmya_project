package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"kirmya/internal/interview_prep/models"
	"kirmya/internal/interview_prep/repository"
)

type InterviewPrepService struct {
	repo repository.Repository
}

func NewInterviewPrepService(repo repository.Repository) *InterviewPrepService {
	return &InterviewPrepService{repo: repo}
}

// ----------------- Preparations -----------------

func (s *InterviewPrepService) CreatePreparation(ctx context.Context, userID uuid.UUID, req models.CreatePreparationRequest) (*models.InterviewPreparation, error) {
	now := time.Now()
	prep := &models.InterviewPreparation{
		ID:                  uuid.New(),
		UserID:              userID,
		JobID:               req.JobID,
		ApplicationID:       req.ApplicationID,
		CompanyName:         req.CompanyName,
		JobTitle:            req.JobTitle,
		JobDescription:      req.JobDescription,
		InterviewDate:       req.InterviewDate,
		InterviewType:       req.InterviewType,
		InterviewRound:      req.InterviewRound,
		ExperienceLevel:     req.ExperienceLevel,
		PreparationDuration: req.PreparationDuration,
		Status:              "In Progress",
		ReadinessScore:      60, // initial baseline readiness
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	if prep.InterviewType == "" {
		prep.InterviewType = "Behavioral"
	}
	if prep.InterviewRound == "" {
		prep.InterviewRound = "Recruiter Round"
	}
	if prep.ExperienceLevel == "" {
		prep.ExperienceLevel = "Mid-Level"
	}
	if prep.PreparationDuration == "" {
		prep.PreparationDuration = "7 Days"
	}

	if err := s.repo.CreatePreparation(ctx, prep); err != nil {
		return nil, err
	}

	// Auto-seed baseline tasks for new workspace
	tasks := []string{
		fmt.Sprintf("Research %s company culture, vision, and recent news", prep.CompanyName),
		fmt.Sprintf("Review job requirements for %s role", prep.JobTitle),
		"Prepare 3 STAR stories demonstrating problem-solving & leadership",
		"Practice 5 core behavioral questions in AI Mock Interview",
		"Prepare 3 thoughtful questions to ask the interviewer",
	}

	for _, taskTitle := range tasks {
		dueDate := now.Add(48 * time.Hour)
		_ = s.repo.CreateTask(ctx, &models.PreparationTask{
			ID:            uuid.New(),
			PreparationID: prep.ID,
			Title:         taskTitle,
			Category:      "Research",
			DueDate:       &dueDate,
			IsCompleted:   false,
			CreatedAt:     now,
		})
	}

	// Seed 3 starter questions
	s.seedStarterQuestions(ctx, prep)

	return prep, nil
}

func (s *InterviewPrepService) seedStarterQuestions(ctx context.Context, prep *models.InterviewPreparation) {
	now := time.Now()
	starters := []struct {
		Q, Cat, Diff, Situation, Task, Action, Result string
	}{
		{
			Q:          fmt.Sprintf("Tell me about yourself and why you're interested in the %s position at %s.", prep.JobTitle, prep.CompanyName),
			Cat:        "General",
			Diff:       "Beginner",
			Situation:  fmt.Sprintf("I have built a strong career background aligned with %s.", prep.JobTitle),
			Task:       "Targeting a role where I can drive high impact.",
			Action:     fmt.Sprintf("Researched %s's mission and engineering/business goals.", prep.CompanyName),
			Result:     "Ready to bring proven skills to deliver immediate results.",
		},
		{
			Q:          "Describe a challenging situation at work and how you overcame it.",
			Cat:        "Behavioral",
			Diff:       "Intermediate",
			Situation:  "Facing tight deadlines with incomplete project specs.",
			Task:       "Deliver a robust solution without delaying launch.",
			Action:     "Aligned key stakeholders, clarified trade-offs, and broke execution into iterative sprints.",
			Result:     "Delivered on schedule with 99.9% uptime and positive feedback.",
		},
		{
			Q:          "How do you prioritize competing deadlines under pressure?",
			Cat:        "Situational",
			Diff:       "Intermediate",
			Situation:  "Multiple high-priority tasks requiring urgent resolution.",
			Task:       "Ensure business continuity and high quality across deliverables.",
			Action:     "Categorized tasks by business impact and urgency using an Eisenhower matrix.",
			Result:     "Completed critical roadmap milestones without burnout or technical debt.",
		},
	}

	for _, sq := range starters {
		_ = s.repo.SaveQuestion(ctx, &models.InterviewQuestion{
			ID:            uuid.New(),
			PreparationID: &prep.ID,
			UserID:        prep.UserID,
			Question:      sq.Q,
			Category:      sq.Cat,
			Difficulty:    sq.Diff,
			SampleAnswer:  fmt.Sprintf("In my experience, when faced with %s, I focused on %s and delivered %s.", sq.Situation, sq.Action, sq.Result),
			IsPracticed:   false,
			IsSaved:       true,
			STARSituation: sq.Situation,
			STARTask:      sq.Task,
			STARAction:    sq.Action,
			STARResult:    sq.Result,
			CreatedAt:     now,
		})
	}
}

func (s *InterviewPrepService) GetPreparation(ctx context.Context, id uuid.UUID) (*models.InterviewPreparation, error) {
	return s.repo.GetPreparation(ctx, id)
}

func (s *InterviewPrepService) ListPreparations(ctx context.Context, userID uuid.UUID) ([]models.InterviewPreparation, error) {
	return s.repo.ListPreparations(ctx, userID)
}

func (s *InterviewPrepService) UpdatePreparation(ctx context.Context, id uuid.UUID, userID uuid.UUID, req models.UpdatePreparationRequest) (*models.InterviewPreparation, error) {
	prep, err := s.repo.GetPreparation(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.CompanyName != "" {
		prep.CompanyName = req.CompanyName
	}
	if req.JobTitle != "" {
		prep.JobTitle = req.JobTitle
	}
	if req.JobDescription != "" {
		prep.JobDescription = req.JobDescription
	}
	if req.InterviewDate != nil {
		prep.InterviewDate = req.InterviewDate
	}
	if req.InterviewType != "" {
		prep.InterviewType = req.InterviewType
	}
	if req.InterviewRound != "" {
		prep.InterviewRound = req.InterviewRound
	}
	if req.ExperienceLevel != "" {
		prep.ExperienceLevel = req.ExperienceLevel
	}
	if req.PreparationDuration != "" {
		prep.PreparationDuration = req.PreparationDuration
	}
	if req.Status != "" {
		prep.Status = req.Status
	}

	if err := s.repo.UpdatePreparation(ctx, prep); err != nil {
		return nil, err
	}
	return prep, nil
}

func (s *InterviewPrepService) DeletePreparation(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeletePreparation(ctx, id)
}

// ----------------- Questions & AI Generation -----------------

func (s *InterviewPrepService) GenerateQuestions(ctx context.Context, userID uuid.UUID, req models.GenerateQuestionsRequest) ([]models.InterviewQuestion, error) {
	jobTitle := req.JobTitle
	if jobTitle == "" {
		jobTitle = "Software Engineer"
	}
	company := req.CompanyName
	if company == "" {
		company = "Target Company"
	}
	count := req.Count
	if count <= 0 {
		count = 5
	}
	category := req.Category
	if category == "" {
		category = "Behavioral"
	}
	difficulty := req.Difficulty
	if difficulty == "" {
		difficulty = "Intermediate"
	}

	now := time.Now()
	var generated []models.InterviewQuestion

	templates := []struct {
		QStr string
		Cat  string
		Diff string
		Sit  string
		Tsk  string
		Act  string
		Res  string
	}{
		{
			QStr: fmt.Sprintf("Tell me about a time you solved a complex technical or operational challenge relevant to %s at %s.", jobTitle, company),
			Cat:  "Technical", Diff: difficulty,
			Sit:  fmt.Sprintf("While working on a scalable system for %s.", jobTitle),
			Tsk:  "Eliminate bottleneck and optimize system throughput.",
			Act:  "Analyzed execution metrics, refactored core loops, and added caching.",
			Res:  "Reduced latency by 45% and improved user satisfaction.",
		},
		{
			QStr: "Describe a situation where you had a disagreement with a team member or leader. How did you resolve it?",
			Cat:  "Behavioral", Diff: difficulty,
			Sit:  "Differing technical architectural opinions on project structure.",
			Tsk:  "Reach consensus without delaying sprint milestones.",
			Act:  "Organized a data-driven review session comparing benchmarks and maintainability.",
			Res:  "Agreed on a hybrid approach, maintaining team harmony and code quality.",
		},
		{
			QStr: fmt.Sprintf("How do you ensure high quality and standard compliance when delivering under tight deadlines for %s?", jobTitle),
			Cat:  "Situational", Diff: difficulty,
			Sit:  "High-visibility launch deadline approaching rapidly.",
			Tsk:  "Maintain strict quality assurance without missing the ship date.",
			Act:  "Implemented automated CI/CD pipelines, focused testing on critical user paths, and conducted pair code reviews.",
			Res:  "Shipped feature zero critical bugs on release day.",
		},
		{
			QStr: fmt.Sprintf("Give an example of how you mentor junior team members or foster technical growth in your team for %s.", jobTitle),
			Cat:  "Leadership", Diff: difficulty,
			Sit:  "New team members joining during rapid team scaling.",
			Tsk:  "Accelerate onboarding and knowledge transfer.",
			Act:  "Created comprehensive documentation, pair programming schedules, and weekly 1-on-1 feedback sessions.",
			Res:  "Reduced onboarding ramp-up time from 4 weeks to 10 days.",
		},
		{
			QStr: fmt.Sprintf("Why do you specifically want to work as a %s at %s, and how does your career vision align with our goals?", jobTitle, company),
			Cat:  "Culture Fit", Diff: difficulty,
			Sit:  fmt.Sprintf("Following %s's innovation and industry impact.", company),
			Tsk:  "Align personal professional trajectory with company values.",
			Act:  "Studied company engineering blogs and core principles.",
			Res:  "Eager to contribute immediately to core initiatives.",
		},
	}

	for i := 0; i < count; i++ {
		t := templates[i%len(templates)]
		q := models.InterviewQuestion{
			ID:            uuid.New(),
			PreparationID: req.PreparationID,
			UserID:        userID,
			Question:      t.QStr,
			Category:      t.Cat,
			Difficulty:    t.Diff,
			SampleAnswer:  fmt.Sprintf("Situation: %s\nTask: %s\nAction: %s\nResult: %s", t.Sit, t.Tsk, t.Act, t.Res),
			UserAnswer:    "",
			Notes:         "",
			IsPracticed:   false,
			IsSaved:       true,
			STARSituation: t.Sit,
			STARTask:      t.Tsk,
			STARAction:    t.Act,
			STARResult:    t.Res,
			CreatedAt:     now,
		}
		if err := s.repo.SaveQuestion(ctx, &q); err == nil {
			generated = append(generated, q)
		}
	}

	return generated, nil
}

func (s *InterviewPrepService) SaveQuestion(ctx context.Context, userID uuid.UUID, req models.SaveQuestionRequest) (*models.InterviewQuestion, error) {
	now := time.Now()
	q := &models.InterviewQuestion{
		ID:            uuid.New(),
		PreparationID: req.PreparationID,
		UserID:        userID,
		Question:      req.Question,
		Category:      req.Category,
		Difficulty:    req.Difficulty,
		SampleAnswer:  req.SampleAnswer,
		UserAnswer:    req.UserAnswer,
		Notes:         req.Notes,
		IsPracticed:   req.UserAnswer != "",
		IsSaved:       true,
		STARSituation: req.STARSituation,
		STARTask:      req.STARTask,
		STARAction:    req.STARAction,
		STARResult:    req.STARResult,
		CreatedAt:     now,
	}
	if q.Category == "" {
		q.Category = "General"
	}
	if q.Difficulty == "" {
		q.Difficulty = "Intermediate"
	}

	if err := s.repo.SaveQuestion(ctx, q); err != nil {
		return nil, err
	}
	return q, nil
}

func (s *InterviewPrepService) GetQuestion(ctx context.Context, id uuid.UUID) (*models.InterviewQuestion, error) {
	return s.repo.GetQuestion(ctx, id)
}

func (s *InterviewPrepService) ListQuestions(ctx context.Context, userID uuid.UUID, prepID *uuid.UUID) ([]models.InterviewQuestion, error) {
	return s.repo.ListQuestions(ctx, userID, prepID)
}

func (s *InterviewPrepService) UpdateQuestionPractice(ctx context.Context, id uuid.UUID, req models.UpdateQuestionPracticeRequest) (*models.InterviewQuestion, error) {
	q, err := s.repo.GetQuestion(ctx, id)
	if err != nil {
		return nil, err
	}

	q.UserAnswer = req.UserAnswer
	q.Notes = req.Notes
	q.STARSituation = req.STARSituation
	q.STARTask = req.STARTask
	q.STARAction = req.STARAction
	q.STARResult = req.STARResult
	q.IsPracticed = req.IsPracticed || req.UserAnswer != ""

	if err := s.repo.UpdateQuestion(ctx, q); err != nil {
		return nil, err
	}
	return q, nil
}

func (s *InterviewPrepService) DeleteQuestion(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteQuestion(ctx, id)
}

// ----------------- AI Mock Interview Engine -----------------

func (s *InterviewPrepService) StartMockSession(ctx context.Context, userID uuid.UUID, req models.StartMockSessionRequest) (*models.MockInterviewSession, error) {
	title := req.Title
	if title == "" {
		title = "AI Mock Interview Practice"
	}
	totalQ := req.TotalQuestions
	if totalQ <= 0 {
		totalQ = 5
	}
	itype := req.InterviewType
	if itype == "" {
		itype = "Behavioral"
	}
	diff := req.Difficulty
	if diff == "" {
		diff = "Intermediate"
	}

	session := &models.MockInterviewSession{
		ID:                 uuid.New(),
		UserID:             userID,
		PreparationID:      req.PreparationID,
		Title:              title,
		InterviewType:      itype,
		Difficulty:         diff,
		TotalQuestions:     totalQ,
		CompletedQuestions: 0,
		OverallScore:       0,
		RelevanceScore:     0,
		ClarityScore:       0,
		ConfidenceScore:    0,
		TechnicalScore:     0,
		CommunicationScore: 0,
		StructureScore:     0,
		Status:             "Active",
		StartedAt:          time.Now(),
	}

	if err := s.repo.CreateMockSession(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *InterviewPrepService) GetMockSession(ctx context.Context, id uuid.UUID) (*models.MockInterviewSession, error) {
	return s.repo.GetMockSession(ctx, id)
}

func (s *InterviewPrepService) ListMockSessions(ctx context.Context, userID uuid.UUID) ([]models.MockInterviewSession, error) {
	return s.repo.ListMockSessions(ctx, userID)
}

func (s *InterviewPrepService) SubmitMockAnswer(ctx context.Context, sessionID uuid.UUID, req models.SubmitMockAnswerRequest) (*models.MockInterviewAnswer, error) {
	session, err := s.repo.GetMockSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	answerText := strings.TrimSpace(req.CandidateAnswer)
	if answerText == "" && req.AudioTranscript != "" {
		answerText = strings.TrimSpace(req.AudioTranscript)
	}

	// Dynamic AI evaluation of the answer text
	rel, clar, conf, tech, comm, structSc, overall, wentWell, improve, suggested, hasS, hasT, hasA, hasR := s.evaluateAnswerText(req.QuestionText, answerText)

	answer := &models.MockInterviewAnswer{
		ID:                 uuid.New(),
		SessionID:          sessionID,
		QuestionText:       req.QuestionText,
		CandidateAnswer:    req.CandidateAnswer,
		AudioTranscript:    req.AudioTranscript,
		OverallScore:       overall,
		RelevanceScore:     rel,
		ClarityScore:       clar,
		ConfidenceScore:    conf,
		TechnicalScore:     tech,
		CommunicationScore: comm,
		StructureScore:     structSc,
		WhatWentWell:       wentWell,
		WhatCouldImprove:   improve,
		SuggestedAnswer:    suggested,
		HasSTARSituation:   hasS,
		HasSTARTask:        hasT,
		HasSTARAction:      hasA,
		HasSTARResult:      hasR,
		CreatedAt:          time.Now(),
	}

	if err := s.repo.AddMockAnswer(ctx, answer); err != nil {
		return nil, err
	}

	// Update session aggregate metrics
	session.CompletedQuestions++
	answers, _ := s.repo.ListMockAnswers(ctx, sessionID)
	if len(answers) > 0 {
		var sumOver, sumRel, sumClar, sumConf, sumTech, sumComm, sumStruct int
		for _, a := range answers {
			sumOver += a.OverallScore
			sumRel += a.RelevanceScore
			sumClar += a.ClarityScore
			sumConf += a.ConfidenceScore
			sumTech += a.TechnicalScore
			sumComm += a.CommunicationScore
			sumStruct += a.StructureScore
		}
		cnt := len(answers)
		session.OverallScore = sumOver / cnt
		session.RelevanceScore = sumRel / cnt
		session.ClarityScore = sumClar / cnt
		session.ConfidenceScore = sumConf / cnt
		session.TechnicalScore = sumTech / cnt
		session.CommunicationScore = sumComm / cnt
		session.StructureScore = sumStruct / cnt
	}

	if session.CompletedQuestions >= session.TotalQuestions {
		session.Status = "Completed"
		now := time.Now()
		session.CompletedAt = &now
	}

	_ = s.repo.UpdateMockSession(ctx, session)

	// Update user readiness score
	_ = s.recalculateReadinessScore(ctx, session.UserID)

	return answer, nil
}

func (s *InterviewPrepService) CompleteMockSession(ctx context.Context, sessionID uuid.UUID) (*models.MockInterviewSession, error) {
	session, err := s.repo.GetMockSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	session.Status = "Completed"
	now := time.Now()
	session.CompletedAt = &now

	if err := s.repo.UpdateMockSession(ctx, session); err != nil {
		return nil, err
	}

	_ = s.recalculateReadinessScore(ctx, session.UserID)
	return session, nil
}

func (s *InterviewPrepService) evaluateAnswerText(question, answer string) (rel, clar, conf, tech, comm, structSc, overall int, wentWell, improve, suggested string, hasS, hasT, hasA, hasR bool) {
	words := strings.Fields(strings.ToLower(answer))
	wordCount := len(words)

	// STAR Detection heuristics
	lower := strings.ToLower(answer)
	hasS = strings.Contains(lower, "situation") || strings.Contains(lower, "when") || strings.Contains(lower, "at my previous") || strings.Contains(lower, "project")
	hasT = strings.Contains(lower, "task") || strings.Contains(lower, "goal") || strings.Contains(lower, "objective") || strings.Contains(lower, "needed to") || strings.Contains(lower, "responsible for")
	hasA = strings.Contains(lower, "action") || strings.Contains(lower, "i implemented") || strings.Contains(lower, "i created") || strings.Contains(lower, "i designed") || strings.Contains(lower, "i led") || strings.Contains(lower, "i analyzed")
	hasR = strings.Contains(lower, "result") || strings.Contains(lower, "outcome") || strings.Contains(lower, "increased") || strings.Contains(lower, "reduced") || strings.Contains(lower, "improved") || strings.Contains(lower, "%") || strings.Contains(lower, "achieved")

	// Base Scoring based on length & depth
	rel = 75
	clar = 80
	conf = 78
	tech = 75
	comm = 80
	structSc = 60

	if wordCount > 30 {
		rel += 5
		clar += 5
		tech += 5
	}
	if wordCount > 80 {
		rel += 5
		conf += 7
		tech += 5
	}
	if wordCount < 15 {
		rel -= 20
		clar -= 15
		conf -= 15
		tech -= 20
		comm -= 15
	}

	// STAR structure boost
	starCount := 0
	if hasS { starCount++ }
	if hasT { starCount++ }
	if hasA { starCount++ }
	if hasR { starCount++ }
	structSc += starCount * 9

	// Cap at 100
	if rel > 98 { rel = 98 }
	if clar > 98 { clar = 98 }
	if conf > 98 { conf = 98 }
	if tech > 98 { tech = 98 }
	if comm > 98 { comm = 98 }
	if structSc > 98 { structSc = 98 }

	overall = (rel + clar + conf + tech + comm + structSc) / 6

	// Feedback text generation
	if starCount >= 3 {
		wentWell = "Excellent structure using the STAR method! Clear articulation of specific actions taken and measurable outcomes achieved."
	} else if wordCount > 40 {
		wentWell = "Good detail and relevant technical context. Smooth delivery."
	} else {
		wentWell = "Prompt response provided."
	}

	if starCount < 3 {
		improve = "Enhance response by explicitly structuring into Situation, Task, Action, and Result. Make sure to highlight quantifiable metrics in your Result section."
	} else if wordCount < 50 {
		improve = "Consider adding slightly more technical depth regarding architectural trade-offs or team collaboration specifics."
	} else {
		improve = "Keep maintaining this structured cadence during live recruiter rounds!"
	}

	suggested = fmt.Sprintf("In response to '%s', a top-tier answer starts by describing the business context (Situation/Task), detail your direct contribution (Action using strong verbs like 'designed', 'optimized', 'led'), and conclude with quantitative metrics (Result e.g., 'reduced latency by 35%%').", question)

	return
}

// ----------------- Tasks -----------------

func (s *InterviewPrepService) CreateTask(ctx context.Context, prepID uuid.UUID, req models.CreateTaskRequest) (*models.PreparationTask, error) {
	task := &models.PreparationTask{
		ID:            uuid.New(),
		PreparationID: prepID,
		Title:         req.Title,
		Category:      req.Category,
		DueDate:       req.DueDate,
		IsCompleted:   false,
		CreatedAt:     time.Now(),
	}
	if task.Category == "" {
		task.Category = "General"
	}

	if err := s.repo.CreateTask(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *InterviewPrepService) ListTasks(ctx context.Context, prepID uuid.UUID) ([]models.PreparationTask, error) {
	return s.repo.ListTasks(ctx, prepID)
}

func (s *InterviewPrepService) ToggleTaskCompletion(ctx context.Context, id uuid.UUID, isCompleted bool) error {
	return s.repo.ToggleTaskCompletion(ctx, id, isCompleted)
}

func (s *InterviewPrepService) DeleteTask(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteTask(ctx, id)
}

// ----------------- Notes & Debrief -----------------

func (s *InterviewPrepService) SaveNote(ctx context.Context, userID uuid.UUID, req models.SaveInterviewNoteRequest) (*models.InterviewNote, error) {
	prep, err := s.repo.GetPreparation(ctx, req.PreparationID)
	if err != nil {
		return nil, err
	}

	thankYouDraft := ""
	if req.GenerateThankYou {
		thankYouDraft = s.generateThankYouEmail(prep.CompanyName, prep.JobTitle, req.Interviewers, req.TopicsDiscussed)
	}

	note := &models.InterviewNote{
		ID:                   uuid.New(),
		PreparationID:        req.PreparationID,
		UserID:               userID,
		Interviewers:         req.Interviewers,
		TopicsDiscussed:      req.TopicsDiscussed,
		QuestionsAsked:       req.QuestionsAsked,
		CandidatePerformance: req.CandidatePerformance,
		PersonalNotes:        req.PersonalNotes,
		OverallFeeling:       req.OverallFeeling,
		PotentialStrengths:   req.PotentialStrengths,
		PotentialWeaknesses:  req.PotentialWeaknesses,
		FollowUpSuggestions:  req.FollowUpSuggestions,
		ThankYouDraft:        thankYouDraft,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	if err := s.repo.SaveNote(ctx, note); err != nil {
		return nil, err
	}
	return note, nil
}

func (s *InterviewPrepService) generateThankYouEmail(company, jobTitle, interviewers, topics string) string {
	interviewerName := interviewers
	if interviewerName == "" {
		interviewerName = "Interviewer"
	}
	topicMention := topics
	if topicMention == "" {
		topicMention = "our conversation about technical architecture and team growth"
	}

	return fmt.Sprintf(`Subject: Thank You - %s Interview for %s Role

Dear %s,

Thank you so much for taking the time to speak with me today about the %s position at %s. I thoroughly enjoyed learning more about the team's ongoing initiatives and %s.

Our discussion reinforced my enthusiasm for joining %s. I am confident that my background aligns well with your team's goals and that I can make immediate contributions.

Please let me know if you need any additional information or references from my end. I look forward to hearing about next steps.

Best regards,
Candidate`, jobTitle, company, interviewerName, jobTitle, company, topicMention, company)
}

func (s *InterviewPrepService) GetNote(ctx context.Context, prepID uuid.UUID) (*models.InterviewNote, error) {
	return s.repo.GetNote(ctx, prepID)
}

// ----------------- Readiness Scores -----------------

func (s *InterviewPrepService) GetReadinessScore(ctx context.Context, userID uuid.UUID) (*models.InterviewReadinessScore, error) {
	return s.repo.GetReadinessScore(ctx, userID)
}

func (s *InterviewPrepService) recalculateReadinessScore(ctx context.Context, userID uuid.UUID) error {
	sessions, _ := s.repo.ListMockSessions(ctx, userID)
	questions, _ := s.repo.ListQuestions(ctx, userID, nil)

	mockCount := len(sessions)
	practicedQCount := 0
	for _, q := range questions {
		if q.IsPracticed {
			practicedQCount++
		}
	}

	overall := 70 + (mockCount * 3) + (practicedQCount * 2)
	tech := 75 + (practicedQCount * 2)
	behav := 70 + (mockCount * 4)
	comm := 80 + (mockCount * 2)
	roleFit := 75 + (mockCount * 2)
	companyKnow := 70 + (practicedQCount * 3)

	if len(sessions) > 0 {
		var avgScore int
		for _, s := range sessions {
			avgScore += s.OverallScore
		}
		avgScore /= len(sessions)
		overall = (overall + avgScore) / 2
	}

	if overall > 98 { overall = 98 }
	if tech > 98 { tech = 98 }
	if behav > 98 { behav = 98 }
	if comm > 98 { comm = 98 }
	if roleFit > 98 { roleFit = 98 }
	if companyKnow > 98 { companyKnow = 98 }

	score := &models.InterviewReadinessScore{
		UserID:                   userID,
		OverallReadiness:         overall,
		TechnicalReadiness:       tech,
		BehavioralReadiness:      behav,
		CommunicationReadiness:   comm,
		RoleFitReadiness:         roleFit,
		CompanyKnowledgeReadiness: companyKnow,
		TotalMockSessions:        mockCount,
		TotalQuestionsPracticed:  practicedQCount,
		UpdatedAt:                time.Now(),
	}

	return s.repo.SaveReadinessScore(ctx, score)
}

// ----------------- AI Coach -----------------

func (s *InterviewPrepService) AICoachChat(ctx context.Context, userID uuid.UUID, req models.AICoachChatRequest) (*models.AICoachSession, error) {
	now := time.Now()
	var session *models.AICoachSession

	if req.SessionID != nil {
		existing, err := s.repo.GetAICoachSession(ctx, *req.SessionID)
		if err == nil {
			session = existing
		}
	}

	if session == nil {
		topic := req.Topic
		if topic == "" {
			topic = "General Interview Coaching"
		}
		session = &models.AICoachSession{
			ID:        uuid.New(),
			UserID:    userID,
			Topic:     topic,
			Messages:  []models.AICoachMessage{},
			CreatedAt: now,
			UpdatedAt: now,
		}
	}

	// Append User Message
	userMsg := models.AICoachMessage{
		Sender:    "user",
		Content:   req.Message,
		Timestamp: now,
	}
	session.Messages = append(session.Messages, userMsg)

	// AI Response Generation Logic
	aiResponseContent := s.generateAICoachResponse(req.Message, session.Topic)

	aiMsg := models.AICoachMessage{
		Sender:    "ai",
		Content:   aiResponseContent,
		Timestamp: time.Now(),
	}
	session.Messages = append(session.Messages, aiMsg)

	if err := s.repo.SaveAICoachSession(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

func (s *InterviewPrepService) generateAICoachResponse(userQuery, topic string) string {
	q := strings.ToLower(userQuery)
	if strings.Contains(q, "salary") || strings.Contains(q, "negotiat") {
		return "When negotiating salary, wait until you receive a formal offer before anchoring numbers. Express enthusiasm for the team first, then request a 24-48 hour window to evaluate total compensation (base salary, equity, bonus, remote benefits). Always back target numbers with market benchmarks and your unique track record!"
	}
	if strings.Contains(q, "nervous") || strings.Contains(q, "anxious") || strings.Contains(q, "stress") {
		return "Interview nerves are completely normal! Take 3 deep tactical breaths before answering any complex prompt. Remember to pause for 2-3 seconds after an interviewer asks a question to structure your thoughts—interviewers value thoughtful composure over immediate continuous speaking."
	}
	if strings.Contains(q, "star") || strings.Contains(q, "behavioral") {
		return "The STAR method is your best weapon! Allocate your response time: 15% Situation, 15% Task, 50% Action (focus on your personal contribution with strong verbs), and 20% Result (metrics, lessons learned, and team impact)."
	}
	if strings.Contains(q, "question") && (strings.Contains(q, "ask") || strings.Contains(q, "interviewer")) {
		return "Great strategic questions to ask at the end of an interview: 1) 'What does success look like in the first 90 days for this role?' 2) 'What are the biggest technical or team growth challenges currently facing the team?' 3) 'How does the engineering/product team balance speed with code quality?'"
	}

	return fmt.Sprintf("Regarding '%s': Focus on clarity, structured communication, and highlighting your direct impact. Make sure to ground your answers in specific past projects and quantify outcomes whenever possible. What specific aspect of your preparation would you like to refine next?", userQuery)
}
