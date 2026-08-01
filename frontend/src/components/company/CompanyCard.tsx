'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { motion } from 'framer-motion';
import GlassCard from '../landing/GlassCard';
import FollowButton from './FollowButton';
import { CompanyDirectoryItem } from '../../features/companies/types';
import { companiesApi } from '../../features/companies/api';

interface CompanyCardProps {
  item: CompanyDirectoryItem;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ item }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { company, profile } = item;
  const [saved, setSaved] = useState(profile.isSaved || false);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (saved) {
        await companiesApi.unsaveCompany(company.id);
        setSaved(false);
      } else {
        await companiesApi.saveCompany(company.id);
        setSaved(true);
      }
    } catch {
      setSaved(!saved);
    }
  };

  return (
    <GlassCard
      hoverScale={1.02}
      onClick={() => router.push(`/company/${company.handle}`)}
      sx={{
        cursor: 'pointer',
        height: '100%',
        p: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover Image Banner */}
      <Box
        sx={{
          height: 100,
          background: profile.coverUrl
            ? `url(${profile.coverUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #ec4899 100%)',
          position: 'relative',
        }}
      >
        <IconButton
          size="small"
          onClick={handleToggleSave}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            color: saved ? '#f59e0b' : '#ffffff',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' },
          }}
        >
          {saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
        </IconButton>

        {profile.isHiring && (
          <Chip
            label="ACTIVELY HIRING"
            color="success"
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              fontWeight: 800,
              fontSize: '0.65rem',
            }}
          />
        )}
      </Box>

      {/* Card Content Body */}
      <Box sx={{ p: 2.5, pt: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Avatar Logo Offset */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: -4, mb: 1.5 }}>
          <Avatar
            src={profile.logoUrl || undefined}
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              border: '3px solid',
              borderColor: isDark ? '#0f172a' : '#ffffff',
              bgcolor: 'primary.main',
              fontWeight: 900,
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            {company.name[0]}
          </Avatar>

          <FollowButton companyId={company.id} initialFollowing={profile.isFollowing} />
        </Box>

        {/* Company Name & Verified Badge */}
        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
            {company.name}
          </Typography>
          {profile.isVerified && <VerifiedIcon sx={{ color: '#0284c7', fontSize: 18 }} titleAccess="Verified Employer" />}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
          {profile.industry} • Founded {profile.foundedYear}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: '0.84rem',
            lineHeight: 1.5,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {profile.about}
        </Typography>

        {/* Stats Row */}
        <Stack direction="row" spacing={2} sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOnIcon fontSize="small" color="primary" />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {profile.location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WorkIcon fontSize="small" sx={{ color: '#10b981' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981' }}>
              {profile.openJobsCount} Open Jobs
            </Typography>
          </Box>
        </Stack>
      </Box>
    </GlassCard>
  );
};

export default CompanyCard;
