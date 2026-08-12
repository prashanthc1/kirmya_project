'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  Stack,
  IconButton,
  Avatar,
  Chip,
  Rating,
  MenuItem,
  Alert,
  useTheme,
  Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';

interface NoteItem {
  id: string;
  recruiterName: string;
  note: string;
  score: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'No Hire';
  isPinned: boolean;
  createdAt: string;
}

interface Props {
  candidateId: string;
  candidateName: string;
}

export const RecruiterNotes: React.FC<Props> = ({ candidateId, candidateName }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: 'n1',
      recruiterName: 'Rashid Al-Maktoum',
      note: 'Candidate demonstrated exceptional grasp of Go memory management and PostgreSQL GIN indexing during initial screen.',
      score: 5,
      recommendation: 'Strong Hire',
      isPinned: true,
      createdAt: '2 hours ago',
    },
    {
      id: 'n2',
      recruiterName: 'Amira Al-Farsi',
      note: 'Verified previous tenure at CloudScale. Strong team leadership potential.',
      score: 4,
      recommendation: 'Hire',
      isPinned: false,
      createdAt: '1 day ago',
    },
  ]);

  const [newNote, setNewNote] = useState('');
  const [score, setScore] = useState(5);
  const [recommendation, setRecommendation] = useState<'Strong Hire' | 'Hire' | 'Consider' | 'No Hire'>('Hire');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const item: NoteItem = {
      id: `n_${Date.now()}`,
      recruiterName: 'You (Recruiter)',
      note: newNote,
      score: score,
      recommendation: recommendation,
      isPinned: false,
      createdAt: 'Just now',
    };
    setNotes([item, ...notes]);
    setNewNote('');
  };

  const togglePin = (id: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <Box>
      <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
        <strong>Internal Organization Notes:</strong> These notes are private to your recruiting team. Candidates will NEVER see internal notes.
      </Alert>

      {/* Add Note Form */}
      <Card
        sx={{
          borderRadius: '20px',
          p: 3,
          mb: 3,
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Add Recruiter Note &amp; Rating
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder={`Add internal evaluation notes for ${candidateName}... Use @mention to notify team members.`}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={3} alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Candidate Score</Typography>
              <Rating value={score} onChange={(_, val) => setScore(val || 5)} />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>Recommendation</Typography>
              <TextField
                select
                size="small"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as any)}
                sx={{ width: 150 }}
              >
                {['Strong Hire', 'Hire', 'Consider', 'No Hire'].map((rec) => (
                  <MenuItem key={rec} value={rec}>
                    {rec}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleAddNote}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              px: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            }}
          >
            Post Private Note
          </Button>
        </Stack>
      </Card>

      {/* Notes List */}
      <Stack spacing={2}>
        {notes.map((n) => (
          <Card
            key={n.id}
            sx={{
              borderRadius: '16px',
              p: 2.5,
              border: n.isPinned ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.9)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem', fontWeight: 800 }}>
                  {n.recruiterName[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {n.recruiterName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {n.createdAt}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={n.recommendation} color={n.recommendation === 'Strong Hire' || n.recommendation === 'Hire' ? 'success' : 'default'} size="small" sx={{ fontWeight: 800 }} />
                <IconButton size="small" onClick={() => togglePin(n.id)} color={n.isPinned ? 'primary' : 'default'}>
                  {n.isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
                </IconButton>
                <IconButton size="small" color="error" onClick={() => deleteNote(n.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {n.note}
            </Typography>

            <Rating value={n.score} readOnly size="small" />
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default RecruiterNotes;
