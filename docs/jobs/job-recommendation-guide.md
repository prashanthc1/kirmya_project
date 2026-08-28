# Kirmya Personalized Recommendations & Feed Engine Manual

## 1. Hybrid Recommendation Pipeline
- **Deterministic Stage**: Filters active, published jobs by candidate's desired industry, target titles, and remote preferences.
- **Semantic Vector Stage**: Computes cosine similarity between profile vector and job vacancy vectors.
- **Explainable Match Details**: Displays clear rationale ("85% match: 6 overlapping skills, matches preferred remote mode").
