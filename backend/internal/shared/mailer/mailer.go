// Package mailer sends transactional email, over an HTTPS API or over SMTP.
//
// It is deliberately small: the platform only needs to deliver a handful of
// short HTML messages (email verification, password resets, notification
// digests), so this wraps net/smtp and one HTTP endpoint rather than pulling in
// a mail library. A Mailer built from an environment with neither transport
// configured is disabled instead of erroring, which is what keeps
// `go test ./...` and a fresh local checkout working with no mail server.
//
// There are two transports because SMTP is not always reachable. Railway
// disables outbound SMTP entirely below its Pro plan, so on this deployment
// every connection to the mail host timed out — port 465 and port 587 alike,
// which is what took the password reset flow down: the send blocked in the
// request path until the browser gave up, and the user was told to check their
// own connection. An HTTPS API needs only port 443, which is open everywhere,
// so RESEND_API_KEY takes precedence when it is set.
package mailer

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"
)

// Mailer holds a resolved mail configuration. The zero value is disabled.
type Mailer struct {
	host        string
	port        string
	username    string
	password    string
	fromEmail   string
	fromName    string
	replyTo     string
	implicitTLS bool // dial TLS immediately (SMTPS) instead of upgrading with STARTTLS

	// resendKey selects the HTTPS transport. Never logged.
	resendKey  string
	httpClient *http.Client

	// endpoint is the API this posts to. Overridden only by tests, so the
	// transport can be exercised without reaching the real service.
	endpoint string

	// timeout bounds a single delivery attempt on either transport.
	//
	// Nothing bounded it before. net/smtp dials with no deadline, so an
	// unreachable mail host blocked until the kernel gave up on the TCP
	// connect — around two minutes — and because the send ran inline in the
	// HTTP handler, the request went with it.
	timeout time.Duration
}

// defaultTimeout is long enough for a mail server having a slow day and far
// short of a browser's patience.
const defaultTimeout = 10 * time.Second

// FromEnv reads the SMTP_* settings. Two naming schemes are accepted for the
// credential and sender keys because both are in circulation across this
// repository's env files; the first non-empty one wins.
func FromEnv() *Mailer {
	port := firstEnv("SMTP_PORT")
	if port == "" {
		port = "587"
	}

	m := &Mailer{
		resendKey: firstEnv("RESEND_API_KEY"),
		timeout:   defaultTimeout,
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
	// The HTTPS transport has no username to fall back on, so it accepts its
	// own sender key. Resend requires this address to be on a verified domain.
	if m.fromEmail == "" {
		m.fromEmail = firstEnv("RESEND_FROM_EMAIL")
	}

	m.httpClient = &http.Client{Timeout: m.timeout}

	return m
}

// Transport names the delivery route this Mailer will use, for logging and for
// the health report. It never returns anything derived from a credential.
func (m *Mailer) Transport() string {
	switch {
	case m == nil || m.fromEmail == "":
		return "none"
	case m.resendKey != "":
		return "resend"
	case m.host != "":
		return "smtp"
	default:
		return "none"
	}
}

// Enabled reports whether this Mailer has enough configuration to send over
// either transport.
func (m *Mailer) Enabled() bool {
	if m == nil || m.fromEmail == "" {
		return false
	}
	return m.resendKey != "" || m.host != ""
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
		return fmt.Errorf("no mail transport is configured")
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

	if m.resendKey != "" {
		return m.sendViaAPI(to, subject, htmlBody)
	}
	return m.sendViaSMTP(to, subject, htmlBody)
}

// sendViaSMTP delivers over SMTP, with a deadline on every stage.
func (m *Mailer) sendViaSMTP(to, subject, htmlBody string) error {
	msg := m.build(to, subject, htmlBody)
	addr := net.JoinHostPort(m.host, m.port)
	dialer := &net.Dialer{Timeout: m.dialTimeout()}

	var conn net.Conn
	var err error
	if m.implicitTLS {
		// Port 465 speaks TLS from the first byte.
		conn, err = tls.DialWithDialer(dialer, "tcp", addr, &tls.Config{ServerName: m.host})
		if err != nil {
			return fmt.Errorf("smtp tls dial %s: %w", addr, err)
		}
	} else {
		conn, err = dialer.Dial("tcp", addr)
		if err != nil {
			return fmt.Errorf("smtp dial %s: %w", addr, err)
		}
	}
	defer conn.Close()

	// A host that accepts the connection and then stops talking is as bad as
	// one that never accepts it, so the whole conversation is bounded too.
	if err := conn.SetDeadline(time.Now().Add(m.dialTimeout())); err != nil {
		return fmt.Errorf("smtp deadline %s: %w", addr, err)
	}

	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return fmt.Errorf("smtp client %s: %w", addr, err)
	}
	defer client.Close()

	if !m.implicitTLS {
		// Upgrade when the server offers it. PlainAuth refuses to hand
		// credentials to a connection that never became TLS, so an server that
		// does not offer STARTTLS fails at Auth rather than leaking a password.
		if ok, _ := client.Extension("STARTTLS"); ok {
			if err := client.StartTLS(&tls.Config{ServerName: m.host}); err != nil {
				return fmt.Errorf("smtp starttls %s: %w", addr, err)
			}
		}
	}

	if m.username != "" {
		if err := client.Auth(smtp.PlainAuth("", m.username, m.password, m.host)); err != nil {
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

// resendEndpoint is Resend's transactional send API.
const resendEndpoint = "https://api.resend.com/emails"

// sendViaAPI delivers over HTTPS.
//
// The API key travels in the Authorization header and appears in no error
// returned from here: a failed send is logged by the caller, and a credential
// in a log file is a credential published.
func (m *Mailer) sendViaAPI(to, subject, htmlBody string) error {
	payload := map[string]any{
		"from":    m.formattedFrom(),
		"to":      []string{to},
		"subject": subject,
		"html":    htmlBody,
	}
	if m.replyTo != "" {
		payload["reply_to"] = m.replyTo
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encode mail payload: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), m.dialTimeout())
	defer cancel()

	endpoint := m.endpoint
	if endpoint == "" {
		endpoint = resendEndpoint
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build mail request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+m.resendKey)
	req.Header.Set("Content-Type", "application/json")

	client := m.httpClient
	if client == nil {
		client = &http.Client{Timeout: m.dialTimeout()}
	}

	res, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("mail api request: %w", err)
	}
	defer res.Body.Close()

	// Read a bounded amount: the reason for a rejection is short, and an
	// unbounded read of someone else's response is a way to be hurt.
	answer, _ := io.ReadAll(io.LimitReader(res.Body, 4096))
	if res.StatusCode >= 300 {
		return fmt.Errorf("mail api answered %d: %s", res.StatusCode, strings.TrimSpace(string(answer)))
	}

	return nil
}

// dialTimeout is the configured timeout, or the default for a zero-value
// Mailer built by a test rather than by FromEnv.
func (m *Mailer) dialTimeout() time.Duration {
	if m.timeout <= 0 {
		return defaultTimeout
	}
	return m.timeout
}

// formattedFrom renders the sender as a mail header value.
func (m *Mailer) formattedFrom() string {
	if m.fromName != "" {
		return fmt.Sprintf("%s <%s>", m.fromName, m.fromEmail)
	}
	return m.fromEmail
}

// build assembles the RFC 5322 message. Headers are CRLF separated because some
// servers reject bare LF.
func (m *Mailer) build(to, subject, htmlBody string) []byte {
	from := m.formattedFrom()

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
