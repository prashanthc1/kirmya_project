package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// LocalDeterministicProvider executes deterministic heuristics and parsing
type LocalDeterministicProvider struct {
	securityCfg SecurityConfig
}

// NewLocalDeterministicProvider creates a new local rule-based AI provider
func NewLocalDeterministicProvider() *LocalDeterministicProvider {
	return &LocalDeterministicProvider{
		securityCfg: DefaultSecurityConfig(),
	}
}

func (p *LocalDeterministicProvider) GetProviderName() string {
	return "local-deterministic-engine"
}

func (p *LocalDeterministicProvider) GetCapabilities() ProviderCapabilities {
	return ProviderCapabilities{
		SupportsStreaming:  false,
		SupportsStructured: true,
		SupportsTools:      false,
		MaxContextWindow:   32768,
		AvailableModels:    []string{"kirmya-heuristic-v1", "kirmya-ats-scorer-v1"},
	}
}

func (p *LocalDeterministicProvider) GenerateText(ctx context.Context, req TextGenerationRequest) (*TextGenerationResponse, error) {
	start := time.Now()
	var userPrompt string
	for _, m := range req.Messages {
		if m.Role == RoleUser {
			userPrompt = m.Content
			break
		}
	}

	sanitized, _ := SanitizeUntrustedInput(userPrompt, p.securityCfg)
	low := strings.ToLower(sanitized)

	var reply string
	if strings.Contains(low, "star") || strings.Contains(low, "interview") {
		reply = "Based on your response: To strengthen your answer using the STAR method (Situation, Task, Action, Result), ensure you explicitly quantify the final outcome (e.g. 'reduced latency by 35%' or 'delivered project 2 weeks ahead of schedule')."
	} else if strings.Contains(low, "resume") || strings.Contains(low, "ats") {
		reply = "ATS Analysis: Your technical skill keywords are clearly visible. Consider converting passive descriptions into active metrics-driven achievements (e.g. 'Architected distributed event pipelines with Kafka and Go')."
	} else if strings.Contains(low, "roadmap") || strings.Contains(low, "career") {
		reply = "Career Progression Plan: Focus on demonstrating cross-team architectural leadership, mastering high-scale distributed caching (Redis), and completing verified skill assessments on Kirmya."
	} else {
		reply = fmt.Sprintf("Kirmya Career Intelligence: Analyzing request regarding '%s'. Recommended focus: align your verified technical stack with target market requirements and complete active skill assessments.", sanitized)
	}

	latency := time.Since(start).Milliseconds()
	return &TextGenerationResponse{
		Content:      reply,
		ModelName:    "kirmya-heuristic-v1",
		ProviderName: p.GetProviderName(),
		Usage: TokenUsage{
			PromptTokens:     len(userPrompt) / 4,
			CompletionTokens: len(reply) / 4,
			TotalTokens:      (len(userPrompt) + len(reply)) / 4,
		},
		LatencyMs: latency,
	}, nil
}

func (p *LocalDeterministicProvider) GenerateStructured(ctx context.Context, req StructuredGenerationRequest) (*StructuredGenerationResponse, error) {
	start := time.Now()
	var userPrompt string
	for _, m := range req.Messages {
		if m.Role == RoleUser {
			userPrompt = m.Content
			break
		}
	}

	sanitized, _ := SanitizeUntrustedInput(userPrompt, p.securityCfg)
	low := strings.ToLower(sanitized)

	var jsonResult map[string]interface{}

	switch req.SchemaName {
	case "resume_analysis":
		structureScore := 85
		atsScore := 88
		if !strings.Contains(low, "experience") || !strings.Contains(low, "education") {
			structureScore = 65
			atsScore = 70
		}
		jsonResult = map[string]interface{}{
			"score":                   85,
			"grammarScore":            95,
			"concisenessScore":        80,
			"keyStrengths":            []string{"Strong background in backend modular systems", "Familiarity with container orchestrators"},
			"improvements":            []string{"Elaborate on database replication details", "Incorporate metrics on query optimization"},
			"overall_score":           (structureScore + atsScore) / 2,
			"ats_compatibility_score": atsScore,
			"structure_score":         structureScore,
			"skills_score":            90,
			"experience_score":        82,
			"job_match_score":         84,
			"missing_skills":          []string{"Kubernetes", "Redis", "gRPC"},
			"present_keywords":        []string{"GO", "POSTGRESQL", "REST", "TYPESCRIPT", "DOCKER"},
			"missing_keywords":        []string{"KUBERNETES", "REDIS", "GRPC"},
			"keyword_density_score":   80,
			"structure_feedback": []string{
				"Standard section headers (Experience, Education, Skills) are well organized.",
				"Ensure contact email and LinkedIn profile are placed clearly in the header.",
			},
			"experience_bullet_fixes": []string{
				"Replace 'Maintained backend API' with 'Architected high-throughput microservices in Go, reducing P99 latency by 35%'.",
				"Quantify database optimizations with concrete throughput metrics.",
			},
			"general_suggestions": []string{
				"Export resume in single-column PDF format for optimal ATS parsing.",
				"Highlight team leadership and architectural design contributions.",
			},
		}

	case "skill_gap":
		targetRole := "DevOps Engineer"
		if strings.Contains(sanitized, "role ") {
			parts := strings.Split(sanitized, "role ")
			if len(parts) > 1 {
				targetRole = strings.TrimSpace(parts[1])
			}
		} else if strings.Contains(sanitized, "role:") {
			parts := strings.Split(sanitized, "role:")
			if len(parts) > 1 {
				targetRole = strings.TrimSpace(parts[1])
			}
		}
		jsonResult = map[string]interface{}{
			"targetRole":          targetRole,
			"target_role":         targetRole,
			"matchingSkills":      []string{"Go", "SQL", "Git"},
			"matching_skills":     []string{"Go", "PostgreSQL", "REST APIs", "Docker", "Git"},
			"missingSkills":       []string{"Kubernetes", "gRPC", "Redis Cluster"},
			"missing_skills":      []string{"Kubernetes", "Redis Cluster", "Kafka", "gRPC"},
			"transferable_skills": []string{"Database Indexing", "Concurrency Patterns", "System Design"},
			"recommendations":     []string{"Review distributed systems patterns", "Build local project utilizing go-redis"},
			"priority_actions": []string{
				"Complete the Kirmya Distributed Systems and Caching assessment.",
				"Build a sample service demonstrating Kafka event streaming.",
			},
		}

	case "job_match":
		jsonResult = map[string]interface{}{
			"overall_score": 86,
			"match_tier":    "strong_match",
			"explanation":   "Strong alignment between your backend engineering experience and role requirements. Core competencies in Go, SQL, and microservices matched.",
			"matched_skills": []string{"Go", "PostgreSQL", "Docker", "REST"},
			"missing_skills": []string{"Kafka", "Kubernetes"},
			"recommended_actions": []map[string]string{
				{
					"title":       "Master Distributed Event Streaming",
					"description": "Bridge the Kafka skill gap with Kirmya's fast-track learning module.",
				},
			},
		}

	case "interview_prep":
		jsonResult = map[string]interface{}{
			"target_role": "Senior Backend Engineer",
			"focus_area":  "System Design & Concurrency",
			"questions": []map[string]interface{}{
				{
					"id":             "q-1",
					"question":       "How do you design an idempotent payment processing pipeline under high concurrency?",
					"category":       "system_design",
					"expected_focus": "Idempotency keys, distributed locks with Redis, atomic transactions, and retry queues.",
				},
				{
					"id":             "q-2",
					"question":       "Describe a situation where a database deadlock occurred in production and how you fixed it.",
					"category":       "behavioral_technical",
					"expected_focus": "Lock ordering, transaction scope reduction, query execution plan inspection.",
				},
			},
			"coaching_tips": []string{
				"Structure behavioral answers using the STAR method (Situation, Task, Action, Result).",
				"Always articulate architectural trade-offs (e.g. Consistency vs Latency).",
			},
		}

	default:
		jsonResult = map[string]interface{}{
			"status":      "success",
			"summary":     "Deterministic evaluation complete.",
			"action_items": []string{"Review profile details", "Complete skill assessments"},
		}
	}

	bytes, err := json.Marshal(jsonResult)
	if err != nil {
		return nil, ErrMalformedResponse
	}

	latency := time.Since(start).Milliseconds()
	return &StructuredGenerationResponse{
		RawJSON:      string(bytes),
		ModelName:    "kirmya-heuristic-v1",
		ProviderName: p.GetProviderName(),
		Usage: TokenUsage{
			PromptTokens:     len(userPrompt) / 4,
			CompletionTokens: len(bytes) / 4,
			TotalTokens:      (len(userPrompt) + len(bytes)) / 4,
		},
		LatencyMs: latency,
	}, nil
}
