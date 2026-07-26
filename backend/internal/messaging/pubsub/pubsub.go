package pubsub

import (
	"context"
	"sync"
)

// Subscription represents an active channel subscription.
type Subscription interface {
	Channel() <-chan []byte
	Close() error
}

// PubSub defines the contract for horizontal scaling event distribution.
type PubSub interface {
	Publish(ctx context.Context, channel string, message []byte) error
	Subscribe(ctx context.Context, channel string) (Subscription, error)
}

// InMemoryPubSub implements a local thread-safe in-memory publish/subscribe broker.
type InMemoryPubSub struct {
	mu          sync.RWMutex
	subscribers map[string]map[int]chan []byte
	nextID      int
}

// NewInMemoryPubSub instantiates a new local memory broker.
func NewInMemoryPubSub() *InMemoryPubSub {
	return &InMemoryPubSub{
		subscribers: make(map[string]map[int]chan []byte),
	}
}

type inMemorySubscription struct {
	ps      *InMemoryPubSub
	channel string
	id      int
	ch      chan []byte
}

func (s *inMemorySubscription) Channel() <-chan []byte {
	return s.ch
}

func (s *inMemorySubscription) Close() error {
	s.ps.mu.Lock()
	defer s.ps.mu.Unlock()
	if subs, exists := s.ps.subscribers[s.channel]; exists {
		delete(subs, s.id)
		if len(subs) == 0 {
			delete(s.ps.subscribers, s.channel)
		}
	}
	close(s.ch)
	return nil
}

func (ps *InMemoryPubSub) Publish(ctx context.Context, channel string, message []byte) error {
	ps.mu.RLock()
	defer ps.mu.RUnlock()

	if subs, exists := ps.subscribers[channel]; exists {
		for _, ch := range subs {
			select {
			case ch <- message:
			default:
				// Avoid blocking publisher if subscriber is slow or buffer is full
			}
		}
	}
	return nil
}

func (ps *InMemoryPubSub) Subscribe(ctx context.Context, channel string) (Subscription, error) {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	ps.nextID++
	id := ps.nextID
	ch := make(chan []byte, 256) // Buffered to prevent blocking write pathways

	if _, exists := ps.subscribers[channel]; !exists {
		ps.subscribers[channel] = make(map[int]chan []byte)
	}
	ps.subscribers[channel][id] = ch

	return &inMemorySubscription{
		ps:      ps,
		channel: channel,
		id:      id,
		ch:      ch,
	}, nil
}
