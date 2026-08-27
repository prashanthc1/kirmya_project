# Kirmya AI Matching Architecture & Data Pipelines

## 1. Pipeline Staging & Deterministic Fallback
1. **Retrieval**: OpenSearch cosine similarity & PostgreSQL full-text fallback retrieve top-100 candidate jobs.
2. **Hard Constraints**: Filter out closed jobs, blocked companies, and non-matching work authorization statuses.
3. **Multi-Vector Scoring**: Compute compatibility score across skills, experience, location, and role.
4. **Diversity & Exploration**: Apply clustering to prevent vendor monopolies and surface adjacent growth opportunities.
5. **Deterministic Fallback**: If LLM/embeddings services timeout or fail, the system falls back to PostgreSQL structured skill overlap calculation without degrading availability.
