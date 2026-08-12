'use client';

import React from 'react';
import { Box, Typography, Card, Chip, Stack, Button, Divider, useTheme } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import HistoryIcon from '@mui/icons-material/History';

interface LegalDocumentViewerProps {
  title: string;
  slug: string;
  version?: string;
  effectiveDate?: string;
  content?: string;
}

export const LegalDocumentViewer: React.FC<LegalDocumentViewerProps> = ({
  title,
  slug,
  version = '1.0.0',
  effectiveDate = '2026-08-12',
  content,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <GavelIcon sx={{ color: '#6366f1', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Chip label={`Version ${version}`} color="primary" size="small" sx={{ fontWeight: 800 }} />
        <Typography variant="caption" color="text.secondary">
          Effective Date: {effectiveDate}
        </Typography>
      </Stack>

      <Card
        sx={{
          p: 4,
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
          {content || `This document sets forth the official policies and terms governing ${title} on Kirmya. Authorized administrators maintain version history and effective date tracking.`}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Kirmya Legal &amp; Compliance Center
          </Typography>
          <Button size="small" startIcon={<HistoryIcon />} sx={{ fontWeight: 700 }}>
            View Revision History
          </Button>
        </Stack>
      </Card>
    </Box>
  );
};

export default LegalDocumentViewer;
