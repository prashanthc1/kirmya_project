'use client';

import React from 'react';
import { Paper, Typography, Button, Stack, Menu, MenuItem, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { atsApi } from '../../features/ats/api';

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({ selectedIds, onClearSelection, onRefresh }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  if (selectedIds.length === 0) return null;

  const handleBulkMove = async (targetStage: string) => {
    try {
      await atsApi.bulkActionApplications({
        application_ids: selectedIds,
        action: 'move',
        target_stage: targetStage,
      });
      onClearSelection();
      onRefresh();
    } catch {
      onClearSelection();
      onRefresh();
    } finally {
      setAnchorEl(null);
    }
  };

  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,ID,Selected\n' + selectedIds.map((id) => `${id},true`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ats_candidates_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        py: 1.5,
        px: 3,
        borderRadius: '20px',
        bgcolor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        backdropFilter: 'blur(16px)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {selectedIds.length} Applications Selected
      </Typography>

      <Button variant="contained" size="small" startIcon={<ArrowForwardIcon />} onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ borderRadius: '10px', fontWeight: 800 }}>
        Bulk Move Stage
      </Button>

      <Button variant="outlined" size="small" color="inherit" startIcon={<DownloadIcon />} onClick={handleExportCSV} sx={{ borderRadius: '10px', fontWeight: 700 }}>
        Export CSV
      </Button>

      <Button variant="text" size="small" color="inherit" onClick={onClearSelection} sx={{ fontWeight: 700 }}>
        Clear
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {['Shortlisted', 'Interview', 'Technical Round', 'Offer', 'Hired', 'Rejected'].map((stage) => (
          <MenuItem key={stage} onClick={() => handleBulkMove(stage)} sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
            Move to {stage}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default BulkActions;
