# Kirmya Central Recommendation & Career Intelligence Engine

## 1. Architectural Overview
Kirmya features a production-ready, explainable recommendation and personalization pipeline that candidate-matches jobs, peer connections, professional communities, skill development pathways, and career gap actions.

```
User & Profile Features → Hard Eligibility & Safety Filters → Candidate Scoring Pipeline
                                                                     ↓
                                                          Diversity & Fairness Re-Ranking
                                                                     ↓
                                                       Explainable Rationale Generation
                                                                     ↓
                                                       Unified Recommendations Response
```

## 2. Scoring Pipeline & Fairness Constraints
- **Multi-Factor Weighting**:
  - Skill Match Weight (Default: 35%)
  - Title Match Weight (Default: 25%)
  - Location Compatibility Weight (Default: 15%)
  - Industry Match Weight (Default: 15%)
  - Diversity Penalty (Default: 10%)
- **Fairness Guarantee**: Protected personal characteristics (race, religion, gender, sexual orientation, health data) are strictly prohibited from candidate scoring, vector representation, or ranking features.

## 3. Explainability & Feedback Loop
- **Server-Side Rationales**: Every recommendation includes a human-readable rationale (e.g., *"96% match based on your Go microservices & PostgreSQL index optimization experience"*).
- **Feedback Event Processing**: User actions (`view`, `click`, `apply`, `save`, `dismiss`) trigger feature vector adjustments without overfitting to a single interaction.

## 4. Hard Safety Filters & Opt-Out
- Blocked users, restricted accounts, private profiles, expired jobs, and reported entities are filtered before scoring.
- Users can adjust personalization controls or opt-out via account settings.
