package http

import (
	"github.com/gin-gonic/gin"
	sharedMiddleware "kirmya/internal/shared/middleware"
)

func RegisterRoutes(api *gin.RouterGroup, handler *CompanyHandler) {
	companiesGroup := api.Group("/companies")
	{
		companiesGroup.GET("", handler.ListDirectory)
		companiesGroup.GET("/featured", handler.GetFeaturedCompanies)
		companiesGroup.GET("/popular", handler.GetPopularCompanies)
		companiesGroup.GET("/recommended", handler.GetRecommendations)
		companiesGroup.GET("/search", handler.SearchCompanies)
		companiesGroup.GET("/industries", handler.GetIndustries)
		companiesGroup.GET("/handle/:handle", handler.GetByHandle)

		companiesGroup.GET("/:id/jobs", handler.GetCompanyJobs)
		companiesGroup.GET("/:id/employees", handler.GetCompanyEmployees)
		companiesGroup.GET("/:id/leaders", handler.GetCompanyLeaders)
		companiesGroup.GET("/:id/locations", handler.GetCompanyLocations)
		companiesGroup.GET("/:id/departments", handler.GetCompanyDepartments)
		companiesGroup.GET("/:id/gallery", handler.GetCompanyGallery)

		protected := companiesGroup.Group("")
		protected.Use(sharedMiddleware.AuthRequired())
		{
			protected.POST("", handler.RegisterCompany)
			protected.PUT("/:id", handler.UpdateProfile)
			protected.POST("/follow", handler.FollowCompany)
			protected.POST("/:id/follow", handler.FollowCompany)
			protected.DELETE("/follow", handler.UnfollowCompany)
			protected.POST("/save", handler.SaveCompany)
			protected.DELETE("/save", handler.UnsaveCompany)
			protected.POST("/:id/report", handler.ReportCompany)
			protected.POST("/:id/verify", handler.RequestVerification)
			protected.PUT("/verify/:requestId", handler.UpdateVerificationStatus)
		}
	}

	companyPublicGroup := api.Group("/company")
	{
		companyPublicGroup.GET("/:slug", handler.GetByHandle)
	}
}
