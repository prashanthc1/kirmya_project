package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/referral/domain"
)

// This file carries the OpenAPI (swagger) contract for the referral module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerCreateRequest documents POST /api/v1/referrals/requests.
//
// @Summary      Create request
// @Description  Creates request via the Kirmya referral module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateReferralRequestPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/referrals/requests [post]
func swaggerCreateRequest() {}

// swaggerGetOpenRequests documents GET /api/v1/referrals/requests.
//
// @Summary      Get open requests
// @Description  Returns open requests via the Kirmya referral module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/referrals/requests [get]
func swaggerGetOpenRequests() {}

// swaggerOfferReferral documents POST /api/v1/referrals/offer.
//
// @Summary      Offer referral
// @Description  Offers referral via the Kirmya referral module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  domain.OfferReferralPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/referrals/offer [post]
func swaggerOfferReferral() {}

// swaggerGetUserReferrals documents GET /api/v1/referrals/my-referrals.
//
// @Summary      Get user referrals
// @Description  Returns user referrals via the Kirmya referral module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/referrals/my-referrals [get]
func swaggerGetUserReferrals() {}

// swaggerUpdateReferralStatus documents PUT /api/v1/referrals/{id}/status.
//
// @Summary      Update referral status
// @Description  Updates referral status via the Kirmya referral module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.UpdateReferralStatusPayload  true  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/referrals/{id}/status [put]
func swaggerUpdateReferralStatus() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.UpdateReferralStatusPayload
	_ swagger.ErrorResponse
)
