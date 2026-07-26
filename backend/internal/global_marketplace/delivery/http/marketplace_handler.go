package http

import (
	"net/http"

	"kirmya/internal/global_marketplace/service"

	"github.com/gin-gonic/gin"
)

type MarketplaceHandler struct {
	svc service.MarketplaceService
}

func NewMarketplaceHandler(svc service.MarketplaceService) *MarketplaceHandler {
	return &MarketplaceHandler{svc: svc}
}

// SearchInternationalJobs handles GET /global/jobs
func (h *MarketplaceHandler) SearchInternationalJobs(c *gin.Context) {
	region := c.Query("region")
	country := c.Query("country")
	arrangement := c.Query("arrangement")

	jobs, err := h.svc.SearchInternationalJobs(c.Request.Context(), region, country, arrangement)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  jobs,
		"count": len(jobs),
	})
}

// GetCountries handles GET /global/countries
func (h *MarketplaceHandler) GetCountries(c *gin.Context) {
	countries, err := h.svc.GetCountries(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  countries,
		"count": len(countries),
	})
}

// GetRegions handles GET /global/regions
func (h *MarketplaceHandler) GetRegions(c *gin.Context) {
	regions, err := h.svc.GetRegions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  regions,
		"count": len(regions),
	})
}

// GetCurrencies handles GET /global/currencies
func (h *MarketplaceHandler) GetCurrencies(c *gin.Context) {
	currencies, err := h.svc.GetCurrencies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  currencies,
		"count": len(currencies),
	})
}
