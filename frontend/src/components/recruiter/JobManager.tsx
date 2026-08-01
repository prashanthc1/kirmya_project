'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GlassCard from '../landing/GlassCard';
import { RecruiterJob } from '../../features/recruiter/types';

interface JobManagerProps {
  jobs: RecruiterJob[];
}

export const JobManager: React.FC<JobManagerProps> = ({ jobs }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tab, setTab] = useState(0);

  const filteredJobs = jobs.filter((j) => {
    if (tab === 0) return true;
    if (tab === 1) return j.status === 'Active';
    if (tab === 2) return j.status === 'Paused';
    if (tab === 3) return j.status === 'Closed';
    return true;
  });

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Manage Job Listings ({jobs.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/recruiter/jobs/create')}
          sx={{ py: 1, px: 3, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
        >
          Post New Job
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ mb: 3 }}>
        <Tab label={`All Jobs (${jobs.length})`} sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Active" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Paused" sx={{ fontWeight: 800, textTransform: 'none' }} />
        <Tab label="Closed" sx={{ fontWeight: 800, textTransform: 'none' }} />
      </Tabs>

      <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
              <TableCell sx={{ fontWeight: 800 }}>Job Title &amp; Department</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Applicants</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Views</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Deadline</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job.id} hover sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {job.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.department} • {job.employmentType}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {job.location}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={job.status}
                    size="small"
                    color={job.status === 'Active' ? 'success' : job.status === 'Paused' ? 'warning' : 'default'}
                    sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {job.applicantsCount} Applicants
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {job.viewsCount} Views
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {job.deadline}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => router.push(`/recruiter/applications?jobId=${job.id}`)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassCard>
  );
};

export default JobManager;
