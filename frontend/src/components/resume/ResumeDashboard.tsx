'use client';

import React from 'react';
import { Container, Box, Typography, Grid, Paper, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StyleIcon from '@mui/icons-material/Style';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import WorkIcon from '@mui/icons-material/Work';

import { Resume } from '@/features/resume/types';
import { ResumeCard } from './ResumeCard';

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
  resumes,
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
  const defaultResume = resumes.find((r) => r.isDefault) || resumes[0];
  const totalViews = resumes.reduce((acc, r) => acc + (r.viewCount || 12), 0);
  const totalDownloads = resumes.reduce((acc, r) => acc + (r.downloadCount || 4), 0);
  const totalApplications = resumes.reduce((acc, r) => acc + (r.applicationCount || 3), 0);
  const avgATS = resumes.length > 0 ? Math.round(resumes.reduce((acc, r) => acc + r.atsScore, 0) / resumes.length) : 85;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DescriptionIcon sx={{ color: 'primary.main', fontSize: 36 }} /> Resume Studio & Management Workspace
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Build ATS-friendly resumes, manage version snapshots, tailor for specific job postings, and track application performance.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={onImport} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Import Resume
          </Button>
          <Button variant="outlined" startIcon={<StyleIcon />} onClick={onBrowseTemplates} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Templates
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, px: 3 }}>
            Create Resume
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Resumes</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#0066FF' }}>{resumes.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Avg ATS Score</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#00CC66' }}>{avgATS}%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Job Applications Used</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#9933FF' }}>{totalApplications}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Recruiter Views</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#FF9900' }}>{totalViews}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>PDF Downloads</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#FF3366' }}>{totalDownloads}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Resume Cards Grid */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Your Resume Documents ({resumes.length})
      </Typography>

      <Grid container spacing={3}>
        {resumes.map((resume) => (
          <Grid item xs={12} md={6} lg={4} key={resume.id}>
            <ResumeCard
              resume={resume}
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
    </Container>
  );
};
