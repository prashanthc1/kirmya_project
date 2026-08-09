package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/event/domain"
)

// This file carries the OpenAPI (swagger) contract for the events module.
// The functions below have no runtime role: swaggo reads their annotations
// to build internal/docs. Keeping them out of the handlers leaves the
// delivery layer readable and lets the contract be reviewed on its own.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerGetEvents documents GET /api/v1/events.
//
// @Summary      Get events
// @Description  Returns events via the Kirmya events module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/events [get]
func swaggerGetEvents() {}

// swaggerCreateEvent documents POST /api/v1/events.
//
// @Summary      Create event
// @Description  Creates event via the Kirmya events module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        request  body  domain.CreateEventPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/events [post]
func swaggerCreateEvent() {}

// swaggerGetUserRegistrations documents GET /api/v1/events/my-events.
//
// @Summary      Get user registrations
// @Description  Returns user registrations via the Kirmya events module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        page   query  int  false  "Page number (1-based)"  default(1)
// @Param        limit  query  int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  swagger.PaginationResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/events/my-events [get]
func swaggerGetUserRegistrations() {}

// swaggerGetEventByID documents GET /api/v1/events/{id}.
//
// @Summary      Get event by ID
// @Description  Returns event by ID via the Kirmya events module. Requires a valid Bearer access token.
// @Tags         Communities
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/events/{id} [get]
func swaggerGetEventByID() {}

// swaggerRegisterAttendee documents POST /api/v1/events/{id}/register.
//
// @Summary      Register attendee
// @Description  Registers attendee via the Kirmya events module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  domain.RegisterEventPayload  true  "Request payload"
// @Success      201  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/events/{id}/register [post]
func swaggerRegisterAttendee() {}

// swaggerCancelRegistration documents POST /api/v1/events/{id}/cancel.
//
// @Summary      Cancel registration
// @Description  Cancels registration via the Kirmya events module. Requires a valid Bearer access token.
// @Tags         Communities
// @Accept       json
// @Produce      json
// @Param        id  path  string  true  "Id"
// @Param        request  body  object  false  "Request payload"
// @Success      200  {object}  swagger.SuccessResponse
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/events/{id}/cancel [post]
func swaggerCancelRegistration() {}

// The blank declarations below anchor the imports above. swag resolves the
// qualified type names in the annotations through this file's import set,
// and package names such as `domain` and `models` are not unique across
// modules, so the imports have to be explicit rather than inferred.
var (
	_ domain.RegisterEventPayload
	_ swagger.ErrorResponse
)
