'use client';

import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import GlassPanel from '../../../components/company/GlassPanel';

interface ApplicationItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  jobTitle: string;
  jobId: string;
  stage: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedDate: string;
  matchScore: number;
  experience: string;
}

const MOCK_APPLICATIONS: ApplicationItem[] = [
  {
    id: 'app-1',
    candidateName: 'Alex Rivera',
    candidateEmail: 'alex.rivera@example.com',
    jobTitle: 'Senior Full Stack Engineer',
    jobId: 'job-101',
    stage: 'screening',
    appliedDate: '2026-08-12',
    matchScore: 94,
    experience: '6 years',
  },
  {
    id: 'app-2',
    candidateName: 'Samantha Chen',
    candidateEmail: 'samantha.chen@example.com',
    jobTitle: 'Lead Product Manager',
    jobId: 'job-102',
    stage: 'interview',
    appliedDate: '2026-08-10',
    matchScore: 88,
    experience: '8 years',
  },
  {
    id: 'app-3',
    candidateName: 'Michael Vance',
    candidateEmail: 'michael.v@example.com',
    jobTitle: 'DevOps / Infrastructure Specialist',
    jobId: 'job-103',
    stage: 'new',
    appliedDate: '2026-08-14',
    matchScore: 91,
    experience: '5 years',
  },
  {
    id: 'app-4',
    candidateName: 'Elena Rostova',
    candidateEmail: 'elena.rostova@example.com',
    jobTitle: 'Senior Full Stack Engineer',
    jobId: 'job-101',
    stage: 'offer',
    appliedDate: '2026-08-01',
    matchScore: 96,
    experience: '7 years',
  },
  {
    id: 'app-5',
    candidateName: 'David Miller',
    candidateEmail: 'david.m@example.com',
    jobTitle: 'UX/UI Designer',
    jobId: 'job-104',
    stage: 'rejected',
    appliedDate: '2026-08-05',
    matchScore: 72,
    experience: '3 years',
  },
];

const STAGE_CHIPS: Record<ApplicationItem['stage'], { label: string; color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'error' | 'warning' }> = {
  new: { label: 'New', color: 'info' },
  screening: { label: 'Screening', color: 'warning' },
  interview: { label: 'Interview', color: 'primary' },
  offer: { label: 'Offer Extended', color: 'secondary' },
  hired: { label: 'Hired', color: 'success' },
  rejected: { label: 'Rejected', color: 'default' },
};

export default function EmployerApplicationsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState('');
  const [selectedApp, setSelectedApp] = React.useState<ApplicationItem | null>(null);
  const [applications, setApplications] = React.useState<ApplicationItem[]>(MOCK_APPLICATIONS);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter ? app.stage === stageFilter : true;
    return matchesSearch && matchesStage;
  });

  const updateStage = (id: string, nextStage: ApplicationItem['stage']) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, stage: nextStage } : app))
    );
    if (selectedApp && selectedApp.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, stage: nextStage } : null));
    }
  };

  return (
    <CompanyDashboardShell
      title="Application Tracker"
      description="Track and evaluate candidate job applications across screening, interviews, offers, and hiring stages."
      requires="application:view"
    >
      {({ companyId }) => (
        <Stack spacing={3}>
          <GlassPanel>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
              <TextField
                placeholder="Search candidates, positions, email..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 300, flexGrow: { xs: 1, sm: 0 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="stage-filter-label">Filter Stage</InputLabel>
                  <Select
                    labelId="stage-filter-label"
                    value={stageFilter}
                    label="Filter Stage"
                    onChange={(e) => setStageFilter(e.target.value)}
                  >
                    <MenuItem value="">All Stages</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="screening">Screening</MenuItem>
                    <MenuItem value="interview">Interview</MenuItem>
                    <MenuItem value="offer">Offer Extended</MenuItem>
                    <MenuItem value="hired">Hired</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </GlassPanel>

          <GlassPanel title={`Applications (${filtered.length})`}>
            {filtered.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No applications found matching your criteria.
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" aria-label="Applications table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidate</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Applied Date</TableCell>
                      <TableCell>Match Score</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((app) => (
                      <TableRow key={app.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                              {app.candidateName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {app.candidateName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {app.candidateEmail}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{app.jobTitle}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {app.appliedDate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`${app.matchScore}%`}
                            color={app.matchScore >= 90 ? 'success' : app.matchScore >= 80 ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={STAGE_CHIPS[app.stage].label}
                            color={STAGE_CHIPS[app.stage].color}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => setSelectedApp(app)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Advance Stage">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() =>
                                  updateStage(
                                    app.id,
                                    app.stage === 'new'
                                      ? 'screening'
                                      : app.stage === 'screening'
                                      ? 'interview'
                                      : app.stage === 'interview'
                                      ? 'offer'
                                      : 'hired'
                                  )
                                }
                              >
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => updateStage(app.id, 'rejected')}
                              >
                                <CancelOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </GlassPanel>

          {/* Details Dialog */}
          {selectedApp && (
            <Dialog open={!!selectedApp} onClose={() => setSelectedApp(null)} maxWidth="sm" fullWidth>
              <DialogTitle>Candidate Application Detail</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                      {selectedApp.candidateName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedApp.candidateName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedApp.candidateEmail} • {selectedApp.experience} experience
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">
                      Target Role
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedApp.jobTitle}
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Typography variant="caption">Applied: {selectedApp.appliedDate}</Typography>
                      <Typography variant="caption">AI Match: {selectedApp.matchScore}%</Typography>
                    </Stack>
                  </Box>

                  <Typography variant="subtitle2" fontWeight={600}>
                    Current Stage Action:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      variant={selectedApp.stage === 'screening' ? 'contained' : 'outlined'}
                      onClick={() => updateStage(selectedApp.id, 'screening')}
                    >
                      Screening
                    </Button>
                    <Button
                      size="small"
                      variant={selectedApp.stage === 'interview' ? 'contained' : 'outlined'}
                      onClick={() => updateStage(selectedApp.id, 'interview')}
                    >
                      Interview
                    </Button>
                    <Button
                      size="small"
                      variant={selectedApp.stage === 'offer' ? 'contained' : 'outlined'}
                      onClick={() => updateStage(selectedApp.id, 'offer')}
                    >
                      Offer
                    </Button>
                    <Button
                      size="small"
                      color="success"
                      variant={selectedApp.stage === 'hired' ? 'contained' : 'outlined'}
                      onClick={() => updateStage(selectedApp.id, 'hired')}
                    >
                      Hired
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant={selectedApp.stage === 'rejected' ? 'contained' : 'outlined'}
                      onClick={() => updateStage(selectedApp.id, 'rejected')}
                    >
                      Rejected
                    </Button>
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedApp(null)}>Close</Button>
              </DialogActions>
            </Dialog>
          )}
        </Stack>
      )}
    </CompanyDashboardShell>
  );
}
