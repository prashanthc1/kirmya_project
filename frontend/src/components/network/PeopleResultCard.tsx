'use client';

import React, { useState } from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import Link from 'next/link';

import ConnectionActionButton from './ConnectionActionButton';
import { PeopleSearchResult } from '../../features/networking/services/networkingApi';
import { tokens } from '../../theme/tokens';

interface PeopleResultCardProps {
  person: PeopleSearchResult;
  onStatusChange?: () => void;
}

export const PeopleResultCard: React.FC<PeopleResultCardProps> = ({ person, onStatusChange }) => {
  const [currentStatus, setCurrentStatus] = useState<string>(person.connectionStatus || 'none');

  if (currentStatus === 'blocked') return null;

  const profileHref = `/profile/${encodeURIComponent(person.username || person.userId)}`;

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: `${tokens.radius.lg}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(0, 0, 0, 0.06)',
        },
      }}
    >
      <Box>
        {/* Top: Avatar & Basic Info */}
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Avatar
            component={Link}
            href={profileHref}
            src={person.avatarUrl}
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              fontSize: '1.25rem',
              fontWeight: 800,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            {person.name ? person.name[0].toUpperCase() : 'K'}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography
                component={Link}
                href={profileHref}
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {person.name}
              </Typography>
              {person.verificationStatus === 'verified' && (
                <VerifiedIcon color="primary" sx={{ fontSize: 16 }} />
              )}
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.85rem',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 0.5,
              }}
            >
              {person.headline || person.currentPosition || 'Professional Member'}
            </Typography>

            {person.location && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 13 }} />
                <span>{person.location}</span>
              </Stack>
            )}
          </Box>
        </Stack>

        {/* Company & Mutual context */}
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ my: 1.5 }}>
          {person.company && (
            <Chip
              icon={<BusinessOutlinedIcon sx={{ fontSize: 13 }} />}
              label={person.company}
              size="small"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem' }}
            />
          )}

          {person.mutualCount > 0 && (
            <Chip
              icon={<PeopleAltOutlinedIcon sx={{ fontSize: 13 }} />}
              label={`${person.mutualCount} mutual`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem', fontWeight: 600 }}
            />
          )}

          {person.openToWork && (
            <Chip
              label="Open to work"
              size="small"
              color="success"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem', fontWeight: 600 }}
            />
          )}
        </Stack>
      </Box>

      {/* Bottom: Connection Action */}
      <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
        <ConnectionActionButton
          userId={person.userId}
          userName={person.name}
          userUsername={person.username}
          initialStatus={person.connectionStatus}
          onStatusChange={(s) => {
            setCurrentStatus(s);
            if (onStatusChange) onStatusChange();
          }}
        />
      </Box>
    </Card>
  );
};

export default PeopleResultCard;
