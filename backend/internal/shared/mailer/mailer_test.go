package mailer

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestFromEnvResolvesBothNamingSchemes(t *testing.T) {
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_PORT", "465")
	t.Setenv("SMTP_USER", "legacy-user")
	t.Setenv("SMTP_SENDER_EMAIL", "noreply@example.com")
	t.Setenv("SMTP_SENDER_NAME", "Kirmya")

	m := FromEnv()

	if !m.Enabled() {
		t.Fatal("expected a configured mailer to be enabled")
	}
	if m.username != "legacy-user" {
		t.Errorf("SMTP_USER fallback not read, got %q", m.username)
	}
	if m.From() != "noreply@example.com" {
		t.Errorf("SMTP_SENDER_EMAIL fallback not read, got %q", m.From())
	}
	// Port 465 is SMTPS whatever SMTP_ENCRYPTION claims, or the handshake stalls.
	if !m.implicitTLS {
		t.Error("port 465 should dial TLS directly")
	}
}

func TestUnconfiguredMailerIsDisabledAndDoesNotSend(t *testing.T) {
	t.Setenv("SMTP_HOST", "")
	t.Setenv("SMTP_FROM_EMAIL", "")
	t.Setenv("SMTP_SENDER_EMAIL", "")
	t.Setenv("EMAIL_FROM", "")
	t.Setenv("SMTP_USERNAME", "")
	t.Setenv("SMTP_USER", "")

	m := FromEnv()

	if m.Enabled() {
		t.Fatal("mailer with no SMTP_HOST must be disabled")
	}
	if err := m.Send("user@example.com", "hi", "<p>hi</p>"); err == nil {
		t.Fatal("disabled mailer must report that smtp is not configured")
	}
}

func TestSendRejectsHeaderInjection(t *testing.T) {
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_FROM_EMAIL", "noreply@example.com")

	m := FromEnv()

	// A newline in either field would otherwise become a header of the
	// caller's choosing, including an extra Bcc.
	if err := m.Send("victim@example.com\r\nBcc: attacker@evil.test", "hi", "<p>hi</p>"); err == nil {
		t.Error("recipient with CRLF must be rejected")
	}
	if err := m.Send("user@example.com", "hi\nBcc: attacker@evil.test", "<p>hi</p>"); err == nil {
		t.Error("subject with LF must be rejected")
	}
}

func TestBuildWritesHTMLHeaders(t *testing.T) {
	m := &Mailer{fromEmail: "noreply@example.com", fromName: "Kirmya", replyTo: "support@example.com"}

	msg := string(m.build("user@example.com", "Verify your email", "<p>link</p>"))

	for _, want := range []string{
		"From: Kirmya <noreply@example.com>\r\n",
		"To: user@example.com\r\n",
		"Reply-To: support@example.com\r\n",
		"Subject: Verify your email\r\n",
		"Content-Type: text/html; charset=\"UTF-8\"\r\n",
		"\r\n\r\n<p>link</p>",
	} {
		if !strings.Contains(msg, want) {
			t.Errorf("message missing %q\n---\n%s", want, msg)
		}
	}
}

// The HTTPS transport exists because SMTP is not reachable everywhere. Railway
// disables outbound SMTP below its Pro plan, and on that deployment every
// connection to the mail host timed out on both 465 and 587 — which is what
// broke password resets in production.

func TestResendKeySelectsTheAPITransport(t *testing.T) {
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_SENDER_EMAIL", "noreply@example.com")
	t.Setenv("RESEND_API_KEY", "re_test_key")

	m := FromEnv()

	if !m.Enabled() {
		t.Fatal("a mailer with an API key must be enabled")
	}
	// The API key wins over SMTP, because a configured SMTP host that cannot be
	// reached is exactly the situation this transport is here for.
	if got := m.Transport(); got != "resend" {
		t.Errorf("transport is %q, want resend", got)
	}
}

func TestAPIKeyAloneIsEnoughToSend(t *testing.T) {
	// No SMTP_HOST at all: the HTTPS transport needs no mail server.
	t.Setenv("RESEND_API_KEY", "re_test_key")
	t.Setenv("RESEND_FROM_EMAIL", "noreply@kirmya.com")

	m := FromEnv()

	if !m.Enabled() {
		t.Fatal("an API key and a sender address are enough to send")
	}
	if m.From() != "noreply@kirmya.com" {
		t.Errorf("sender is %q, want noreply@kirmya.com", m.From())
	}
}

func TestSMTPStaysTheTransportWithoutAnAPIKey(t *testing.T) {
	t.Setenv("SMTP_HOST", "smtp.example.com")
	t.Setenv("SMTP_SENDER_EMAIL", "noreply@example.com")

	if got := FromEnv().Transport(); got != "smtp" {
		t.Errorf("transport is %q, want smtp", got)
	}
}

func TestAPISendPostsTheMessageAndAuthenticates(t *testing.T) {
	var gotAuth, gotBody string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		raw, _ := io.ReadAll(r.Body)
		gotBody = string(raw)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"id":"abc123"}`))
	}))
	defer server.Close()

	m := &Mailer{
		resendKey:  "re_test_key",
		fromEmail:  "noreply@kirmya.com",
		fromName:   "Kirmya",
		replyTo:    "support@kirmya.com",
		timeout:    5 * time.Second,
		httpClient: server.Client(),
		endpoint:   server.URL,
	}

	if err := m.Send("candidate@example.invalid", "Reset your Kirmya password", "<p>link</p>"); err != nil {
		t.Fatalf("send over the API transport: %v", err)
	}

	if gotAuth != "Bearer re_test_key" {
		t.Errorf("Authorization header is %q", gotAuth)
	}

	// Decoded rather than string-matched: encoding/json escapes < and > as
	// \u003c and \u003e, which is valid JSON and decodes back to the angle
	// brackets at the other end. Matching raw bytes would assert the encoder's
	// choices rather than the message that actually gets delivered.
	var sent struct {
		From    string   `json:"from"`
		To      []string `json:"to"`
		Subject string   `json:"subject"`
		HTML    string   `json:"html"`
		ReplyTo string   `json:"reply_to"`
	}
	if err := json.Unmarshal([]byte(gotBody), &sent); err != nil {
		t.Fatalf("the request body is not valid JSON: %v\n%s", err, gotBody)
	}

	if sent.From != "Kirmya <noreply@kirmya.com>" {
		t.Errorf("from is %q", sent.From)
	}
	if len(sent.To) != 1 || sent.To[0] != "candidate@example.invalid" {
		t.Errorf("to is %v", sent.To)
	}
	if sent.Subject != "Reset your Kirmya password" {
		t.Errorf("subject is %q", sent.Subject)
	}
	if sent.HTML != "<p>link</p>" {
		t.Errorf("html is %q, so the body would arrive altered", sent.HTML)
	}
	if sent.ReplyTo != "support@kirmya.com" {
		t.Errorf("reply_to is %q", sent.ReplyTo)
	}
}

// A rejection has to say enough to act on and not so much as to publish the
// credential: this error is written to the application log on every failure.
func TestAPIFailureIsReportedWithoutTheCredential(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnprocessableEntity)
		_, _ = w.Write([]byte(`{"message":"The kirmya.com domain is not verified"}`))
	}))
	defer server.Close()

	m := &Mailer{
		resendKey:  "re_super_secret_key",
		fromEmail:  "noreply@kirmya.com",
		timeout:    5 * time.Second,
		httpClient: server.Client(),
		endpoint:   server.URL,
	}

	err := m.Send("candidate@example.invalid", "Subject", "<p>body</p>")
	if err == nil {
		t.Fatal("a rejected send reported success")
	}
	if !strings.Contains(err.Error(), "not verified") {
		t.Errorf("the reason is missing from %q", err)
	}
	if strings.Contains(err.Error(), "re_super_secret_key") {
		t.Fatalf("the API key leaked into the error: %q", err)
	}
}

// The defect this whole change exists to stop: an unreachable mail host must
// fail quickly, not block until the kernel gives up on the connect.
func TestAnUnreachableSMTPHostFailsFastRatherThanHanging(t *testing.T) {
	// A port with nothing listening on a non-routable address, so the connect
	// hangs rather than being refused.
	m := &Mailer{
		host:      "10.255.255.1",
		port:      "587",
		fromEmail: "noreply@kirmya.com",
		timeout:   750 * time.Millisecond,
	}

	start := time.Now()
	err := m.Send("candidate@example.invalid", "Subject", "<p>body</p>")
	elapsed := time.Since(start)

	if err == nil {
		t.Fatal("sending to an unreachable host reported success")
	}
	// Generously above the configured timeout, and far below the ~2 minutes an
	// unbounded connect took in production.
	if elapsed > 10*time.Second {
		t.Errorf("an unreachable host blocked for %s; the timeout did not apply", elapsed)
	}
}
