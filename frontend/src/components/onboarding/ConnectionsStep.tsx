'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Avatar,
  Chip,
  Paper,
  useTheme,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const ConnectionsStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [connected, setConnected] = useState<{ [key: string]: boolean }>({});

  const connections = [
    { id: 'u1', name: 'Sarah Chen', title: 'Staff Recruiter', company: 'Stripe', roleType: 'Recruiter', avatar: 'S' },
    { id: 'u2', name: 'Tariq Al-Mansoor', title: 'Facilities Director', company: 'Emaar Properties', roleType: 'Mentor', avatar: 'T' },
    { id: 'u3', name: 'Elena Rostova', title: 'Lead AI Engineer', company: 'Nexus AI', roleType: 'Expert', avatar: 'E' },
    { id: 'u4', name: 'Hyperion Labs Talent Team', title: 'Corporate Employer Page', company: 'Hyperion Labs', roleType: 'Company', avatar: 'H' },
  ];

  const toggleConnect = (id: string) => {
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Recommended Connections
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Connect with verified corporate recruiters, industry mentors, and referral advocates.
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {connections.map((conn) => {
            const isC = !!connected[conn.id];
            return (
              <Grid item xs={12} sm={6} key={conn.id}>
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
                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>{conn.avatar}</Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {conn.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {conn.title} at {conn.company}
                      </Typography>
                      <Chip label={conn.roleType} size="small" variant="outlined" sx={{ fontSize: '0.65rem', mt: 0.5 }} />
                    </Box>
                  </Stack>

                  <Button
                    size="small"
                    variant={isC ? 'contained' : 'outlined'}
                    color={isC ? 'success' : 'primary'}
                    startIcon={isC ? <CheckIcon /> : <PersonAddIcon />}
                    onClick={() => toggleConnect(conn.id)}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                  >
                    {isC ? 'Connected' : conn.roleType === 'Company' ? 'Follow' : 'Connect'}
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Stack direction="row" spacing={2}>
            <Button variant="text" onClick={() => onNext()} sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Skip
            </Button>
            <Button
              variant="contained"
              onClick={() => onNext({ connections: Object.keys(connected) })}
              endIcon={<ArrowForwardIcon />}
              sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
            >
              Continue
            </Button>
          </Stack>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default ConnectionsStep;
