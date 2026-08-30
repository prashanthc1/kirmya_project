'use client';

import React from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StyleIcon from '@mui/icons-material/Style';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';

import { Resume } from '../../features/resume/types';
import { ResumeCard } from './ResumeCard';
import { tokens } from '../../theme/tokens';

interface ResumeDashboardProps {
  resumes: Resume[];
  onCreate: () => void;
  onImport: () => void;
  onBrowseTemplates: () => void;
  onEdit: (resume: Resume) => void;
  onPreview: (resume: Resume) => void;
  onDuplicate: (resume: Resume) => void;
  onDownload: (resume: Resume) => void;
  onSetDefault: (resume: Resume) => void;
  onShare: (resume: Resume) => void;
  onDelete: (resume: Resume) => void;
}

export const ResumeDashboard: React.FC<ResumeDashboardProps> = ({
  resumes = [],
  onCreate,
  onImport,
  onBrowseTemplates,
  onEdit,
  onPreview,
  onDuplicate,
  onDownload,
  onSetDefault,
  onShare,
  onDelete,
}) => {
  const totalViews = resumes.reduce((acc, r) => acc + (r.viewCount || 0), 0);
  const totalDownloads = resumes.reduce((acc, r) => acc + (r.downloadCount || 0), 0);
  const totalApplications = resumes.reduce((acc, r) => acc + (r.applicationCount || 0), 0);
  const avgATS =
    resumes.length > 0
      ? Math.round(resumes.reduce((acc, r) => acc + (r.atsScore || 0), 0) / resumes.length)
      : 0;

  return (
    <Box data-testid="resume-dashboard" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              Resume Studio & Document Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680 }}>
              Build ATS-optimized resumes, manage versions, import existing PDF documents, and tailor profiles for job applications.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={onImport}
              sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
            >
              Import PDF/Doc
            </Button>
            <Button
              variant="outlined"
              startIcon={<StyleIcon />}
              onClick={onBrowseTemplates}
              sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
            >
              Templates
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreate}
              sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 800, px: 2.5 }}
            >
              Create Resume
            </Button>
          </Stack>
        </Stack>

        {/* Real Metrics Grid */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Total Resumes
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.5 }}>
                {resumes.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.04)',
              }}
            >
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Average ATS Score
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>
                {avgATS > 0 ? `${avgATS}%` : '—'}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
              }}
            >
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Applications Used
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                {totalApplications}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.04)',
              }}
            >
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Recruiter Views
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main', mt: 0.5 }}>
                {totalViews}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <DescriptionIcon sx={{ fontSize: 52, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No Resumes Created Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mt: 0.5, mb: 3 }}>
            Create your first ATS-friendly resume using our builder templates, or import an existing PDF document.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={onImport}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
            >
              Import PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreate}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
            >
              Create Resume
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {resumes.map((res) => (
            <Grid item xs={12} md={6} key={res.id}>
              <ResumeCard
                resume={res}
                onEdit={onEdit}
                onPreview={onPreview}
                onDuplicate={onDuplicate}
                onDownload={onDownload}
                onSetDefault={onSetDefault}
                onShare={onShare}
                onDelete={onDelete}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ResumeDashboard;
