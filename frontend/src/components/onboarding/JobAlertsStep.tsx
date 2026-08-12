'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Paper,
  useTheme,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const JobAlertsStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [frequency, setFrequency] = useState('Daily');
  const [channels, setChannels] = useState<{ [key: string]: boolean }>({
    Email: true,
    Push: true,
    'In-app': true,
  });

  const handleChannelToggle = (channel: string) => {
    setChannels({ ...channels, [channel]: !channels[channel] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <NotificationsActiveIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Job Alerts & Notifications
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Never miss a relevant job opening. Configure alert frequency and delivery channels.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 4,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Alert Frequency
          </Typography>
          <RadioGroup row value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {['Instant', 'Daily', 'Weekly', 'Monthly'].map((freq) => (
              <FormControlLabel key={freq} value={freq} control={<Radio size="small" />} label={freq} />
            ))}
          </RadioGroup>

          <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 3, mb: 1.5 }}>
            Notification Channels
          </Typography>
          <Grid container spacing={2}>
            {['Email', 'Push', 'In-app'].map((channel) => (
              <Grid item xs={12} sm={4} key={channel}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!channels[channel]}
                      onChange={() => handleChannelToggle(channel)}
                    />
                  }
                  label={`${channel} Notifications`}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => onNext({ frequency, channels })}
            endIcon={<ArrowForwardIcon />}
            sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Continue
          </Button>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default JobAlertsStep;
