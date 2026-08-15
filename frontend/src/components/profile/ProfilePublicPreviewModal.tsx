'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  ButtonGroup,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import { UserProfile } from '../../features/profile/types';
import ProfileHeader from './ProfileHeader';
import ProfileAbout from './ProfileAbout';
import ProfileExperience from './ProfileExperience';

interface ProfilePublicPreviewModalProps {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
}

export const ProfilePublicPreviewModal: React.FC<ProfilePublicPreviewModalProps> = ({
  open,
  profile,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'public' | 'members' | 'connections'>('public');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: 'background.paper',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <VisibilityIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Public Profile Preview Mode
            </Typography>
          </Stack>

          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={viewMode === 'public' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('public')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Public
            </Button>
            <Button
              variant={viewMode === 'members' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('members')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Members
            </Button>
            <Button
              variant={viewMode === 'connections' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('connections')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Connections
            </Button>
          </ButtonGroup>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`Currently rendering profile as viewed by: ${
              viewMode === 'public'
                ? 'External Public Visitors & Search Engines'
                : viewMode === 'members'
                ? 'Logged-in Kirmya Members'
                : 'Your Accepted Professional Connections'
            }`}
            color="info"
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          />
        </Box>

        <ProfileHeader profile={profile} isOwner={false} />
        <ProfileAbout summary={profile.summary} />
        {profile.workExperiences && profile.workExperiences.length > 0 && (
          <ProfileExperience experiences={profile.workExperiences} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
        <Button
          component={Link}
          href="/profile/settings"
          variant="outlined"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
        >
          Edit Privacy Settings
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          startIcon={<CloseIcon />}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}
        >
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfilePublicPreviewModal;
