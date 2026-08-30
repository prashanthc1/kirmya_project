'use client';

import React, { useRef, useState } from 'react';
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
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import Link from 'next/link';

import { UserProfile } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwner?: boolean;
  onReport?: () => void;
  onPhotoUpload?: (url: string) => void;
  onCoverUpload?: (url: string) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwner = true,
  onReport,
  onPhotoUpload,
}) => {
  const theme = useTheme();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const status = profile.verificationStatus || 'unverified';
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || 'Candidate';

  const renderVerificationBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <Tooltip title="Official Verified Professional">
            <Chip
              icon={<VerifiedIcon style={{ color: '#fff', fontSize: 16 }} />}
              label="Verified"
              color="primary"
              size="small"
              sx={{ fontWeight: 700, height: 24 }}
            />
          </Tooltip>
        );
      case 'pending':
        return (
          <Tooltip title="Verification Request Pending Review">
            <Chip
              icon={<PendingIcon style={{ fontSize: 16 }} />}
              label="Pending"
              color="warning"
              size="small"
              sx={{ fontWeight: 700, height: 24 }}
            />
          </Tooltip>
        );
      case 'rejected':
        return (
          <Tooltip title="Verification Application Rejected">
            <Chip
              icon={<CancelIcon style={{ fontSize: 16 }} />}
              label="Rejected"
              color="error"
              size="small"
              sx={{ fontWeight: 700, height: 24 }}
            />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('Image size must not exceed 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setUploadingAvatar(true);
    try {
      const res = await profileApi.uploadPhoto(formData);
      onPhotoUpload?.(res.photo_url);
      setToastMessage('Profile photo updated successfully.');
    } catch {
      setToastMessage('Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/profile/${profile.username}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setToastMessage('Profile link copied to clipboard!');
    }
  };

  return (
    <Card
      component="header"
      elevation={1}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        mb: 3.5,
        p: { xs: 2.5, sm: 3.5 },
        position: 'relative',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2.5, sm: 3.5 }}
        alignItems={{ xs: 'center', sm: 'flex-start' }}
      >
        {/* Avatar & Photo Upload */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={profile.avatarUrl || undefined}
            sx={{
              width: { xs: 96, sm: 112 },
              height: { xs: 96, sm: 112 },
              fontSize: '2.5rem',
              fontWeight: 800,
              bgcolor: theme.palette.primary.main,
              color: '#ffffff',
              border: `3px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[2],
            }}
          >
            {fullName.charAt(0).toUpperCase()}
          </Avatar>

          {isOwner && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
              />
              <Tooltip title="Upload new photo">
                <IconButton
                  size="small"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  aria-label="Upload profile photo"
                >
                  {uploadingAvatar ? <CircularProgress size={16} /> : <PhotoCameraOutlinedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Profile Info Details */}
        <Box sx={{ flexGrow: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            justifyContent={{ xs: 'center', sm: 'flex-start' }}
            flexWrap="wrap"
            sx={{ mb: 0.5 }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
              }}
            >
              {fullName}
            </Typography>
            {renderVerificationBadge()}
            {profile.openToWork && (
              <Chip
                label="Open to Work"
                color="success"
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700, height: 24 }}
              />
            )}
          </Stack>

          {/* Headline */}
          {profile.headline && (
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ fontWeight: 500, lineHeight: 1.4, mb: 1 }}
            >
              {profile.headline}
            </Typography>
          )}

          {/* Location & Current Role Metadata */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent={{ xs: 'center', sm: 'flex-start' }}
            flexWrap="wrap"
            sx={{ color: 'text.secondary', fontSize: '0.875rem', rowGap: 0.5 }}
          >
            {profile.currentPosition && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <BusinessOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">{profile.currentPosition}</Typography>
              </Stack>
            )}
            {profile.location && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  {profile.location}
                  {profile.country ? `, ${profile.country}` : ''}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Action Controls */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent={{ xs: 'center', sm: 'flex-end' }}
          sx={{ flexShrink: 0, pt: { xs: 1, sm: 0 } }}
        >
          {isOwner ? (
            <Button
              component={Link}
              href={ROUTES.EDIT_PROFILE}
              variant="contained"
              size="medium"
              startIcon={<EditOutlinedIcon />}
              sx={{ borderRadius: `${tokens.radius.md}px`, px: 2.5 }}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                component={Link}
                href={`/messages?userId=${profile.userId}`}
                variant="contained"
                size="medium"
                sx={{ borderRadius: `${tokens.radius.md}px`, px: 2.5 }}
              >
                Connect / Message
              </Button>
              {onReport && (
                <Tooltip title="Report Profile">
                  <IconButton onClick={onReport} size="small" aria-label="Report this profile">
                    <FlagOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          <Tooltip title="Share Profile Link">
            <IconButton onClick={handleShare} size="small" aria-label="Share profile link">
              <ShareOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setToastMessage(null)} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ProfileHeader;
