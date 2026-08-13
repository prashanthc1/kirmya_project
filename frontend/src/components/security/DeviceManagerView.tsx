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
  Stack,
  Alert,
} from '@mui/material';
import LaptopIcon from '@mui/icons-material/Laptop';

export const DeviceManagerView: React.FC = () => {
  const [devices, setDevices] = useState([
    { id: 'd1', device_id: 'dev-web-001', platform: 'Web Desktop', browser: 'Chrome 120.0', os: 'Windows 11', trusted_status: 'trusted' },
  ]);

  const [message, setMessage] = useState<string | null>(null);

  const handleRemove = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
    setMessage('Device trust removed.');
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LaptopIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Trusted Browsers & Registered Devices</Typography>
      </Stack>

      {message && <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>{message}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Platform & Device</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Browser / Agent</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Operating System</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Trust Status</TableCell>
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
                  <Chip label={row.trusted_status.toUpperCase()} color="success" size="small" sx={{ fontWeight: 800 }} />
                </TableCell>
                <TableCell>
                  <Button size="small" color="error" onClick={() => handleRemove(row.id)}>
                    Remove Device
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default DeviceManagerView;
