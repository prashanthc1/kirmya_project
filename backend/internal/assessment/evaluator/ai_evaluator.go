package evaluator

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"kirmya/internal/assessment/domain"
)

type AIEvaluationResult struct {
	PracticalScore int    `json:"practical_score"` // 0 to 100
	CritiqueSummary string `json:"critique_summary"`
	Strengths       string `json:"strengths"`
	Improvements    string `json:"improvements"`
}

// AIEvaluator interface provides automated evaluation support for practical code and scenario responses.
type AIEvaluator interface {
	EvaluatePracticalResponse(ctx context.Context, question domain.Question, userResponse string) (*AIEvaluationResult, error)
}

type MockLLMAIEvaluator struct{}

func NewMockLLMAIEvaluator() *MockLLMAIEvaluator {
	return &MockLLMAIEvaluator{}
}

func (e *MockLLMAIEvaluator) EvaluatePracticalResponse(ctx context.Context, question domain.Question, userResponse string) (*AIEvaluationResult, error) {
	slog.Info("Executing AI evaluation on practical response", slog.String("question_id", question.ID.String()))

	trimmed := strings.TrimSpace(userResponse)
	if len(trimmed) == 0 {
		return &AIEvaluationResult{
			PracticalScore: 0,
			CritiqueSummary: "No response was provided for the practical scenario.",
			Strengths:       "None",
			Improvements:    "Attempting all practical code scenarios is recommended.",
		}, nil
	}

	// Score calculation heuristic based on response completeness, keyword density, and length
	lengthScore := len(trimmed) / 4
	if lengthScore > 60 {
		lengthScore = 60
	}

	keywordBonus := 25
	lower := strings.ToLower(trimmed)
	if strings.Contains(lower, "function") || strings.Contains(lower, "select") || strings.Contains(lower, "api") || strings.Contains(lower, "index") || strings.Contains(lower, "cache") {
		keywordBonus += 15
	}

	finalScore := lengthScore + keywordBonus
	if finalScore > 98 {
		finalScore = 98
	} else if finalScore < 40 {
		finalScore = 45
	}

	return &AIEvaluationResult{
		PracticalScore: finalScore,
		CritiqueSummary: fmt.Sprintf("AI Evaluation Score: %d%%. Demonstrated clear understanding of practical architectural principles, proper error handling consideration, and modular design.", finalScore),
		Strengths:       "Solid structure, logical parameter naming, and appropriate error boundary handling.",
		Improvements:    "Could enhance concurrency safety edge cases and add explicit retry configuration.",
	}, nil
}
