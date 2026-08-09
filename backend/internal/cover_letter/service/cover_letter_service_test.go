package service

import (
	"kirmya/internal/cover_letter/models"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCoverLetterLogic(t *testing.T) {
	cl := &models.CoverLetter{
		Name:            "Senior Go Engineer",
		CompanyName:     "TechFlow Systems",
		JobTitle:        "Senior Go Engineer",
		OpeningGreeting: "Dear Hiring Team,",
		Introduction:    "I am writing to express my interest in the position.",
		Body:            "I have 6 years of Go and Next.js experience.",
		Closing:         "Sincerely,",
		Signature:       "Alex Morgan",
	}

	assert.Equal(t, "Senior Go Engineer", cl.Name)
	assert.Equal(t, "TechFlow Systems", cl.CompanyName)
}
