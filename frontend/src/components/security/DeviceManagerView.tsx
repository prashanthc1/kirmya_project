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
  Stack,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  Box,
} from '@mui/material';
import LaptopIcon from '@mui/icons-material/Laptop';
import { DeviceItem } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

export const DeviceManagerView: React.FC = () => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    securityApi.getTrustedDevices().then((data) => {
      setDevices(data);
      setLoading(false);
    });
  }, []);

  const handleToggleTrust = async (id: string, currentStatus: string) => {
    const isCurrentlyTrusted = currentStatus === 'trusted';
    const nextStatus: DeviceItem['trusted_status'] = isCurrentlyTrusted ? 'revoked' : 'trusted';

    const ok = await securityApi.toggleDeviceTrust(id, !isCurrentlyTrusted);
    if (ok) {
      setDevices(
        devices.map((d) => (d.id === id ? { ...d, trusted_status: nextStatus } : d))
      );
      setMessage(`Device status updated to ${nextStatus}.`);
    }
  };

  const handleRemove = async (id: string) => {
    const ok = await securityApi.removeDevice(id);
    if (ok) {
      setDevices(devices.filter((d) => d.id !== id));
      setMessage('Device removed from registered devices.');
    }
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LaptopIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Trusted Browsers & Registered Devices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage hardware devices and trusted browsers registered to skip MFA challenges.
          </Typography>
        </Box>
      </Stack>

      {message && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
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
                <TableCell sx={{ fontWeight: 800 }}>Platform & Device</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Browser / Agent</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Operating System</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Trust Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Trust Toggle</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{row.platform}</TableCell>
                  <TableCell>{row.browser}</TableCell>
                  <TableCell>{row.os}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.trusted_status.toUpperCase()}
                      color={
                        row.trusted_status === 'trusted'
                          ? 'success'
                          : row.trusted_status === 'pending'
                          ? 'warning'
                          : 'error'
                      }
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={row.trusted_status === 'trusted'}
                          onChange={() => handleToggleTrust(row.id, row.trusted_status)}
                          color="success"
                        />
                      }
                      label={row.trusted_status === 'trusted' ? 'Trusted' : 'Revoked'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" color="error" onClick={() => handleRemove(row.id)}>
                      Remove
                    </Button>
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

export default DeviceManagerView;
