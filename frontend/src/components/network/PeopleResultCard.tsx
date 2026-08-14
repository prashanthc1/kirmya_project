'use client';

import React, { useState } from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Stack,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import BlockIcon from '@mui/icons-material/Block';
import FlagIcon from '@mui/icons-material/Flag';
import Link from 'next/link';
import ConnectionRequestDialog from './ConnectionRequestDialog';
import { PeopleSearchResult, networkingApi } from '../../features/networking/services/networkingApi';

interface PeopleResultCardProps {
  person: PeopleSearchResult;
  onStatusChange?: () => void;
}

export const PeopleResultCard: React.FC<PeopleResultCardProps> = ({ person, onStatusChange }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState(person.connectionStatus);
  const [following, setFollowing] = useState(person.isFollowing);

  const handleSendRequest = async (note?: string) => {
    try {
      await networkingApi.sendRequest(person.userId, note);
      setStatus('pending_sent');
      if (onStatusChange) onStatusChange();
    } catch (e) {
      alert('Failed to send connection request.');
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (following) {
        await networkingApi.unfollowUser(person.userId);
        setFollowing(false);
      } else {
        await networkingApi.followUser(person.userId);
        setFollowing(true);
      }
    } catch (e) {
      alert('Action failed.');
    }
  };

  const handleBlock = async () => {
    if (confirm(`Block ${person.name}? You will no longer see each other's profiles.`)) {
      await networkingApi.blockUser(person.userId);
      setStatus('blocked');
      if (onStatusChange) onStatusChange();
    }
  };

  if (status === 'blocked') return null;

  return (
    <Card sx={{ p: 2.5, borderRadius: '20px', bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
          <Avatar
            src={person.avatarUrl}
            sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 800 }}
          >
            {person.name ? person.name[0].toUpperCase() : 'K'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              component={Link}
              href={`/profile/${person.username || person.userId}`}
              variant="subtitle1"
              sx={{ fontWeight: 800, textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
            >
              {person.name || person.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {person.headline || 'Professional Specialist'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {person.location} {person.industry ? `• ${person.industry}` : ''}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
          {person.openToWork && (
            <Chip label="#OpenToWork" color="success" size="small" sx={{ fontWeight: 800 }} />
          )}
          {person.mutualCount > 0 && (
            <Chip label={`${person.mutualCount} Mutuals`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
          )}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
        {status === 'connected' ? (
          <Button variant="outlined" disabled startIcon={<CheckIcon />} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Connected
          </Button>
        ) : status === 'pending_sent' ? (
          <Button variant="outlined" color="warning" disabled sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Pending
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Connect
          </Button>
        )}

        <Stack direction="row" spacing={0.5}>
          <Tooltip title={following ? 'Unfollow' : 'Follow'}>
            <IconButton size="small" onClick={handleFollowToggle} color={following ? 'primary' : 'default'}>
              <RssFeedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Block User">
            <IconButton size="small" color="error" onClick={handleBlock}>
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <ConnectionRequestDialog
        open={dialogOpen}
        targetName={person.name || person.username}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSendRequest}
      />
    </Card>
  );
};

export default PeopleResultCard;
