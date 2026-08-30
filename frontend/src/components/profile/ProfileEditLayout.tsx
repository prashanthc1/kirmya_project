'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  TextField,
  Button,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

import { AuthenticatedLayout } from '../shell';
import ExperienceEditor from './ExperienceEditor';
import EducationEditor from './EducationEditor';
import CareerPreferencesEditor from './CareerPreferencesEditor';
import ProfilePrivacySettings from './ProfilePrivacySettings';
import { ErrorState } from '../common';
import { UserProfile } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

export const ProfileEditLayout: React.FC<{ initialProfile?: UserProfile }> = ({ initialProfile }) => {
  const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile || {});
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    if (!initialProfile) {
      fetchProfile();
    }
  }, [initialProfile]);

  const handleSaveHeader = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile({
        username: profile.username,
        headline: profile.headline,
        summary: profile.summary,
        location: profile.location,
        country: profile.country,
        industry: profile.industry,
        currentPosition: profile.currentPosition,
      });
      setToastMessage('Basic information & headline updated successfully.');
    } catch {
      setToastMessage('Failed to update basic information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedLayout maxWidth="standard">
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Button
            component={Link}
            href={ROUTES.PROFILE}
            startIcon={<ArrowBackIcon />}
            size="small"
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Back to Profile
          </Button>
        </Stack>

        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
          Edit Profile & Professional Identity
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your basic information, headline, experience, education, and career preferences.
        </Typography>
      </Box>

      {loading && (
        <Stack spacing={3}>
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          <Skeleton variant="rounded" height={240} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
        </Stack>
      )}

      {!loading && error && (
        <ErrorState
          title="Unable to load profile data"
          message="We could not load your profile for editing. Please check your connection and retry."
          onRetry={fetchProfile}
        />
      )}

      {!loading && !error && (
        <Stack spacing={4}>
          {/* Section 1: Basic Information & Headline */}
          <Card
            id="basic"
            elevation={1}
            sx={{
              borderRadius: `${tokens.radius.lg}px`,
              p: { xs: 2.5, sm: 3.5 },
            }}
          >
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2.5 }}>
              1. Basic Information & Headline
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={profile.username || ''}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  helperText="Your unique URL handle on Kirmya"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Position / Title"
                  value={profile.currentPosition || ''}
                  onChange={(e) => setProfile({ ...profile, currentPosition: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Professional Headline"
                  value={profile.headline || ''}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  placeholder="e.g. Distributed Systems Engineer | Cloud & Microservices Architect"
                  helperText="Summarize your professional expertise in one line"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, State"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={profile.country || ''}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  placeholder="Country"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Industry / Domain"
                  value={profile.industry || ''}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  placeholder="e.g. Technology, Finance, Healthcare"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="About & Career Summary"
                  value={profile.summary || ''}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  placeholder="Share a concise overview of your background, leadership accomplishments, and career aspirations..."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSaveHeader}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <SaveOutlinedIcon />}
                sx={{ borderRadius: `${tokens.radius.md}px`, px: 3 }}
              >
                {saving ? 'Saving...' : 'Save Basic Info'}
              </Button>
            </Box>
          </Card>

          {/* Section 2: Work Experience */}
          <Box id="experience">
            <ExperienceEditor initialExperiences={profile.workExperiences} />
          </Box>

          {/* Section 3: Education */}
          <Box id="education">
            <EducationEditor initialEducations={profile.educations} />
          </Box>

          {/* Section 4: Career Preferences */}
          <Box id="preferences">
            <CareerPreferencesEditor initialPreferences={profile.careerPreferences} />
          </Box>

          {/* Section 5: Privacy Settings */}
          <Box id="privacy">
            <ProfilePrivacySettings initialSettings={profile.privacySettings} />
          </Box>
        </Stack>
      )}

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </AuthenticatedLayout>
  );
};

export default ProfileEditLayout;
