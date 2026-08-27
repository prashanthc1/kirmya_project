# Kirmya Profile Privacy & Visibility Controls

## 1. Profile Visibility Levels
- **Public**: Discoverable via search and viewable by non-logged-in visitors.
- **Connections Only**: Detailed experience, education, and skills are visible only to accepted 1st-degree connections.
- **Private**: Hidden from public search indexes; only basic name and avatar visible to direct profile URL requests.

---

## 2. Blocked User Handling
If User A blocks User B:
- User B cannot view User A's profile (returns HTTP 404 Not Found to prevent enumeration).
- User A is excluded from User B's search suggestions and People You May Know recommendations.
