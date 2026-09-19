//go:build ciintegration

package ci

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"
)

// TestEmployerOnboardingJourney exercises the full employer lifecycle:
// 1. Register and onboard as a recruiter.
// 2. Create a company profile via POST /api/v1/companies -> 201 with company ID.
// 3. GET company as the owner (verifying membership/owner standing).
// 4. Publish a job posting via API.
// 5. Ensure foreign users (both non-recruiters and foreign recruiters) cannot close it.
// 6. Verify owner can close the job.
func TestEmployerOnboardingJourney(t *testing.T) {
	base := required(t, "TEST_API_URL")

	// 1. Register and onboard recruiter
	recruiter := becomeRecruiter(t, base, registerAndLogin(t, base))
	foreignUser := registerAndLogin(t, base)
	foreignRecruiter := becomeRecruiter(t, base, registerAndLogin(t, base))

	// 2. Create company -> 201 with id
	companySlug := fmt.Sprintf("ci-emp-%s", strings.ToLower(uuid.NewString()[:8]))
	companyPayload := map[string]any{
		"name":        "Journey Employer Technologies",
		"slug":        companySlug,
		"industry":    "Technology",
		"description": "A high-growth technology enterprise created during employer onboarding journey test.",
	}

	createResp := do(t, http.MethodPost, base+"/api/v1/companies", recruiter.token, companyPayload)
	createBody, _ := readBody(createResp)
	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("create company: got %d want 201: %s", createResp.StatusCode, createBody)
	}

	var createdCompany struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		Slug string `json:"slug"`
	}
	if err := json.Unmarshal([]byte(createBody), &createdCompany); err != nil || createdCompany.ID == "" {
		t.Fatalf("create company response did not carry a valid ID: %s (err: %v)", createBody, err)
	}

	// 3. GET company as owner
	getResp := do(t, http.MethodGet, base+"/api/v1/companies/"+createdCompany.ID, recruiter.token, nil)
	getBody, _ := readBody(getResp)
	if getResp.StatusCode != http.StatusOK {
		t.Fatalf("GET company by id as owner: got %d want 200: %s", getResp.StatusCode, getBody)
	}

	var companyDetail struct {
		ID     string `json:"id"`
		Name   string `json:"name"`
		Slug   string `json:"slug"`
		Viewer *struct {
			IsMember    bool     `json:"isMember"`
			Roles       []string `json:"roles"`
			Permissions []string `json:"permissions"`
		} `json:"viewer"`
	}
	if err := json.Unmarshal([]byte(getBody), &companyDetail); err != nil {
		t.Fatalf("decoding company detail: %v", err)
	}
	if companyDetail.ID != createdCompany.ID {
		t.Errorf("company id mismatch: got %s want %s", companyDetail.ID, createdCompany.ID)
	}
	if companyDetail.Viewer == nil || !companyDetail.Viewer.IsMember {
		t.Errorf("owner was not recognized as member in viewer context: %s", getBody)
	}

	// Also verify the dedicated employer portal route
	empResp := do(t, http.MethodGet, base+"/api/v1/employer/company", recruiter.token, nil)
	empBody, _ := readBody(empResp)
	if empResp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/v1/employer/company as owner: got %d want 200: %s", empResp.StatusCode, empBody)
	}

	// 4. Publish job via API
	jobPayload := map[string]any{
		"title":          "Journey Lead Infrastructure Engineer",
		"description":    "Posting created by the employer onboarding journey test suite.",
		"status":         "Active",
		"workplaceType":  "Remote",
		"employmentType": "Full-time",
		"location":       "Remote",
	}
	jobResp := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs", recruiter.token, jobPayload)
	jobBody, _ := readBody(jobResp)
	if jobResp.StatusCode != http.StatusCreated {
		t.Fatalf("create job: got %d want 201: %s", jobResp.StatusCode, jobBody)
	}

	var createdJob struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}
	if err := json.Unmarshal([]byte(jobBody), &createdJob); err != nil || createdJob.ID == "" {
		t.Fatalf("expected job with id, got: %s", jobBody)
	}
	jobID := createdJob.ID

	// Explicitly publish via the publish endpoint
	pubResp := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs/"+jobID+"/publish", recruiter.token, nil)
	if pubResp.StatusCode != http.StatusOK {
		t.Fatalf("publish job via API: got %d want 200", pubResp.StatusCode)
	}

	// 5. Foreign user cannot close it
	// Ordinary foreign user without recruiter capability must be rejected with 403
	closeResp1 := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs/"+jobID+"/close", foreignUser.token, map[string]any{})
	if closeResp1.StatusCode != http.StatusForbidden {
		t.Errorf("foreign non-recruiter closing job: got %d want 403", closeResp1.StatusCode)
	}

	// Foreign recruiter without ownership must be rejected with 404 or 403
	closeResp2 := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs/"+jobID+"/close", foreignRecruiter.token, map[string]any{})
	if closeResp2.StatusCode != http.StatusNotFound && closeResp2.StatusCode != http.StatusForbidden {
		t.Errorf("foreign recruiter closing job: got %d want 404 or 403", closeResp2.StatusCode)
	}

	// Verify the job is still active and not closed
	checkResp := do(t, http.MethodGet, base+"/api/v1/recruiter/jobs/"+jobID, recruiter.token, nil)
	checkBody, _ := readBody(checkResp)
	if checkResp.StatusCode != http.StatusOK {
		t.Fatalf("reading back job after foreign close attempts: got %d want 200: %s", checkResp.StatusCode, checkBody)
	}
	if strings.Contains(strings.ToLower(checkBody), `"status":"closed"`) {
		t.Errorf("foreign user was able to close the job: %s", checkBody)
	}

	// 6. Verify owner can close the job
	ownerCloseResp := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs/"+jobID+"/close", recruiter.token, map[string]any{})
	if ownerCloseResp.StatusCode != http.StatusOK {
		t.Fatalf("owner closing own job: got %d want 200", ownerCloseResp.StatusCode)
	}

	// Read back to ensure status changed to closed
	closedResp := do(t, http.MethodGet, base+"/api/v1/recruiter/jobs/"+jobID, recruiter.token, nil)
	closedBody, _ := readBody(closedResp)
	if closedResp.StatusCode != http.StatusOK {
		t.Fatalf("reading closed job: got %d want 200: %s", closedResp.StatusCode, closedBody)
	}
	if !strings.Contains(strings.ToLower(closedBody), `"status":"closed"`) {
		t.Errorf("owner closed job but status is not closed: %s", closedBody)
	}
}
