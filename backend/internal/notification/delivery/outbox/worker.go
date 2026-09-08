package outbox

import (
	"context"
	"fmt"
	"html"
	"log/slog"
	"strings"
	"time"
)

// Worker drains the outbox.
//
// It runs beside the privacy worker in main.go and follows the same shape: a
// ticker, one pass per tick, and every error logged rather than dropped. A pass
// that fails does not stop the loop — the rows it did not claim are still due.
type Worker struct {
	store   *Store
	senders map[Channel]Sender
	batch   int
	logger  *slog.Logger
}

// NewWorker builds the worker. A channel with no sender registered dead-letters
// its deliveries immediately rather than retrying them into a void.
func NewWorker(store *Store, batch int, senders ...Sender) *Worker {
	if batch <= 0 {
		batch = 20
	}
	registry := make(map[Channel]Sender, len(senders))
	for _, s := range senders {
		if s != nil {
			registry[s.Channel()] = s
		}
	}
	return &Worker{store: store, senders: registry, batch: batch, logger: slog.Default()}
}

// Channels reports which routes this worker can actually deliver on, for the
// startup log. A deployment with no SMTP configured should be able to see that
// email notifications will dead-letter, rather than discovering it from a
// support ticket.
func (w *Worker) Channels() []string {
	names := make([]string, 0, len(w.senders))
	for channel := range w.senders {
		names = append(names, string(channel))
	}
	return names
}

// Run drains the outbox every interval until the context is cancelled.
func (w *Worker) Run(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = 30 * time.Second
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if sent, failed, err := w.Pass(ctx); err != nil {
				w.logger.Error("notification delivery pass failed", slog.String("error", err.Error()))
			} else if sent > 0 || failed > 0 {
				w.logger.Info("notification delivery pass",
					slog.Int("sent", sent), slog.Int("failed", failed))
			}
		}
	}
}

// Pass claims one batch and attempts each delivery. It reports how many
// arrived and how many did not, so a caller — a test, or the loop above — can
// assert on the outcome rather than on the absence of an error.
func (w *Worker) Pass(ctx context.Context) (sent int, failed int, err error) {
	messages, err := w.store.ClaimDue(ctx, w.batch)
	if err != nil {
		return 0, 0, err
	}

	for _, msg := range messages {
		sender, ok := w.senders[msg.Channel]
		if !ok {
			// Terminal: no amount of retrying configures a provider. It is
			// dead-lettered so an operator can see the channel is unwired and
			// replay the backlog once it is.
			if markErr := w.store.MarkFailed(ctx, msg,
				fmt.Errorf("%w: %s", ErrNoSender, msg.Channel), true); markErr != nil {
				w.logger.Error("could not record an unsendable delivery",
					slog.String("error", markErr.Error()))
			}
			failed++
			continue
		}

		if sendErr := sender.Send(ctx, msg); sendErr != nil {
			if markErr := w.store.MarkFailed(ctx, msg, sendErr, false); markErr != nil {
				w.logger.Error("could not record a failed delivery",
					slog.String("error", markErr.Error()))
			}
			failed++
			continue
		}

		if markErr := w.store.MarkSent(ctx, msg.DeliveryID, string(msg.Channel)); markErr != nil {
			// The message arrived but we could not record it. Logged loudly:
			// the row is still Retrying, so it will be sent again, and a
			// duplicate is the price of not silently losing the record.
			w.logger.Error("delivery succeeded but could not be recorded",
				slog.String("delivery_id", msg.DeliveryID.String()),
				slog.String("error", markErr.Error()))
		}
		sent++
	}

	return sent, failed, nil
}

// mailSender delivers over the platform's SMTP mailer.
type mailSender struct {
	mailer mailer
	appURL string
}

// mailer is the slice of shared/mailer this package uses, declared here so a
// test can observe what would have been sent.
type mailer interface {
	Enabled() bool
	Send(to, subject, htmlBody string) error
}

// NewMailSender returns an email sender, or nil when no mail transport is
// configured. A nil sender is not registered, so email deliveries dead-letter
// with a clear reason instead of being reported as sent.
func NewMailSender(m mailer, appURL string) Sender {
	if m == nil || !m.Enabled() {
		return nil
	}
	return &mailSender{mailer: m, appURL: strings.TrimRight(appURL, "/")}
}

func (s *mailSender) Channel() Channel { return ChannelEmail }

func (s *mailSender) Send(ctx context.Context, msg Message) error {
	if strings.TrimSpace(msg.Recipient) == "" {
		// Nothing to send to. Terminal in practice, and the worker records it
		// as a failure with this reason rather than reporting a delivery.
		return fmt.Errorf("no email address for user %s", msg.UserID)
	}

	subject := msg.Subject
	if subject == "" {
		subject = "A new notification from Kirmya"
	}

	return s.mailer.Send(msg.Recipient, subject, s.body(msg))
}

// body renders the notification. Every value that came from a person — a
// notification title, an actor's name, a job title — is escaped: notification
// content is user-influenced, and an unescaped one would be an HTML injection
// into someone else's inbox.
func (s *mailSender) body(msg Message) string {
	var sb strings.Builder
	sb.WriteString(`<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1d1d1f;line-height:1.5">`)
	sb.WriteString(`<h2 style="font-size:18px;margin:0 0 12px">`)
	sb.WriteString(html.EscapeString(msg.Subject))
	sb.WriteString(`</h2><p style="margin:0 0 20px">`)
	sb.WriteString(html.EscapeString(msg.Body))
	sb.WriteString(`</p>`)
	if s.appURL != "" {
		sb.WriteString(`<p style="margin:0 0 20px"><a href="`)
		sb.WriteString(html.EscapeString(s.appURL + "/notifications"))
		sb.WriteString(`" style="color:#0066ff">View it on Kirmya</a></p>`)
		sb.WriteString(`<p style="font-size:12px;color:#86868b;margin:0">`)
		sb.WriteString(`You are receiving this because of your notification settings. `)
		sb.WriteString(`<a href="`)
		sb.WriteString(html.EscapeString(s.appURL + "/settings/notifications"))
		sb.WriteString(`" style="color:#86868b">Change what Kirmya emails you</a>.`)
		sb.WriteString(`</p>`)
	}
	sb.WriteString(`</body></html>`)
	return sb.String()
}

// inAppSender is a no-op transport: the notification row itself is the in-app
// delivery, so there is nothing to send. It exists so in-app deliveries settle
// as Sent rather than dead-lettering for want of a registered channel.
type inAppSender struct{}

func NewInAppSender() Sender { return &inAppSender{} }

func (inAppSender) Channel() Channel { return ChannelInApp }

func (inAppSender) Send(context.Context, Message) error { return nil }
