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
} from '@mui/material';
import { Close, AutoAwesome } from '@mui/icons-material';
import { GenerateQuestionsRequest } from '@/features/interview-prep/types';

interface QuestionGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  preparationId?: string;
  defaultJobTitle?: string;
  defaultCompany?: string;
  onGenerate: (req: GenerateQuestionsRequest) => Promise<void>;
}

export const QuestionGeneratorModal: React.FC<QuestionGeneratorModalProps> = ({
  open,
  onClose,
  preparationId,
  defaultJobTitle = 'Software Engineer',
  defaultCompany = 'Target Company',
  onGenerate,
}) => {
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [category, setCategory] = useState('Behavioral');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate({
        preparation_id: preparationId,
        job_title: jobTitle,
        company_name: companyName,
        category,
        difficulty,
        count,
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
          <AutoAwesome sx={{ color: '#F59E0B' }} />
          <Typography variant="h6" fontWeight={700}>
            AI Target Question Generator
          </Typography>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Job Role Title"
            fullWidth
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
          />

          <TextField
            label="Target Company"
            fullWidth
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Question Category"
              fullWidth
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
            >
              <MenuItem value="Behavioral">Behavioral</MenuItem>
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Situational">Situational</MenuItem>
              <MenuItem value="Leadership">Leadership</MenuItem>
              <MenuItem value="Culture Fit">Culture Fit</MenuItem>
            </TextField>

            <TextField
              select
              label="Difficulty Level"
              fullWidth
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
            >
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
              <MenuItem value="Expert">Expert</MenuItem>
            </TextField>
          </Stack>

          <TextField
            select
            label="Number of Questions"
            fullWidth
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
          >
            <MenuItem value={3}>3 Questions</MenuItem>
            <MenuItem value={5}>5 Questions</MenuItem>
            <MenuItem value={10}>10 Questions</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: '#94A3B8' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={loading}
          startIcon={<AutoAwesome />}
          sx={{
            background: 'linear-gradient(90deg, #F59E0B 0%, #8B5CF6 100%)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2.5,
            px: 3,
          }}
        >
          {loading ? 'Generating...' : 'Generate Tailored Questions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
