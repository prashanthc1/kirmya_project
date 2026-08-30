'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';

import { ApplicationTimelineItem } from '../../features/applications/types';
import { tokens } from '../../theme/tokens';

interface ApplicationTimelineProps {
  items?: ApplicationTimelineItem[];
}

const getEventIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('applied') || s.includes('submitted')) return <HistoryEduOutlinedIcon fontSize="small" />;
  if (s.includes('view') || s.includes('review')) return <VisibilityOutlinedIcon fontSize="small" />;
  if (s.includes('shortlist')) return <StarOutlineIcon fontSize="small" />;
  if (s.includes('interview')) return <EventOutlinedIcon fontSize="small" />;
  if (s.includes('offer') || s.includes('accept')) return <CardGiftcardOutlinedIcon fontSize="small" />;
  if (s.includes('reject') || s.includes('withdraw')) return <CloseOutlinedIcon fontSize="small" />;
  return <CheckCircleOutlineIcon fontSize="small" />;
};

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ items = [] }) => {
  if (items.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No timeline events logged yet for this application.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      data-testid="application-timeline"
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: `${tokens.radius.lg}px`,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
        Application Activity & History
      </Typography>

      <Stack spacing={3} sx={{ position: 'relative', pl: 1 }}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const formattedDate = item.date
            ? new Date(item.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <Stack key={item.id || idx} direction="row" spacing={2} sx={{ position: 'relative' }}>
              {/* Timeline Connector Line */}
              {!isLast && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 15,
                    top: 32,
                    bottom: -24,
                    width: 2,
                    bgcolor: 'divider',
                  }}
                />
              )}

              {/* Icon Node */}
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: idx === 0 ? 'primary.main' : 'action.selected',
                  color: idx === 0 ? 'primary.contrastText' : 'text.primary',
                  zIndex: 1,
                  boxShadow: idx === 0 ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                }}
              >
                {getEventIcon(item.status || item.title)}
              </Avatar>

              {/* Event Content */}
              <Box sx={{ flexGrow: 1, pt: 0.25 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {item.title || item.status}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {formattedDate}
                  </Typography>
                </Stack>

                {item.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                    {item.description}
                  </Typography>
                )}

                {item.moved_by && (
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block', mt: 0.25 }}>
                    Updated by {item.moved_by}
                  </Typography>
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default ApplicationTimeline;
