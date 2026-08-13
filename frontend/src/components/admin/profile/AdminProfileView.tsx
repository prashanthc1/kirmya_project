'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Button,
  Chip,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import SecurityIcon from '@mui/icons-material/Security';
import { ProfileData, profileApi } from '../../../features/profile/services/profileApi';

export const AdminProfileView: React.FC<{ profile: ProfileData; userId: string }> = ({ profile: initialProfile, userId }) => {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [verificationStatus, setVerificationStatus] = useState(initialProfile.verificationStatus || 'unverified');
  const [verificationNotes, setVerificationNotes] = useState(initialProfile.verificationNotes || '');
  const [isRestricted, setIsRestricted] = useState(initialProfile.isRestricted || false);

  const handleVerify = async () => {
    try {
      await profileApi.adminVerifyProfile(userId, verificationStatus, verificationNotes);
      alert('Verification status updated.');
    } catch (e) {
      alert('Failed to update verification status.');
    }
  };

  const handleRestrict = async () => {
    try {
      await profileApi.adminRestrictProfile(userId, isRestricted);
      alert('Profile restriction state updated.');
    } catch (e) {
      alert('Failed to update restriction state.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <SecurityIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Admin User Profile Audit & Moderation Desk
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Inspect identity details, perform verification, enforce platform restrictions, and view moderation logs.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: '24px', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
              Candidate Identity Summary
            </Typography>
            <Typography variant="body1"><strong>Username:</strong> @{profile.username}</Typography>
            <Typography variant="body1"><strong>Headline:</strong> {profile.headline}</Typography>
            <Typography variant="body1"><strong>Current Position:</strong> {profile.currentPosition || 'N/A'}</Typography>
            <Typography variant="body1"><strong>Location:</strong> {profile.location || 'N/A'}</Typography>
            <Typography variant="body1"><strong>Completion Score:</strong> {profile.profileCompletedPercentage}%</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Verification Card */}
          <Card sx={{ p: 3, borderRadius: '24px', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
              Official Verification State
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value as any)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="unverified">Unverified</MenuItem>
              <MenuItem value="pending">Pending Audit</MenuItem>
              <MenuItem value="verified">Verified Badge Granted</MenuItem>
              <MenuItem value="rejected">Rejected / Incomplete</MenuItem>
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Audit Notes"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" fullWidth onClick={handleVerify} sx={{ borderRadius: '12px', fontWeight: 800 }}>
              Update Verification
            </Button>
          </Card>

          {/* Restriction Card */}
          <Card sx={{ p: 3, borderRadius: '24px' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
              Trust & Safety Restriction
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isRestricted}
                  onChange={(e) => setIsRestricted(e.target.checked)}
                />
              }
              label="Restrict Public Search & Profile"
            />
            <Button color="error" variant="contained" fullWidth onClick={handleRestrict} sx={{ borderRadius: '12px', fontWeight: 800, mt: 2 }}>
              Enforce Restriction
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminProfileView;
