'use client';

import React from 'react';
import { Paper, Stack, Button, IconButton, Tooltip, Select, MenuItem, Typography, Box } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletIcon from '@mui/icons-material/Tablet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import PaletteIcon from '@mui/icons-material/Palette';

interface ResumePreviewToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  deviceView: 'desktop' | 'tablet' | 'mobile';
  onDeviceChange: (view: 'desktop' | 'tablet' | 'mobile') => void;
  templateName: string;
  onTemplateChange: (template: string) => void;
  onDownload: () => void;
  onPrint: () => void;
}

export const ResumePreviewToolbar: React.FC<ResumePreviewToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  deviceView,
  onDeviceChange,
  templateName,
  onTemplateChange,
  onDownload,
  onPrint,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mr: 1 }}>
          Template:
        </Typography>
        <Select
          size="small"
          value={templateName}
          onChange={(e) => onTemplateChange(e.target.value)}
          sx={{ borderRadius: 2, fontWeight: 600, minWidth: 140 }}
        >
          <MenuItem value="classic">Classic ATS</MenuItem>
          <MenuItem value="modern">Modern Professional</MenuItem>
          <MenuItem value="minimal">Clean Minimalist</MenuItem>
          <MenuItem value="executive">Executive</MenuItem>
          <MenuItem value="technical">Technical</MenuItem>
          <MenuItem value="creative">Creative Studio</MenuItem>
        </Select>
      </Stack>

      {/* Device Toggle */}
      <Stack direction="row" spacing={0.5} sx={{ bgcolor: 'rgba(255, 255, 255, 0.04)', p: 0.5, borderRadius: 2 }}>
        <Tooltip title="Desktop View">
          <IconButton
            size="small"
            color={deviceView === 'desktop' ? 'primary' : 'default'}
            onClick={() => onDeviceChange('desktop')}
          >
            <DesktopWindowsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Tablet View">
          <IconButton
            size="small"
            color={deviceView === 'tablet' ? 'primary' : 'default'}
            onClick={() => onDeviceChange('tablet')}
          >
            <TabletIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Mobile View">
          <IconButton
            size="small"
            color={deviceView === 'mobile' ? 'primary' : 'default'}
            onClick={() => onDeviceChange('mobile')}
          >
            <PhoneIphoneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Zoom Control */}
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton size="small" onClick={onZoomOut}>
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 40, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Typography>
        <IconButton size="small" onClick={onZoomIn}>
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Actions */}
      <Stack direction="row" spacing={1.5}>
        <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={onPrint} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Print
        </Button>
        <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={onDownload} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Download PDF
        </Button>
      </Stack>
    </Paper>
  );
};
