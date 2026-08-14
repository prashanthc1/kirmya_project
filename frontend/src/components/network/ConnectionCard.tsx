'use client';

import React from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import { ConnectionRecommendation, networkingApi } from '../../features/networking/services/networkingApi';

interface ConnectionCardProps {
  connection: ConnectionRecommendation;
  onRemove?: () => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onRemove }) => {
  const handleRemove = async () => {
    if (confirm(`Remove connection with ${connection.name}?`)) {
      try {
        await networkingApi.removeConnection(connection.userId);
        if (onRemove) onRemove();
      } catch (e) {
        alert('Failed to remove connection.');
      }
    }
  };

  return (
    <Card sx={{ p: 2, borderRadius: '16px', bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={connection.avatarUrl} sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 800 }}>
            {connection.name ? connection.name[0].toUpperCase() : 'K'}
          </Avatar>
          <Box>
            <Typography
              component={Link}
              href={`/profile/${connection.username || connection.userId}`}
              variant="subtitle1"
              sx={{ fontWeight: 800, textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
            >
              {connection.name || connection.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {connection.headline}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {connection.location} {connection.industry ? `• ${connection.industry}` : ''}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href={`/messaging?user=${connection.userId}`}
            variant="outlined"
            startIcon={<MessageIcon />}
            size="small"
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Message
          </Button>

          <Tooltip title="Remove Connection">
            <IconButton size="small" color="error" onClick={handleRemove}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Card>
  );
};

export default ConnectionCard;
