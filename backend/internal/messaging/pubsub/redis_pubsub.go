package pubsub

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"sync"

	"github.com/redis/go-redis/v9"
)

// RedisPubSub distributes realtime events across API processes.
//
// F16. The only implementation of PubSub was InMemoryPubSub: a map of
// subscribers inside one process. A message published on one API instance never
// reached a subscriber connected to another, so chat and live notifications
// were correct only while exactly one process was running. That capped
// throughput at a single instance, made every deploy a mass-disconnect, and
// meant the first horizontal scale-out would present as the product silently
// losing messages. The documentation described a distributed broker throughout.
//
// The PubSub interface was already the seam, so this is an adapter rather than
// a redesign: everything that publishes or subscribes is unchanged.
type RedisPubSub struct {
	client *redis.Client

	// local mirrors delivery to subscribers in this same process.
	//
	// Redis does not echo a publish back to the connection that made it in a
	// way that is synchronous enough to rely on, and more importantly a
	// subscriber in the publishing process should not have its delivery depend
	// on a network round trip. Publishing to both means a single-process
	// deployment behaves exactly as it did before, and a multi-process one adds
	// the remote subscribers on top.
	local *InMemoryPubSub

	mu     sync.Mutex
	closed bool
}

// NewRedisPubSub connects to Redis for realtime fan-out.
//
// It returns an error rather than falling back silently. A caller that quietly
// degraded to the in-memory broker would produce exactly the failure this
// replaces — working in staging with one process, dropping messages in
// production with several — with nothing in the logs to explain it.
func NewRedisPubSub(addr, password string, db int) (*RedisPubSub, error) {
	client := redis.NewClient(&redis.Options{Addr: addr, Password: password, DB: db})

	if err := client.Ping(context.Background()).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("connect realtime broker at %s: %w", addr, err)
	}

	return &RedisPubSub{client: client, local: NewInMemoryPubSub()}, nil
}

// NewRedisPubSubFromURL builds the broker from a redis:// URL.
func NewRedisPubSubFromURL(rawURL string) (*RedisPubSub, error) {
	opts, err := redis.ParseURL(rawURL)
	if err != nil {
		return nil, fmt.Errorf("parse realtime broker URL: %w", err)
	}
	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("connect realtime broker: %w", err)
	}
	return &RedisPubSub{client: client, local: NewInMemoryPubSub()}, nil
}

// Publish sends to every subscriber, in this process and in every other.
func (r *RedisPubSub) Publish(ctx context.Context, channel string, message []byte) error {
	// Local first: a subscriber in this process must not wait on the network,
	// and must still receive the message if Redis is briefly unreachable.
	_ = r.local.Publish(ctx, channel, message)

	if err := r.client.Publish(ctx, channel, message).Err(); err != nil {
		return fmt.Errorf("publish to realtime broker: %w", err)
	}
	return nil
}

// Subscribe receives on a channel from any process.
func (r *RedisPubSub) Subscribe(ctx context.Context, channel string) (Subscription, error) {
	r.mu.Lock()
	if r.closed {
		r.mu.Unlock()
		return nil, fmt.Errorf("realtime broker is closed")
	}
	r.mu.Unlock()

	// The in-process half, so a message published here arrives without a round
	// trip and survives a broker blip.
	localSub, err := r.local.Subscribe(ctx, channel)
	if err != nil {
		return nil, err
	}

	remote := r.client.Subscribe(ctx, channel)
	// Wait for the subscription to be established before returning, so a caller
	// that publishes immediately after subscribing does not race the setup and
	// miss its own first message.
	if _, err := remote.Receive(ctx); err != nil {
		_ = localSub.Close()
		_ = remote.Close()
		return nil, fmt.Errorf("subscribe to realtime broker: %w", err)
	}

	sub := &redisSubscription{
		channel: channel,
		out:     make(chan []byte, 64),
		remote:  remote,
		local:   localSub,
		done:    make(chan struct{}),
	}
	go sub.pump()
	return sub, nil
}

// Close releases the broker connection.
func (r *RedisPubSub) Close() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.closed {
		return nil
	}
	r.closed = true
	return r.client.Close()
}

// redisSubscription merges the local and remote streams into one channel, so
// callers see the same Subscription contract as the in-memory broker.
type redisSubscription struct {
	channel string
	out     chan []byte
	remote  *redis.PubSub
	local   Subscription

	closeOnce sync.Once
	done      chan struct{}
}

func (s *redisSubscription) Channel() <-chan []byte { return s.out }

func (s *redisSubscription) Close() error {
	s.closeOnce.Do(func() {
		close(s.done)
		_ = s.local.Close()
		_ = s.remote.Close()
	})
	return nil
}

// pump forwards both sources onto the caller's channel.
//
// A send that would block is dropped rather than stalling the whole
// subscription: one slow websocket must not back up delivery for everyone else
// on the same broker. The drop is logged, because silently discarding a
// realtime message is exactly the kind of thing that should be visible.
func (s *redisSubscription) pump() {
	defer close(s.out)

	remote := s.remote.Channel()
	local := s.local.Channel()

	for {
		select {
		case <-s.done:
			return

		case msg, ok := <-remote:
			if !ok {
				return
			}
			s.forward([]byte(msg.Payload))

		case msg, ok := <-local:
			if !ok {
				local = nil
				continue
			}
			s.forward(msg)
		}
	}
}

func (s *redisSubscription) forward(payload []byte) {
	select {
	case s.out <- payload:
	case <-s.done:
	default:
		slog.Warn("dropped a realtime message for a subscriber that is not keeping up",
			slog.String("channel", s.channel))
	}
}

// FromEnv builds the realtime broker the deployment is configured for.
//
// Redis is used when it is configured, and the in-memory broker otherwise. The
// return value says which, so main can log it: a deployment running more than
// one replica on the in-memory broker is broken in a way that only shows up as
// users not receiving messages, and that fact belongs in the startup log rather
// than in a support ticket.
func FromEnv() (PubSub, string) {
	if url := strings.TrimSpace(os.Getenv("REDIS_URL")); url != "" {
		if broker, err := NewRedisPubSubFromURL(url); err == nil {
			return broker, "redis"
		} else {
			slog.Error("realtime broker could not use REDIS_URL; falling back to a single-process broker",
				slog.String("error", err.Error()))
		}
	}

	host := strings.TrimSpace(os.Getenv("REDIS_HOST"))
	if host != "" {
		port := strings.TrimSpace(os.Getenv("REDIS_PORT"))
		if port == "" {
			port = "6379"
		}
		addr := host + ":" + port
		if broker, err := NewRedisPubSub(addr, os.Getenv("REDIS_PASSWORD"), 0); err == nil {
			return broker, "redis"
		} else {
			slog.Error("realtime broker could not reach Redis; falling back to a single-process broker",
				slog.String("addr", addr), slog.String("error", err.Error()))
		}
	}

	return NewInMemoryPubSub(), "in-memory"
}
