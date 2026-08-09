'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { AlertDeliveryHistory } from '@/features/job-alerts/types';

interface AlertHistoryProps {
  history: AlertDeliveryHistory[];
}

export const AlertHistory: React.FC<AlertHistoryProps> = ({ history }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <HistoryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Alert Delivery History & Engagement Metrics
        </Typography>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Alert Title</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Channel</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Jobs Sent</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Opened</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Clicked</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Applied</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Sent Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{row.alert_title}</TableCell>
              <TableCell>
                <Chip label={row.delivery_channel} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{row.jobs_included}</TableCell>
              <TableCell>{row.jobs_opened}</TableCell>
              <TableCell>{row.jobs_clicked}</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#00CC66' }}>{row.applications_submitted}</TableCell>
              <TableCell>
                <Chip label={row.delivery_status} color="success" size="small" sx={{ fontWeight: 700 }} />
              </TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>{new Date(row.sent_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
