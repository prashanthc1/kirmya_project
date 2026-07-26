package pagination

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type PageParams struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

type PaginatedResponse struct {
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalItems int         `json:"total_items"`
	TotalPages int         `json:"total_pages"`
	Data       interface{} `json:"data"`
}

func GetPageParams(c *gin.Context) PageParams {
	page := 1
	limit := 20

	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
			if limit > 100 {
				limit = 100 // Cap max items per page to 100 for memory safety
			}
		}
	}

	return PageParams{
		Page:  page,
		Limit: limit,
	}
}

func (p PageParams) GetOffset() int {
	return (p.Page - 1) * p.Limit
}

func NewPaginatedResponse(page, limit, totalItems int, data interface{}) PaginatedResponse {
	totalPages := 0
	if totalItems > 0 && limit > 0 {
		totalPages = (totalItems + limit - 1) / limit
	}

	return PaginatedResponse{
		Page:       page,
		Limit:      limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
		Data:       data,
	}
}
