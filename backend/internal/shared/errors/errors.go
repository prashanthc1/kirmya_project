package errors

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Standard Error Codes
const (
	CodeUnauthenticated    = "UNAUTHENTICATED"
	CodeForbidden          = "FORBIDDEN"
	CodeNotFound           = "NOT_FOUND"
	CodeConflict           = "CONFLICT"
	CodeValidationFailed   = "VALIDATION_FAILED"
	CodeRateLimited        = "RATE_LIMITED"
	CodeBadRequest         = "BAD_REQUEST"
	CodeInternalError      = "INTERNAL_ERROR"
	CodeServiceUnavailable = "SERVICE_UNAVAILABLE"
	CodeDatabaseError      = "DATABASE_ERROR"
	CodeRequestTimeout     = "REQUEST_TIMEOUT"
)

// Domain Sentinel Errors
var (
	ErrUnauthenticated    = errors.New("unauthenticated: sign in to continue")
	ErrForbidden          = errors.New("forbidden: you do not have permission to perform this action")
	ErrNotFound           = errors.New("not_found: requested resource not found")
	ErrConflict           = errors.New("conflict: resource already exists or state conflict occurred")
	ErrValidation         = errors.New("validation_failed: invalid request payload")
	ErrRateLimited        = errors.New("rate_limited: too many requests, please slow down")
	ErrServiceUnavailable = errors.New("service_unavailable: service is temporarily unavailable")
	ErrDatabase           = errors.New("database_error: underlying database operation failed")
	ErrTimeout            = errors.New("request_timeout: request execution deadline exceeded")
)

// AppError represents a structured, user-safe application error.
type AppError struct {
	StatusCode int               `json:"-"`
	Code       string            `json:"code"`
	Message    string            `json:"error"`
	Details    map[string]string `json:"details,omitempty"`
	RequestID  string            `json:"request_id,omitempty"`
	Err        error             `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError builds a custom AppError with an HTTP status code, machine-readable code, and user message.
func NewAppError(statusCode int, code, message string, cause error) *AppError {
	return &AppError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
		Err:        cause,
	}
}

// Wrap wraps an existing error with a machine code and user-facing message.
func Wrap(err error, code, message string) *AppError {
	if err == nil {
		return nil
	}
	return &AppError{
		StatusCode: StatusCodeFromCode(code),
		Code:       code,
		Message:    message,
		Err:        err,
	}
}

// StatusCodeFromCode maps standard error codes to HTTP status codes.
func StatusCodeFromCode(code string) int {
	switch code {
	case CodeUnauthenticated:
		return http.StatusUnauthorized
	case CodeForbidden:
		return http.StatusForbidden
	case CodeNotFound:
		return http.StatusNotFound
	case CodeConflict:
		return http.StatusConflict
	case CodeValidationFailed, CodeBadRequest:
		return http.StatusBadRequest
	case CodeRateLimited:
		return http.StatusTooManyRequests
	case CodeServiceUnavailable, CodeDatabaseError:
		return http.StatusServiceUnavailable
	case CodeRequestTimeout:
		return http.StatusGatewayTimeout
	default:
		return http.StatusInternalServerError
	}
}

// APIErrorResponse is the canonical JSON error payload returned by all API endpoints.
type APIErrorResponse struct {
	Error     string            `json:"error"`
	Code      string            `json:"code,omitempty"`
	Details   map[string]string `json:"details,omitempty"`
	RequestID string            `json:"request_id,omitempty"`
}

// RespondError translates any Go error or AppError into a canonical HTTP error response.
// Internal database error messages, stack traces, and SQL queries are NEVER exposed to callers.
func RespondError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	reqID := getRequestID(c)

	// Check if already an AppError
	var appErr *AppError
	if errors.As(err, &appErr) {
		if appErr.StatusCode >= 500 {
			c.Error(appErr)
		}
		c.JSON(appErr.StatusCode, APIErrorResponse{
			Error:     appErr.Message,
			Code:      appErr.Code,
			Details:   appErr.Details,
			RequestID: reqID,
		})
		return
	}

	// Match against domain sentinels
	switch {
	case errors.Is(err, ErrUnauthenticated):
		c.JSON(http.StatusUnauthorized, APIErrorResponse{
			Error:     "Sign in to continue",
			Code:      CodeUnauthenticated,
			RequestID: reqID,
		})
	case errors.Is(err, ErrForbidden):
		c.JSON(http.StatusForbidden, APIErrorResponse{
			Error:     userSafeMessage(err, "You do not have permission to perform this action"),
			Code:      CodeForbidden,
			RequestID: reqID,
		})
	case errors.Is(err, ErrNotFound):
		c.JSON(http.StatusNotFound, APIErrorResponse{
			Error:     userSafeMessage(err, "Requested resource not found"),
			Code:      CodeNotFound,
			RequestID: reqID,
		})
	case errors.Is(err, ErrConflict):
		c.JSON(http.StatusConflict, APIErrorResponse{
			Error:     userSafeMessage(err, "Resource conflict detected"),
			Code:      CodeConflict,
			RequestID: reqID,
		})
	case errors.Is(err, ErrValidation):
		c.JSON(http.StatusBadRequest, APIErrorResponse{
			Error:     userSafeMessage(err, "Invalid request payload"),
			Code:      CodeValidationFailed,
			RequestID: reqID,
		})
	case errors.Is(err, ErrRateLimited):
		c.JSON(http.StatusTooManyRequests, APIErrorResponse{
			Error:     "Too many requests. Please slow down.",
			Code:      CodeRateLimited,
			RequestID: reqID,
		})
	case errors.Is(err, ErrServiceUnavailable), errors.Is(err, ErrDatabase):
		c.Error(err) // Record internal error for logging
		c.JSON(http.StatusServiceUnavailable, APIErrorResponse{
			Error:     "Service is temporarily unavailable. Please try again shortly.",
			Code:      CodeServiceUnavailable,
			RequestID: reqID,
		})
	case errors.Is(err, ErrTimeout):
		c.JSON(http.StatusGatewayTimeout, APIErrorResponse{
			Error:     "Request execution deadline exceeded",
			Code:      CodeRequestTimeout,
			RequestID: reqID,
		})
	default:
		// Unknown internal server error - never leak raw error details
		c.Error(err) // Record internal error for logging
		c.JSON(http.StatusInternalServerError, APIErrorResponse{
			Error:     "An unexpected error occurred. Please try again.",
			Code:      CodeInternalError,
			RequestID: reqID,
		})
	}
}

// RespondWithError formats and sends a direct HTTP error with code, message, and request ID.
func RespondWithError(c *gin.Context, status int, code, message string) {
	reqID := getRequestID(c)
	c.JSON(status, APIErrorResponse{
		Error:     message,
		Code:      code,
		RequestID: reqID,
	})
}

func getRequestID(c *gin.Context) string {
	if reqID, ok := c.Get("request_id"); ok {
		if s, ok := reqID.(string); ok && s != "" {
			return s
		}
	}
	if reqID := c.GetHeader("X-Request-ID"); reqID != "" {
		return reqID
	}
	if traceID, ok := c.Get("trace_id"); ok {
		if s, ok := traceID.(string); ok && s != "" {
			return s
		}
	}
	return ""
}

func userSafeMessage(err error, fallback string) string {
	msg := err.Error()
	// Strip sentinel prefix e.g. "not_found: specific item" -> "Specific item"
	if idx := strings.Index(msg, ": "); idx >= 0 && idx+2 < len(msg) {
		remainder := msg[idx+2:]
		// Don't leak raw sql/pg errors
		if strings.Contains(strings.ToLower(remainder), "sql") ||
			strings.Contains(strings.ToLower(remainder), "pgx") ||
			strings.Contains(strings.ToLower(remainder), "select") ||
			strings.Contains(strings.ToLower(remainder), "insert") ||
			strings.Contains(strings.ToLower(remainder), "table") {
			return fallback
		}
		return strings.ToUpper(remainder[:1]) + remainder[1:]
	}
	return fallback
}
