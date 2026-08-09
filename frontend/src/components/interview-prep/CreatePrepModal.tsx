'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';
import { CreatePreparationRequest } from '@/features/interview-prep/types';

interface CreatePrepModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (req: CreatePreparationRequest) => Promise<void>;
}

export const CreatePrepModal: React.FC<CreatePrepModalProps> = ({ open, onClose, onSubmit }) => {
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [interviewType, setInterviewType] = useState('Behavioral');
  const [interviewRound, setInterviewRound] = useState('Recruiter Round');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level');
  const [preparationDuration, setPreparationDuration] = useState('7 Days');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !jobTitle) return;
    setLoading(true);
    try {
      await onSubmit({
        company_name: companyName,
        job_title: jobTitle,
        job_description: jobDescription,
        interview_type: interviewType,
        interview_round: interviewRound,
        experience_level: experienceLevel,
        preparation_duration: preparationDuration,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AutoAwesome sx={{ color: '#60A5FA' }} />
          <Typography variant="h6" fontWeight={700}>
            New Interview Preparation Workspace
          </Typography>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Target Company Name"
              required
              fullWidth
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Google, Microsoft, Stripe"
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
            />

            <TextField
              label="Job Role / Title"
              required
              fullWidth
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Interview Type"
                fullWidth
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as any)}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
              >
                <MenuItem value="Behavioral">Behavioral</MenuItem>
                <MenuItem value="Technical">Technical</MenuItem>
                <MenuItem value="System Design">System Design</MenuItem>
                <MenuItem value="Situational">Situational</MenuItem>
                <MenuItem value="Case Study">Case Study</MenuItem>
              </TextField>

              <TextField
                select
                label="Interview Round"
                fullWidth
                value={interviewRound}
                onChange={(e) => setInterviewRound(e.target.value as any)}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
              >
                <MenuItem value="Recruiter Round">Recruiter Round</MenuItem>
                <MenuItem value="Hiring Manager">Hiring Manager</MenuItem>
                <MenuItem value="Technical Screen">Technical Screen</MenuItem>
                <MenuItem value="Onsite Final">Onsite Final</MenuItem>
              </TextField>
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Experience Level"
                fullWidth
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
              >
                <MenuItem value="Entry-Level">Entry-Level</MenuItem>
                <MenuItem value="Mid-Level">Mid-Level</MenuItem>
                <MenuItem value="Senior">Senior</MenuItem>
                <MenuItem value="Lead/Executive">Lead/Executive</MenuItem>
              </TextField>

              <TextField
                select
                label="Prep Duration"
                fullWidth
                value={preparationDuration}
                onChange={(e) => setPreparationDuration(e.target.value as any)}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
              >
                <MenuItem value="3 Days">3 Days</MenuItem>
                <MenuItem value="7 Days">7 Days</MenuItem>
                <MenuItem value="14 Days">14 Days</MenuItem>
                <MenuItem value="30 Days">30 Days</MenuItem>
              </TextField>
            </Stack>

            <TextField
              label="Job Description (Optional)"
              multiline
              rows={3}
              fullWidth
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste key responsibilities or target requirements..."
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={onClose} sx={{ color: '#94A3B8' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2.5,
              px: 3,
            }}
          >
            {loading ? 'Creating...' : 'Initialize Prep Workspace'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
