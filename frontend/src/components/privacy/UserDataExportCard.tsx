'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SecurityIcon from '@mui/icons-material/Security';

import { dataOpsApi, DataExport } from '../../features/data_operations/services/dataOpsApi';

export default function UserDataExportCard() {
  const [exports, setExports] = useState<DataExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExports = async () => {
    setLoading(true);
    try {
      const data = await dataOpsApi.getUserExportHistory();
      setExports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExports();
  }, []);

  const handleRequestExport = async () => {
    setRequesting(true);
    setError(null);
    try {
      await dataOpsApi.requestUserExport();
      await loadExports();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to request personal data export');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5, color: "text.primary" }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SecurityIcon sx={{ color: "primary.main" }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">Download Your Personal Data (GDPR Data Portability)</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Request a full ZIP package containing your profile, resume, job applications, messages, connections, and privacy settings.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={requesting}
          onClick={handleRequestExport}
          sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', '&:hover': { bgcolor: "primary.main" } }}
        >
          {requesting ? 'Generating Archive...' : 'Request Data Export'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2, bgcolor: "background.default", '& .MuiLinearProgress-bar': { bgcolor: "primary.main" } }} />}

      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "text.secondary", mb: 1, mt: 3 }}>
        Your Data Export History & Downloads
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { color: "text.secondary", borderColor: "divider" } }}>
              <TableCell>Requested At</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expiration</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exports.map((e) => (
              <TableRow key={e.id} sx={{ '& td': { color: "text.primary", borderColor: "divider" } }}>
                <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                <TableCell><Chip label={e.format.toUpperCase()} size="small" sx={{ bgcolor: "background.default", color: "primary.main" }} /></TableCell>
                <TableCell><Chip label={e.status} color="success" size="small" /></TableCell>
                <TableCell>{new Date(e.expiresAt).toLocaleTimeString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="text" sx={{ color: "primary.main" }} href={e.downloadUrl || '#'}>
                    Download Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {exports.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>
                  No active data export requests found. Click &quot;Request Data Export&quot; above to generate your data archive.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
