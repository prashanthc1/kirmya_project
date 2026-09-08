package pubsub

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"
)

// F16. The realtime layer must reach subscribers in other processes.
//
// These use two independent broker instances, each with its own Redis
// connection, which is what two API replicas are. The in-memory broker fails
// every one of them: a message published on one instance never arrives on the
// other, because its subscribers live in a map inside the publishing process.

func redisAddr(t *testing.T) string {
	t.Helper()
	host := strings.TrimSpace(os.Getenv("REDIS_HOST"))
	if host == "" {
		t.Skip("REDIS_HOST is not set; skipping the distributed broker tests")
	}
	port := strings.TrimSpace(os.Getenv("REDIS_PORT"))
	if port == "" {
		port = "6379"
	}
	return host + ":" + port
}

func newBroker(t *testing.T) *RedisPubSub {
	t.Helper()
	broker, err := NewRedisPubSub(redisAddr(t), os.Getenv("REDIS_PASSWORD"), 0)
	if err != nil {
		t.Fatalf("connect broker: %v", err)
	}
	t.Cleanup(func() { _ = broker.Close() })
	return broker
}

// receive waits for one message, or reports what was missing.
func receive(t *testing.T, sub Subscription, within time.Duration) []byte {
	t.Helper()
	select {
	case msg, ok := <-sub.Channel():
		if !ok {
			t.Fatal("the subscription closed before delivering anything")
		}
		return msg
	case <-time.After(within):
		t.Fatal("no message arrived within the deadline")
		return nil
	}
}

// TestMessagePublishedOnOneProcessReachesAnother is the whole point.
func TestMessagePublishedOnOneProcessReachesAnother(t *testing.T) {
	ctx := context.Background()
	channel := "test:cross-process:" + time.Now().Format("150405.000000")

	// Two brokers with separate connections: two API replicas.
	replicaA := newBroker(t)
	replicaB := newBroker(t)

	// A user's websocket is connected to replica B.
	sub, err := replicaB.Subscribe(ctx, channel)
	if err != nil {
		t.Fatalf("subscribe on replica B: %v", err)
	}
	defer sub.Close()

	// The event is produced on replica A — a different process entirely.
	if err := replicaA.Publish(ctx, channel, []byte(`{"type":"notification"}`)); err != nil {
		t.Fatalf("publish on replica A: %v", err)
	}

	if got := string(receive(t, sub, 5*time.Second)); got != `{"type":"notification"}` {
		t.Errorf("received %q", got)
	}
}

// A subscriber in the publishing process must still receive, and must not have
// its delivery depend on a network round trip.
func TestMessageReachesASubscriberInTheSameProcess(t *testing.T) {
	ctx := context.Background()
	channel := "test:same-process:" + time.Now().Format("150405.000000")

	broker := newBroker(t)
	sub, err := broker.Subscribe(ctx, channel)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer sub.Close()

	if err := broker.Publish(ctx, channel, []byte("local")); err != nil {
		t.Fatalf("publish: %v", err)
	}

	if got := string(receive(t, sub, 5*time.Second)); got != "local" {
		t.Errorf("received %q, want %q", got, "local")
	}
}

// Every subscriber on a channel gets the message, not just the first.
func TestEverySubscriberOnAChannelReceives(t *testing.T) {
	ctx := context.Background()
	channel := "test:fanout:" + time.Now().Format("150405.000000")

	publisher := newBroker(t)
	subs := make([]Subscription, 0, 3)
	for i := 0; i < 3; i++ {
		broker := newBroker(t)
		sub, err := broker.Subscribe(ctx, channel)
		if err != nil {
			t.Fatalf("subscribe %d: %v", i, err)
		}
		defer sub.Close()
		subs = append(subs, sub)
	}

	if err := publisher.Publish(ctx, channel, []byte("fanout")); err != nil {
		t.Fatalf("publish: %v", err)
	}

	for i, sub := range subs {
		if got := string(receive(t, sub, 5*time.Second)); got != "fanout" {
			t.Errorf("subscriber %d received %q", i, got)
		}
	}
}

// A closed subscription must stop delivering and must not panic on a later
// publish — a user closing a tab is the most common event in this system.
func TestClosedSubscriptionStopsCleanly(t *testing.T) {
	ctx := context.Background()
	channel := "test:close:" + time.Now().Format("150405.000000")

	broker := newBroker(t)
	sub, err := broker.Subscribe(ctx, channel)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	if err := sub.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}
	// Closing twice is what a deferred Close plus an explicit one produces.
	if err := sub.Close(); err != nil {
		t.Errorf("second close: %v", err)
	}

	if err := broker.Publish(ctx, channel, []byte("after close")); err != nil {
		t.Errorf("publish after a subscriber closed: %v", err)
	}
}

// Messages on one channel must not leak onto another. Channels are per-user
// here ("user:events:<id>"), so a leak would be one user receiving another's
// notifications.
func TestChannelsAreIsolated(t *testing.T) {
	ctx := context.Background()
	stamp := time.Now().Format("150405.000000")
	mine := "test:isolation:mine:" + stamp
	theirs := "test:isolation:theirs:" + stamp

	broker := newBroker(t)
	sub, err := broker.Subscribe(ctx, mine)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer sub.Close()

	if err := broker.Publish(ctx, theirs, []byte("not for you")); err != nil {
		t.Fatalf("publish: %v", err)
	}
	if err := broker.Publish(ctx, mine, []byte("for you")); err != nil {
		t.Fatalf("publish: %v", err)
	}

	// The first message to arrive must be the one addressed to this channel.
	if got := string(receive(t, sub, 5*time.Second)); got != "for you" {
		t.Errorf("received %q from another channel", got)
	}
}

// The in-memory broker is kept for single-process use, and this records what it
// cannot do — so nobody reaches for it to fix a scaling problem.
func TestInMemoryBrokerDoesNotCrossProcesses(t *testing.T) {
	ctx := context.Background()
	channel := "test:in-memory"

	// Two instances stand in for two processes.
	replicaA := NewInMemoryPubSub()
	replicaB := NewInMemoryPubSub()

	sub, err := replicaB.Subscribe(ctx, channel)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer sub.Close()

	if err := replicaA.Publish(ctx, channel, []byte("lost")); err != nil {
		t.Fatalf("publish: %v", err)
	}

	select {
	case msg := <-sub.Channel():
		t.Fatalf("the in-memory broker delivered %q across instances; this test documents that it cannot", msg)
	case <-time.After(250 * time.Millisecond):
		// Expected: nothing arrives. This is the defect F16 describes.
	}
}
