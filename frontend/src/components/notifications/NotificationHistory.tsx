'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
} from '@mui/material';
import { NotificationDeliveryDTO } from '../../features/notifications/types';

interface HistoryProps {
  items?: NotificationDeliveryDTO[];
}

export const NotificationHistory: React.FC<HistoryProps> = ({ items = [] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const defaultItems: NotificationDeliveryDTO[] = [
    {
      id: 'd1',
      notificationId: 'n1',
      userId: 'u1',
      channel: 'email',
      provider: 'SendGrid',
      status: 'Delivered',
      attempts: 1,
      maxAttempts: 3,
      scheduledAt: '2026-08-12T10:00:00Z',
      sentAt: '2026-08-12T10:00:02Z',
      deliveredAt: '2026-08-12T10:00:04Z',
      createdAt: '2026-08-12T10:00:00Z',
    },
    {
      id: 'd2',
      notificationId: 'n2',
      userId: 'u1',
      channel: 'push',
      provider: 'FCM',
      status: 'Sent',
      attempts: 1,
      maxAttempts: 3,
      scheduledAt: '2026-08-12T11:30:00Z',
      sentAt: '2026-08-12T11:30:01Z',
      createdAt: '2026-08-12T11:30:00Z',
    },
  ];

  const list = items.length > 0 ? items : defaultItems;

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: { xs: 3, md: 4 },
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
        Notification Delivery Log &amp; History
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Audit trail of channel dispatch attempts, provider statuses, and timestamps.
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Channel</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Provider</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Attempts</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Scheduled Time</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Sent Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Chip label={row.channel.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {row.provider}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.status}
                    size="small"
                    color={row.status === 'Delivered' || row.status === 'Sent' ? 'success' : 'warning'}
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.attempts} / {row.maxAttempts}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(row.scheduledAt).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {row.sentAt ? new Date(row.sentAt).toLocaleString() : 'N/A'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default NotificationHistory;
