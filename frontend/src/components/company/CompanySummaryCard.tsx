'use client';

/** A company as it appears in search results and discovery rails. */
import React from 'react';
import NextLink from 'next/link';
import { Avatar, Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

import { CompanySummary } from '../../features/company/types';
import { HiringChip, VerifiedBadge } from './CompanyBadges';

const numberFormat = new Intl.NumberFormat();

export const CompanySummaryCard: React.FC<{ company: CompanySummary; dense?: boolean }> = ({
  company,
  dense = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component={NextLink}
      href={`/company/${company.slug}`}
      sx={{
        display: 'block',
        p: dense ? 2 : 2.5,
        height: '100%',
        borderRadius: '16px',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        transition: 'transform 160ms ease, border-color 160ms ease',
        '&:hover': { transform: 'translateY(-3px)', borderColor: 'primary.main' },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar
          src={company.logoUrl || undefined}
          alt=""
          variant="rounded"
          sx={{ width: dense ? 44 : 56, height: dense ? 44 : 56, borderRadius: '12px' }}
        >
          {company.name?.charAt(0) ?? <BusinessIcon />}
        </Avatar>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
              {company.name}
            </Typography>
            <VerifiedBadge isVerified={company.isVerified} />
          </Stack>

          {company.tagline && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {company.tagline}
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1, color: 'text.secondary' }}
          >
            {company.industry && <Typography variant="caption">{company.industry}</Typography>}
            {company.headquarters && (
              <Stack direction="row" spacing={0.25} alignItems="center">
                <LocationOnIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">{company.headquarters}</Typography>
              </Stack>
            )}
            {company.companySize && (
              <Stack direction="row" spacing={0.25} alignItems="center">
                <PeopleAltIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption">{company.companySize}</Typography>
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            <HiringChip isHiring={company.isHiring} />
            {company.openJobsCount > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={`${numberFormat.format(company.openJobsCount)} open ${
                  company.openJobsCount === 1 ? 'role' : 'roles'
                }`}
              />
            )}
            {company.followersCount > 0 && (
              <Chip
                size="small"
                variant="outlined"
                label={`${numberFormat.format(company.followersCount)} followers`}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default CompanySummaryCard;
