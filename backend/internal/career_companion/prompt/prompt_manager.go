package prompt

import (
	"fmt"
)

type PromptManager struct{}

func NewPromptManager() *PromptManager {
	return &PromptManager{}
}

func (p *PromptManager) GetSystemPrompt(mode, memorySummary string) string {
	basePrompt := "You are Kirmya AI Career Companion, an empathetic, highly skilled career coach helping professionals recover from job loss and accelerate career growth."

	if memorySummary != "" {
		basePrompt += fmt.Sprintf(" User Career Memory Context: %s", memorySummary)
	}

	switch mode {
	case "interview_coaching":
		return basePrompt + " Mode: INTERVIEW COACHING. Ask simulated technical and behavioral interview questions. Evaluate user answers using the STAR method."
	case "roadmap_gen":
		return basePrompt + " Mode: CAREER ROADMAP GENERATION. Produce actionable, milestone-based career growth steps with timeframes and required technical skills."
	default:
		return basePrompt + " Mode: CAREER CHAT. Help with resume optimization, job search strategies, skill gap analysis, and emotional encouragement."
	}
}
