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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import ShareIcon from '@mui/icons-material/Share';
import QrCodeIcon from '@mui/icons-material/QrCode';
import FlagIcon from '@mui/icons-material/Flag';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CollectionsIcon from '@mui/icons-material/Collections';
import Link from 'next/link';
import { UserProfile } from '../../features/profile/types';
import { profileApi } from '../../features/profile/api';

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
  onCoverUpload,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const status = profile.verificationStatus || 'unverified';

  const renderVerificationBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <Tooltip title="Official Verified Professional">
            <Chip
              icon={<VerifiedIcon style={{ color: '#fff' }} />}
              label="Verified"
              color="primary"
              size="small"
              sx={{ fontWeight: 800 }}
            />
          </Tooltip>
        );
      case 'pending':
        return (
          <Tooltip title="Verification Request Pending Audit">
            <Chip
              icon={<PendingIcon />}
              label="Pending Verification"
              color="warning"
              size="small"
              sx={{ fontWeight: 800 }}
            />
          </Tooltip>
        );
      case 'rejected':
        return (
          <Tooltip title="Verification Application Rejected">
            <Chip
              icon={<CancelIcon />}
              label="Rejected"
              color="error"
              size="small"
              sx={{ fontWeight: 800 }}
            />
          </Tooltip>
        );
      default:
        return (
          <Tooltip title="Unverified Candidate Profile">
            <Chip
              label="Unverified"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700, color: 'text.secondary' }}
            />
          </Tooltip>
        );
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await profileApi.uploadPhoto(formData);
      if (onPhotoUpload && res.photo_url) {
        onPhotoUpload(res.photo_url);
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await profileApi.uploadCoverPhoto(formData);
      if (onCoverUpload && res.cover_url) {
        onCoverUpload(res.cover_url);
      }
    } catch (err) {
      console.error('Cover upload failed', err);
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        overflow: 'hidden',
        mb: 3,
        bgcolor: 'background.paper',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Cover Banner */}
      <Box
        sx={{
          height: 200,
          background: profile.coverUrl
            ? `url(${profile.coverUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          position: 'relative',
        }}
      >
        {isOwner && (
          <>
            <input
              type="file"
              accept="image/*"
              ref={coverInputRef}
              style={{ display: 'none' }}
              onChange={handleCoverChange}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={uploadingCover ? <CircularProgress size={16} color="inherit" /> : <CollectionsIcon />}
              onClick={() => coverInputRef.current?.click()}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                borderRadius: '12px',
                bgcolor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.9)' },
              }}
            >
              {uploadingCover ? 'Uploading...' : 'Change Cover'}
            </Button>
          </>
        )}
      </Box>

      <Box sx={{ p: { xs: 2.5, md: 3.5 }, pt: 0, position: 'relative' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          spacing={2}
          sx={{ mt: -7, mb: 2 }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile.avatarUrl}
              sx={{
                width: 128,
                height: 128,
                border: '4px solid white',
                boxShadow: 4,
                fontSize: '2.5rem',
                bgcolor: 'primary.main',
              }}
            >
              {profile.username ? profile.username[0].toUpperCase() : 'K'}
            </Avatar>

            {isOwner && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  ref={avatarInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <Tooltip title="Upload Profile Photo">
                  <IconButton
                    onClick={() => avatarInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      bgcolor: 'primary.main',
                      color: 'white',
                      boxShadow: 2,
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    {uploadingAvatar ? <CircularProgress size={18} color="inherit" /> : <PhotoCameraIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ pt: { xs: 1, sm: 0 } }}>
            {isOwner ? (
              <>
                <Button
                  component={Link}
                  href="/profile/edit"
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                >
                  Edit Profile
                </Button>
                <Button
                  component={Link}
                  href="/profile/preview"
                  variant="outlined"
                  sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
                >
                  Preview Public View
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}>
                  Connect
                </Button>
                <Button variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}>
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
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : profile.username || 'Kirmya Professional'}
            </Typography>
            {renderVerificationBadge()}
          </Stack>

          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700, mt: 0.5 }}>
            {profile.headline || 'Professional at Kirmya'}
          </Typography>

          <Stack direction="row" spacing={2.5} flexWrap="wrap" sx={{ mt: 1.5 }}>
            {profile.location && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {profile.location}
                </Typography>
              </Stack>
            )}
            {profile.currentPosition && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <BusinessIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
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
