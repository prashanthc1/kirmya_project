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

type OpenAIConfig struct {
	BaseURL string
	APIKey  string
	Model   string
	Timeout time.Duration
}

type OpenAIProvider struct {
	cfg      OpenAIConfig
	client   *http.Client
	fallback AIProvider
}

func NewOpenAIProvider(cfg OpenAIConfig, fallback AIProvider) *OpenAIProvider {
	if cfg.BaseURL == "" {
		cfg.BaseURL = "https://api.openai.com/v1"
	}
	if cfg.Model == "" {
		cfg.Model = "gpt-4o"
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 30 * time.Second
	}
	return &OpenAIProvider{
		cfg: cfg,
		client: &http.Client{
			Timeout: cfg.Timeout,
		},
		fallback: fallback,
	}
}

func (p *OpenAIProvider) GetProviderName() string {
	return "openai-rest-provider"
}

func (p *OpenAIProvider) GetCapabilities() ProviderCapabilities {
	return ProviderCapabilities{
		SupportsStreaming:  true,
		SupportsStructured: true,
		SupportsTools:      true,
		MaxContextWindow:   128000,
		AvailableModels:    []string{p.cfg.Model, "gpt-4o-mini", "gpt-4-turbo"},
	}
}

type openAIChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatRequest struct {
	Model          string              `json:"model"`
	Messages       []openAIChatMessage `json:"messages"`
	Temperature    float64             `json:"temperature,omitempty"`
	MaxTokens      int                 `json:"max_tokens,omitempty"`
	ResponseFormat map[string]string   `json:"response_format,omitempty"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

func (p *OpenAIProvider) GenerateText(ctx context.Context, req TextGenerationRequest) (*TextGenerationResponse, error) {
	if p.cfg.APIKey == "" {
		if p.fallback != nil {
			return p.fallback.GenerateText(ctx, req)
		}
		return nil, ErrProviderUnavailable
	}

	start := time.Now()
	var msgs []openAIChatMessage
	if req.SystemPrompt != "" {
		msgs = append(msgs, openAIChatMessage{
			Role:    "system",
			Content: req.SystemPrompt + "\n\n" + GroundingInstruction(),
		})
	}
	for _, m := range req.Messages {
		msgs = append(msgs, openAIChatMessage{
			Role:    string(m.Role),
			Content: m.Content,
		})
	}

	bodyPayload := openAIChatRequest{
		Model:       p.cfg.Model,
		Messages:    msgs,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
	}

	bodyBytes, err := json.Marshal(bodyPayload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(p.cfg.BaseURL, "/")+"/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.cfg.APIKey)

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
		return nil, fmt.Errorf("openai error status %d: %s", resp.StatusCode, string(respBytes))
	}

	var parsed openAIChatResponse
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return nil, ErrMalformedResponse
	}
	if len(parsed.Choices) == 0 {
		return nil, ErrMalformedResponse
	}

	return &TextGenerationResponse{
		Content:      parsed.Choices[0].Message.Content,
		ModelName:    p.cfg.Model,
		ProviderName: p.GetProviderName(),
		Usage: TokenUsage{
			PromptTokens:     parsed.Usage.PromptTokens,
			CompletionTokens: parsed.Usage.CompletionTokens,
			TotalTokens:      parsed.Usage.TotalTokens,
		},
		LatencyMs: time.Since(start).Milliseconds(),
	}, nil
}

func (p *OpenAIProvider) GenerateStructured(ctx context.Context, req StructuredGenerationRequest) (*StructuredGenerationResponse, error) {
	if p.cfg.APIKey == "" {
		if p.fallback != nil {
			return p.fallback.GenerateStructured(ctx, req)
		}
		return nil, ErrProviderUnavailable
	}

	start := time.Now()
	var msgs []openAIChatMessage
	systemPrompt := req.SystemPrompt
	if systemPrompt == "" {
		systemPrompt = "You are a professional AI career intelligence engine."
	}
	systemPrompt += "\nRespond ONLY in valid JSON matching the requested schema.\n" + GroundingInstruction()

	msgs = append(msgs, openAIChatMessage{
		Role:    "system",
		Content: systemPrompt,
	})
	for _, m := range req.Messages {
		msgs = append(msgs, openAIChatMessage{
			Role:    string(m.Role),
			Content: m.Content,
		})
	}

	bodyPayload := openAIChatRequest{
		Model:          p.cfg.Model,
		Messages:       msgs,
		Temperature:    req.Temperature,
		MaxTokens:      req.MaxTokens,
		ResponseFormat: map[string]string{"type": "json_object"},
	}

	bodyBytes, err := json.Marshal(bodyPayload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(p.cfg.BaseURL, "/")+"/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.cfg.APIKey)

	resp, err := p.client.Do(httpReq)
	if err != nil {
		if p.fallback != nil {
			return p.fallback.GenerateStructured(ctx, req)
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
			return p.fallback.GenerateStructured(ctx, req)
		}
		return nil, fmt.Errorf("openai error status %d: %s", resp.StatusCode, string(respBytes))
	}

	var parsed openAIChatResponse
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return nil, ErrMalformedResponse
	}
	if len(parsed.Choices) == 0 {
		return nil, ErrMalformedResponse
	}

	rawJSON := parsed.Choices[0].Message.Content

	// Validate JSON format
	var testParse map[string]interface{}
	if err := json.Unmarshal([]byte(rawJSON), &testParse); err != nil {
		if p.fallback != nil {
			return p.fallback.GenerateStructured(ctx, req)
		}
		return nil, ErrMalformedResponse
	}

	return &StructuredGenerationResponse{
		RawJSON:      rawJSON,
		ModelName:    p.cfg.Model,
		ProviderName: p.GetProviderName(),
		Usage: TokenUsage{
			PromptTokens:     parsed.Usage.PromptTokens,
			CompletionTokens: parsed.Usage.CompletionTokens,
			TotalTokens:      parsed.Usage.TotalTokens,
		},
		LatencyMs: time.Since(start).Milliseconds(),
	}, nil
}
