// Package mailer sends transactional email over SMTP.
//
// It is deliberately small: the platform only needs to deliver a handful of
// short HTML messages (email verification, and whatever follows it), so this
// wraps net/smtp rather than pulling in a mail library. A Mailer built from an
// environment with no SMTP_HOST is disabled instead of erroring, which is what
// keeps `go test ./...` and a fresh local checkout working with no mail server.
package mailer

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strings"
)

// Mailer holds a resolved SMTP configuration. The zero value is disabled.
type Mailer struct {
	host        string
	port        string
	username    string
	password    string
	fromEmail   string
	fromName    string
	replyTo     string
	implicitTLS bool // dial TLS immediately (SMTPS) instead of upgrading with STARTTLS
}

// FromEnv reads the SMTP_* settings. Two naming schemes are accepted for the
// credential and sender keys because both are in circulation across this
// repository's env files; the first non-empty one wins.
func FromEnv() *Mailer {
	port := firstEnv("SMTP_PORT")
	if port == "" {
		port = "587"
	}

	m := &Mailer{
		host:      firstEnv("SMTP_HOST"),
		port:      port,
		username:  firstEnv("SMTP_USERNAME", "SMTP_USER"),
		password:  firstEnv("SMTP_PASSWORD", "SMTP_PASS"),
		fromEmail: firstEnv("SMTP_FROM_EMAIL", "SMTP_SENDER_EMAIL", "EMAIL_FROM"),
		fromName:  firstEnv("SMTP_FROM_NAME", "SMTP_SENDER_NAME"),
		replyTo:   firstEnv("SMTP_REPLY_TO"),
	}

	// Port 465 is SMTPS: the connection is TLS from the first byte and the
	// server never speaks plaintext EHLO, so a STARTTLS handshake stalls there.
	// Providers still label 465 "tls" in their setup docs (Hostinger does), so
	// the port decides rather than the label, and SMTP_ENCRYPTION only has to
	// name the implicit case explicitly for a provider on a nonstandard port.
	m.implicitTLS = port == "465" || strings.EqualFold(firstEnv("SMTP_ENCRYPTION"), "ssl")

	if m.fromEmail == "" {
		m.fromEmail = m.username
	}

	return m
}

// Enabled reports whether this Mailer has enough configuration to send.
func (m *Mailer) Enabled() bool {
	return m != nil && m.host != "" && m.fromEmail != ""
}

// From returns the configured sender address.
func (m *Mailer) From() string {
	if m == nil {
		return ""
	}
	return m.fromEmail
}

// Send delivers a single HTML message. It returns an error when the Mailer is
// disabled so callers decide what an unconfigured mail server means for them.
func (m *Mailer) Send(to, subject, htmlBody string) error {
	if !m.Enabled() {
		return fmt.Errorf("smtp is not configured")
	}

	// Recipient and subject reach us from user-supplied registration data, so a
	// CR/LF in either would let a caller append their own headers or extra
	// envelope recipients onto the message.
	if err := rejectHeaderInjection("recipient", to); err != nil {
		return err
	}
	if err := rejectHeaderInjection("subject", subject); err != nil {
		return err
	}

	msg := m.build(to, subject, htmlBody)
	addr := net.JoinHostPort(m.host, m.port)

	var auth smtp.Auth
	if m.username != "" {
		auth = smtp.PlainAuth("", m.username, m.password, m.host)
	}

	if !m.implicitTLS {
		// net/smtp upgrades with STARTTLS on its own when the server offers it,
		// and PlainAuth refuses to hand credentials to a server that does not.
		return smtp.SendMail(addr, auth, m.fromEmail, []string{to}, msg)
	}

	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: m.host})
	if err != nil {
		return fmt.Errorf("smtp tls dial %s: %w", addr, err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return fmt.Errorf("smtp client %s: %w", addr, err)
	}
	defer client.Close()

	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("smtp auth: %w", err)
		}
	}
	if err := client.Mail(m.fromEmail); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("smtp rcpt to: %w", err)
	}
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := w.Write(msg); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("smtp close body: %w", err)
	}

	return client.Quit()
}

// build assembles the RFC 5322 message. Headers are CRLF separated because some
// servers reject bare LF.
func (m *Mailer) build(to, subject, htmlBody string) []byte {
	from := m.fromEmail
	if m.fromName != "" {
		from = fmt.Sprintf("%s <%s>", m.fromName, m.fromEmail)
	}

	var b strings.Builder
	fmt.Fprintf(&b, "From: %s\r\n", from)
	fmt.Fprintf(&b, "To: %s\r\n", to)
	if m.replyTo != "" {
		fmt.Fprintf(&b, "Reply-To: %s\r\n", m.replyTo)
	}
	fmt.Fprintf(&b, "Subject: %s\r\n", subject)
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	b.WriteString("\r\n")
	b.WriteString(htmlBody)

	return []byte(b.String())
}

func rejectHeaderInjection(field, value string) error {
	if strings.ContainsAny(value, "\r\n") {
		return fmt.Errorf("invalid %s: line breaks are not allowed in mail headers", field)
	}
	return nil
}

func firstEnv(keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return value
		}
	}
	return ""
}
