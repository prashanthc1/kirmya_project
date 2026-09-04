package http

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"kirmya/internal/search/domain"
	"kirmya/internal/search/repository"
	"kirmya/internal/search/service"
	configPkg "kirmya/internal/shared/config"
	sharedMiddleware "kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func generateTestToken(userID uuid.UUID) string {
	claims := &sharedMiddleware.JWTClaims{
		UserID: userID,
		Email:  "test@kirmya.com",
		Role:   "user",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(configPkg.GetJWTSecretBytes())
	return tokenStr
}

func setupTestRouter() (*gin.Engine, *SearchHandler, uuid.UUID, string) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	testUserID := uuid.New()
	testToken := generateTestToken(testUserID)

	repo := repository.NewSearchRepository(nil)
	svc := service.NewSearchService(repo, nil, nil)
	handler := NewSearchHandler(svc)

	api := r.Group("/api/v1")
	RegisterRoutes(api, handler)

	return r, handler, testUserID, testToken
}

func TestSearchHandler_Search(t *testing.T) {
	r, _, _, token := setupTestRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/unified-search?q=Go&category=all", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var resp domain.SearchResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse JSON response: %v", err)
	}

	if resp.Query != "go" {
		t.Errorf("Expected normalized query 'go', got %q", resp.Query)
	}
	if len(resp.Results) == 0 {
		t.Errorf("Expected search results for 'Go', got 0")
	}
}

func TestSearchHandler_Suggestions(t *testing.T) {
	r, _, _, token := setupTestRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/unified-search/suggestions?q=eng", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var suggestions []domain.SearchSuggestion
	if err := json.Unmarshal(w.Body.Bytes(), &suggestions); err != nil {
		t.Fatalf("Failed to parse JSON suggestions: %v", err)
	}

	if len(suggestions) == 0 {
		t.Errorf("Expected suggestions for 'eng', got 0")
	}
}

func TestSearchHandler_HistoryAndPreferencesFlow(t *testing.T) {
	r, _, _, token := setupTestRouter()

	// 1. Perform a search to generate history
	searchReq, _ := http.NewRequest(http.MethodGet, "/api/v1/unified-search?q=PostgreSQL", nil)
	searchReq.Header.Set("Authorization", "Bearer "+token)
	wSearch := httptest.NewRecorder()
	r.ServeHTTP(wSearch, searchReq)
	if wSearch.Code != http.StatusOK {
		t.Fatalf("Search failed with status %d. Body: %s", wSearch.Code, wSearch.Body.String())
	}

	// 2. Fetch history
	histReq, _ := http.NewRequest(http.MethodGet, "/api/v1/unified-search/history", nil)
	histReq.Header.Set("Authorization", "Bearer "+token)
	wHist := httptest.NewRecorder()
	r.ServeHTTP(wHist, histReq)
	if wHist.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for history, got %d. Body: %s", wHist.Code, wHist.Body.String())
	}

	var history []domain.SearchHistoryItem
	if err := json.Unmarshal(wHist.Body.Bytes(), &history); err != nil {
		t.Fatalf("Failed to parse history: %v", err)
	}
	if len(history) == 0 {
		t.Errorf("Expected history item recorded after search")
	}

	// 3. Save Search Preference
	prefPayload := domain.SaveSearchPreferencePayload{
		SavedQuery: "Go Backend Developer",
		Filters: map[string]interface{}{
			"preferred_categories": []string{"jobs", "people"},
			"default_work_modes":   []string{"remote"},
			"default_locations":    []string{"Dubai, UAE"},
		},
		EmailAlertEnabled: true,
	}
	prefBytes, _ := json.Marshal(prefPayload)
	prefReq, _ := http.NewRequest(http.MethodPost, "/api/v1/unified-search/preferences", bytes.NewBuffer(prefBytes))
	prefReq.Header.Set("Content-Type", "application/json")
	prefReq.Header.Set("Authorization", "Bearer "+token)
	wPref := httptest.NewRecorder()
	r.ServeHTTP(wPref, prefReq)
	if wPref.Code != http.StatusCreated {
		t.Errorf("Expected status 201 for save preference, got %d. Body: %s", wPref.Code, wPref.Body.String())
	}

	// 4. Delete single history item if exists
	if len(history) > 0 {
		delReq, _ := http.NewRequest(http.MethodDelete, "/api/v1/unified-search/history/"+history[0].ID.String(), nil)
		delReq.Header.Set("Authorization", "Bearer "+token)
		wDel := httptest.NewRecorder()
		r.ServeHTTP(wDel, delReq)
		if wDel.Code != http.StatusOK {
			t.Errorf("Expected status 200 for delete history item, got %d. Body: %s", wDel.Code, wDel.Body.String())
		}
	}

	// 5. Clear all history
	clearReq, _ := http.NewRequest(http.MethodDelete, "/api/v1/unified-search/history", nil)
	clearReq.Header.Set("Authorization", "Bearer "+token)
	wClear := httptest.NewRecorder()
	r.ServeHTTP(wClear, clearReq)
	if wClear.Code != http.StatusOK {
		t.Errorf("Expected status 200 for clear history, got %d. Body: %s", wClear.Code, wClear.Body.String())
	}
}

func TestSearchHandler_Reindex(t *testing.T) {
	r, _, _, token := setupTestRouter()

	reindexPayload := domain.ReindexPayload{
		EntityType: "jobs",
		EntityID:   "job-789",
	}
	payloadBytes, _ := json.Marshal(reindexPayload)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/unified-search/reindex", bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200 for reindex, got %d", w.Code)
	}
}
