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
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link';
import ConnectionRequestDialog from './ConnectionRequestDialog';
import { ConnectionRecommendation, networkingApi } from '../../features/networking/services/networkingApi';

interface RecommendationCardProps {
  cand: ConnectionRecommendation;
  onDismiss?: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ cand, onDismiss }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<string>(cand.connectionStatus || 'none');

  const handleSendRequest = async (note?: string) => {
    try {
      await networkingApi.sendRequest(cand.userId, note);
      setStatus('pending_sent');
    } catch (e) {
      alert('Failed to send request.');
    }
  };

  const handleDismiss = async () => {
    try {
      await networkingApi.dismissRecommendation(cand.userId);
      if (onDismiss) onDismiss();
    } catch (e) {
      if (onDismiss) onDismiss();
    }
  };

  return (
    <Card sx={{ p: 2.5, borderRadius: '20px', bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={cand.avatarUrl} sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 800 }}>
              {cand.name ? cand.name[0].toUpperCase() : 'K'}
            </Avatar>
            <Box>
              <Typography
                component={Link}
                href={`/profile/${cand.username || cand.userId}`}
                variant="subtitle1"
                sx={{ fontWeight: 800, textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
              >
                {cand.name || cand.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {cand.headline}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cand.location} • {cand.industry}
              </Typography>
            </Box>
          </Stack>

          <Tooltip title="Dismiss Suggestion">
            <IconButton size="small" onClick={handleDismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ my: 1.5 }} flexWrap="wrap">
          {cand.matchScore > 0 && (
            <Chip label={`${cand.matchScore}% Match`} color="secondary" variant="outlined" size="small" sx={{ fontWeight: 800 }} />
          )}
          {cand.reason && (
            <Chip label={cand.reason} size="small" sx={{ fontWeight: 700 }} />
          )}
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
        {status === 'pending_sent' ? (
          <Button fullWidth variant="outlined" color="warning" disabled sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Invitation Pending
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Connect
          </Button>
        )}
      </Box>

      <ConnectionRequestDialog
        open={dialogOpen}
        targetName={cand.name || cand.username}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSendRequest}
      />
    </Card>
  );
};

export default RecommendationCard;
