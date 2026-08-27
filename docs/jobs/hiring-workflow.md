# Kirmya End-to-End Hiring Workflow & Interview Orchestration

## 1. Structured Interview Scheduling Protocol
1. **Recruiter Schedules Interview**: Specifies interview type (Technical, Cultural, Behavioral), meeting link, date, and timezone.
2. **Calendar Timezone Normalization**: UTC timestamp stored in PostgreSQL; frontend renders local candidate and interviewer timezones.
3. **Automated Reminders**: Push/Email reminder dispatched 24 hours and 1 hour prior to scheduled session.
4. **Post-Interview Scorecard**: Interviewer submits confidential feedback and decision recommendation (`Strong Yes`, `Yes`, `No`, `Strong No`).
