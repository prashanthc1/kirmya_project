'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  Chip,
  Button,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import GlassCard from '../landing/GlassCard';

interface EmployeesSectionProps {
  employees: any[];
}

export const EmployeesSection: React.FC<EmployeesSectionProps> = ({ employees }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [connected, setConnected] = useState<{ [key: string]: boolean }>({});

  const toggleConnect = (id: string) => {
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <PeopleIcon sx={{ color: '#6366f1', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Recruiters &amp; Team Members ({employees.length})
        </Typography>
      </Stack>

      <Grid container spacing={2.5}>
        {employees.map((emp) => {
          const isConn = !!connected[emp.id];
          return (
            <Grid item xs={12} sm={6} md={4} key={emp.id}>
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
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>{emp.name[0]}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {emp.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {emp.title}
                    </Typography>
                    <Chip label={emp.roleType} size="small" variant="outlined" sx={{ fontSize: '0.65rem', mt: 0.5 }} />
                  </Box>
                </Stack>

                <Button
                  size="small"
                  variant={isConn ? 'contained' : 'outlined'}
                  color={isConn ? 'success' : 'primary'}
                  startIcon={isConn ? <CheckIcon /> : <PersonAddIcon />}
                  onClick={() => toggleConnect(emp.id)}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                >
                  {isConn ? 'Connected' : 'Connect'}
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </GlassCard>
  );
};

export default EmployeesSection;
