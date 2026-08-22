# Kirmya Organization & Tenant Isolation Architecture

## 1. Multi-Tenant Organization Boundaries
- **Organization-Scoped Context**: All organization-level entities (jobs, team members, applicant notes, billing details) are strictly bound to `organization_id`.
- **Cross-Tenant Access Defense**: API operations verify caller membership in target `organization_id` via `org_members` junction table before executing read or write operations.

```sql
-- Database Foreign Key & Tenant Scoping Constraint
SELECT * FROM organization_jobs 
WHERE organization_id = $1 
  AND id = $2 
  AND EXISTS (
      SELECT 1 FROM org_members 
      WHERE organization_id = $1 AND user_id = $3 AND status = 'active'
  );
```
