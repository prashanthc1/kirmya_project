'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import analyticsApi from '@/features/analytics/services/analyticsApi';

interface AnalyticsExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AnalyticsExportModal({ open, onClose }: AnalyticsExportModalProps) {
  const [format, setFormat] = useState('csv');
  const [downloading, setDownloading] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await analyticsApi.requestExport(format);
      setExportUrl(res.export?.download_url || '#');
    } catch {
      setExportUrl('#');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', border: '1px solid #334155' } }}>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Export Analytics Data</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Generate an asynchronous analytics export file. Large exports will process in the background.
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: "text.secondary" }}>Export Format</InputLabel>
            <Select
              value={format}
              label="Export Format"
              onChange={(e) => setFormat(e.target.value)}
              sx={{ color: "text.primary", '& .MuiOutlinedInput-notchedOutline': { borderColor: "divider" } }}
            >
              <MenuItem value="csv">CSV (Comma Separated Values)</MenuItem>
              <MenuItem value="json">JSON (Structured Objects)</MenuItem>
            </Select>
          </FormControl>

          {exportUrl && (
            <Box sx={{ p: 2, bgcolor: "background.default", borderRadius: 2, border: '1px solid #10b981' }}>
              <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold', mb: 1 }}>
                ✓ Export Ready
              </Typography>
              <Button href={exportUrl} download variant="contained" size="small" startIcon={<DownloadIcon />} sx={{ bgcolor: '#10b981', color: "success.contrastText" }}>
                Download File
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary" }}>Cancel</Button>
        <Button onClick={handleExport} variant="contained" disabled={downloading} sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
          {downloading ? 'Queuing...' : 'Generate Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
