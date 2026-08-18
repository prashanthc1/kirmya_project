# Kirmya Trust & Safety, Content Moderation, User Reporting, Appeals & Platform Integrity System

## 1. Overview
The Kirmya Trust & Safety (T&S) system provides robust, multi-layered platform moderation, automated abuse prevention, user reporting, appeals management, and administrative enforcement. It protects job seekers, recruiters, employers, and community participants from fraud, malicious content, spam, and identity abuse.

---

## 2. Central Safety Event Systems
The Trust & Safety service publishes standardized event payloads to the central NATS event bus for event-driven processing across microservices and audit logging.

| Event Topic | Description | Trigger Condition |
| :--- | :--- | :--- |
| `trust.report_created` | Triggered when a user submits an abuse/incident report. | User calls `POST /api/v1/safety/reports` |
| `trust.content_flagged` | Triggered when automated rules or AI detect suspicious content. | Automated content evaluation score >= threshold |
| `trust.content_removed` | Triggered when moderation action removes content. | Moderator or system executes `content_removal` action |
| `trust.user_restricted` | Triggered when active restrictions are placed on a user. | Temporary/permanent suspension or capability restriction applied |
| `trust.appeal_created` | Triggered when a user submits an appeal against a decision. | User calls `POST /api/v1/safety/appeals` |
| `trust.appeal_resolved` | Triggered when an independent reviewer resolves an appeal. | Admin calls `PUT /api/v1/admin/trust-safety/appeals/:id` |
| `trust.job_flagged` | Triggered when a job posting is flagged for scam or policy violation. | Job scam heuristics risk score > 70.0 |
| `trust.employer_flagged` | Triggered when an employer profile is flagged for fraud or fake identity. | Employer risk signals exceed threshold |

---

## 3. Report Categories
Safety reports support standardized categorization for targeted queue routing and risk scoring:
- `spam`: Unsolicited bulk marketing, excessive promotional content, bot messages.
- `scam`: Financial fraud, advance-fee scams, fake investment opportunities.
- `fraud`: Deceptive practices, counterfeit identity, fraudulent job postings.
- `fake_job`: Non-existent positions, fraudulent recruiter posts, phishing job listings.
- `fake_recruiter`: Impersonation of legitimate company recruiters or HR staff.
- `impersonation`: User or corporate brand identity theft.
- `harassment`: Stalking, repeated unwanted contact, abusive behavior.
- `threat`: Violent threats, intimidation, extortion.
- `hate_abuse`: Hate speech, discrimination, abusive language.
- `privacy_violation`: Unauthorized sharing of personal identifiable information (PII/doxxing).
- `phishing`: Malicious links designed to credential steal or compromise accounts.
- `malicious_content`: Malware links, drive-by downloads, compromised attachments.
- `inappropriate_content`: NSFW material, illegal content, policy-violating text/media.
- `platform_abuse`: API abuse, automated scraping, account sharing violations.
- `copyright`: Intellectual property, trademark, or copyright infringement.
- `other`: General policy non-compliance not covered by standard categories.

---

## 4. Moderation Queue Prioritization Algorithm
Moderation cases in `/admin/trust-safety/queue` are dynamically prioritized using a multi-factor risk score calculation (0.0 to 100.0 scale):

$$\text{RiskScore} = \min\left(100, W_{\text{cat}} + W_{\text{rep}} + W_{\text{history}} + W_{\text{ai}}\right)$$

Where:
- $W_{\text{cat}}$ (Category Severity Weight):
  - Critical (`threat`, `phishing`, `scam`): +40 points
  - High (`fake_job`, `fake_recruiter`, `malicious_content`): +30 points
  - Medium (`harassment`, `hate_abuse`, `privacy_violation`): +20 points
  - Low (`spam`, `inappropriate_content`, `other`): +10 points
- $W_{\text{rep}}$ (Reporter Reputation Weight): $+0 \text{ to } +15$ points depending on reporter history accuracy.
- $W_{\text{history}}$ (Target User Violation History): $+10$ points per prior confirmed violation (max +30 points).
- $W_{\text{ai}}$ (AI Moderation Confidence Multiplier): $\text{AI Confidence (0-1.0)} \times 15$ points.

### Queue Priority Levels
- **Critical** (Risk Score >= 85.0): SLA < 1 hour resolution target.
- **Urgent** (Risk Score 70.0 - 84.9): SLA < 4 hours resolution target.
- **High** (Risk Score 50.0 - 69.9): SLA < 12 hours resolution target.
- **Normal** (Risk Score 25.0 - 49.9): SLA < 24 hours resolution target.
- **Low** (Risk Score < 25.0): SLA < 48 hours resolution target.

---

## 5. Automated Content Moderation Pipeline & Confidence Scores
The automated moderation engine evaluates user-generated text, job postings, messages, and profiles against configurable safety rules:

1. **Rule Evaluation**:
   - Spam pattern & regex detection (e.g. repeated URL patterns, mass broadcast strings).
   - Malicious domain & phishing link checks.
   - Advance-fee payment keywords (e.g., "wire transfer", "Western Union", "pay fee before starting").
   - Off-platform communication redirects (e.g., "WhatsApp only", "Telegram contact").
2. **Confidence Score Calculation (0.0 - 1.0)**:
   - Each matching rule contributes a weighted confidence factor $C_i$.
   - Aggregated confidence score: $C_{\text{total}} = 1 - \prod (1 - C_i)$.
3. **Automated Enforcement Thresholds**:
   - $C_{\text{total}} \ge 0.85$: Immediate automated content removal / flagging and case creation.
   - $0.50 \le C_{\text{total}} < 0.85$: Flagged for expedited human review in moderation queue.
   - $C_{\text{total}} < 0.50$: Monitored / passed.

---

## 6. Safety Policy Versioning & Enforcement Levels
Safety policies maintain explicit version numbers (e.g. `1.0.0`, `1.1.0`) to ensure enforcement auditability.

### Enforcement Levels & Proportional Actions
- `warning`: Official administrative warning issued to user.
- `content_removal`: Deletion or redaction of policy-violating post, job, message, or file.
- `visibility_reduction`: Soft-shadowban or algorithmic downranking of content/profile.
- `messaging_restriction`: Temporary or permanent revocation of direct messaging capabilities.
- `job_posting_restriction`: Temporary or permanent revocation of job posting privileges.
- `application_restriction`: Temporary or permanent revocation of job application submission.
- `community_restriction`: Revocation of community group posting/commenting permissions.
- `temporary_suspension`: Time-bound full account suspension (e.g. 7, 14, 30 days).
- `permanent_suspension`: Permanent account closure (**requires human moderator authorization**).
- `account_lock`: Emergency security lock requiring identity verification to unlock.
- `account_deactivation`: Full system deactivation of account data.

---

## 7. Appeals Workflow & Reviewer Independence
Users subjected to enforcement actions may file appeals via `POST /api/v1/safety/appeals`.

### Strict Reviewer Independence Constraint
To prevent bias, the system enforces:
```
ReviewerID != OriginalModeratorID
```
If the moderator who took the original enforcement decision attempts to resolve the appeal, the service rejects the request with HTTP 403 Forbidden / `INDEPENDENT_REVIEWER_REQUIRED`.

### Appeal Lifecycles
- `submitted`: Appeal registered by user.
- `under_review`: Claimed by an independent reviewer.
- `approved`: Appeal upheld. Active restrictions associated with the decision are automatically deactivated.
- `denied`: Appeal rejected. Original decision maintained.
- `partially_approved`: Decision modified or restriction duration reduced.

---

## 8. Fake Job & Profile Detection Heuristics
Specialized risk scoring for job posts and employer accounts:
- **Advance-Fee Payment Heuristic**: Detects phrases demanding equipment purchases, training fees, or wire transfers before employment.
- **Off-Platform Channel Trigger**: Detects insistence on Telegram, WhatsApp, or unverified external email domains (e.g. `@gmail.com` for corporate recruiters).
- **Salary Anomaly Heuristic**: Detects unrealistic salary compensation relative to job title/tier.
- **Posting Velocity Anomaly**: Detects rapid bulk posting of jobs by unverified accounts.

---

## 9. Reporter Privacy Protection
To protect reporters from retaliation:
- All non-admin endpoints (`/api/v1/safety/reports`, `/api/v1/safety/reports/:id`) strip `reporter_id` and internal moderator notes before returning payload to callers.
- Reporter PII is accessible strictly by authorized moderators with `trust_safety.review` or higher RBAC permissions.

---

## 10. Moderator RBAC Permissions
The Trust & Safety module defines fine-grained RBAC permissions:

| Permission Code | Capabilities |
| :--- | :--- |
| `trust_safety.view` | View safety dashboard metrics, rules, and read-only case queues. |
| `trust_safety.review` | Claim, assign, and review pending moderation cases and evidence. |
| `trust_safety.enforce` | Execute moderation decisions (warnings, content removals, suspensions). |
| `trust_safety.appeals` | Review and resolve user appeals (subject to reviewer independence). |
| `trust_safety.manage_policies` | Create, edit, activate, or archive Safety Policies. |
| `trust_safety.manage_rules` | Configure automated moderation rules and pattern matchers. |

---

## 11. OpenTelemetry Telemetry
The module records spans, attributes, and metric counters for observability:
- **Metrics**:
  - `trust_safety_reports_submitted_total` (counter, labeled by category, target_type)
  - `trust_safety_decisions_executed_total` (counter, labeled by action_type, policy_version)
  - `trust_safety_appeals_resolved_total` (counter, labeled by status)
  - `trust_safety_case_resolution_time_seconds` (histogram)
- **Span Attributes**:
  - `trust.case_id`, `trust.report_id`, `trust.target_type`, `trust.category`, `trust.risk_score`, `trust.policy_version`.

---

## 12. OpenAPI 3.0 Specifications

```yaml
openapi: 3.0.3
info:
  title: Kirmya Trust & Safety API
  version: 1.0.0
  description: Platform moderation, reporting, appeals, policy management, and integrity endpoints.
paths:
  /api/v1/safety/reports:
    post:
      summary: Submit safety report
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReportSubmitPayload'
      responses:
        '201':
          description: Report submitted successfully
        '400':
          description: Invalid payload or duplicate report
    get:
      summary: List user safety reports
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of user reports with reporter identity redacted

  /api/v1/safety/appeals:
    post:
      summary: Submit enforcement appeal
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppealSubmitPayload'
      responses:
        '201':
          description: Appeal submitted
    get:
      summary: List user appeals
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of user appeals

  /api/v1/safety/restrictions:
    get:
      summary: Get active user restrictions
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Active restrictions list

  /api/v1/admin/trust-safety/queue:
    get:
      summary: Get prioritized moderation queue
      security:
        - BearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Prioritized case queue

  /api/v1/admin/trust-safety/policies:
    get:
      summary: List safety policies
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of safety policies
    post:
      summary: Create safety policy
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePolicyPayload'
      responses:
        '201':
          description: Policy created

  /api/v1/admin/trust-safety/workload:
    get:
      summary: Get moderator workload metrics
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Moderator workload metrics list

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    ReportSubmitPayload:
      type: object
      required:
        - target_type
        - target_id
        - category
        - description
      properties:
        target_type:
          type: string
        target_id:
          type: string
          format: uuid
        target_title:
          type: string
        category:
          type: string
        description:
          type: string
        evidence_urls:
          type: array
          items:
            type: string
    AppealSubmitPayload:
      type: object
      required:
        - decision_id
        - reason
        - explanation
      properties:
        decision_id:
          type: string
          format: uuid
        reason:
          type: string
        explanation:
          type: string
        evidence_urls:
          type: array
          items:
            type: string
    CreatePolicyPayload:
      type: object
      required:
        - code
        - title
        - category
        - description
        - severity
        - enforcement_guidance
      properties:
        code:
          type: string
        title:
          type: string
        category:
          type: string
        description:
          type: string
        severity:
          type: string
        enforcement_guidance:
          type: string
        version:
          type: string
```
