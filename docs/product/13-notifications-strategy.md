# Notifications Strategy: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-013 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Engagement & Growth Guild | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft mapping communication channels and priority tiers. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed detailed specifications for all notification paths, scheduler, and digest layouts. |

---

## 1. Executive Summary

This document establishes the official **Notifications Strategy** for the **Kirmya Professional Ecosystem**. It defines the communication channels, delivery logic, priority matrices, anti-fatigue parameters, scheduling constraints, and weekly/daily digest formats required to maintain high user retention without causing alert fatigue.

---

## 2. Notification Channels

Kirmya utilizes five distinct delivery channels to route alerts based on urgency, content type, and user preferences:

```
                          [ DELIVERY PIPELINE ]
  +-------------------------------------------------------------+
  |  In-App        |  Real-time Socket.io notifications drawer  |
  +----------------+--------------------------------------------+
  |  Browser       |  Web Push API alerts (Chrome, Safari)      |
  +----------------+--------------------------------------------+
  |  Mobile Push   |  OS-level pushes via APNs & Firebase (FCM) |
  +----------------+--------------------------------------------+
  |  Email         |  SES transactional / Mailgun marketing     |
  +----------------+--------------------------------------------+
  |  SMS (Future)  |  Twilio gateway (Critical OTP / Billing)   |
  +-------------------------------------------------------------+
```

### 2.1 In-App Notifications
* **Mechanism**: Real-time WebSocket connection (`socket.io` or SSE backend bus).
* **UI Location**: Global header notification bell icon, rendering a dropdown drawer with unread counters.
* **Target Content**: Social activities (likes, follows), Guild discussions, and minor DRS milestones.

### 2.2 Browser Notifications
* **Mechanism**: Service Worker implementation using the Web Push API.
* **UI Location**: OS-level native desktop banner alerts.
* **Target Content**: Active chat messages and real-time meeting invites.

### 2.3 Mobile Push Notifications
* **Mechanism**: Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM).
* **UI Location**: Lock screen banners and app icon badges.
* **Target Content**: Critical sourcing updates, interview invitations, and security access warnings.

### 2.4 Email Communications
* **Mechanism**: Transactional email relays (Amazon SES) and campaign relays (Mailgun).
* **Target Content**: Password resets, invoices, contract signatures, daily upskilling updates, and weekly Guild summaries.

### 2.5 SMS (Future Horizon - Phase 4)
* **Mechanism**: Regional telecom carrier gateways (e.g. Twilio).
* **Target Content**: Multi-factor authentication codes, escrow deposit verifications, and urgent account dispute alerts.

---

## 3. Core Delivery Strategy & Priority Matrix

Notifications are routed according to a three-tier severity hierarchy to ensure instant dispatch for security and transaction events, while batching social updates to avoid spam:

| Event Type | Priority | In-App | Browser | Mobile Push | Email | SMS (Future) | Fallback / Escalation Logic |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MFA Code / Login Alert** | `High` | Yes | No | No | Yes | Yes | Send SMS instantly. Email if SMS fails. |
| **Escrow Payout Complete** | `High` | Yes | Yes | Yes | Yes | Yes | Push + In-app instantly. Email invoice. |
| **Interview Request** | `High` | Yes | Yes | Yes | Yes | No | Push instantly. Email if unread after 10m. |
| **Active Chat Message** | `Medium` | Yes | Yes | Yes | No | No | Push instantly if user is offline. |
| **DRS Score Verified** | `Medium` | Yes | No | Yes | Yes | No | In-app instantly. Digest summary email. |
| **Guild Submission Flag** | `Medium` | Yes | Yes | Yes | Yes | No | Route to moderator workspace + push. |
| **Skill Path Course Added** | `Low` | Yes | No | No | Yes | No | Batch into daily learning digest. |
| **Feed Post Comment/Like** | `Low` | Yes | No | No | No | No | Batch into weekly social summary email. |

---

## 4. Notification Preferences & User Controls

Users manage their notification routing via a granular dashboard at `/settings`. The platform enforces these options:

* **Channel Opt-In/Opt-Out**: Users can toggle In-App, Push, and Email alerts independently for each category (Social, Learning, Sourcing, Security).
* **Do-Not-Disturb (Quiet Hours)**:
  - Users can define quiet hours (e.g. 22:00 to 07:00 local time).
  - During quiet hours, the system suppresses Push and Browser alerts, queuing them for dispatch once quiet hours expire.
  - Security (High Priority) alerts bypass quiet hours automatically.

---

## 5. Scheduling & Rate Limiting (Anti-Fatigue Policies)

To prevent notification fatigue, Kirmya implements strict delivery limits:

* **Frequency Caps**:
  - **Medium/Low Priority Push**: Maximum of **5 push notifications** per user per rolling 24-hour window.
  - **Marketing Emails**: Maximum of **2 emails** per user per week.
* **Coalescing Engine**:
  - If a user receives multiple likes or comments within a 15-minute window, the system groups them into a single alert (e.g. *"User A and 4 others liked your post"*).

---

## 6. Digest Email Structure & Cadence

Rather than sending transactional emails for every platform event, low-priority updates are consolidated into digest emails:

### 6.1 Daily Learning Digest
* **Cadence**: Every morning at 08:00 local time.
* **Target Audience**: Active Job Seekers and Freelancers.
* **Content Layout**:
  - Progress tracker on current upskilling path.
  - Next recommended course/module based on skill-gap analysis.
  - Recommended technical articles from followed Guilds.

### 6.2 Weekly Guild Summary
* **Cadence**: Fridays at 17:00 local time.
* **Target Audience**: All registered users.
* **Content Layout**:
  - Top 3 voted Guild articles of the week.
  - Trending skills in their region.
  - Active peer-review queues needing feedback.

### 6.3 Recruiter Pipeline Digest
* **Cadence**: Daily at 08:30 local time.
* **Target Audience**: Active Recruiter seats.
* **Content Layout**:
  - Number of new blind candidate matches on active jobs.
  - Pending interview schedules for the day.
  - Pending employer actions (evaluating portfolios, feedback).

---

## 7. Approval Checkpoints

The Notifications Strategy must be approved by the Engineering and Growth teams before notification service integration:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **VP of Engineering** | Infrastructure | [Pending] | | `Awaiting Review` |
| **Growth Product Manager**| Marketing | [Pending] | | `Awaiting Review` |
| **Lead Security Architect** | InfoSec | [Pending] | | `Awaiting Review` |
| **Lead QA Architect** | Quality Assurance| [Pending] | | `Awaiting Review` |
