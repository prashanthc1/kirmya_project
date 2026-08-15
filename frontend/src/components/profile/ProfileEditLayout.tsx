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
import CareerPreferencesEditor from './CareerPreferencesEditor';
import { UserProfile, profileApi } from '../../features/profile/services/profileApi';

export const ProfileEditLayout: React.FC<{ initialProfile?: UserProfile }> = ({ initialProfile }) => {
  const [profile, setProfile] = useState<Partial<UserProfile>>(
    initialProfile || {
      headline: '',
      summary: '',
      location: '',
      country: '',
      industry: '',
      currentPosition: '',
      openToWork: true,
      openToRecruiters: true,
    }
  );
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
        Edit Professional Identity & Profile Studio
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage basic info, career summary, work history, education, and recruiter preferences.
      </Typography>

      {/* Section 1: Header & Basics */}
      <Card
        sx={{
          borderRadius: '24px',
          p: 3.5,
          mb: 4,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2.5 }}>
          1. Basic Information & Headline
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Username"
              value={profile.username || ''}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Position / Title"
              value={profile.currentPosition || ''}
              onChange={(e) => setProfile({ ...profile, currentPosition: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Professional Headline"
              value={profile.headline || ''}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Industry"
              value={profile.industry || ''}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveHeader}
            disabled={saving}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Save Header Changes
          </Button>
        </Box>
      </Card>

      {/* Section 2: Career Preferences Editor */}
      <CareerPreferencesEditor
        initialPreferences={initialProfile?.careerPreferences}
      />

      {/* Section 3: About / Summary */}
      <Card
        sx={{
          borderRadius: '24px',
          p: 3.5,
          mb: 4,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2.5 }}>
          3. About & Career Summary
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Professional Summary"
          value={profile.summary || ''}
          onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveHeader}
            disabled={saving}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Save Summary
          </Button>
        </Box>
      </Card>

      {/* Section 4: Work Experience Editor */}
      <ExperienceEditor initialExperiences={initialProfile?.workExperiences} />

      {/* Section 5: Education Editor */}
      <EducationEditor initialEducations={initialProfile?.educations} />
    </Box>
  );
};

export default ProfileEditLayout;
