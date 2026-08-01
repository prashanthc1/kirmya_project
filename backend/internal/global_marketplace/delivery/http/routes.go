package http

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(api *gin.RouterGroup, handler *MarketplaceHandler) {
	globalGroup := api.Group("/global")
	{
		globalGroup.GET("/jobs", handler.SearchInternationalJobs)
		globalGroup.GET("/countries", handler.GetCountries)
		globalGroup.GET("/regions", handler.GetRegions)
		globalGroup.GET("/currencies", handler.GetCurrencies)
	}
}
