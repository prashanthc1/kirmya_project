'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';

export const SessionManagerView: React.FC = () => {
  const [sessions, setSessions] = useState([
    { id: 's1', ip_address: '127.0.0.1', user_agent: 'Chrome 120 / Windows 11', location: 'Dubai, UAE', is_current: true },
    { id: 's2', ip_address: '192.168.1.45', user_agent: 'Safari / macOS Sonoma', location: 'Abu Dhabi, UAE', is_current: false },
  ]);

  const [message, setMessage] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
    setMessage('Session revoked.');
  };

  const handleRevokeAllOther = () => {
    setSessions(sessions.filter((s) => s.is_current));
    setMessage('All other sessions revoked successfully.');
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <DevicesIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Active Authentication Sessions</Typography>
        </Stack>
        {sessions.length > 1 && (
          <Button variant="outlined" color="error" onClick={handleRevokeAllOther} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Revoke All Other Sessions
          </Button>
        )}
      </Stack>

      {message && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>{message}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Browser & Platform</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Approximate Location</TableCell>
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
    </Card>
  );
};

export default SessionManagerView;
