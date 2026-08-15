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
  IconButton,
  Tooltip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import { Community } from '../../features/community/types';

interface CommunityCardProps {
  community: Community;
  onJoinToggle?: (id: string, isMember: boolean) => void;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({ community, onJoinToggle }) => {
  const [isMember, setIsMember] = useState<boolean>(!!community.isMember);
  const [loading, setLoading] = useState<boolean>(false);

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    const newStatus = !isMember;
    setIsMember(newStatus);
    if (onJoinToggle) {
      onJoinToggle(community.id, newStatus);
    }
    setLoading(false);
  };

  return (
    <Card
      data-testid={`community-card-${community.id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(99, 102, 241, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 20px 35px -10px rgba(99, 102, 241, 0.18)'
              : '0 20px 35px -10px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      {/* Cover / Banner image */}
      <Box
        sx={{
          height: 110,
          width: '100%',
          position: 'relative',
          background: community.coverImageUrl
            ? `url(${community.coverImageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 1,
          }}
        >
          <Chip
            icon={community.isPrivate ? <LockIcon sx={{ fontSize: 14 }} /> : <PublicIcon sx={{ fontSize: 14 }} />}
            label={community.isPrivate ? 'Private' : 'Public'}
            size="small"
            sx={{
              bgcolor: 'rgba(15, 23, 42, 0.65)',
              color: '#ffffff',
              backdropFilter: 'blur(8px)',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>
      </Box>

      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', pt: 0 }}>
        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: -4, mb: 2 }}>
          <Avatar
            src={community.avatarUrl}
            alt={community.title}
            sx={{
              width: 64,
              height: 64,
              border: '3px solid',
              borderColor: 'background.paper',
              boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
              bgcolor: 'primary.main',
              fontWeight: 700,
              fontSize: '1.5rem',
            }}
          >
            {community.title.charAt(0)}
          </Avatar>
          <Chip
            label={community.category}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          />
        </Box>

        {/* Title & Description */}
        <Typography
          variant="h6"
          fontWeight={700}
          component={Link}
          href={`/communities/${community.id}`}
          sx={{
            color: 'text.primary',
            textDecoration: 'none',
            '&:hover': { color: 'primary.main' },
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.5,
          }}
        >
          {community.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 40,
            mb: 2,
            lineHeight: 1.5,
          }}
        >
          {community.description}
        </Typography>

        {/* Topics */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
          {community.topics.slice(0, 3).map((topic) => (
            <Chip
              key={topic}
              label={`#${topic}`}
              size="small"
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                color: 'text.secondary',
                fontSize: '0.72rem',
                fontWeight: 600,
                height: 22,
              }}
            />
          ))}
          {community.topics.length > 3 && (
            <Chip
              label={`+${community.topics.length - 3}`}
              size="small"
              sx={{ fontSize: '0.72rem', height: 22 }}
            />
          )}
        </Stack>

        <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Stats & Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  {community.memberCount.toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <ForumIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  {community.postCount.toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant={isMember ? 'outlined' : 'contained'}
              color={isMember ? 'success' : 'primary'}
              onClick={handleJoinClick}
              disabled={loading}
              startIcon={isMember ? <CheckCircleIcon /> : undefined}
              fullWidth
              sx={{
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                py: 1,
              }}
            >
              {isMember ? 'Joined' : community.isPrivate ? 'Request Join' : 'Join Group'}
            </Button>
            <Button
              component={Link}
              href={`/communities/${community.id}`}
              variant="outlined"
              sx={{
                minWidth: 44,
                borderRadius: '12px',
                bgcolor: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.16)',
                },
              }}
            >
              <ArrowForwardIcon sx={{ fontSize: 20 }} />
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
