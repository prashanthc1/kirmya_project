# Kirmya Real-Time Event-Driven Indexing Pipeline Manual

## 1. Event-Driven Search Synchronization
- **NATS / Event Bus Integration**: Domain events (`JobPublishedEvent`, `ProfileUpdatedEvent`, `OrganizationVerifiedEvent`) trigger asynchronous index upserts.
- **Transactional Outbox Sync**: Outbox consumers ensure at-least-once document delivery to search indices without blocking web requests.
- **De-Indexing Automation**: Unpublished jobs or suspended accounts trigger immediate document deletion events.
