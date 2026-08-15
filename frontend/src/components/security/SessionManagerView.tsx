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
  Button,
  Box,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import { SessionItem } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

export const SessionManagerView: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    securityApi.getActiveSessions().then((data) => {
      setSessions(data);
      setLoading(false);
    });
  }, []);

  const handleRevoke = async (id: string) => {
    const ok = await securityApi.revokeSession(id);
    if (ok) {
      setSessions(sessions.filter((s) => s.id !== id));
      setMessage('Session revoked successfully.');
    }
  };

  const handleRevokeAllOther = async () => {
    const ok = await securityApi.revokeAllOtherSessions();
    if (ok) {
      setSessions(sessions.filter((s) => s.is_current));
      setMessage('All other authentication sessions revoked successfully.');
    }
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <DevicesIcon color="primary" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Active Authentication Sessions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and manage logged-in web browsers and mobile app sessions.
            </Typography>
          </Box>
        </Stack>
        {sessions.filter((s) => !s.is_current).length > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleRevokeAllOther}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Revoke All Other Sessions
          </Button>
        )}
      </Stack>

      {message && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
          {message}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Browser & Platform</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Approximate Location</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Last Active</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Session Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{row.user_agent}</TableCell>
                  <TableCell>{row.ip_address}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>
                    {row.last_active_at ? new Date(row.last_active_at).toLocaleString() : 'Just now'}
                  </TableCell>
                  <TableCell>
                    {row.is_current ? (
                      <Chip label="Current Active Session" color="success" size="small" sx={{ fontWeight: 800 }} />
                    ) : (
                      <Chip label="Active" variant="outlined" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {!row.is_current && (
                      <Button size="small" color="error" onClick={() => handleRevoke(row.id)}>
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
};

export default SessionManagerView;
