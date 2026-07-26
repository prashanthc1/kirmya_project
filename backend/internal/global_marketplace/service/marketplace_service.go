package service

import (
	"context"

	"kirmya/internal/global_marketplace/domain"
	"kirmya/internal/global_marketplace/repository"
)

type MarketplaceService interface {
	GetCountries(ctx context.Context) ([]domain.Country, error)
	GetRegions(ctx context.Context) ([]domain.Region, error)
	GetCurrencies(ctx context.Context) ([]domain.Currency, error)
	SearchInternationalJobs(ctx context.Context, regionCode, countryCode, arrangement string) ([]domain.InternationalJobItem, error)
}

type marketplaceService struct {
	repo repository.MarketplaceRepository
}

func NewMarketplaceService(repo repository.MarketplaceRepository) MarketplaceService {
	return &marketplaceService{repo: repo}
}

func (s *marketplaceService) GetCountries(ctx context.Context) ([]domain.Country, error) {
	return s.repo.GetCountries(ctx)
}

func (s *marketplaceService) GetRegions(ctx context.Context) ([]domain.Region, error) {
	return s.repo.GetRegions(ctx)
}

func (s *marketplaceService) GetCurrencies(ctx context.Context) ([]domain.Currency, error) {
	return s.repo.GetCurrencies(ctx)
}

func (s *marketplaceService) SearchInternationalJobs(ctx context.Context, regionCode, countryCode, arrangement string) ([]domain.InternationalJobItem, error) {
	return s.repo.SearchInternationalJobs(ctx, regionCode, countryCode, arrangement)
}
