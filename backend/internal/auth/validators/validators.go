package validators

import (
	"errors"
	"regexp"
	"strings"

	"kirmya/internal/auth/dto"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	upperRegex = regexp.MustCompile(`[A-Z]`)
	lowerRegex = regexp.MustCompile(`[a-z]`)
	digitRegex = regexp.MustCompile(`[0-9]`)
	specRegex  = regexp.MustCompile(`[!@#$%^&*()_+=\[\]{}|;:',.<>?/~\-]`)
)

// ValidateRegisterInput validates registration form inputs and password rules.
func ValidateRegisterInput(req *dto.RegisterRequest) error {
	req.NormalizeFields()

	fn := strings.TrimSpace(req.FirstName)
	if fn == "" {
		return errors.New("first name is required")
	}
	if len(fn) < 2 || len(fn) > 50 {
		return errors.New("first name must be between 2 and 50 characters")
	}

	ln := strings.TrimSpace(req.LastName)
	if ln == "" {
		return errors.New("last name is required")
	}
	if len(ln) < 2 || len(ln) > 50 {
		return errors.New("last name must be between 2 and 50 characters")
	}

	if !emailRegex.MatchString(req.Email) {
		return errors.New("invalid email address format")
	}

	if req.ConfirmPassword != "" && req.Password != req.ConfirmPassword {
		return errors.New("passwords do not match")
	}

	return ValidatePasswordPolicy(req.Password)
}

// ValidatePasswordPolicy verifies minimum 12 characters, uppercase, lowercase, digit, and special char.
func ValidatePasswordPolicy(password string) error {
	if len(password) < 12 {
		return errors.New("password must be at least 12 characters long")
	}
	if !upperRegex.MatchString(password) {
		return errors.New("password must contain at least one uppercase letter")
	}
	if !lowerRegex.MatchString(password) {
		return errors.New("password must contain at least one lowercase letter")
	}
	if !digitRegex.MatchString(password) {
		return errors.New("password must contain at least one number")
	}
	if !specRegex.MatchString(password) {
		return errors.New("password must contain at least one special character")
	}
	return nil
}
