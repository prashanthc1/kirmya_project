# Kirmya "People You May Know" Networking Recommendations

## 1. Recommendation Scoring Algorithm
The networking recommendation engine evaluates candidates using 5 weighted scoring factors:
1. **Mutual Connection Count (Weight: 35%)**: Number of shared 1st-degree connections.
2. **Shared Company / Past Employer (Weight: 25%)**: Working at the same current or past organization.
3. **Shared Industry (Weight: 20%)**: Operating in the same industry domain.
4. **Shared Skills (Weight: 15%)**: Overlapping professional skill tags.
5. **Location Proximity (Weight: 5%)**: Matching city or metropolitan region.

---

## 2. Suppression & Privacy Rules
- Excludes existing 1st-degree connections and pending requests.
- Excludes users hidden from search or marked non-discoverable.
- Respects user dismissals (`POST /api/v1/network/recommendations/dismiss`).
