'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Container,
  Grid,
  Box,
  Skeleton,
  Typography,
  Card,
  Stack,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { AppHeader } from '../../../components/shell/AppHeader';
import { MobileDrawer } from '../../../components/shell/MobileDrawer';
import { MobileBottomNav } from '../../../components/shell/MobileBottomNav';
import { Footer } from '../../../components/landing/Footer';
import ProfileHeader from '../../../components/profile/ProfileHeader';
import ProfileAbout from '../../../components/profile/ProfileAbout';
import ProfileExperience from '../../../components/profile/ProfileExperience';
import ProfileEducation from '../../../components/profile/ProfileEducation';
import ProfileSkills from '../../../components/profile/ProfileSkills';
import ProfileCertifications from '../../../components/profile/ProfileCertifications';
import ProfileLanguages from '../../../components/profile/ProfileLanguages';
import ProfileProjects from '../../../components/profile/ProfileProjects';
import ProfileAchievements from '../../../components/profile/ProfileAchievements';
import ProfileReportDialog from '../../../components/profile/ProfileReportDialog';
import { ErrorState } from '../../../components/common';
import { UserProfile } from '../../../features/profile/types';
import { profileApi } from '../../../features/profile/api';
import { tokens } from '../../../theme/tokens';

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const fetchPublicProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await profileApi.getPublicProfile(username);
      setProfile(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  const isPrivate =
    profile?.isPrivate || profile?.privacySettings?.profileVisibility === 'private';

  const handleReportSubmit = async (reason: string, description: string) => {
    try {
      await profileApi.reportProfile(username, reason, description);
    } catch {
      // Handled silently or toast
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <Box component="main" id="main-content" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          {loading && (
            <Stack spacing={3}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              <Skeleton variant="rounded" height={240} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            </Stack>
          )}

          {!loading && error && (
            <ErrorState
              title="Profile Not Found"
              message={`We couldn't find a public profile for @${username}. The user may not exist or has set their profile to private.`}
              onRetry={fetchPublicProfile}
            />
          )}

          {!loading && !error && profile && isPrivate && (
            <Card
              elevation={1}
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: `${tokens.radius.lg}px`,
                maxWidth: 600,
                mx: 'auto',
                my: 4,
              }}
            >
              <LockOutlinedIcon color="action" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                This Profile is Private
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{profile.username} has configured their profile visibility settings to private. Only confirmed connections can view full career details.
              </Typography>
            </Card>
          )}

          {!loading && !error && profile && !isPrivate && (
            <Box>
              <ProfileHeader
                profile={profile}
                isOwner={false}
                onReport={() => setReportOpen(true)}
              />

              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Stack spacing={0}>
                    <ProfileAbout summary={profile.summary} isOwner={false} />
                    <ProfileExperience experiences={profile.workExperiences} isOwner={false} />
                    <ProfileEducation educations={profile.educations} isOwner={false} />
                    <ProfileSkills skills={profile.skills} isOwner={false} />
                    <ProfileProjects projects={profile.projects} isOwner={false} />
                    <ProfileCertifications certifications={profile.certifications} isOwner={false} />
                    <ProfileLanguages languages={profile.languages} isOwner={false} />
                    <ProfileAchievements achievements={profile.achievements} isOwner={false} />
                  </Stack>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card elevation={1} sx={{ p: 3, borderRadius: `${tokens.radius.lg}px`, mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Professional Summary
                    </Typography>
                    <Stack spacing={1.25} sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                      {profile.industry && (
                        <Typography variant="body2">
                          <strong>Industry:</strong> {profile.industry}
                        </Typography>
                      )}
                      {profile.location && (
                        <Typography variant="body2">
                          <strong>Location:</strong> {profile.location}
                        </Typography>
                      )}
                      {profile.targetRoles && profile.targetRoles.length > 0 && (
                        <Typography variant="body2">
                          <strong>Seeking:</strong> {profile.targetRoles.join(', ')}
                        </Typography>
                      )}
                    </Stack>
                  </Card>
                </Grid>
              </Grid>

              <ProfileReportDialog
                open={reportOpen}
                username={profile.username}
                onClose={() => setReportOpen(false)}
                onSubmit={handleReportSubmit}
              />
            </Box>
          )}
        </Container>
      </Box>

      <MobileBottomNav />
      <Footer />
    </Box>
  );
}
