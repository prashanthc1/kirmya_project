# Kirmya Time-Zone Handling & Calendar Synchronization

## 1. Time-Zone Normalization
- All scheduling timestamps are stored in PostgreSQL using `TIMESTAMPTZ` (normalized to UTC).
- Candidate and recruiter UI components format dates using the client's local IANA time zone (e.g. `America/New_York`, `Asia/Kolkata`, `Europe/London`), preventing daylight saving time (DST) calculation errors.

---

## 2. Double-Booking Conflict Prevention
Before creating an interview booking, the backend queries active interviews for both the candidate and assigned panel members:
```sql
SELECT id FROM interviews 
WHERE interviewer_id = $1 
  AND status IN ('scheduled', 'confirmed') 
  AND tstzrange(start_time, end_time) && tstzrange($2, $3);
```
If an overlapping range exists, the API rejects the request with HTTP 409 Conflict.
