# Kirmya Real-Time Messaging & Direct Communication Platform Audit

## Executive Summary
This document audits the 1-to-1 Direct Messaging architecture, WebSocket real-time delivery pipeline, conversation state management, attachment verification, message search indexing, typing/presence engine, and mutual block privacy enforcement.

---

## 1. Messaging Ecosystem Overview
- **PostgreSQL Source of Truth**: All conversations, messages, and delivery states persist reliably in PostgreSQL.
- **WebSocket & Redis Pub/Sub**: Real-time message broadcasting, typing indicators, and presence updates operate on an ephemeral Redis pub/sub layer without being the permanent source of truth.
- **Strict Bidirectional Block Enforcement**: Blocked users are immediately stripped from active conversations and prevented from initiating direct messages.
- **Attachment Verification**: Message attachments are scanned for MIME integrity and restricted to 10MB; file downloads require short-lived signed URLs.
