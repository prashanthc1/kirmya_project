package prompts

import (
	"fmt"
	"strings"

	"kirmya/internal/career_ai/domain"
)

type PromptManager interface {
	BuildCareerTrajectoryPrompt(ctxData domain.UserContext, topic string) (systemPrompt, userPrompt string)
	BuildResumeAnalysisPrompt(resumeText, targetRole string) (systemPrompt, userPrompt string)
	BuildSkillGapPrompt(currentSkills []string, targetRole string) (systemPrompt, userPrompt string)
	BuildInterviewPrepPrompt(targetRole, focusArea string) (systemPrompt, userPrompt string)
}

type defaultPromptManager struct{}

func NewPromptManager() PromptManager {
	return &defaultPromptManager{}
}

func (p *defaultPromptManager) BuildCareerTrajectoryPrompt(ctxData domain.UserContext, topic string) (string, string) {
	systemPrompt := `You are Kirmya's Senior Executive Career Strategist AI. Your mission is to assist job-seekers and professionals recovering from job loss to achieve rapid, high-impact career growth. Provide empathetic, highly actionable, and structured guidance.`

	userPrompt := fmt.Sprintf(
		"User Context:\n- Current Role: %s\n- Target Role: %s\n- Years of Experience: %d\n- Key Skills: %s\n- Topic: %s\n\nGenerate high-priority career transition advice and 3 specific action items.",
		ctxData.CurrentRole, ctxData.TargetRole, ctxData.YearsExp, strings.Join(ctxData.CurrentSkills, ", "), topic,
	)

	return systemPrompt, userPrompt
}

func (p *defaultPromptManager) BuildResumeAnalysisPrompt(resumeText, targetRole string) (string, string) {
	systemPrompt := `You are Kirmya's Expert Technical Recruiter & Resume Critique Specialist AI. Analyze the resume for ATS optimization, high-impact action verbs, metric quantification, and structural clarity.`

	userPrompt := fmt.Sprintf(
		"Target Role: %s\n\nResume Content:\n%s\n\nProvide top resume improvement suggestions and bullet point rewrites.",
		targetRole, resumeText,
	)

	return systemPrompt, userPrompt
}

func (p *defaultPromptManager) BuildSkillGapPrompt(currentSkills []string, targetRole string) (string, string) {
	systemPrompt := `You are Kirmya's Technical Competency Analyst AI. Compare candidate skills against hiring benchmarks for the target role and recommend actionable learning bridges.`

	userPrompt := fmt.Sprintf(
		"Target Role: %s\nCurrent Skills: %s\n\nIdentify top missing domain skills and recommend learning steps.",
		targetRole, strings.Join(currentSkills, ", "),
	)

	return systemPrompt, userPrompt
}

func (p *defaultPromptManager) BuildInterviewPrepPrompt(targetRole, focusArea string) (string, string) {
	systemPrompt := `You are Kirmya's Lead Interview Coach AI. Help candidates master technical, behavioral, and system design interviews using the STAR method.`

	userPrompt := fmt.Sprintf(
		"Target Role: %s\nFocus Area: %s\n\nGenerate realistic mock interview questions, STAR method hints, and technical trade-off points.",
		targetRole, focusArea,
	)

	return systemPrompt, userPrompt
}
