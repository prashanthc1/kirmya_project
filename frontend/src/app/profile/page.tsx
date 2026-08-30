'use client';

import React, { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Skeleton,
  Stack,
} from '@mui/material';

import { AuthenticatedLayout } from '../../components/shell';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileAbout from '../../components/profile/ProfileAbout';
import ProfileExperience from '../../components/profile/ProfileExperience';
import ProfileEducation from '../../components/profile/ProfileEducation';
import ProfileSkills from '../../components/profile/ProfileSkills';
import ProfileCertifications from '../../components/profile/ProfileCertifications';
import ProfileLanguages from '../../components/profile/ProfileLanguages';
import ProfileProjects from '../../components/profile/ProfileProjects';
import ProfileAchievements from '../../components/profile/ProfileAchievements';
import ProfileCompletenessCard from '../../components/profile/ProfileCompletenessCard';
import ProfileAnalyticsCard from '../../components/profile/ProfileAnalyticsCard';
import { ErrorState } from '../../components/common';
import { UserProfile } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await profileApi.getMyProfile();
      setProfile(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <AuthenticatedLayout maxWidth="standard">
      {loading && (
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                <Skeleton variant="rounded" height={180} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                <Skeleton variant="rounded" height={180} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      )}

      {!loading && error && (
        <ErrorState
          title="Unable to load profile"
          message="We could not retrieve your professional profile. Please check your connection and try again."
          onRetry={fetchProfile}
        />
      )}

      {!loading && !error && profile && (
        <Box component="div">
          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            isOwner={true}
            onPhotoUpload={(url) => setProfile({ ...profile, avatarUrl: url })}
          />

          {/* Two-Column Responsive Layout */}
          <Grid container spacing={3}>
            {/* Main Content Column */}
            <Grid item xs={12} md={8}>
              <Stack spacing={0}>
                {/* 1. About & Career Summary */}
                <ProfileAbout summary={profile.summary} isOwner={true} />

                {/* 2. Work Experience */}
                <ProfileExperience experiences={profile.workExperiences} isOwner={true} />

                {/* 3. Education */}
                <ProfileEducation educations={profile.educations} isOwner={true} />

                {/* 4. Skills & Competencies */}
                <ProfileSkills skills={profile.skills} isOwner={true} />

                {/* 5. Projects & Portfolio */}
                <ProfileProjects projects={profile.projects} isOwner={true} />

                {/* 6. Certifications */}
                <ProfileCertifications certifications={profile.certifications} isOwner={true} />

                {/* 7. Languages */}
                <ProfileLanguages languages={profile.languages} isOwner={true} />

                {/* 8. Honors & Achievements */}
                <ProfileAchievements achievements={profile.achievements} isOwner={true} />
              </Stack>
            </Grid>

            {/* Sidebar Column */}
            <Grid item xs={12} md={4}>
              <Stack spacing={0}>
                {/* Profile Completeness Guidance */}
                <ProfileCompletenessCard
                  completeness={profile.profileCompleteness}
                  percentage={profile.profileCompletedPercentage}
                />

                {/* Profile Analytics & Impressions */}
                <ProfileAnalyticsCard
                  analytics={profile.profileAnalytics}
                  views={profile.profileViewsCount}
                  searchAppearances={profile.searchAppearancesCount}
                  connectionRequests={profile.connectionRequestsCount}
                />
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}
    </AuthenticatedLayout>
  );
}
