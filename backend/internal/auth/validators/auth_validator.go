package validators

import (
	"kirmya/internal/auth/dto"
)

// ValidateRegisterPayload validates register DTO payload.
func ValidateRegisterPayload(req *dto.RegisterRequest) error {
	return ValidateRegisterInput(req)
}
