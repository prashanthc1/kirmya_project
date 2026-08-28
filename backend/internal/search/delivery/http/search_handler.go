package http

import (
	"errors"
	"net/http"
	"strconv"

	"kirmya/internal/search/domain"
	"kirmya/internal/search/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SearchHandler struct {
	service service.SearchService
}

func NewSearchHandler(s service.SearchService) *SearchHandler {
	return &SearchHandler{service: s}
}

func (h *SearchHandler) Search(c *gin.Context) {
	query := c.Query("q")
	category := c.Query("category")
	if category == "" {
		category = domain.CategoryAll
	}

	userID, _ := h.getUserID(c)
	resp, err := h.service.Search(c.Request.Context(), userID, query, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SearchHandler) GetSuggestions(c *gin.Context) {
	query := c.Query("q")
	suggestions, err := h.service.GetSuggestions(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, suggestions)
}

func (h *SearchHandler) GetHistory(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	history, err := h.service.GetUserHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, history)
}

func (h *SearchHandler) SavePreference(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	var payload domain.SaveSearchPreferencePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pref, err := h.service.SavePreference(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, pref)
}

func (h *SearchHandler) DeleteHistoryItem(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	historyIDStr := c.Param("id")
	historyID, err := uuid.Parse(historyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid history ID"})
		return
	}
	if err := h.service.DeleteHistoryItem(c.Request.Context(), userID, historyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "History item deleted successfully"})
}

func (h *SearchHandler) ClearHistory(c *gin.Context) {
	userID, err := h.getUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.ClearUserHistory(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Search history cleared successfully"})
}

func (h *SearchHandler) Reindex(c *gin.Context) {
	var payload domain.ReindexPayload
	_ = c.ShouldBindJSON(&payload)

	count, err := h.service.ReindexEntities(c.Request.Context(), payload.EntityType, payload.EntityID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Reindexed successfully", "count": count})
}

// Candidate Discovery Handlers
func (h *SearchHandler) SearchCandidates(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	minYears, _ := strconv.Atoi(c.Query("min_years_exp"))
	maxYears, _ := strconv.Atoi(c.Query("max_years_exp"))

	q := domain.CandidateSearchQuery{
		Query:              c.Query("q"),
		BooleanMode:        c.Query("boolean") == "true",
		CurrentTitle:       c.Query("title"),
		Industry:           c.Query("industry"),
		ExperienceLevel:    c.Query("experience_level"),
		MinYearsExp:        minYears,
		MaxYearsExp:        maxYears,
		Country:            c.Query("country"),
		City:               c.Query("city"),
		RemoteAvailability: c.Query("remote"),
		Availability:       c.Query("availability"),
		EmploymentType:     c.Query("employment_type"),
		Page:               page,
		Limit:              limit,
		SortBy:             c.DefaultQuery("sort_by", "match_score"),
	}

	resp, err := h.service.SearchCandidates(c.Request.Context(), q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *SearchHandler) GetFilterFacets(c *gin.Context) {
	facets, err := h.service.GetFilterFacets(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, facets)
}

func (h *SearchHandler) GetCandidateDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid candidate ID"})
		return
	}

	item, err := h.service.GetCandidateDetail(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *SearchHandler) SaveCandidate(c *gin.Context) {
	userID, _ := h.getUserID(c)
	candIDStr := c.Param("id")
	candID, _ := uuid.Parse(candIDStr)

	err := h.service.SaveCandidate(c.Request.Context(), userID, candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Candidate saved successfully"})
}

func (h *SearchHandler) UnsaveCandidate(c *gin.Context) {
	userID, _ := h.getUserID(c)
	candIDStr := c.Param("id")
	candID, _ := uuid.Parse(candIDStr)

	err := h.service.UnsaveCandidate(c.Request.Context(), userID, candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Candidate removed from saved list"})
}

func (h *SearchHandler) GetSavedCandidates(c *gin.Context) {
	userID, _ := h.getUserID(c)
	list, err := h.service.GetSavedCandidates(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *SearchHandler) MessageCandidate(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Message conversation initiated successfully"})
}

func (h *SearchHandler) ConnectCandidate(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Connection request sent successfully"})
}

func (h *SearchHandler) GetSavedSearches(c *gin.Context) {
	userID, _ := h.getUserID(c)
	list, err := h.service.GetSavedSearches(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

func (h *SearchHandler) CreateSavedSearch(c *gin.Context) {
	userID, _ := h.getUserID(c)
	var payload struct {
		SearchName     string                 `json:"search_name" binding:"required"`
		Query          string                 `json:"query"`
		Filters        map[string]interface{} `json:"filters"`
		AlertFrequency string                 `json:"alert_frequency"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dto, err := h.service.CreateSavedSearch(c.Request.Context(), userID, payload.SearchName, payload.Query, payload.Filters, payload.AlertFrequency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, dto)
}

func (h *SearchHandler) DeleteSavedSearch(c *gin.Context) {
	userID, _ := h.getUserID(c)
	idStr := c.Param("id")
	id, _ := uuid.Parse(idStr)

	err := h.service.DeleteSavedSearch(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Saved search deleted successfully"})
}

func (h *SearchHandler) GetTalentPools(c *gin.Context) {
	userID, _ := h.getUserID(c)
	pools, err := h.service.GetTalentPools(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pools)
}

func (h *SearchHandler) CreateTalentPool(c *gin.Context) {
	userID, _ := h.getUserID(c)
	var payload struct {
		Name           string `json:"name" binding:"required"`
		Description    string `json:"description"`
		SharedWithTeam bool   `json:"shared_with_team"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pool, err := h.service.CreateTalentPool(c.Request.Context(), userID, payload.Name, payload.Description, payload.SharedWithTeam)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, pool)
}

func (h *SearchHandler) AddCandidateToPool(c *gin.Context) {
	userID, _ := h.getUserID(c)
	poolIDStr := c.Param("id")
	poolID, _ := uuid.Parse(poolIDStr)

	var payload struct {
		CandidateID string `json:"candidate_id" binding:"required"`
		Notes       string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	candID, _ := uuid.Parse(payload.CandidateID)
	err := h.service.AddCandidateToPool(c.Request.Context(), userID, poolID, candID, payload.Notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Candidate added to talent pool successfully"})
}

func (h *SearchHandler) RemoveCandidateFromPool(c *gin.Context) {
	poolIDStr := c.Param("id")
	poolID, _ := uuid.Parse(poolIDStr)
	candIDStr := c.Param("candidateId")
	candID, _ := uuid.Parse(candIDStr)

	err := h.service.RemoveCandidateFromPool(c.Request.Context(), poolID, candID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Candidate removed from talent pool"})
}

func (h *SearchHandler) DeleteTalentPool(c *gin.Context) {
	userID, _ := h.getUserID(c)
	poolIDStr := c.Param("id")
	poolID, _ := uuid.Parse(poolIDStr)

	err := h.service.DeleteTalentPool(c.Request.Context(), userID, poolID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Talent pool deleted successfully"})
}

func (h *SearchHandler) CompareCandidates(c *gin.Context) {
	var payload domain.CandidateComparisonPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	matrix, err := h.service.CompareCandidates(c.Request.Context(), payload.CandidateIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, matrix)
}

func (h *SearchHandler) GetRecommendations(c *gin.Context) {
	userID, _ := h.getUserID(c)
	recs, err := h.service.GetRecommendations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, recs)
}

// Helpers
func (h *SearchHandler) getUserID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("userID")
	if !exists {
		val, exists = c.Get("user_id")
	}
	if !exists {
		return uuid.Nil, errors.New("unauthorized context")
	}
	switch uid := val.(type) {
	case uuid.UUID:
		if uid == uuid.Nil {
			return uuid.Nil, errors.New("invalid user identity")
		}
		return uid, nil
	case string:
		if parsed, err := uuid.Parse(uid); err == nil && parsed != uuid.Nil {
			return parsed, nil
		}
	}
	return uuid.Nil, errors.New("unauthorized context")
}
