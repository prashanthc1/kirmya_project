'use client';

/**
 * Small shared indicators used across the company pages.
 *
 * The verification badge is the one piece of UI a company cannot influence, so
 * it lives here alone rather than being re-implemented per page: it renders
 * from `isVerified`, which the server sets only for a completed, unexpired
 * verification. A pending or rejected submission renders nothing.
 */
import React from 'react';
import { Box, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import { VerificationStatus } from '../../features/company/types';

export const VerifiedBadge: React.FC<{ isVerified: boolean; size?: 'small' | 'medium' }> = ({
  isVerified,
  size = 'small',
}) => {
  if (!isVerified) return null;

  return (
    // `titleAccess` rather than a bare `aria-label`: MUI marks an icon
    // `aria-hidden` unless it is given one, so a label alone would leave the
    // badge announced to nobody. `describeChild` keeps the icon's own name and
    // moves the explanation to a description, instead of the tooltip text
    // overwriting the name.
    <Tooltip title="Kirmya has verified this company's business documentation" describeChild>
      <VerifiedIcon
        color="primary"
        fontSize={size}
        titleAccess="Verified company"
        sx={{ verticalAlign: 'middle' }}
      />
    </Tooltip>
  );
};

const VERIFICATION_PRESENTATION: Record<
  VerificationStatus,
  { label: string; color: 'default' | 'info' | 'success' | 'error' | 'warning'; icon: React.ReactElement }
> = {
  not_verified: { label: 'Not verified', color: 'default', icon: <ShieldOutlinedIcon /> },
  pending: { label: 'Verification pending', color: 'info', icon: <HourglassTopIcon /> },
  verified: { label: 'Verified', color: 'success', icon: <VerifiedIcon /> },
  rejected: { label: 'Verification rejected', color: 'error', icon: <ErrorOutlineIcon /> },
  expired: { label: 'Verification expired', color: 'warning', icon: <EventBusyIcon /> },
};

export const VerificationStatusChip: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  const presentation = VERIFICATION_PRESENTATION[status] ?? VERIFICATION_PRESENTATION.not_verified;

  return (
    <Chip
      size="small"
      color={presentation.color}
      variant={presentation.color === 'default' ? 'outlined' : 'filled'}
      icon={presentation.icon}
      label={presentation.label}
    />
  );
};

export const HiringChip: React.FC<{ isHiring: boolean }> = ({ isHiring }) =>
  isHiring ? <Chip size="small" color="success" variant="outlined" label="Actively hiring" /> : null;

/** A single labelled figure. Used on the dashboard and analytics screens. */
export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon?: React.ReactNode;
}> = ({ label, value, caption, icon }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '16px',
        height: '100%',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary">
          {caption}
        </Typography>
      )}
    </Box>
  );
};

/** Responsive auto-fitting grid. Avoids the MUI Grid item/size API entirely. */
export const AutoGrid: React.FC<{
  children: React.ReactNode;
  min?: number;
  gap?: number;
}> = ({ children, min = 220, gap = 2 }) => (
  <Box
    sx={{
      display: 'grid',
      gap,
      gridTemplateColumns: {
        xs: '1fr',
        sm: `repeat(auto-fit, minmax(${min}px, 1fr))`,
      },
    }}
  >
    {children}
  </Box>
);

export default VerifiedBadge;
