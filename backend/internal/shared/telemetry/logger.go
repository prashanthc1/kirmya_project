package telemetry

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"
)

type LogLevel string

const (
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
	LevelAudit LogLevel = "AUDIT"
)

type StructuredLog struct {
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	EventType string                 `json:"event_type,omitempty"`
	TraceID   string                 `json:"trace_id,omitempty"`
	SpanID    string                 `json:"span_id,omitempty"`
	UserID    string                 `json:"user_id,omitempty"`
	IPAddress string                 `json:"ip_address,omitempty"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
}

func writeLog(level LogLevel, eventType, traceID, spanID, userID, ipAddress, message string, fields map[string]interface{}) {
	entry := StructuredLog{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Level:     string(level),
		EventType: eventType,
		TraceID:   traceID,
		SpanID:    spanID,
		UserID:    userID,
		IPAddress: ipAddress,
		Message:   message,
		Fields:    fields,
	}

	bytes, _ := json.Marshal(entry)
	fmt.Fprintln(os.Stdout, string(bytes))
}

func LogInfo(traceID, message string, fields map[string]interface{}) {
	writeLog(LevelInfo, "SYSTEM_INFO", traceID, "", "", "", message, fields)
}

func LogWarn(traceID, message string, fields map[string]interface{}) {
	writeLog(LevelWarn, "SYSTEM_WARN", traceID, "", "", "", message, fields)
}

func LogError(traceID, message string, err error, fields map[string]interface{}) {
	if fields == nil {
		fields = make(map[string]interface{})
	}
	if err != nil {
		fields["error"] = err.Error()
	}
	writeLog(LevelError, "SYSTEM_ERROR", traceID, "", "", "", message, fields)
}

func LogContextError(ctx context.Context, err error, message string, details map[string]interface{}) {
	traceID := GetTraceID(ctx)
	LogError(traceID, message, err, details)
}

// LogUserAction records auditable user behaviors (e.g. application submitted, profile updated).
func LogUserAction(ctx context.Context, userID, action string, details map[string]interface{}) {
	traceID := GetTraceID(ctx)
	writeLog(LevelAudit, "USER_ACTION", traceID, "", userID, "", fmt.Sprintf("User Action: %s", action), details)
}

// LogSecurityEvent records security anomalies (failed logins, rate limit violations, CORS rejections).
func LogSecurityEvent(ctx context.Context, eventType, ipAddress string, details map[string]interface{}) {
	traceID := GetTraceID(ctx)
	writeLog(LevelWarn, "SECURITY_EVENT", traceID, "", "", ipAddress, fmt.Sprintf("Security Event: %s", eventType), details)
}
