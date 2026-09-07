//go:build ciintegration

package ci

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func uploadPDF(t *testing.T, base string, user ciUser, name string, body []byte) (string, string) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile("file", name)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = part.Write(body); err != nil {
		t.Fatal(err)
	}
	_ = w.WriteField("title", name)
	_ = w.WriteField("document_type", "Resume")
	_ = w.WriteField("is_default", "true")
	if err = w.Close(); err != nil {
		t.Fatal(err)
	}
	req, err := http.NewRequest(http.MethodPost, base+"/api/v1/documents/upload", &buf)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer "+user.token)
	req.Header.Set("Content-Type", w.FormDataContentType())
	resp, err := httpClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("upload got %d: %s", resp.StatusCode, raw)
	}
	var doc struct{ ID, SHA256 string }
	if err = json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	if doc.ID == "" || len(doc.SHA256) != 64 {
		t.Fatalf("upload returned incomplete metadata: %s", raw)
	}
	return doc.ID, doc.SHA256
}

func TestBatch3HiringAndPrivacyLifecycle(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	candidate := registerAndLogin(t, base)
	foreignCandidate := registerAndLogin(t, base)
	recruiter := registerAndLogin(t, base)
	foreignRecruiter := registerAndLogin(t, base)
	accept := do(t, http.MethodPost, base+"/api/v1/legal/documents/terms/accept", candidate.token, map[string]any{"version": "1.0.0"})
	accept.Body.Close()
	if accept.StatusCode != http.StatusCreated {
		t.Fatalf("legal acceptance got %d", accept.StatusCode)
	}
	var acceptCount int
	if err = pool.QueryRow(ctx, `SELECT count(*) FROM legal_document_acceptances WHERE user_id=$1`, candidate.id).Scan(&acceptCount); err != nil || acceptCount != 1 {
		t.Fatalf("legal acceptance not durable: %d %v", acceptCount, err)
	}
	company := seedCompany(ctx, t, pool, "CI Batch3 Hiring")
	foreignCompany := seedCompany(ctx, t, pool, "CI Batch3 Foreign")
	job := uuid.New()
	foreignJob := uuid.New()
	questions := `[{"id":"eligible","text":"Are you eligible?","required":true}]`
	for _, seed := range []struct {
		id, company, recruiter uuid.UUID
		title                  string
	}{{job, company, uuid.MustParse(recruiter.id), "CI Batch3 owned role"}, {foreignJob, foreignCompany, uuid.MustParse(foreignRecruiter.id), "CI Batch3 foreign role"}} {
		if _, err = pool.Exec(ctx, `INSERT INTO jobs(id,company_id,recruiter_id,title,description,status,screening_questions,created_at) VALUES($1,$2,$3,$4,'batch3','active',$5::jsonb,NOW())`, seed.id, seed.company, seed.recruiter, seed.title, questions); err != nil {
			t.Fatal(err)
		}
	}

	docID, hash := uploadPDF(t, base, candidate, "resume.pdf", []byte("%PDF-1.4\nBatch 3 durable resume\n%%EOF"))
	foreignDoc, _ := uploadPDF(t, base, foreignCandidate, "foreign.pdf", []byte("%PDF-1.4\nForeign\n%%EOF"))
	t.Run("malware fixture is rejected", func(t *testing.T) {
		var buf bytes.Buffer
		w := multipart.NewWriter(&buf)
		p, _ := w.CreateFormFile("file", "eicar.pdf")
		_, _ = p.Write([]byte("%PDF-1.4 EICAR-STANDARD-ANTIVIRUS-TEST-FILE"))
		_ = w.Close()
		req, _ := http.NewRequest(http.MethodPost, base+"/api/v1/documents/upload", &buf)
		req.Header.Set("Authorization", "Bearer "+candidate.token)
		req.Header.Set("Content-Type", w.FormDataContentType())
		resp, err := httpClient().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("malware fixture got %d want 400", resp.StatusCode)
		}
	})

	apply := func(token, resume string, answers []map[string]string, key string) *http.Response {
		return do(t, http.MethodPost, base+"/api/v1/jobs/"+job.String()+"/apply", token, map[string]any{"resume_id": resume, "cover_letter": "Durable cover letter", "contact_name": "Edited Candidate", "contact_email": "edited@example.invalid", "contact_phone": "+971500000000", "answers": answers, "idempotency_key": key})
	}
	t.Run("required screening", func(t *testing.T) {
		resp := apply(candidate.token, docID, nil, "missing-answer")
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("missing answer got %d", resp.StatusCode)
		}
	})
	t.Run("foreign attachment", func(t *testing.T) {
		resp := apply(candidate.token, foreignDoc, []map[string]string{{"question_id": "eligible", "answer": "yes"}}, "foreign-doc")
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("foreign attachment got %d", resp.StatusCode)
		}
	})
	resp := apply(candidate.token, docID, []map[string]string{{"question_id": "eligible", "question_text": "Are you eligible?", "answer": "yes"}}, "submit-once")
	raw, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("apply got %d: %s", resp.StatusCode, raw)
	}
	var app struct {
		Summary struct {
			ID string `json:"id"`
		} `json:"summary"`
	}
	if err = json.Unmarshal(raw, &app); err != nil {
		t.Fatal(err)
	}
	if app.Summary.ID == "" {
		t.Fatalf("missing application receipt: %s", raw)
	}
	var snapName, snapEmail, snapPhone, snapHash, cover string
	if err = pool.QueryRow(ctx, `SELECT contact_name,contact_email,contact_phone,resume_sha256,cover_letter FROM job_applications WHERE id=$1`, app.Summary.ID).Scan(&snapName, &snapEmail, &snapPhone, &snapHash, &cover); err != nil {
		t.Fatal(err)
	}
	if snapName != "Edited Candidate" || snapEmail != "edited@example.invalid" || snapPhone != "+971500000000" || snapHash != hash || cover != "Durable cover letter" {
		t.Fatalf("application snapshot lost edits: %q %q %q %q %q", snapName, snapEmail, snapPhone, snapHash, cover)
	}
	retry := apply(candidate.token, docID, []map[string]string{{"question_id": "eligible", "answer": "yes"}}, "submit-once")
	retryRaw, _ := io.ReadAll(retry.Body)
	retry.Body.Close()
	if retry.StatusCode != http.StatusCreated || !bytes.Contains(retryRaw, []byte(app.Summary.ID)) {
		t.Fatalf("idempotent retry got %d %s", retry.StatusCode, retryRaw)
	}

	t.Run("recruiter organization isolation", func(t *testing.T) {
		owned := do(t, http.MethodGet, base+"/api/v1/recruiter/applications", recruiter.token, nil)
		ownedRaw, _ := io.ReadAll(owned.Body)
		owned.Body.Close()
		if owned.StatusCode != http.StatusOK || !bytes.Contains(ownedRaw, []byte(app.Summary.ID)) {
			t.Fatalf("owner list got %d %s", owned.StatusCode, ownedRaw)
		}
		foreign := do(t, http.MethodGet, base+"/api/v1/recruiter/applications", foreignRecruiter.token, nil)
		foreignRaw, _ := io.ReadAll(foreign.Body)
		foreign.Body.Close()
		if bytes.Contains(foreignRaw, []byte(app.Summary.ID)) {
			t.Fatal("foreign recruiter saw application")
		}
	})
	stage := do(t, http.MethodPut, base+"/api/v1/recruiter/applications/"+app.Summary.ID+"/stage", recruiter.token, map[string]any{"stage": "Shortlisted", "notes": "Reviewed against required answer"})
	stageRaw, _ := io.ReadAll(stage.Body)
	stage.Body.Close()
	if stage.StatusCode != http.StatusOK {
		t.Fatalf("stage got %d %s", stage.StatusCode, stageRaw)
	}
	start := time.Now().UTC().Add(24 * time.Hour).Truncate(time.Second)
	scheduleBody := map[string]any{"job_id": job.String(), "candidate_id": candidate.id, "candidate_name": "Edited Candidate", "type": "Video", "scheduled_at": start.Format(time.RFC3339), "duration_minutes": 45, "meeting_link": "https://example.invalid/meeting"}
	book := do(t, http.MethodPost, base+"/api/v1/recruiter/interviews", recruiter.token, scheduleBody)
	bookRaw, _ := io.ReadAll(book.Body)
	book.Body.Close()
	if book.StatusCode != http.StatusCreated {
		t.Fatalf("book got %d %s", book.StatusCode, bookRaw)
	}
	var booked struct {
		ID string `json:"id"`
	}
	_ = json.Unmarshal(bookRaw, &booked)
	conflict := do(t, http.MethodPost, base+"/api/v1/recruiter/interviews", recruiter.token, scheduleBody)
	conflict.Body.Close()
	if conflict.StatusCode < 400 {
		t.Fatal("conflicting interview was accepted")
	}
	interviewList := do(t, http.MethodGet, base+"/api/v1/recruiter/interviews", recruiter.token, nil)
	interviewListRaw, _ := io.ReadAll(interviewList.Body)
	interviewList.Body.Close()
	if interviewList.StatusCode != http.StatusOK || !bytes.Contains(interviewListRaw, []byte(booked.ID)) {
		t.Fatalf("owned interview was not returned: %d %s", interviewList.StatusCode, interviewListRaw)
	}
	foreignInterviewList := do(t, http.MethodGet, base+"/api/v1/recruiter/interviews", foreignRecruiter.token, nil)
	foreignInterviewListRaw, _ := io.ReadAll(foreignInterviewList.Body)
	foreignInterviewList.Body.Close()
	if foreignInterviewList.StatusCode != http.StatusOK || bytes.Contains(foreignInterviewListRaw, []byte(booked.ID)) {
		t.Fatalf("interview leaked across organizations: %d %s", foreignInterviewList.StatusCode, foreignInterviewListRaw)
	}
	candidateUpdate := do(t, http.MethodGet, base+"/api/v1/applications/"+app.Summary.ID, candidate.token, nil)
	candidateRaw, _ := io.ReadAll(candidateUpdate.Body)
	candidateUpdate.Body.Close()
	if candidateUpdate.StatusCode != http.StatusOK || !bytes.Contains(candidateRaw, []byte(`"current_status":"Interview"`)) || !bytes.Contains(candidateRaw, []byte(booked.ID)) {
		t.Fatalf("candidate did not receive interview update: %d %s", candidateUpdate.StatusCode, candidateRaw)
	}
	foreignCancel := do(t, http.MethodPut, base+"/api/v1/recruiter/interviews/"+booked.ID+"/cancel", foreignRecruiter.token, nil)
	foreignCancel.Body.Close()
	if foreignCancel.StatusCode < 400 {
		t.Fatal("foreign recruiter cancelled interview")
	}
	cancelInterview := do(t, http.MethodPut, base+"/api/v1/recruiter/interviews/"+booked.ID+"/cancel", recruiter.token, nil)
	cancelInterview.Body.Close()
	if cancelInterview.StatusCode != http.StatusOK {
		t.Fatalf("interview cancellation got %d", cancelInterview.StatusCode)
	}
	candidateUpdate = do(t, http.MethodGet, base+"/api/v1/applications/"+app.Summary.ID, candidate.token, nil)
	candidateRaw, _ = io.ReadAll(candidateUpdate.Body)
	candidateUpdate.Body.Close()
	if !bytes.Contains(candidateRaw, []byte(`"status":"cancelled"`)) {
		t.Fatalf("candidate did not receive cancellation: %s", candidateRaw)
	}

	closed := uuid.New()
	if _, err = pool.Exec(ctx, `INSERT INTO jobs(id,company_id,recruiter_id,title,description,status,created_at) VALUES($1,$2,$3,'closed','closed','closed',NOW())`, closed, company, uuid.MustParse(recruiter.id)); err != nil {
		t.Fatal(err)
	}
	closedResp := do(t, http.MethodPost, base+"/api/v1/jobs/"+closed.String()+"/apply", candidate.token, map[string]any{"resume_id": docID})
	closedResp.Body.Close()
	if closedResp.StatusCode != http.StatusBadRequest {
		t.Fatalf("closed job got %d", closedResp.StatusCode)
	}

	prefs := do(t, http.MethodPut, base+"/api/v1/privacy", candidate.token, map[string]any{"discover_in_search": false, "recruiter_discoverable": false, "messaging_permission": "None", "ai_data_usage": false, "analytics_consent": false})
	prefs.Body.Close()
	if prefs.StatusCode != http.StatusOK {
		t.Fatalf("privacy update got %d", prefs.StatusCode)
	}
	var stored bool
	if err = pool.QueryRow(ctx, `SELECT discover_in_search FROM privacy_preferences WHERE user_id=$1`, candidate.id).Scan(&stored); err != nil || stored {
		t.Fatalf("privacy preference not durable: %v %v", stored, err)
	}
	hiddenName := "Hidden" + uuid.NewString()[:8]
	if _, err = pool.Exec(ctx, `UPDATE users SET first_name=$2 WHERE id=$1`, candidate.id, hiddenName); err != nil {
		t.Fatal(err)
	}
	search := do(t, http.MethodGet, base+"/api/v1/recruiter/candidates/search?query="+hiddenName, recruiter.token, nil)
	searchRaw, _ := io.ReadAll(search.Body)
	search.Body.Close()
	if search.StatusCode != http.StatusOK || bytes.Contains(searchRaw, []byte(candidate.id)) {
		t.Fatalf("private candidate leaked through recruiter search: %d %s", search.StatusCode, searchRaw)
	}
	message := do(t, http.MethodPost, base+"/api/v1/messages/conversations", recruiter.token, map[string]any{"participant_id": candidate.id})
	message.Body.Close()
	if message.StatusCode != http.StatusBadRequest {
		t.Fatalf("messaging preference was not enforced: %d", message.StatusCode)
	}
	aiAttempt := do(t, http.MethodPost, base+"/api/v1/ai/resume-analysis", candidate.token, map[string]any{"resumeText": "private resume"})
	aiAttempt.Body.Close()
	if aiAttempt.StatusCode != http.StatusForbidden {
		t.Fatalf("AI privacy preference was not enforced before provider execution: %d", aiAttempt.StatusCode)
	}
	foreignDownload := do(t, http.MethodGet, base+"/api/v1/documents/"+docID+"/download", foreignCandidate.token, nil)
	foreignDownload.Body.Close()
	if foreignDownload.StatusCode != http.StatusNotFound {
		t.Fatalf("foreign document download got %d", foreignDownload.StatusCode)
	}
	export := do(t, http.MethodPost, base+"/api/v1/privacy/export", candidate.token, map[string]any{})
	exportRaw, _ := io.ReadAll(export.Body)
	export.Body.Close()
	if export.StatusCode != http.StatusOK {
		t.Fatalf("export request got %d %s", export.StatusCode, exportRaw)
	}
	var ej struct {
		ID string `json:"id"`
	}
	_ = json.Unmarshal(exportRaw, &ej)
	var status string
	for deadline := time.Now().Add(8 * time.Second); time.Now().Before(deadline); time.Sleep(250 * time.Millisecond) {
		check := do(t, http.MethodGet, base+"/api/v1/privacy/export/"+ej.ID, candidate.token, nil)
		var b struct {
			Status string `json:"status"`
		}
		_ = json.NewDecoder(check.Body).Decode(&b)
		check.Body.Close()
		status = b.Status
		if status == "completed" {
			break
		}
	}
	if status != "completed" {
		t.Fatalf("export did not complete: %s", status)
	}
	download := do(t, http.MethodGet, base+"/api/v1/privacy/export/"+ej.ID+"/download", candidate.token, nil)
	downloadRaw, _ := io.ReadAll(download.Body)
	download.Body.Close()
	if download.StatusCode != http.StatusOK || !bytes.Contains(downloadRaw, []byte(candidate.email)) {
		t.Fatalf("authorized export got %d %s", download.StatusCode, downloadRaw)
	}
	foreignExport := do(t, http.MethodGet, base+"/api/v1/privacy/export/"+ej.ID+"/download", foreignCandidate.token, nil)
	foreignExport.Body.Close()
	if foreignExport.StatusCode != http.StatusNotFound {
		t.Fatalf("foreign export got %d", foreignExport.StatusCode)
	}
	if _, err = pool.Exec(ctx, `UPDATE data_export_jobs SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1`, ej.ID); err != nil {
		t.Fatal(err)
	}
	expired := do(t, http.MethodGet, base+"/api/v1/privacy/export/"+ej.ID+"/download", candidate.token, nil)
	expired.Body.Close()
	if expired.StatusCode != http.StatusNotFound {
		t.Fatalf("expired export got %d", expired.StatusCode)
	}
	cancelExportID := uuid.New()
	if _, err = pool.Exec(ctx, `INSERT INTO data_export_jobs(id,user_id,status,expires_at,max_attempts,created_at,updated_at) VALUES($1,$2,'pending',NOW()+INTERVAL '7 days',0,NOW(),NOW())`, cancelExportID, candidate.id); err != nil {
		t.Fatal(err)
	}
	cancelExport := do(t, http.MethodPost, base+"/api/v1/privacy/export/"+cancelExportID.String()+"/cancel", candidate.token, nil)
	cancelExport.Body.Close()
	if cancelExport.StatusCode != http.StatusOK {
		t.Fatalf("export cancellation got %d", cancelExport.StatusCode)
	}

	// A legal hold produces a durable worker failure. Releasing it and resetting
	// the retry budget lets the same job resume and propagate deletion to bytes,
	// profiles, sessions and account/search state.
	deleteResp := do(t, http.MethodPost, base+"/api/v1/privacy/delete-account", foreignCandidate.token, map[string]any{"reason": "batch3 lifecycle proof"})
	deleteRaw, _ := io.ReadAll(deleteResp.Body)
	deleteResp.Body.Close()
	if deleteResp.StatusCode != http.StatusOK {
		t.Fatalf("deletion request got %d %s", deleteResp.StatusCode, deleteRaw)
	}
	var deletion struct {
		ID string `json:"id"`
	}
	_ = json.Unmarshal(deleteRaw, &deletion)
	holdID := uuid.New()
	if _, err = pool.Exec(ctx, `INSERT INTO legal_holds(id,resource_type,resource_id,reason,is_active,created_at) VALUES($1,'user',$2,'batch3 test hold',true,NOW())`, holdID, foreignCandidate.id); err != nil {
		t.Fatal(err)
	}
	if _, err = pool.Exec(ctx, `UPDATE data_deletion_requests SET grace_period_expires_at=NOW()-INTERVAL '1 second' WHERE id=$1`, deletion.ID); err != nil {
		t.Fatal(err)
	}
	var deletionStatus string
	for deadline := time.Now().Add(6 * time.Second); time.Now().Before(deadline); time.Sleep(250 * time.Millisecond) {
		_ = pool.QueryRow(ctx, `SELECT status FROM data_deletion_requests WHERE id=$1`, deletion.ID).Scan(&deletionStatus)
		if deletionStatus == "failed" {
			break
		}
	}
	if deletionStatus != "failed" {
		t.Fatalf("legal-hold deletion did not fail durably: %s", deletionStatus)
	}
	if _, err = pool.Exec(ctx, `UPDATE legal_holds SET is_active=false,released_at=NOW() WHERE id=$1`, holdID); err != nil {
		t.Fatal(err)
	}
	if _, err = pool.Exec(ctx, `UPDATE data_deletion_requests SET attempt_count=0,status='failed' WHERE id=$1`, deletion.ID); err != nil {
		t.Fatal(err)
	}
	for deadline := time.Now().Add(6 * time.Second); time.Now().Before(deadline); time.Sleep(250 * time.Millisecond) {
		_ = pool.QueryRow(ctx, `SELECT status FROM data_deletion_requests WHERE id=$1`, deletion.ID).Scan(&deletionStatus)
		if deletionStatus == "completed" {
			break
		}
	}
	if deletionStatus != "completed" {
		t.Fatalf("deletion retry did not complete: %s", deletionStatus)
	}
	var userStatus string
	var contentPresent bool
	if err = pool.QueryRow(ctx, `SELECT status FROM users WHERE id=$1`, foreignCandidate.id).Scan(&userStatus); err != nil || userStatus != "deleted" {
		t.Fatalf("account not anonymized: %s %v", userStatus, err)
	}
	if err = pool.QueryRow(ctx, `SELECT content IS NOT NULL FROM candidate_documents WHERE id=$1`, foreignDoc).Scan(&contentPresent); err != nil || contentPresent {
		t.Fatalf("document bytes survived deletion: %v %v", contentPresent, err)
	}
	failingExport := uuid.New()
	if _, err = pool.Exec(ctx, `INSERT INTO data_export_jobs(id,user_id,status,expires_at,created_at,updated_at) VALUES($1,$2,'pending',NOW()+INTERVAL '7 days',NOW(),NOW())`, failingExport, foreignCandidate.id); err != nil {
		t.Fatal(err)
	}
	var exportStatus string
	var attempts int
	for deadline := time.Now().Add(7 * time.Second); time.Now().Before(deadline); time.Sleep(300 * time.Millisecond) {
		_ = pool.QueryRow(ctx, `SELECT status,attempt_count FROM data_export_jobs WHERE id=$1`, failingExport).Scan(&exportStatus, &attempts)
		if exportStatus == "failed" && attempts == 3 {
			break
		}
	}
	if exportStatus != "failed" || attempts != 3 {
		t.Fatalf("worker failure/retries got status=%s attempts=%d", exportStatus, attempts)
	}
	cancelDeleteUser := recruiter
	cancelDelete := do(t, http.MethodPost, base+"/api/v1/privacy/delete-account", cancelDeleteUser.token, map[string]any{"reason": "cancel proof"})
	cancelDelete.Body.Close()
	if cancelDelete.StatusCode != http.StatusOK {
		t.Fatalf("cancellable deletion create got %d", cancelDelete.StatusCode)
	}
	cancelled := do(t, http.MethodPost, base+"/api/v1/privacy/delete-account/cancel", cancelDeleteUser.token, nil)
	cancelled.Body.Close()
	if cancelled.StatusCode != http.StatusOK {
		t.Fatalf("deletion cancellation got %d", cancelled.StatusCode)
	}

	if _, err = pool.Exec(ctx, `INSERT INTO users(id,uuid,first_name,last_name,email,password_hash,status) VALUES($1,$1,'Restart','Proof',$2,'!','active') ON CONFLICT(email) DO UPDATE SET first_name='Restart',status='active'`, uuid.New(), "ci-b3-restart@example.invalid"); err != nil {
		t.Fatal(err)
	}
	var savedHash string
	if err = pool.QueryRow(ctx, `SELECT sha256 FROM candidate_documents WHERE id=$1`, docID).Scan(&savedHash); err != nil || savedHash != hash {
		t.Fatalf("document metadata mismatch %q %v", savedHash, err)
	}
}

// TestBatch3RestartReadback runs against a freshly started API process using
// the database the previous process wrote through. A directly inserted row only
// proves PostgreSQL kept it, so the substantive assertions re-sign in as the
// candidate and read the application snapshot and document bytes back over
// HTTP: business data written by the previous process must still be served.
func TestBatch3RestartReadback(t *testing.T) {
	if os.Getenv("POST_RESTART") != "1" {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	var first, status string
	if err = pool.QueryRow(ctx, `SELECT first_name,status FROM users WHERE email='ci-b3-restart@example.invalid'`).Scan(&first, &status); err != nil {
		t.Fatal(err)
	}
	if first != "Restart" || status != "active" {
		t.Fatalf("restart readback mismatch %q %q", first, status)
	}
	resp, err := http.Get(base + "/health")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("restarted API health=%d", resp.StatusCode)
	}

	var appID, candidateEmail, docID, wantHash string
	if err = pool.QueryRow(ctx, `SELECT a.id::text,u.email,a.resume_id::text,a.resume_sha256
		FROM job_applications a JOIN users u ON u.id=a.candidate_id
		WHERE a.contact_email='edited@example.invalid'
		ORDER BY a.applied_at DESC LIMIT 1`).Scan(&appID, &candidateEmail, &docID, &wantHash); err != nil {
		t.Fatalf("pre-restart application row missing: %v", err)
	}
	loginBody, err := json.Marshal(map[string]any{"email": candidateEmail, "password": ciPassword})
	if err != nil {
		t.Fatal(err)
	}
	loginResp, err := httpClient().Post(base+"/api/v1/auth/login", "application/json", bytes.NewReader(loginBody))
	if err != nil {
		t.Fatal(err)
	}
	defer loginResp.Body.Close()
	if loginResp.StatusCode != http.StatusOK {
		t.Fatalf("post-restart login got %d", loginResp.StatusCode)
	}
	var login struct {
		AccessToken string `json:"accessToken"`
		Token       string `json:"token"`
	}
	if err = json.NewDecoder(loginResp.Body).Decode(&login); err != nil {
		t.Fatal(err)
	}
	token := login.AccessToken
	if token == "" {
		token = login.Token
	}
	if token == "" {
		t.Fatal("post-restart login returned no access token")
	}

	receipt := do(t, http.MethodGet, base+"/api/v1/applications/"+appID, token, nil)
	receiptRaw, _ := io.ReadAll(receipt.Body)
	receipt.Body.Close()
	if receipt.StatusCode != http.StatusOK {
		t.Fatalf("post-restart application receipt got %d: %s", receipt.StatusCode, receiptRaw)
	}
	for _, want := range []string{"Edited Candidate", "edited@example.invalid", "+971500000000", "Durable cover letter"} {
		if !bytes.Contains(receiptRaw, []byte(want)) {
			t.Fatalf("post-restart receipt lost %q: %s", want, receiptRaw)
		}
	}

	download := do(t, http.MethodGet, base+"/api/v1/documents/"+docID+"/download", token, nil)
	documentBytes, _ := io.ReadAll(download.Body)
	download.Body.Close()
	if download.StatusCode != http.StatusOK {
		t.Fatalf("post-restart document download got %d", download.StatusCode)
	}
	if got := fmt.Sprintf("%x", sha256.Sum256(documentBytes)); got != wantHash {
		t.Fatalf("post-restart document bytes changed: got %s want %s", got, wantHash)
	}
}

// TestBatch3DeletionWorkerFailureIsDurable covers the deletion failure that is
// not a legal hold: the work transaction rolls back, so the recorded failure and
// the consumed attempt have to survive on their own. Without that the request
// keeps its pre-attempt state and the worker retries the same broken deletion
// forever with nothing to diagnose. A disposable statement trigger forces the
// failure so the check does not depend on a particular schema constraint.
func TestBatch3DeletionWorkerFailureIsDurable(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	victim := registerAndLogin(t, base)

	request := do(t, http.MethodPost, base+"/api/v1/privacy/delete-account", victim.token, map[string]any{"reason": "worker failure proof"})
	requestRaw, _ := io.ReadAll(request.Body)
	request.Body.Close()
	if request.StatusCode != http.StatusOK {
		t.Fatalf("deletion request got %d %s", request.StatusCode, requestRaw)
	}
	var deletion struct {
		ID string `json:"id"`
	}
	if err = json.Unmarshal(requestRaw, &deletion); err != nil || deletion.ID == "" {
		t.Fatalf("deletion request returned no id: %s", requestRaw)
	}

	if _, err = pool.Exec(ctx, `CREATE OR REPLACE FUNCTION ci_block_profile_delete() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'ci forced deletion failure'; END $$ LANGUAGE plpgsql`); err != nil {
		t.Fatal(err)
	}
	if _, err = pool.Exec(ctx, `CREATE TRIGGER ci_block_profile_delete BEFORE DELETE ON profiles EXECUTE FUNCTION ci_block_profile_delete()`); err != nil {
		t.Fatal(err)
	}
	dropTrigger := func() {
		if _, dropErr := pool.Exec(ctx, `DROP TRIGGER IF EXISTS ci_block_profile_delete ON profiles`); dropErr != nil {
			t.Fatalf("could not remove the forced-failure trigger: %v", dropErr)
		}
	}
	defer dropTrigger()

	if _, err = pool.Exec(ctx, `UPDATE data_deletion_requests SET grace_period_expires_at=NOW()-INTERVAL '1 second' WHERE id=$1`, deletion.ID); err != nil {
		t.Fatal(err)
	}
	var status, lastError string
	var attempts int
	for deadline := time.Now().Add(15 * time.Second); time.Now().Before(deadline); time.Sleep(250 * time.Millisecond) {
		_ = pool.QueryRow(ctx, `SELECT status,attempt_count,COALESCE(last_error,'') FROM data_deletion_requests WHERE id=$1`, deletion.ID).Scan(&status, &attempts, &lastError)
		if status == "failed" && attempts > 0 && lastError != "" {
			break
		}
	}
	if status != "failed" || attempts == 0 || !strings.Contains(lastError, "ci forced deletion failure") {
		t.Fatalf("deletion failure was not durable: status=%s attempts=%d error=%q", status, attempts, lastError)
	}
	var victimStatus string
	if err = pool.QueryRow(ctx, `SELECT status FROM users WHERE id=$1`, victim.id).Scan(&victimStatus); err != nil {
		t.Fatal(err)
	}
	if victimStatus == "deleted" {
		t.Fatal("a failed deletion anonymized the account anyway")
	}

	dropTrigger()
	if _, err = pool.Exec(ctx, `UPDATE data_deletion_requests SET attempt_count=0 WHERE id=$1`, deletion.ID); err != nil {
		t.Fatal(err)
	}
	for deadline := time.Now().Add(15 * time.Second); time.Now().Before(deadline); time.Sleep(250 * time.Millisecond) {
		_ = pool.QueryRow(ctx, `SELECT status FROM data_deletion_requests WHERE id=$1`, deletion.ID).Scan(&status)
		if status == "completed" {
			break
		}
	}
	if status != "completed" {
		t.Fatalf("deletion did not recover after the forced failure was removed: %s", status)
	}
	if err = pool.QueryRow(ctx, `SELECT status FROM users WHERE id=$1`, victim.id).Scan(&victimStatus); err != nil || victimStatus != "deleted" {
		t.Fatalf("recovered deletion did not anonymize the account: %s %v", victimStatus, err)
	}
}

// TestBatch3ConcurrentInterviewBooking books overlapping — deliberately not
// identical — slots from several goroutines at once. Identical slots would be
// caught by the unique index alone, so staggered starts are what actually
// exercise the advisory lock around the overlap check. Exactly one may win.
// The last booking repeats an overlapping instant in a non-UTC offset, so the
// conflict check is shown to compare instants rather than wall-clock strings.
func TestBatch3ConcurrentInterviewBooking(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	candidate := registerAndLogin(t, base)
	recruiter := registerAndLogin(t, base)
	company := seedCompany(ctx, t, pool, "CI Batch3 Booking")
	job := uuid.New()
	if _, err = pool.Exec(ctx, `INSERT INTO jobs(id,company_id,recruiter_id,title,description,status,created_at) VALUES($1,$2,$3,'CI Batch3 booking role','batch3','active',NOW())`, job, company, uuid.MustParse(recruiter.id)); err != nil {
		t.Fatal(err)
	}
	docID, _ := uploadPDF(t, base, candidate, "booking.pdf", []byte("%PDF-1.4\nBooking\n%%EOF"))
	applied := do(t, http.MethodPost, base+"/api/v1/jobs/"+job.String()+"/apply", candidate.token, map[string]any{"resume_id": docID, "idempotency_key": "booking-" + job.String()})
	appliedRaw, _ := io.ReadAll(applied.Body)
	applied.Body.Close()
	if applied.StatusCode != http.StatusCreated {
		t.Fatalf("apply got %d %s", applied.StatusCode, appliedRaw)
	}

	slot := time.Now().UTC().Add(48 * time.Hour).Truncate(time.Hour)
	const attempts = 4
	results := make(chan int, attempts)
	var wg sync.WaitGroup
	for i := 0; i < attempts; i++ {
		wg.Add(1)
		go func(offset int) {
			defer wg.Done()
			body := map[string]any{"job_id": job.String(), "candidate_id": candidate.id, "candidate_name": "Booking Candidate", "type": "Video", "scheduled_at": slot.Add(time.Duration(offset) * time.Minute).Format(time.RFC3339), "duration_minutes": 45}
			resp := do(t, http.MethodPost, base+"/api/v1/recruiter/interviews", recruiter.token, body)
			resp.Body.Close()
			results <- resp.StatusCode
		}(i)
	}
	wg.Wait()
	close(results)
	created := 0
	for status := range results {
		if status == http.StatusCreated {
			created++
		}
	}
	if created != 1 {
		t.Fatalf("concurrent overlapping bookings created %d interviews, want exactly 1", created)
	}
	var stored int
	if err = pool.QueryRow(ctx, `SELECT count(*) FROM interviews WHERE candidate_id=$1 AND status<>'cancelled'`, candidate.id).Scan(&stored); err != nil {
		t.Fatal(err)
	}
	if stored != 1 {
		t.Fatalf("database holds %d live interviews for the candidate, want 1", stored)
	}

	// Same overlapping instant, expressed in +04:00 rather than UTC.
	elsewhere := slot.Add(30 * time.Minute).In(time.FixedZone("GST", 4*60*60))
	tzBooking := do(t, http.MethodPost, base+"/api/v1/recruiter/interviews", recruiter.token, map[string]any{"job_id": job.String(), "candidate_id": candidate.id, "candidate_name": "Booking Candidate", "type": "Video", "scheduled_at": elsewhere.Format(time.RFC3339), "duration_minutes": 45})
	tzBooking.Body.Close()
	if tzBooking.StatusCode < 400 {
		t.Fatalf("an overlapping booking in another timezone was accepted: %d", tzBooking.StatusCode)
	}
}

// TestBatch3RecruiterPublishesRealJob publishes through the API rather than
// seeding SQL. The rest of the suite seeds jobs directly, which is why a broken
// publish endpoint — a fresh recruiter's profile violated the organization and
// recruiter_profiles foreign keys — reached the browser suite unnoticed. It also
// pins the listing to real rows: it used to answer with two hard-coded jobs
// whenever the query failed or found nothing.
func TestBatch3RecruiterPublishesRealJob(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	recruiter := registerAndLogin(t, base)

	empty := do(t, http.MethodGet, base+"/api/v1/recruiter/jobs", recruiter.token, nil)
	emptyRaw, _ := io.ReadAll(empty.Body)
	empty.Body.Close()
	if empty.StatusCode != http.StatusOK {
		t.Fatalf("job listing got %d %s", empty.StatusCode, emptyRaw)
	}
	for _, invented := range []string{"11111111-1111-1111-1111-111111111111", "Senior Go Backend Architect"} {
		if bytes.Contains(emptyRaw, []byte(invented)) {
			t.Fatalf("a recruiter with no postings was shown an invented job (%s): %s", invented, emptyRaw)
		}
	}

	title := "CI Batch3 published role " + uuid.NewString()[:8]
	created := do(t, http.MethodPost, base+"/api/v1/recruiter/jobs", recruiter.token, map[string]any{"title": title, "description": "published through the API", "status": "Active", "workplaceType": "Remote", "employmentType": "Full-time"})
	createdRaw, _ := io.ReadAll(created.Body)
	created.Body.Close()
	if created.StatusCode != http.StatusCreated {
		t.Fatalf("job publication got %d %s", created.StatusCode, createdRaw)
	}
	var published struct {
		ID string `json:"id"`
	}
	if err = json.Unmarshal(createdRaw, &published); err != nil || published.ID == "" {
		t.Fatalf("job publication returned no id: %s", createdRaw)
	}
	var canonical, mirrored int
	if err = pool.QueryRow(ctx, `SELECT count(*) FROM jobs WHERE id=$1`, published.ID).Scan(&canonical); err != nil || canonical != 1 {
		t.Fatalf("published job missing from jobs: %d %v", canonical, err)
	}
	if err = pool.QueryRow(ctx, `SELECT count(*) FROM recruiter_jobs WHERE id=$1`, published.ID).Scan(&mirrored); err != nil || mirrored != 1 {
		t.Fatalf("published job missing from recruiter_jobs: %d %v", mirrored, err)
	}
	listed := do(t, http.MethodGet, base+"/api/v1/recruiter/jobs", recruiter.token, nil)
	listedRaw, _ := io.ReadAll(listed.Body)
	listed.Body.Close()
	if listed.StatusCode != http.StatusOK || !bytes.Contains(listedRaw, []byte(title)) {
		t.Fatalf("published job was not listed back: %d %s", listed.StatusCode, listedRaw)
	}
}

// TestBatch3PublicProfileVisibility pins the stored preference to the actual
// public read. The column defaults to 'Public' while the query compared against
// lowercase 'public', so the check was false for every user who had a
// preferences row and every public profile answered not-found. Both directions
// are asserted so neither a hidden profile leaking nor a visible one
// disappearing can pass.
func TestBatch3PublicProfileVisibility(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	base := required(t, "TEST_API_URL")
	pool, err := pgxpool.New(ctx, required(t, "DATABASE_URL"))
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	subject := registerAndLogin(t, base)

	created := do(t, http.MethodPut, base+"/api/v1/profile/me", subject.token, map[string]any{"headline": "Batch3 visible headline"})
	created.Body.Close()
	if created.StatusCode != http.StatusOK {
		t.Fatalf("profile update got %d", created.StatusCode)
	}

	visible := do(t, http.MethodGet, base+"/api/v1/profiles/"+subject.id, "", nil)
	visible.Body.Close()
	if visible.StatusCode != http.StatusOK {
		t.Fatalf("a public profile was not readable: %d", visible.StatusCode)
	}

	hidden := do(t, http.MethodPut, base+"/api/v1/privacy", subject.token, map[string]any{"profile_visibility": "Private"})
	hidden.Body.Close()
	if hidden.StatusCode != http.StatusOK {
		t.Fatalf("privacy update got %d", hidden.StatusCode)
	}
	var stored string
	if err = pool.QueryRow(ctx, `SELECT profile_visibility FROM privacy_preferences WHERE user_id=$1`, subject.id).Scan(&stored); err != nil {
		t.Fatal(err)
	}
	if stored != "Private" {
		t.Fatalf("privacy preference not durable: %q", stored)
	}
	afterHiding := do(t, http.MethodGet, base+"/api/v1/profiles/"+subject.id, "", nil)
	afterHiding.Body.Close()
	if afterHiding.StatusCode != http.StatusNotFound {
		t.Fatalf("a private profile stayed publicly readable: %d", afterHiding.StatusCode)
	}
}
