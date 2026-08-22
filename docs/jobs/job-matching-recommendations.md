# Kirmya AI Job Matching & Recommendation Engine

## 1. Job Matching Algorithm
Matches candidates to jobs based on 4 weighted vectors:
1. **Skill Overlap (Weight: 40%)**: Jaccard similarity index between candidate skill tags and required job skills.
2. **Title & Role Alignment (Weight: 30%)**: Semantic match between candidate headline and job title.
3. **Experience Level (Weight: 20%)**: Candidate years of experience vs. job seniority tier.
4. **Work Mode & Location (Weight: 10%)**: Remote preference or geographical proximity.

---

## 2. Job Alerts Delivery
- Users set custom alerts (`/jobs/alerts`) for keywords, locations, and work modes.
- Alerts trigger digest notifications via in-app notification center and email, deduplicating previously delivered jobs.
