'use client';

import React from 'react';
import { Box, Paper, Typography, Chip, Switch, IconButton, Stack, Tooltip } from '@mui/material';
import { surfaceTransition } from '../../theme/motion';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { JobAlert } from '@/features/job-alerts/types';

interface AlertCardProps {
  alert: JobAlert;
  onEdit?: (alert: JobAlert) => void;
  onDelete?: (alert: JobAlert) => void;
  onTogglePause?: (alert: JobAlert) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onEdit, onDelete, onTogglePause }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: alert.is_active ? '1px solid rgba(0, 102, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
        transition: surfaceTransition(0.25),
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: alert.is_active ? 'rgba(0, 102, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <NotificationsActiveIcon sx={{ color: alert.is_active ? 'primary.main' : 'text.disabled', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              {alert.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
              Delivery: {alert.frequency} &bull; Created {new Date(alert.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center">
          {onTogglePause && (
            <Tooltip title={alert.is_active ? 'Pause Alert' : 'Resume Alert'}>
              <IconButton size="small" onClick={() => onTogglePause(alert)} sx={{ color: alert.is_active ? '#FF9900' : '#00CC66' }}>
                {alert.is_active ? <PauseCircleIcon fontSize="small" /> : <PlayCircleIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <IconButton size="small" onClick={() => onEdit(alert)} sx={{ color: 'text.secondary' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" onClick={() => onDelete(alert)} sx={{ color: 'error.main' }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Keywords: <strong>&ldquo;{alert.keywords || 'All matching positions'}&rdquo;</strong>
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <LocationOnIcon fontSize="small" sx={{ color: 'primary.main', fontSize: 16 }} />
          <Typography variant="caption">{alert.location || alert.remote_preference || 'Remote'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <WorkIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
          <Typography variant="caption">{alert.employment_type} &bull; {alert.experience_level}</Typography>
        </Box>
        {(alert.salary_min > 0 || alert.salary_max > 0) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#00CC66' }}>
            <AttachMoneyIcon fontSize="small" sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              ${alert.salary_min.toLocaleString()} - ${alert.salary_max.toLocaleString()}
            </Typography>
          </Box>
        )}
      </Stack>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {alert.skills.slice(0, 4).map((s) => (
          <Chip key={s} label={s} size="small" variant="outlined" sx={{ borderRadius: 1.5, fontSize: '0.72rem' }} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Stack direction="row" spacing={1}>
          {alert.channel_email && <Chip label="Email" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />}
          {alert.channel_push && <Chip label="Push" size="small" color="secondary" sx={{ height: 20, fontSize: '0.65rem' }} />}
          {alert.channel_in_app && <Chip label="In-App" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(0, 204, 255, 0.15)', color: '#00CCFF' }} />}
        </Stack>
        <Chip
          label={alert.is_active ? 'Active' : 'Paused'}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: '0.7rem',
            bgcolor: alert.is_active ? 'rgba(0, 204, 102, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            color: alert.is_active ? '#00CC66' : 'text.disabled',
          }}
        />
      </Box>
    </Paper>
  );
};
