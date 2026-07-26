package events

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

type DomainEvent struct {
	ID        uuid.UUID              `json:"id"`
	Type      string                 `json:"type"` // e.g. 'user.registered', 'job.applied', 'ai.match_computed'
	Producer  string                 `json:"producer"`
	Payload   map[string]interface{} `json:"payload"`
	Timestamp time.Time              `json:"timestamp"`
}

type EventHandler func(ctx context.Context, evt DomainEvent) error

type EventBus interface {
	Publish(ctx context.Context, evt DomainEvent) error
	Subscribe(eventType string, handler EventHandler)
}

type inMemoryEventBus struct {
	mu       sync.RWMutex
	handlers map[string][]EventHandler
}

func NewEventBus() EventBus {
	return &inMemoryEventBus{
		handlers: make(map[string][]EventHandler),
	}
}

func (b *inMemoryEventBus) Publish(ctx context.Context, evt DomainEvent) error {
	if evt.ID == uuid.Nil {
		evt.ID = uuid.New()
	}
	if evt.Timestamp.IsZero() {
		evt.Timestamp = time.Now()
	}

	b.mu.RLock()
	subscribers, exists := b.handlers[evt.Type]
	b.mu.RUnlock()

	if !exists || len(subscribers) == 0 {
		return nil
	}

	// Dispatch to subscribers asynchronously
	for _, handler := range subscribers {
		h := handler
		go func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("[EventBus] Recovered from event handler panic (%s): %v\n", evt.Type, r)
				}
			}()
			_ = h(ctx, evt)
		}()
	}

	return nil
}

func (b *inMemoryEventBus) Subscribe(eventType string, handler EventHandler) {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.handlers[eventType] = append(b.handlers[eventType], handler)
}
