package telemetry

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

type StructuredLog struct {
	Timestamp string                 `json:"timestamp"`
	Level     string                 `json:"level"`
	TraceID   string                 `json:"trace_id,omitempty"`
	SpanID    string                 `json:"span_id,omitempty"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
}

func LogInfo(traceID, message string, fields map[string]interface{}) {
	writeLog("INFO", traceID, message, fields)
}

func LogError(traceID, message string, err error, fields map[string]interface{}) {
	if fields == nil {
		fields = make(map[string]interface{})
	}
	if err != nil {
		fields["error"] = err.Error()
	}
	writeLog("ERROR", traceID, message, fields)
}

func writeLog(level, traceID, message string, fields map[string]interface{}) {
	entry := StructuredLog{
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		Level:     level,
		TraceID:   traceID,
		Message:   message,
		Fields:    fields,
	}

	bytes, _ := json.Marshal(entry)
	fmt.Fprintln(os.Stdout, string(bytes))
}
