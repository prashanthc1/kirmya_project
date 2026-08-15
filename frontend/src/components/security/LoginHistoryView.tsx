'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import { LoginHistoryItem } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

interface LoginHistoryViewProps {
  items?: LoginHistoryItem[];
}

export const LoginHistoryView: React.FC<LoginHistoryViewProps> = ({ items: propItems }) => {
  const [items, setItems] = useState<LoginHistoryItem[]>(propItems || []);
  const [loading, setLoading] = useState(!propItems);

  useEffect(() => {
    if (!propItems) {
      securityApi.getLoginHistory().then((data) => {
        setItems(data);
        setLoading(false);
      });
    }
  }, [propItems]);

  const getSeverityColor = (severity: LoginHistoryItem['severity']) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'success';
    }
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <HistoryIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Login Security & Audit Event Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review past authentication attempts, MFA challenges, IP locations, and security events.
          </Typography>
        </Box>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No recent security events recorded.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Event Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>User Agent / Browser</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SecurityIcon fontSize="small" color="primary" />
                      <span>{row.event_type}</span>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.severity.toUpperCase()}
                      color={getSeverityColor(row.severity)}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell>{row.ip_address}</TableCell>
                  <TableCell>{row.user_agent}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
};

export default LoginHistoryView;
