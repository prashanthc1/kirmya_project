'use client';

import React from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Stack,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import ShareIcon from '@mui/icons-material/Share';
import QrCodeIcon from '@mui/icons-material/QrCode';
import FlagIcon from '@mui/icons-material/Flag';
import Link from 'next/link';
import { ProfileData } from '../../features/profile/services/profileApi';

interface ProfileHeaderProps {
  profile: ProfileData;
  isOwner?: boolean;
  onReport?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, isOwner = true, onReport }) => {
  const isVerified = profile.verificationStatus === 'verified';

  return (
    <Card sx={{ borderRadius: '24px', overflow: 'hidden', mb: 3, bgcolor: 'background.paper' }}>
      {/* Cover Banner */}
      <Box
        sx={{
          height: 180,
          background: profile.coverUrl
            ? `url(${profile.coverUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          position: 'relative',
        }}
      />

      <Box sx={{ p: { xs: 2.5, md: 3.5 }, pt: 0, position: 'relative' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={2} sx={{ mt: -6, mb: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile.avatarUrl}
              sx={{
                width: 120,
                height: 120,
                border: '4px solid white',
                boxShadow: 3,
                fontSize: '2.5rem',
                bgcolor: 'primary.main',
              }}
            >
              {profile.username ? profile.username[0].toUpperCase() : 'K'}
            </Avatar>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {isOwner ? (
              <>
                <Button
                  component={Link}
                  href="/profile/edit"
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{ borderRadius: '12px', fontWeight: 800 }}
                >
                  Edit Profile
                </Button>
                <Button
                  component={Link}
                  href="/profile/preview"
                  variant="outlined"
                  sx={{ borderRadius: '12px', fontWeight: 800 }}
                >
                  Preview Public View
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
                  Connect
                </Button>
                <Button variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800 }}>
                  Message
                </Button>
                {onReport && (
                  <Tooltip title="Report Profile">
                    <IconButton onClick={onReport} color="warning">
                      <FlagIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
            <Tooltip title="Share Profile">
              <IconButton sx={{ bgcolor: 'action.hover' }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Profile QR Code">
              <IconButton sx={{ bgcolor: 'action.hover' }}>
                <QrCodeIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile.username || 'Kirmya Professional'}
            </Typography>
            {isVerified && (
              <Tooltip title="Verified Professional">
                <VerifiedIcon color="primary" sx={{ fontSize: 24 }} />
              </Tooltip>
            )}
          </Stack>

          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700, mt: 0.5 }}>
            {profile.headline || 'Professional at Kirmya'}
          </Typography>

          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1.5 }}>
            {profile.location && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {profile.location}
                </Typography>
              </Stack>
            )}
            {profile.currentPosition && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <BusinessIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {profile.currentPosition}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
            {profile.openToWork && (
              <Chip label="#OpenToWork" color="success" size="small" sx={{ fontWeight: 800 }} />
            )}
            {profile.openToRecruiters && (
              <Chip label="Open to Recruiters" color="info" size="small" sx={{ fontWeight: 800 }} />
            )}
            <Chip
              label={`${profile.profileCompletedPercentage}% Complete`}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Box>
      </Box>
    </Card>
  );
};

export default ProfileHeader;
