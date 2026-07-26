package telemetry

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Span struct {
	TraceID string
	SpanID  string
	Name    string
}

type Tracer interface {
	StartSpan(ctx context.Context, name string) (context.Context, *Span)
}

type mockTracer struct{}

func NewTracer() Tracer {
	return &mockTracer{}
}

func (t *mockTracer) StartSpan(ctx context.Context, name string) (context.Context, *Span) {
	traceID := ctx.Value("trace_id")
	traceIDStr := ""
	if traceID != nil {
		traceIDStr = fmt.Sprintf("%v", traceID)
	} else {
		traceIDStr = uuid.New().String()
	}

	span := &Span{
		TraceID: traceIDStr,
		SpanID:  uuid.New().String()[:8],
		Name:    name,
	}

	ctx = context.WithValue(ctx, "trace_id", span.TraceID)
	ctx = context.WithValue(ctx, "span_id", span.SpanID)
	return ctx, span
}
