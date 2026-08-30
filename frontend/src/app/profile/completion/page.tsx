'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Stack, Skeleton } from '@mui/material';

import { AuthenticatedLayout } from '../../../components/shell';
import ProfileCompletenessCard from '../../../components/profile/ProfileCompletenessCard';
import { ErrorState } from '../../../components/common';
import { ProfileCompleteness } from '../../../features/profile/types';
import { profileApi } from '../../../features/profile/api';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function ProfileCompletionPage() {
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCompleteness = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await profileApi.getProfileCompleteness();
      setCompleteness(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleteness();
  }, []);

  return (
    <AuthenticatedLayout maxWidth="standard">
      <Stack spacing={3}>
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
            Profile Strength & Completion
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Maximize your discovery by verified recruiters and hiring managers.
          </Typography>
        </div>

        {loading && (
          <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
        )}

        {!loading && error && (
          <ErrorState
            title="Unable to load completion status"
            message="We could not calculate your profile completeness right now. Please retry."
            onRetry={fetchCompleteness}
          />
        )}

        {!loading && !error && (
          <ProfileCompletenessCard completeness={completeness || undefined} />
        )}
      </Stack>
    </AuthenticatedLayout>
  );
}
