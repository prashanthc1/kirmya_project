'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  Avatar,
  useTheme,
  CircularProgress,
} from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';

import { Community } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';
import { tokens } from '../../theme/tokens';

interface CommunityCardProps {
  community: Community;
  onJoinToggle?: (id: string, isMember: boolean) => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community, onJoinToggle }) => {
  const theme = useTheme();
  const [isMember, setIsMember] = useState<boolean>(!!community.isMember);
  const [memberCount, setMemberCount] = useState<number>(community.memberCount || 0);
  const [loading, setLoading] = useState<boolean>(false);

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setLoading(true);
    try {
      if (isMember) {
        await communityApi.leaveCommunity(community.id);
        setIsMember(false);
        setMemberCount((prev) => Math.max(0, prev - 1));
        if (onJoinToggle) onJoinToggle(community.id, false);
      } else {
        const res = await communityApi.joinCommunity(community.id);
        if (!res.pendingApproval) {
          setIsMember(true);
          setMemberCount((prev) => prev + 1);
          if (onJoinToggle) onJoinToggle(community.id, true);
        }
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      component={Link}
      href={`/communities/${community.id}`}
      data-testid={`community-card-${community.id}`}
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: `${tokens.radius.lg}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        textDecoration: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(99, 102, 241, 0.08)',
        },
      }}
    >
      {/* Cover / Banner */}
      <Box
        sx={{
          height: 100,
          width: '100%',
          position: 'relative',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.08)',
          background: community.coverImageUrl
            ? `url(${community.coverImageUrl}) center/cover no-repeat`
            : undefined,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 0.5,
          }}
        >
          <Chip
            icon={community.isPrivate ? <LockIcon sx={{ fontSize: 13 }} /> : <PublicIcon sx={{ fontSize: 13 }} />}
            label={community.isPrivate ? 'Private' : 'Public'}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              color: 'text.primary',
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
        </Box>
      </Box>

      {/* Card Content */}
      <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Avatar
            src={community.avatarUrl}
            sx={{
              width: 44,
              height: 44,
              mt: -3.5,
              border: '2px solid',
              borderColor: 'background.paper',
              bgcolor: 'primary.main',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {community.title ? community.title[0].toUpperCase() : 'C'}
          </Avatar>

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {community.title}
            </Typography>

            <Typography
              variant="caption"
              color="primary.main"
              sx={{ fontWeight: 700, fontSize: '0.75rem', display: 'block' }}
            >
              {community.category || 'Professional Group'}
            </Typography>
          </Box>
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            lineHeight: 1.4,
            fontSize: '0.875rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            flexGrow: 1,
          }}
        >
          {community.description || 'Join discussions and network with peers.'}
        </Typography>

        {/* Footer: Member Count & Action */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto', pt: 1 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <PeopleOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </Typography>
          </Stack>

          <Button
            size="small"
            variant={isMember ? 'outlined' : 'contained'}
            color={isMember ? 'inherit' : 'primary'}
            onClick={handleJoinClick}
            disabled={loading}
            startIcon={isMember ? <CheckCircleIcon fontSize="small" color="success" /> : undefined}
            sx={{
              borderRadius: `${tokens.radius.sm}px`,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'none',
              px: 1.5,
            }}
          >
            {loading ? (
              <CircularProgress size={14} color="inherit" />
            ) : isMember ? (
              'Joined'
            ) : community.isPrivate ? (
              'Request'
            ) : (
              'Join'
            )}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CommunityCard;
