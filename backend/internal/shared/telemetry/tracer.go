package telemetry

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

type contextKey string

const (
	TraceIDKey contextKey = "trace_id"
	SpanIDKey  contextKey = "span_id"
)

// TraceSpan represents an OpenTelemetry W3C trace span context.
type TraceSpan struct {
	TraceID string
	SpanID  string
	Name    string
}

// GenerateRandomHex produces crypto-safe random hex strings for W3C compliance.
func GenerateRandomHex(bytes int) string {
	b := make([]byte, bytes)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// StartSpan creates a new OpenTelemetry compliant span context.
func StartSpan(ctx context.Context, name string) (context.Context, *TraceSpan) {
	traceID, ok := ctx.Value(TraceIDKey).(string)
	if !ok || traceID == "" {
		traceID = uuid.New().String()
	}

	spanID := GenerateRandomHex(8)
	span := &TraceSpan{
		TraceID: traceID,
		SpanID:  spanID,
		Name:    name,
	}

	ctx = context.WithValue(ctx, TraceIDKey, traceID)
	ctx = context.WithValue(ctx, SpanIDKey, spanID)
	return ctx, span
}

// InjectTraceHeaders injects W3C traceparent headers into outgoing HTTP requests.
func InjectTraceHeaders(ctx context.Context, req *http.Request) {
	traceID, _ := ctx.Value(TraceIDKey).(string)
	spanID, _ := ctx.Value(SpanIDKey).(string)

	if traceID != "" && spanID != "" {
		// W3C traceparent format: 00-{trace_id_32_hex}-{span_id_16_hex}-01
		traceparent := fmt.Sprintf("00-%s-%s-01", traceID, spanID)
		req.Header.Set("traceparent", traceparent)
	}
}

// GetTraceID extracts the active trace ID from context.
func GetTraceID(ctx context.Context) string {
	if traceID, ok := ctx.Value(TraceIDKey).(string); ok {
		return traceID
	}
	return "00000000-0000-0000-0000-000000000000"
}
