'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ExperienceEditor from './ExperienceEditor';
import EducationEditor from './EducationEditor';
import { ProfileData, profileApi } from '../../features/profile/services/profileApi';

export const ProfileEditLayout: React.FC<{ initialProfile?: ProfileData }> = ({ initialProfile }) => {
  const [profile, setProfile] = useState<Partial<ProfileData>>(initialProfile || {
    headline: '',
    summary: '',
    location: '',
    country: '',
    industry: '',
    currentPosition: '',
    openToWork: true,
    openToRecruiters: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSaveHeader = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile(profile);
      alert('Profile header updated successfully!');
    } catch (e) {
      alert('Failed to update profile header.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Edit Professional Identity & Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Each profile section saves independently to prevent accidental data loss.
      </Typography>

      {/* Section 1: Header & Basics */}
      <Card sx={{ borderRadius: '24px', p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          1. Basic Information & Headline
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Username"
              value={profile.username || ''}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Position / Title"
              value={profile.currentPosition || ''}
              onChange={(e) => setProfile({ ...profile, currentPosition: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Professional Headline"
              value={profile.headline || ''}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Industry"
              value={profile.industry || ''}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.openToWork ?? true}
                    onChange={(e) => setProfile({ ...profile, openToWork: e.target.checked })}
                  />
                }
                label="Open to Work Badge (#OpenToWork)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.openToRecruiters ?? true}
                    onChange={(e) => setProfile({ ...profile, openToRecruiters: e.target.checked })}
                  />
                }
                label="Open to Recruiters"
              />
            </Stack>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveHeader}
            disabled={saving}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Save Header Changes
          </Button>
        </Box>
      </Card>

      {/* Section 2: About / Summary */}
      <Card sx={{ borderRadius: '24px', p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          2. About & Career Summary
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Professional Summary"
          value={profile.summary || ''}
          onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
        />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveHeader}
            disabled={saving}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Save Summary
          </Button>
        </Box>
      </Card>

      {/* Section 3: Work Experience Editor */}
      <ExperienceEditor initialExperiences={initialProfile?.workExperiences} />

      {/* Section 4: Education Editor */}
      <EducationEditor initialEducations={initialProfile?.educations} />
    </Box>
  );
};

export default ProfileEditLayout;
