'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  IconButton,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import Link from 'next/link';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';

import { FeedItem } from '../../features/recommendation/types';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

interface DiscoveryCardProps {
  item: FeedItem;
  onDismiss?: (id: string) => void;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  item,
  onDismiss,
  onSave,
  isSaved = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 50) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };

  const scoreColor = getScoreColor(item.score);

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: `${tokens.radius.lg}px`,
        border: `1px solid ${
          isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'
        }`,
        background: isDark
          ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.6) 100%)'
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 12px 32px -4px rgba(0, 0, 0, 0.45)'
            : '0 12px 32px -4px rgba(15, 23, 42, 0.08)',
          borderColor: alpha(scoreColor, 0.3),
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2}>
          {/* Header Bar: Category Tag & Explainability Badge & Dismiss */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              {item.itemType === 'job' && (
                <Chip
                  icon={<WorkOutlineIcon sx={{ fontSize: '14px !important' }} />}
                  label="Job Opportunity"
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.08),
                    color: theme.palette.primary.main,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}
                />
              )}
              {item.itemType === 'person' && (
                <Chip
                  icon={<PeopleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                  label="Peer Connection"
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: alpha(theme.palette.info.main, isDark ? 0.15 : 0.08),
                    color: theme.palette.info.main,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                />
              )}
              {item.itemType === 'community' && (
                <Chip
                  icon={<GroupsOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                  label="Community Group"
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: alpha(theme.palette.success.main, isDark ? 0.15 : 0.08),
                    color: theme.palette.success.main,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                />
              )}
              {item.itemType === 'career_tip' && (
                <Chip
                  icon={<LightbulbOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                  label="Career Intelligence"
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: alpha(theme.palette.warning.main, isDark ? 0.15 : 0.08),
                    color: theme.palette.warning.main,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                />
              )}

              {/* Match Score Indicator */}
              {item.score > 0 && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: '999px',
                    bgcolor: alpha(scoreColor, isDark ? 0.2 : 0.1),
                    color: scoreColor,
                    fontSize: '0.725rem',
                    fontWeight: 700,
                  }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 12 }} />
                  {item.score}% Match
                </Box>
              )}
            </Stack>

            {/* Actions: Save & Dismiss */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {onSave && (
                <Tooltip title={isSaved ? 'Saved' : 'Save opportunity'}>
                  <IconButton
                    size="small"
                    onClick={() => onSave(item.id)}
                    sx={{ color: isSaved ? theme.palette.primary.main : 'text.secondary' }}
                  >
                    {isSaved ? (
                      <BookmarkIcon fontSize="small" />
                    ) : (
                      <BookmarkBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              {onDismiss && (
                <Tooltip title="Dismiss recommendation">
                  <IconButton
                    size="small"
                    onClick={() => onDismiss(item.id)}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* Body Content by Item Type */}
          {item.itemType === 'job' && item.job && (
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  component={Link}
                  href={ROUTES.JOB_DETAIL(item.job.id)}
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: 'text.primary',
                    '&:hover': { color: theme.palette.primary.main },
                    display: 'inline-block',
                  }}
                >
                  {item.job.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {item.job.company || 'Verified Employer'} • {item.job.industry || 'Technology'}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
                <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                  <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">{item.job.location || 'Remote'}</Typography>
                </Stack>
                {item.job.salaryMax > 0 && (
                  <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                    <PaymentsOutlinedIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {item.job.salaryMax.toLocaleString()} {item.job.currency || 'AED'}
                    </Typography>
                  </Stack>
                )}
                {item.job.employmentType && (
                  <Chip
                    label={item.job.employmentType}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Stack>

              {item.job.requiredSkills && item.job.requiredSkills.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                  {item.job.requiredSkills.slice(0, 5).map((skill, idx) => (
                    <Chip
                      key={idx}
                      label={skill}
                      size="small"
                      sx={{
                        fontSize: '0.72rem',
                        height: 22,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          )}

          {item.itemType === 'person' && item.person && (
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar
                src={item.person.avatarUrl}
                alt={item.person.name}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.info.main,
                  fontWeight: 700,
                }}
              >
                {item.person.name.charAt(0).toUpperCase()}
              </Avatar>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Typography
                  component={Link}
                  href={`/profile/${item.person.userId}`}
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: 'text.primary',
                    '&:hover': { color: theme.palette.primary.main },
                  }}
                >
                  {item.person.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.person.headline}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ pt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    📍 {item.person.location}
                  </Typography>
                  {item.person.mutualCount > 0 && (
                    <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                      👥 {item.person.mutualCount} mutual connections
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>
          )}

          {item.itemType === 'community' && item.community && (
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar
                src={item.community.iconUrl}
                alt={item.community.name}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.success.main,
                  fontWeight: 700,
                }}
              >
                <GroupsOutlinedIcon />
              </Avatar>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Typography
                  component={Link}
                  href={`/communities/${item.community.slug || item.community.communityId}`}
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: 'text.primary',
                    '&:hover': { color: theme.palette.primary.main },
                  }}
                >
                  {item.community.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineClamp: 2 }}>
                  {item.community.description}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    👥 {item.community.memberCount.toLocaleString()} members
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {item.community.isPrivate ? (
                      <>
                        <LockOutlinedIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Private
                        </Typography>
                      </>
                    ) : (
                      <>
                        <PublicIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Public
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
          )}

          {item.itemType === 'career_tip' && item.tip && (
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {item.tip.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.tip.summary}
              </Typography>
              {item.tip.actionUrl && (
                <Button
                  component={Link}
                  href={item.tip.actionUrl}
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ alignSelf: 'flex-start', p: 0, mt: 0.5, fontWeight: 600 }}
                >
                  {item.tip.actionLabel || 'Take Action'}
                </Button>
              )}
            </Stack>
          )}

          {/* Explainability Footer Callout */}
          {item.rationale && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.02)',
                border: `1px solid ${
                  isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)'
                }`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <AutoAwesomeIcon
                sx={{
                  fontSize: 14,
                  color: scoreColor,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {item.rationale}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DiscoveryCard;
