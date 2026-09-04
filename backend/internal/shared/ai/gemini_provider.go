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

type GeminiConfig struct {
	APIKey  string
	Model   string
	Timeout time.Duration
}

type GeminiProvider struct {
	cfg      GeminiConfig
	client   *http.Client
	fallback AIProvider
}

func NewGeminiProvider(cfg GeminiConfig, fallback AIProvider) *GeminiProvider {
	if cfg.Model == "" {
		cfg.Model = "gemini-1.5-pro"
	}
	if cfg.Timeout <= 0 {
		cfg.Timeout = 30 * time.Second
	}
	return &GeminiProvider{
		cfg: cfg,
		client: &http.Client{
			Timeout: cfg.Timeout,
		},
		fallback: fallback,
	}
}

func (p *GeminiProvider) GetProviderName() string {
	return "gemini-api-provider"
}

func (p *GeminiProvider) GetCapabilities() ProviderCapabilities {
	return ProviderCapabilities{
		SupportsStreaming:  true,
		SupportsStructured: true,
		SupportsTools:      false,
		MaxContextWindow:   1000000,
		AvailableModels:    []string{p.cfg.Model, "gemini-1.5-flash", "gemini-1.0-pro"},
	}
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

type geminiGenerateRequest struct {
	Contents          []geminiContent `json:"contents"`
	SystemInstruction *geminiContent  `json:"systemInstruction,omitempty"`
}

type geminiGenerateResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	UsageMetadata struct {
		PromptTokenCount     int `json:"promptTokenCount"`
		CandidatesTokenCount int `json:"candidatesTokenCount"`
		TotalTokenCount      int `json:"totalTokenCount"`
	} `json:"usageMetadata"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error,omitempty"`
}

func (p *GeminiProvider) GenerateText(ctx context.Context, req TextGenerationRequest) (*TextGenerationResponse, error) {
	if p.cfg.APIKey == "" {
		if p.fallback != nil {
			return p.fallback.GenerateText(ctx, req)
		}
		return nil, ErrProviderUnavailable
	}

	start := time.Now()
	var contents []geminiContent
	for _, m := range req.Messages {
		role := "user"
		if m.Role == RoleAssistant {
			role = "model"
		}
		contents = append(contents, geminiContent{
			Role:  role,
			Parts: []geminiPart{{Text: m.Content}},
		})
	}

	bodyPayload := geminiGenerateRequest{
		Contents: contents,
	}
	if req.SystemPrompt != "" {
		bodyPayload.SystemInstruction = &geminiContent{
			Role:  "system",
			Parts: []geminiPart{{Text: req.SystemPrompt + "\n\n" + GroundingInstruction()}},
		}
	}

	bodyBytes, err := json.Marshal(bodyPayload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", p.cfg.Model, p.cfg.APIKey)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")

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
		return nil, fmt.Errorf("gemini error status %d: %s", resp.StatusCode, string(respBytes))
	}

	var parsed geminiGenerateResponse
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return nil, ErrMalformedResponse
	}
	if len(parsed.Candidates) == 0 || len(parsed.Candidates[0].Content.Parts) == 0 {
		return nil, ErrMalformedResponse
	}

	content := parsed.Candidates[0].Content.Parts[0].Text

	return &TextGenerationResponse{
		Content:      content,
		ModelName:    p.cfg.Model,
		ProviderName: p.GetProviderName(),
		Usage: TokenUsage{
			PromptTokens:     parsed.UsageMetadata.PromptTokenCount,
			CompletionTokens: parsed.UsageMetadata.CandidatesTokenCount,
			TotalTokens:      parsed.UsageMetadata.TotalTokenCount,
		},
		LatencyMs: time.Since(start).Milliseconds(),
	}, nil
}

func (p *GeminiProvider) GenerateStructured(ctx context.Context, req StructuredGenerationRequest) (*StructuredGenerationResponse, error) {
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
