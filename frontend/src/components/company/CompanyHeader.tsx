'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Rating,
  useTheme,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import WorkIcon from '@mui/icons-material/Work';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import BusinessIcon from '@mui/icons-material/Business';
import FollowButton from './FollowButton';
import ShareDialog from './ShareDialog';

interface CompanyHeaderProps {
  company: any;
  profile: any;
  following: boolean;
  onReport: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  company,
  profile,
  following,
  onReport,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <Box sx={{ mb: 4 }}>
      {/* Cover Image Banner */}
      <Box
        sx={{
          height: { xs: 180, md: 280 },
          borderRadius: '24px',
          background: profile.coverUrl
            ? `url(${profile.coverUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #ec4899 100%)',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        }}
      >
        {profile.isHiring && (
          <Chip
            label="ACTIVELY HIRING"
            color="success"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              fontWeight: 900,
              px: 1.5,
              fontSize: '0.75rem',
            }}
          />
        )}
      </Box>

      {/* Main Info Card Header */}
      <Box sx={{ px: { xs: 2, md: 4 }, mt: -7, position: 'relative', zIndex: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
          justifyContent="space-between"
        >
          {/* Logo & Company Title */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
            <Avatar
              src={profile.logoUrl || undefined}
              sx={{
                width: 110,
                height: 110,
                borderRadius: '24px',
                border: '4px solid',
                borderColor: isDark ? '#0f172a' : '#ffffff',
                bgcolor: 'primary.main',
                fontSize: '2.8rem',
                fontWeight: 900,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              }}
            >
              {company.name[0]}
            </Avatar>

            <Box sx={{ pt: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
                  {company.name}
                </Typography>
                {profile.isVerified && (
                  <VerifiedIcon sx={{ color: '#0284c7', fontSize: 28 }} titleAccess="Verified Employer" />
                )}
              </Stack>

              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                {profile.industry} • Founded {profile.foundedYear} • {profile.companySize}
              </Typography>

              {/* Rating & Location */}
              <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Rating value={profile.rating || 4.9} precision={0.1} readOnly size="small" />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {profile.rating || 4.9} ({profile.reviewCount || 280} Reviews)
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationOnIcon fontSize="small" color="primary" />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {profile.location}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ pt: { xs: 2, md: 0 } }}>
            <FollowButton
              companyId={company.id}
              initialFollowing={following}
              sx={{ py: 1.2, px: 3, borderRadius: '12px', fontSize: '0.95rem' }}
            />

            <Button
              variant="contained"
              startIcon={<WorkIcon />}
              onClick={() => {
                const el = document.getElementById('open-jobs-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                py: 1.2,
                px: 3,
                borderRadius: '12px',
                fontWeight: 800,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              View {profile.openJobsCount} Jobs
            </Button>

            <Button
              variant="outlined"
              startIcon={<LanguageIcon />}
              component="a"
              href={profile.website}
              target="_blank"
              sx={{ py: 1.2, px: 2.5, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
            >
              Website
            </Button>

            <IconButton
              onClick={() => setShareOpen(true)}
              sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderRadius: '12px' }}
            >
              <ShareIcon />
            </IconButton>

            <IconButton
              onClick={onReport}
              sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderRadius: '12px' }}
            >
              <FlagIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      {/* Share Modal Dialog */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        companyName={company.name}
        handle={company.handle}
      />
    </Box>
  );
};

export default CompanyHeader;
