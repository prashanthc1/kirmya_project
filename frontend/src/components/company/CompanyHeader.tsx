'use client';

/**
 * Public header for a company page: identity, key figures and the viewer's
 * actions. Everything rendered here comes from `CompanyDetail`; nothing is
 * defaulted to a plausible-looking figure when the company has not supplied it.
 */
import React from 'react';
import NextLink from 'next/link';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Rating,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';
import GroupsIcon from '@mui/icons-material/Groups';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SettingsIcon from '@mui/icons-material/Settings';

import { CompanyDetail } from '../../features/company/types';
import { canOpenDashboard } from '../../features/company/permissions';
import { HiringChip, VerifiedBadge } from './CompanyBadges';
import CompanyFollow from './CompanyFollow';

interface CompanyHeaderProps {
  company: CompanyDetail;
  identifier: string;
  isAuthenticated: boolean;
  onRequireSignIn?: () => void;
}

const numberFormat = new Intl.NumberFormat();

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  company,
  identifier,
  isAuthenticated,
  onRequireSignIn,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const showDashboardLink = canOpenDashboard(company.viewer);

  return (
    <Box component="header" sx={{ mb: 4 }}>
      <Box
        role="presentation"
        sx={{
          height: { xs: 140, md: 240 },
          borderRadius: '24px',
          background: company.coverUrl
            ? `url(${company.coverUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 45%, #ec4899 100%)',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.45)'
            : '0 10px 30px rgba(99, 102, 241, 0.15)',
        }}
      />

      <Box
        sx={{
          px: { xs: 2, md: 4 },
          mt: { xs: -6, md: -8 },
          position: 'relative',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
        >
          <Avatar
            src={company.logoUrl || undefined}
            alt={`${company.name} logo`}
            variant="rounded"
            sx={{
              width: { xs: 88, md: 128 },
              height: { xs: 88, md: 128 },
              borderRadius: '24px',
              border: '4px solid',
              borderColor: theme.palette.background.default,
              bgcolor: theme.palette.primary.main,
              fontSize: 40,
            }}
          >
            {company.name?.charAt(0) ?? <BusinessIcon />}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                {company.name}
              </Typography>
              <VerifiedBadge isVerified={company.isVerified} size="medium" />
              <HiringChip isHiring={company.isHiring} />
            </Stack>

            {company.tagline && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {company.tagline}
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              useFlexGap
              sx={{ mt: 1.5, color: 'text.secondary' }}
            >
              {company.industry && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <BusinessIcon fontSize="small" />
                  <Typography variant="body2">{company.industry}</Typography>
                </Stack>
              )}
              {company.headquarters && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LocationOnIcon fontSize="small" />
                  <Typography variant="body2">{company.headquarters}</Typography>
                </Stack>
              )}
              {company.companySize && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <GroupsIcon fontSize="small" />
                  <Typography variant="body2">{company.companySize} employees</Typography>
                </Stack>
              )}
              {company.website && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <LanguageIcon fontSize="small" />
                  <Typography
                    variant="body2"
                    component="a"
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    sx={{ color: 'primary.main', textDecoration: 'none' }}
                  >
                    Website
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
            <CompanyFollow
              identifier={identifier}
              companyId={company.id}
              isFollowing={company.isFollowing}
              isAuthenticated={isAuthenticated}
              onRequireSignIn={onRequireSignIn}
            />
            {showDashboardLink && (
              <Button
                component={NextLink}
                href={`/company/dashboard?company=${company.slug}`}
                variant="outlined"
                startIcon={<SettingsIcon />}
              >
                Manage
              </Button>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ mt: 3 }} />

        <Stack
          direction="row"
          spacing={{ xs: 2, md: 4 }}
          flexWrap="wrap"
          useFlexGap
          sx={{ py: 2 }}
        >
          <HeaderFigure
            icon={<GroupsIcon fontSize="small" />}
            value={numberFormat.format(company.followersCount)}
            label="Followers"
          />
          <HeaderFigure
            icon={<WorkOutlineIcon fontSize="small" />}
            value={numberFormat.format(company.openJobsCount)}
            label="Open jobs"
          />
          {company.employeesCount > 0 && (
            <HeaderFigure
              icon={<BusinessIcon fontSize="small" />}
              value={numberFormat.format(company.employeesCount)}
              label="People on Kirmya"
            />
          )}
          {company.reviewCount > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Rating value={company.rating} precision={0.1} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">
                {company.rating.toFixed(1)} · {numberFormat.format(company.reviewCount)} reviews
              </Typography>
            </Stack>
          )}
          {company.foundedYear > 0 && (
            <Chip size="small" variant="outlined" label={`Founded ${company.foundedYear}`} />
          )}
        </Stack>
      </Box>
    </Box>
  );
};

const HeaderFigure: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <Stack direction="row" spacing={1} alignItems="center">
    {icon}
    <Typography variant="body2">
      <Box component="span" sx={{ fontWeight: 700 }}>
        {value}
      </Box>{' '}
      <Box component="span" sx={{ color: 'text.secondary' }}>
        {label}
      </Box>
    </Typography>
  </Stack>
);

export default CompanyHeader;
