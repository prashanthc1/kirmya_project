'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import SecurityIcon from '@mui/icons-material/Security';
import { AdminMessagingAnalytics } from '../../../features/messaging/services/messagingApi';

export const AdminMessagingView: React.FC<{ analytics?: AdminMessagingAnalytics; reports?: any[] }> = ({
  analytics,
  reports = [],
}) => {
  const defaultAnalytics: AdminMessagingAnalytics = analytics || {
    totalConversationsCount: 18900,
    totalMessagesSent: 142000,
    pendingRequestsCount: 420,
    reportedMessagesCount: 12,
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <ForumIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Admin Real-Time Messaging & Safety Desk
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor real-time volume metrics, message request queues, and moderation reports.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Active Conversations</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.totalConversationsCount}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Messages Dispatched</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.totalMessagesSent}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Pending Message Requests</Typography>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.pendingRequestsCount}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Flagged Message Reports</Typography>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.reportedMessagesCount}</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, borderRadius: '24px' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          Recent Messaging Abuse & Content Reports
        </Typography>

        {reports.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No active message reports pending administrator review.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report ID</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Reporter ID</TableCell>
                  <TableCell>Conversation ID</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((rep, idx) => (
                  <TableRow key={rep.id || idx}>
                    <TableCell><Typography variant="caption">{rep.id}</Typography></TableCell>
                    <TableCell><Chip label={rep.reason} size="small" color="warning" /></TableCell>
                    <TableCell><Typography variant="caption">{rep.reporterId}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{rep.conversationId}</Typography></TableCell>
                    <TableCell><Chip label={rep.status} size="small" variant="outlined" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default AdminMessagingView;
