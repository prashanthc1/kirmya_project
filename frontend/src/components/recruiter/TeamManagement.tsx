'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recruiterApi } from '../../features/recruiter/api';
import {
  Box,
  Card,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  Chip,
  Button,
  TextField,
  MenuItem,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Organization Owner' | 'Hiring Manager' | 'Recruiter' | 'Recruiter Admin' | 'Interviewer' | 'Viewer';
  department: string;
  status: 'Active' | 'Invited';
}

export const TeamManagement: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  /*
   * The recruiting team, from the API.
   *
   * These were four colleagues in component state - Rashid Al-Maktoum, Amira
   * Al-Farsi, Sarah Chen, Tariq Al-Mansoor, all at emaar.ae - shown to every
   * recruiter as their own team.
   *
   * `GET /recruiter/team` is the only endpoint this surface has. There is no
   * invite, no role change and no removal, so those controls are disabled and
   * say why rather than editing a local array and looking like they worked.
   */
  const {
    data: members = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recruiter', 'team'],
    queryFn: async (): Promise<TeamMember[]> => {
      const rows = await recruiterApi.getTeamMembers();
      return (rows ?? []) as TeamMember[];
    },
  });

  const MANAGEMENT_UNAVAILABLE =
    'Team changes are made by a company owner from the company workspace. This view is read-only.';

  const [openInvite, setOpenInvite] = useState(false);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    email: '',
    role: 'Recruiter',
    department: 'Talent Acquisition',
  });

  const roles = [
    'Organization Owner',
    'Hiring Manager',
    'Recruiter',
    'Recruiter Admin',
    'Interviewer',
    'Viewer',
  ];

  // No handlers: the three actions they backed had no endpoint behind them and
  // only edited this component's copy of the list.

  return (
    <Box>
      <Card
        sx={{
          borderRadius: '24px',
          p: { xs: 3, md: 4 },
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SecurityIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                Hiring Team Collaboration &amp; RBAC Roles
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Manage organization-scoped permissions for jobs, candidates, applications, and scheduling.
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<GroupAddIcon />}
            onClick={() => setOpenInvite(true)}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              px: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            }}
          >
            Invite Team Member
          </Button>
        </Stack>

        <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
          <strong>RBAC Access Control:</strong> Organization Owners &amp; Recruiter Admins can publish jobs and manage teams. Hiring Managers &amp; Interviewers can view assigned candidates, schedule interviews, and record structured feedback scorecards.
        </Alert>

        <Grid container spacing={2.5}>
          {isLoading && (
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 3 }} role="status" aria-live="polite">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Loading your team…</Typography>
              </Stack>
            </Grid>
          )}
          {isError && !isLoading && (
            <Grid item xs={12}>
              <Alert severity="error">
                Your team could not be loaded.
                {error instanceof Error ? ` ${error.message}` : ''}
              </Alert>
            </Grid>
          )}
          {!isLoading && !isError && members.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                No one else is on this recruiting team yet.
              </Typography>
            </Grid>
          )}
          {members.map((m) => (
            <Grid item xs={12} md={6} key={m.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>{m.name[0]}</Avatar>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {m.name}
                      </Typography>
                      {m.status === 'Invited' && <Chip label="Invited" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {m.email} • {m.department}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title={MANAGEMENT_UNAVAILABLE}>
                    <span>
                      <TextField
                        select
                        size="small"
                        value={m.role}
                        disabled
                        sx={{ minWidth: 160 }}
                      >
                        {roles.map((r) => (
                          <MenuItem key={r} value={r}>
                            {r}
                          </MenuItem>
                        ))}
                      </TextField>
                    </span>
                  </Tooltip>
                  <Tooltip title={MANAGEMENT_UNAVAILABLE}>
                    <span>
                      <IconButton color="error" size="small" disabled>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={openInvite} onClose={() => setOpenInvite(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Invite Recruiter / Hiring Manager</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Work Email Address *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Assigned Role *"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              >
                {roles.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenInvite(false)}>Cancel</Button>
          <Tooltip title={MANAGEMENT_UNAVAILABLE}>
            <span>
              <Button variant="contained" disabled sx={{ fontWeight: 800 }}>
                Send Invite
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagement;
