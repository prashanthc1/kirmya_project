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
    <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, color: '#f8fafc' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SecurityIcon sx={{ color: '#38bdf8' }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">Download Your Personal Data (GDPR Data Portability)</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Request a full ZIP package containing your profile, resume, job applications, messages, connections, and privacy settings.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={requesting}
          onClick={handleRequestExport}
          sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
        >
          {requesting ? 'Generating Archive...' : 'Request Data Export'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <LinearProgress sx={{ mb: 2, bgcolor: '#0f172a', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#94a3b8', mb: 1, mt: 3 }}>
        Your Data Export History & Downloads
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { color: '#94a3b8', borderColor: '#334155' } }}>
              <TableCell>Requested At</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expiration</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exports.map((e) => (
              <TableRow key={e.id} sx={{ '& td': { color: '#f8fafc', borderColor: '#334155' } }}>
                <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                <TableCell><Chip label={e.format.toUpperCase()} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8' }} /></TableCell>
                <TableCell><Chip label={e.status} color="success" size="small" /></TableCell>
                <TableCell>{new Date(e.expiresAt).toLocaleTimeString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="text" sx={{ color: '#38bdf8' }} href={e.downloadUrl || '#'}>
                    Download Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {exports.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: '#94a3b8', py: 3 }}>
                  No active data export requests found. Click "Request Data Export" above to generate your data archive.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
