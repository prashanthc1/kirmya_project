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
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import GlassPanel from '../../../components/company/GlassPanel';

interface InterviewItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewerName: string;
  dateTime: string;
  meetingUrl: string;
  type: 'Technical Panel' | 'Culture Fit' | 'Recruiter Screen' | 'Executive Round';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
}

const INITIAL_INTERVIEWS: InterviewItem[] = [
  {
    id: 'int-1',
    candidateName: 'Samantha Chen',
    candidateEmail: 'samantha.chen@example.com',
    jobTitle: 'Lead Product Manager',
    interviewerName: 'Sarah Jenkins (VP Product)',
    dateTime: '2026-08-16 14:00 EST',
    meetingUrl: 'https://meet.kirmya.com/int-101',
    type: 'Executive Round',
    status: 'Scheduled',
  },
  {
    id: 'int-2',
    candidateName: 'Alex Rivera',
    candidateEmail: 'alex.rivera@example.com',
    jobTitle: 'Senior Full Stack Engineer',
    interviewerName: 'Dave Miller (Tech Lead)',
    dateTime: '2026-08-15 11:30 EST',
    meetingUrl: 'https://meet.kirmya.com/int-102',
    type: 'Technical Panel',
    status: 'Scheduled',
  },
  {
    id: 'int-3',
    candidateName: 'Michael Vance',
    candidateEmail: 'michael.v@example.com',
    jobTitle: 'DevOps / Infrastructure Specialist',
    interviewerName: 'Alex Thorne (Staff Recruiter)',
    dateTime: '2026-08-14 10:00 EST',
    meetingUrl: 'https://meet.kirmya.com/int-103',
    type: 'Recruiter Screen',
    status: 'Completed',
  },
];

export default function EmployerInterviewsPage() {
  const [interviews, setInterviews] = React.useState<InterviewItem[]>(INITIAL_INTERVIEWS);
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [scheduleOpen, setScheduleOpen] = React.useState<boolean>(false);

  // New Interview form state
  const [candName, setCandName] = React.useState('');
  const [candEmail, setCandEmail] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [interviewer, setInterviewer] = React.useState('');
  const [dt, setDt] = React.useState('');
  const [intType, setIntType] = React.useState<InterviewItem['type']>('Technical Panel');

  const filtered = interviews.filter((item) => (statusFilter ? item.status === statusFilter : true));

  const handleCreateInterview = () => {
    if (!candName || !position) return;
    const newInt: InterviewItem = {
      id: `int-${Date.now()}`,
      candidateName: candName,
      candidateEmail: candEmail || `${candName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      jobTitle: position,
      interviewerName: interviewer || 'Recruitment Team',
      dateTime: dt || new Date().toLocaleString(),
      meetingUrl: `https://meet.kirmya.com/int-${Math.floor(Math.random() * 1000)}`,
      type: intType,
      status: 'Scheduled',
    };
    setInterviews((prev) => [newInt, ...prev]);
    setScheduleOpen(false);
    setCandName('');
    setCandEmail('');
    setPosition('');
    setInterviewer('');
    setDt('');
  };

  return (
    <CompanyDashboardShell
      title="Interview Coordination"
      description="Schedule, manage, and coordinate candidate interviews with hiring managers and panels."
      requires="job:view"
      actions={() => (
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setScheduleOpen(true)}
          sx={{ borderRadius: '10px', textTransform: 'none' }}
        >
          Schedule Interview
        </Button>
      )}
    >
      {() => (
        <Stack spacing={3}>
          <GlassPanel>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>
                Upcoming & Recent Interviews ({filtered.length})
              </Typography>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="interview-status-label">Filter Status</InputLabel>
                <Select
                  labelId="interview-status-label"
                  value={statusFilter}
                  label="Filter Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Rescheduled">Rescheduled</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </GlassPanel>

          <GlassPanel>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label="Interviews table">
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Job Position</TableCell>
                    <TableCell>Interview Type</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Interviewer</TableCell>
                    <TableCell>Meeting Link</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.85rem' }}>
                            {item.candidateName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.candidateName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.candidateEmail}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{item.jobTitle}</TableCell>
                      <TableCell>
                        <Chip size="small" label={item.type} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTimeIcon fontSize="inherit" color="action" />
                          <Typography variant="caption">{item.dateTime}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.interviewerName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VideoCallIcon fontSize="small" />}
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none' }}
                        >
                          Join Video
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.status}
                          color={
                            item.status === 'Scheduled'
                              ? 'primary'
                              : item.status === 'Completed'
                              ? 'success'
                              : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </GlassPanel>

          {/* Schedule Interview Dialog */}
          <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule Candidate Interview</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Candidate Name"
                  fullWidth
                  size="small"
                  required
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                />
                <TextField
                  label="Candidate Email"
                  fullWidth
                  size="small"
                  type="email"
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                />
                <TextField
                  label="Job Position"
                  fullWidth
                  size="small"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
                <TextField
                  label="Assigned Interviewer(s)"
                  fullWidth
                  size="small"
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  placeholder="e.g. Sarah Jenkins (VP Engineering)"
                />
                <TextField
                  label="Date & Time"
                  fullWidth
                  size="small"
                  value={dt}
                  onChange={(e) => setDt(e.target.value)}
                  placeholder="e.g. 2026-08-20 14:00 EST"
                />
                <FormControl fullWidth size="small">
                  <InputLabel id="new-int-type-label">Interview Type</InputLabel>
                  <Select
                    labelId="new-int-type-label"
                    value={intType}
                    label="Interview Type"
                    onChange={(e) => setIntType(e.target.value as InterviewItem['type'])}
                  >
                    <MenuItem value="Recruiter Screen">Recruiter Screen</MenuItem>
                    <MenuItem value="Technical Panel">Technical Panel</MenuItem>
                    <MenuItem value="Culture Fit">Culture Fit</MenuItem>
                    <MenuItem value="Executive Round">Executive Round</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleCreateInterview} disabled={!candName || !position}>
                Confirm Schedule
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      )}
    </CompanyDashboardShell>
  );
}
