'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Stack, Button, Box, Skeleton } from '@mui/material';

import { AuthenticatedLayout } from '../../../components/shell';
import ProfileHeader from '../../../components/profile/ProfileHeader';
import ProfileAbout from '../../../components/profile/ProfileAbout';
import ProfileExperience from '../../../components/profile/ProfileExperience';
import ProfileEducation from '../../../components/profile/ProfileEducation';
import ProfileSkills from '../../../components/profile/ProfileSkills';
import { ErrorState } from '../../../components/common';
import { UserProfile } from '../../../features/profile/types';
import { profileApi } from '../../../features/profile/api';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ProfilePreviewPage() {
  const [viewMode, setViewMode] = useState<'public' | 'members' | 'connections'>('public');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPreview = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await profileApi.getProfilePreview(viewMode);
      setProfile(data.profile || null);
    } catch {
      // Fallback to getMyProfile if preview endpoint fails
      try {
        const myData = await profileApi.getMyProfile();
        setProfile(myData);
      } catch {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [viewMode]);

  return (
    <AuthenticatedLayout maxWidth="standard">
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
              Profile Privacy Preview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              See how your professional identity appears to different visitor audiences.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant={viewMode === 'public' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('public')}
              sx={{ borderRadius: `${tokens.radius.md}px` }}
            >
              Public
            </Button>
            <Button
              variant={viewMode === 'members' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('members')}
              sx={{ borderRadius: `${tokens.radius.md}px` }}
            >
              Members
            </Button>
            <Button
              variant={viewMode === 'connections' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('connections')}
              sx={{ borderRadius: `${tokens.radius.md}px` }}
            >
              Connections
            </Button>
          </Stack>
        </Stack>

        {loading && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Stack>
        )}

        {!loading && error && (
          <ErrorState
            title="Unable to generate preview"
            message="We could not render your profile preview under the selected audience mode."
            onRetry={fetchPreview}
          />
        )}

        {!loading && !error && profile && (
          <Box>
            <ProfileHeader profile={profile} isOwner={false} />
            <ProfileAbout summary={profile.summary} isOwner={false} />
            <ProfileExperience experiences={profile.workExperiences} isOwner={false} />
            <ProfileEducation educations={profile.educations} isOwner={false} />
            <ProfileSkills skills={profile.skills} isOwner={false} />
          </Box>
        )}
      </Stack>
    </AuthenticatedLayout>
  );
}
