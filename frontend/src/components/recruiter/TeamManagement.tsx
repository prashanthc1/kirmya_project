'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  Chip,
  Button,
  TextField,
  MenuItem,
  useTheme,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SecurityIcon from '@mui/icons-material/Security';
import GlassCard from '../landing/GlassCard';

export const TeamManagement: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const members = [
    { id: '1', name: 'Rashid Al-Maktoum', email: 'rashid@emaar.ae', role: 'Owner', status: 'Active' },
    { id: '2', name: 'Amira Al-Farsi', email: 'amira@emaar.ae', role: 'Admin', status: 'Active' },
    { id: '3', name: 'Sarah Chen', email: 'sarah.recruiter@emaar.ae', role: 'Recruiter', status: 'Active' },
    { id: '4', name: 'Tariq Al-Mansoor', email: 'tariq.hm@emaar.ae', role: 'Hiring Manager', status: 'Active' },
  ];

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SecurityIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Hiring Team Collaboration &amp; Role Permissions
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<GroupAddIcon />} sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}>
          Invite Teammate
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        {members.map((m) => (
          <Grid item xs={12} md={6} key={m.id}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>{m.name[0]}</Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {m.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.email}
                  </Typography>
                </Box>
              </Stack>

              <TextField select size="small" value={m.role} sx={{ minWidth: 140 }}>
                {['Owner', 'Admin', 'Recruiter', 'Hiring Manager', 'Viewer'].map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
};

export default TeamManagement;
