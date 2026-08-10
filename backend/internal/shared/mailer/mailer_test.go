package mailer

import (
	"strings"
	"testing"
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
