'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import { Close, EventAvailable, Star, CheckCircle, Lightbulb } from '@mui/icons-material';

interface InterviewDayModeModalProps {
  open: boolean;
  onClose: () => void;
  companyName?: string;
  jobTitle?: string;
}

export const InterviewDayModeModal: React.FC<InterviewDayModeModalProps> = ({
  open,
  onClose,
  companyName = 'Target Company',
  jobTitle = 'Candidate Role',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: '#0F172A',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#fff',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <EventAvailable sx={{ color: '#34D399' }} />
          <Typography variant="h6" fontWeight={700}>
            Interview Day Warm-Up Cheat Sheet ({companyName} - {jobTitle})
          </Typography>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          {/* Quick Reminder Box */}
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#34D399', mb: 0.5 }}>
              ⚡ 30-Second Pre-Interview Checklist
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
              1. Take 3 deep breaths before entering the call.
              <br />
              2. Pause 2-3 seconds after each prompt to structure your answer into STAR framework.
              <br />
              3. Highlight your direct contribution using strong action verbs ('I designed', 'I led', 'I refactored').
            </Typography>
          </Box>

          {/* Quick STAR Story Highlights */}
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#60A5FA', mb: 1 }}>
              🎯 Top 3 STAR Stories Ready to Tell
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                • <strong>Story 1 (System Optimization):</strong> Monolith migration to microservices under tight 2-week deadline (Latency reduced by 45%).
              </Typography>
              <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                • <strong>Story 2 (Conflict Resolution):</strong> Differing architecture proposal resolved via automated benchmark data.
              </Typography>
              <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                • <strong>Story 3 (Leadership & Mentorship):</strong> Onboarded 3 junior engineers, reducing ramp-up time from 4 weeks to 10 days.
              </Typography>
            </Stack>
          </Box>

          {/* Key Questions to Ask */}
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#A78BFA', mb: 1 }}>
              ❓ Essential Questions to Ask Your Interviewer
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
              1. "What does success look like in the first 90 days for this {jobTitle} position?"
              <br />
              2. "What are the biggest technical or team growth priorities for {companyName} right now?"
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2.5,
            px: 4,
          }}
        >
          I'm Ready! Good Luck 🚀
        </Button>
      </DialogActions>
    </Dialog>
  );
};
