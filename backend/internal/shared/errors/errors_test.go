package errors

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestErrorClassification(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		err            error
		expectedStatus int
		expectedCode   string
		expectedMsg    string
	}{
		{
			name:           "Unauthenticated Sentinel",
			err:            ErrUnauthenticated,
			expectedStatus: http.StatusUnauthorized,
			expectedCode:   CodeUnauthenticated,
			expectedMsg:    "Sign in to continue",
		},
		{
			name:           "Forbidden Sentinel",
			err:            ErrForbidden,
			expectedStatus: http.StatusForbidden,
			expectedCode:   CodeForbidden,
			expectedMsg:    "You do not have permission to perform this action",
		},
		{
			name:           "Not Found Sentinel",
			err:            ErrNotFound,
			expectedStatus: http.StatusNotFound,
			expectedCode:   CodeNotFound,
			expectedMsg:    "Requested resource not found",
		},
		{
			name:           "Custom App Error",
			err:            NewAppError(http.StatusBadRequest, CodeValidationFailed, "Field email is required", nil),
			expectedStatus: http.StatusBadRequest,
			expectedCode:   CodeValidationFailed,
			expectedMsg:    "Field email is required",
		},
		{
			name:           "Sanitized DB Error",
			err:            errors.New("pq: relation \"users\" does not exist syntax error at SELECT * FROM"),
			expectedStatus: http.StatusInternalServerError,
			expectedCode:   CodeInternalError,
			expectedMsg:    "An unexpected error occurred. Please try again.",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Set("request_id", "req-12345")

			RespondError(c, tc.err)

			if w.Code != tc.expectedStatus {
				t.Fatalf("expected status %d, got %d", tc.expectedStatus, w.Code)
			}

			var resp APIErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Code != tc.expectedCode {
				t.Errorf("expected code %q, got %q", tc.expectedCode, resp.Code)
			}
			if resp.Error != tc.expectedMsg {
				t.Errorf("expected error %q, got %q", tc.expectedMsg, resp.Error)
			}
			if resp.RequestID != "req-12345" {
				t.Errorf("expected request_id req-12345, got %q", resp.RequestID)
			}
		})
	}
}
