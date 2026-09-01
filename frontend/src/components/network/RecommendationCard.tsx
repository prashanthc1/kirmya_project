'use client';

import React, { useState } from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import Link from 'next/link';

import ConnectionActionButton from './ConnectionActionButton';
import { ConnectionRecommendation, networkingApi } from '../../features/networking/services/networkingApi';
import { tokens } from '../../theme/tokens';

interface RecommendationCardProps {
  cand: ConnectionRecommendation;
  onDismiss?: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ cand, onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await networkingApi.dismissRecommendation(cand.userId);
      if (onDismiss) onDismiss();
    } catch {
      if (onDismiss) onDismiss();
    }
  };

  if (dismissed) return null;

  const profileHref = `/profile/${encodeURIComponent(cand.username || cand.userId)}`;

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
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              component={Link}
              href={profileHref}
              src={cand.avatarUrl}
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {cand.name ? cand.name[0].toUpperCase() : 'K'}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component={Link}
                href={profileHref}
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  textDecoration: 'none',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {cand.name || cand.username}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.85rem',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cand.headline || 'Professional Suggestion'}
              </Typography>
            </Box>
          </Stack>

          <Tooltip title="Dismiss recommendation">
            <IconButton size="small" onClick={handleDismiss} aria-label="Dismiss recommendation">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Suggestion reason & mutuals */}
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ my: 1.5 }}>
          {cand.reason && (
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />}
              label={cand.reason}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem', fontWeight: 600 }}
            />
          )}

          {cand.mutualCount > 0 && !cand.reason?.includes('Mutual') && (
            <Chip
              icon={<PeopleAltOutlinedIcon sx={{ fontSize: 13 }} />}
              label={`${cand.mutualCount} mutual`}
              size="small"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem' }}
            />
          )}

          {cand.location && (
            <Chip
              icon={<LocationOnOutlinedIcon sx={{ fontSize: 13 }} />}
              label={cand.location}
              size="small"
              variant="outlined"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontSize: '0.75rem' }}
            />
          )}
        </Stack>
      </Box>

      {/* Action Button */}
      <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider', mt: 1 }}>
        <ConnectionActionButton
          userId={cand.userId}
          userName={cand.name}
          userUsername={cand.username}
          initialStatus={cand.connectionStatus || 'none'}
        />
      </Box>
    </Card>
  );
};

export default RecommendationCard;
