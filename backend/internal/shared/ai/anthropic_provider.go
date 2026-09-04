package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type AnthropicConfig struct {
	APIKey  string
	Model   string
	Timeout time.Duration
}

type AnthropicProvider struct {
	cfg      AnthropicConfig
	client   *http.Client
	fallback AIProvider
}

func NewAnthropicProvider(cfg AnthropicConfig, fallback AIProvider) *AnthropicProvider {
	if cfg.Model == "" {
		cfg.Model = "claude-3-5-sonnet-20241022"
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 30 * time.Second
	}
	return &AnthropicProvider{
		cfg: cfg,
		client: &http.Client{
			Timeout: cfg.Timeout,
		},
		fallback: fallback,
	}
}

func (p *AnthropicProvider) GetProviderName() string {
	return "anthropic-claude-provider"
}

func (p *AnthropicProvider) GetCapabilities() ProviderCapabilities {
	return ProviderCapabilities{
		SupportsStreaming:  true,
		SupportsStructured: true,
		SupportsTools:      true,
		MaxContextWindow:   200000,
		AvailableModels:    []string{p.cfg.Model, "claude-3-haiku-20240307"},
	}
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicRequest struct {
	Model       string             `json:"model"`
	System      string             `json:"system,omitempty"`
	Messages    []anthropicMessage `json:"messages"`
	MaxTokens   int                `json:"max_tokens"`
	Temperature float64            `json:"temperature,omitempty"`
}

type anthropicResponse struct {
	Content []struct {
		Text string `json:"text"`
		Type string `json:"type"`
	} `json:"content"`
	Usage struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

func (p *AnthropicProvider) GenerateText(ctx context.Context, req TextGenerationRequest) (*TextGenerationResponse, error) {
	if p.cfg.APIKey == "" {
		if p.fallback != nil {
			return p.fallback.GenerateText(ctx, req)
		}
		return nil, ErrProviderUnavailable
	}

	start := time.Now()
	maxTokens := req.MaxTokens
	if maxTokens <= 0 {
		maxTokens = 2048
	}

	var msgs []anthropicMessage
	for _, m := range req.Messages {
		role := "user"
		if m.Role == RoleAssistant {
			role = "assistant"
		}
		msgs = append(msgs, anthropicMessage{
			Role:    role,
			Content: m.Content,
		})
	}

	system := req.SystemPrompt
	if system != "" {
		system += "\n\n" + GroundingInstruction()
	} else {
		system = GroundingInstruction()
	}

	bodyPayload := anthropicRequest{
		Model:       p.cfg.Model,
		System:      system,
		Messages:    msgs,
		MaxTokens:   maxTokens,
		Temperature: req.Temperature,
	}

	bodyBytes, err := json.Marshal(bodyPayload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-api-key", p.cfg.APIKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")

	resp, err := p.client.Do(httpReq)
	if err != nil {
		if p.fallback != nil {
			return p.fallback.GenerateText(ctx, req)
		}
		return nil, fmt.Errorf("%w: %v", ErrProviderUnavailable, err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		if p.fallback != nil {
			return p.fallback.GenerateText(ctx, req)
		}
		return nil, fmt.Errorf("anthropic error status %d: %s", resp.StatusCode, string(respBytes))
	}

	var parsed anthropicResponse
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return nil, ErrMalformedResponse
	}
	if len(parsed.Content) == 0 {
		return nil, ErrMalformedResponse
	}

	return &TextGenerationResponse{
		Content:      parsed.Content[0].Text,
		ModelName:    p.cfg.Model,
		ProviderName: p.GetProviderName(),
		Usage: TokenUsage{
			PromptTokens:     parsed.Usage.InputTokens,
			CompletionTokens: parsed.Usage.OutputTokens,
			TotalTokens:      parsed.Usage.InputTokens + parsed.Usage.OutputTokens,
		},
		LatencyMs: time.Since(start).Milliseconds(),
	}, nil
}

func (p *AnthropicProvider) GenerateStructured(ctx context.Context, req StructuredGenerationRequest) (*StructuredGenerationResponse, error) {
	if p.cfg.APIKey == "" {
		if p.fallback != nil {
			return p.fallback.GenerateStructured(ctx, req)
		}
		return nil, ErrProviderUnavailable
	}

	textReq := TextGenerationRequest{
		SystemPrompt: req.SystemPrompt + "\nOutput strictly valid JSON only. Do not wrap in markdown quotes.\n" + GroundingInstruction(),
		Messages:     req.Messages,
		Temperature:  req.Temperature,
		MaxTokens:    req.MaxTokens,
		Timeout:      req.Timeout,
	}

	res, err := p.GenerateText(ctx, textReq)
	if err != nil {
		if p.fallback != nil {
			return p.fallback.GenerateStructured(ctx, req)
		}
		return nil, err
	}

	cleanJSON := strings.TrimSpace(res.Content)
	cleanJSON = strings.TrimPrefix(cleanJSON, "```json")
	cleanJSON = strings.TrimPrefix(cleanJSON, "```")
	cleanJSON = strings.TrimSuffix(cleanJSON, "```")
	cleanJSON = strings.TrimSpace(cleanJSON)

	var testParse map[string]interface{}
	if err := json.Unmarshal([]byte(cleanJSON), &testParse); err != nil {
		if p.fallback != nil {
			return p.fallback.GenerateStructured(ctx, req)
		}
		return nil, ErrMalformedResponse
	}

	return &StructuredGenerationResponse{
		RawJSON:      cleanJSON,
		ModelName:    res.ModelName,
		ProviderName: res.ProviderName,
		Usage:        res.Usage,
		LatencyMs:    res.LatencyMs,
	}, nil
}
