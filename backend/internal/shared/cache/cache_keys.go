package cache

import (
	"fmt"
	"net/url"

	"github.com/google/uuid"
)

// Landing Page Cache Keys (TTL: 30 minutes)
func LandingContentKey() string {
	return "kirmya:landing:content"
}

func LandingFeaturedJobsKey() string {
	return "kirmya:landing:featured_jobs"
}

func LandingTestimonialsKey() string {
	return "kirmya:landing:testimonials"
}

func LandingStatsKey() string {
	return "kirmya:landing:stats"
}

// Job Search Cache Keys (TTL: 10 minutes)
func JobSearchKey(query, category string) string {
	return fmt.Sprintf("kirmya:search:jobs:%s:%s", url.QueryEscape(query), url.QueryEscape(category))
}

func PopularSearchesKey() string {
	return "kirmya:search:popular"
}

func TrendingJobsKey() string {
	return "kirmya:search:trending"
}

func SearchFiltersKey() string {
	return "kirmya:search:filters"
}

// User Profile Cache Keys (TTL: 15 minutes)
func UserProfileKey(userID uuid.UUID) string {
	return fmt.Sprintf("kirmya:user:profile:%s", userID.String())
}

func UserSkillsKey(userID uuid.UUID) string {
	return fmt.Sprintf("kirmya:user:skills:%s", userID.String())
}

func UserExperienceKey(userID uuid.UUID) string {
	return fmt.Sprintf("kirmya:user:experience:%s", userID.String())
}
