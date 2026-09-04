package ai

import (
	"context"
	"errors"
	"time"
)

var (
	ErrProviderUnavailable = errors.New("ai provider is unavailable")
	ErrRateLimitExceeded   = errors.New("ai rate limit or quota exceeded")
	ErrInvalidPrompt       = errors.New("invalid or malicious prompt detected")
	ErrMalformedResponse   = errors.New("ai provider returned malformed response")
	ErrTimeout             = errors.New("ai request timed out")
	ErrInsufficientData    = errors.New("insufficient profile data for reliable analysis")
)

// Role types for chat messages
type MessageRole string

const (
	RoleSystem    MessageRole = "system"
	RoleUser      MessageRole = "user"
	RoleAssistant MessageRole = "assistant"
)

// ChatMessage represents a single turn in a conversation
type ChatMessage struct {
	Role    MessageRole `json:"role"`
	Content string      `json:"content"`
}

// TextGenerationRequest represents parameters for freeform or chat text generation
type TextGenerationRequest struct {
	SystemPrompt string        `json:"system_prompt"`
	Messages     []ChatMessage `json:"messages"`
	Temperature  float64       `json:"temperature"`
	MaxTokens    int           `json:"max_tokens"`
	StopWords    []string      `json:"stop_words,omitempty"`
	Timeout      time.Duration `json:"timeout,omitempty"`
}

// TokenUsage captures token telemetry
type TokenUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// TextGenerationResponse represents the raw generation output
type TextGenerationResponse struct {
	Content      string     `json:"content"`
	ModelName    string     `json:"model_name"`
	ProviderName string     `json:"provider_name"`
	Usage        TokenUsage `json:"usage"`
	LatencyMs    int64      `json:"latency_ms"`
}

// StructuredGenerationRequest parameters for schema-enforced JSON outputs
type StructuredGenerationRequest struct {
	SystemPrompt string        `json:"system_prompt"`
	Messages     []ChatMessage `json:"messages"`
	SchemaName   string        `json:"schema_name"`
	JSONSchema   string        `json:"json_schema,omitempty"`
	Temperature  float64       `json:"temperature"`
	MaxTokens    int           `json:"max_tokens"`
	Timeout      time.Duration `json:"timeout,omitempty"`
}

// StructuredGenerationResponse represents parsed and validated output
type StructuredGenerationResponse struct {
	RawJSON      string     `json:"raw_json"`
	ModelName    string     `json:"model_name"`
	ProviderName string     `json:"provider_name"`
	Usage        TokenUsage `json:"usage"`
	LatencyMs    int64      `json:"latency_ms"`
}

// ProviderCapabilities describes what an adapter supports
type ProviderCapabilities struct {
	SupportsStreaming  bool     `json:"supports_streaming"`
	SupportsStructured bool     `json:"supports_structured"`
	SupportsTools      bool     `json:"supports_tools"`
	MaxContextWindow   int      `json:"max_context_window"`
	AvailableModels    []string `json:"available_models"`
}

// AIProvider is the canonical interface for all AI interactions in Kirmya
type AIProvider interface {
	GetProviderName() string
	GetCapabilities() ProviderCapabilities
	GenerateText(ctx context.Context, req TextGenerationRequest) (*TextGenerationResponse, error)
	GenerateStructured(ctx context.Context, req StructuredGenerationRequest) (*StructuredGenerationResponse, error)
}
