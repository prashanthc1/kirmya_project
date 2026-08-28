# Kirmya Offer Management, Compensation & Hiring Decision Architecture Guide

## 1. Architectural Overview & Workflow

```
Application ──► Interview(s) ──► Hiring Decision ──► Offer Created ──► Candidate Response ──► Accepted / Hired
                                                            │                   │
                                                            ▼                   ▼
                                                     [Draft / Sent]     [Declined / Expired]
```

---

## 2. Offer Lifecycle State Machine

```
[ Draft ] ──► [ Pending Approval ] ──► [ Approved ] ──► [ Sent ] ──► [ Accepted ] ──► [ Hired ]
    │                                                     │                │
    ▼                                                     ▼                ▼
[ Cancelled ]                                       [ Declined ]     [ Withdrawn ]
                                                          │
                                                          ▼
                                                     [ Expired ]
```

### 2.1 State Definitions
1. **Draft**: Editable by authorized recruiter; hidden from candidate.
2. **Approved / Sent**: Formal offer terms finalized; candidate notified via multi-channel alerts.
3. **Accepted**: Candidate formally accepts; canonical Application state transitions to `offered` / `hired`.
4. **Declined / Expired**: Candidate declined or expiration window elapsed; candidate cannot re-accept.
5. **Withdrawn**: Recruiter cancelled the offer prior to acceptance.

---

## 3. Recruiter & Candidate Authorization Matrix

| Action | Hiring Manager / Admin | Recruiter Member | Candidate (Owner) | Candidate (Other) |
| :--- | :---: | :---: | :---: | :---: |
| **Create Draft Offer** | Yes | Yes | No (`403`) | No (`403`) |
| **Approve Compensation**| Yes | No (`403 Forbidden`) | No (`403`) | No (`403`) |
| **Send Offer to Candidate**| Yes | Yes | No (`403`) | No (`403`) |
| **View Sent Offer** | Yes | Yes | Yes | No (`403 Forbidden`) |
| **Accept Offer** | No (`403`) | No (`403`) | Yes | No (`403 Forbidden`) |
| **Decline Offer** | No (`403`) | No (`403`) | Yes | No (`403 Forbidden`) |
| **Withdraw Offer** | Yes | Yes | No (`403`) | No (`403`) |

---

## 4. Monetary Integrity & Document Security

- **Safe Monetary Storage**: Base salary and bonuses stored using exact decimal fields (`NUMERIC(15, 2)`) with explicit 3-letter currency codes (e.g. `USD`, `AED`, `EUR`, `INR`), eliminating floating-point rounding errors.
- **Private Offer Documents**: Generated offer letters are stored with signed URLs (15-minute expiration) and zero public search indexing.
