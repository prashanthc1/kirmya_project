'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import SecurityIcon from '@mui/icons-material/Security';
import { AdminNetworkAnalytics } from '../../../features/networking/services/networkingApi';

export const AdminNetworkView: React.FC<{ analytics?: AdminNetworkAnalytics; reports?: any[] }> = ({ analytics, reports = [] }) => {
  const defaultAnalytics: AdminNetworkAnalytics = analytics || {
    totalConnectionsCount: 14500,
    totalRequestsCount: 23400,
    pendingRequestsCount: 1800,
    reportedNetworkCount: 14,
    blockedPairsCount: 180,
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <HubIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Admin Network Health & Safety Desk
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor platform connection volumes, spam reports, and relationship safety metrics.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Connections</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.totalConnectionsCount}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Active Pending Invites</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.pendingRequestsCount}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Network Safety Reports</Typography>
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.reportedNetworkCount}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Privacy Blocked Pairs</Typography>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 900, mt: 0.5 }}>{defaultAnalytics.blockedPairsCount}</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, borderRadius: '24px' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          Recent Networking & Abuse Audit Reports
        </Typography>

        {reports.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No active network reports pending admin review.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report ID</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Reporter ID</TableCell>
                  <TableCell>Target ID</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((rep, idx) => (
                  <TableRow key={rep.id || idx}>
                    <TableCell><Typography variant="caption">{rep.id}</Typography></TableCell>
                    <TableCell><Chip label={rep.reason} size="small" color="warning" /></TableCell>
                    <TableCell><Typography variant="caption">{rep.reporterId}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{rep.targetUserId}</Typography></TableCell>
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

export default AdminNetworkView;
