'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Chip,
  Avatar,
  IconButton,
  FormControlLabel,
  Checkbox,
  useTheme,
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LockIcon from '@mui/icons-material/Lock';
import GroupIcon from '@mui/icons-material/Group';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';

interface NotesPanelProps {
  applicationId: string;
}

export const NotesPanel: React.FC<NotesPanelProps> = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [noteText, setNoteText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [notes, setNotes] = useState([
    {
      id: 'n1',
      author: 'Rashid Al-Maktoum',
      text: 'Candidate demonstrated exceptional depth in Go concurrency primitives and memory profiling during preliminary screening.',
      isPrivate: false,
      date: 'Jul 29, 2026 at 03:15 PM',
    },
    {
      id: 'n2',
      author: 'Amira Al-Farsi',
      text: 'Comp expectations are within budget range ($85k-$105k). Recommend advancing to Technical Architecture Round.',
      isPrivate: true,
      date: 'Jul 30, 2026 at 09:30 AM',
    },
  ]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setNotes([
      ...notes,
      {
        id: String(Date.now()),
        author: 'Rashid Al-Maktoum',
        text: noteText,
        isPrivate: isPrivate,
        date: new Date().toLocaleString(),
      },
    ]);
    setNoteText('');
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <Box sx={{ py: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <RateReviewIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Recruiter Notes &amp; Team Discussion
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
        <TextField
          multiline
          rows={3}
          fullWidth
          placeholder="Add recruiter note or mention team members (@amira)..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          sx={{ mb: 1.5 }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <FormControlLabel
            control={<Checkbox checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} color="primary" />}
            label={
              <Stack direction="row" spacing={0.5} alignItems="center">
                {isPrivate ? <LockIcon fontSize="small" color="error" /> : <GroupIcon fontSize="small" color="primary" />}
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {isPrivate ? 'Private Note (Recruiter Only)' : 'Visible to Hiring Team'}
                </Typography>
              </Stack>
            }
          />

          <Button variant="contained" endIcon={<SendIcon />} onClick={handleAddNote} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>
            Add Note
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        {notes.map((n) => (
          <Paper key={n.id} elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 800 }}>
                  {n.author[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {n.author}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {n.date}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={n.isPrivate ? 'Private' : 'Hiring Team'}
                  size="small"
                  color={n.isPrivate ? 'error' : 'primary'}
                  sx={{ fontSize: '0.65rem', fontWeight: 800 }}
                />
                <IconButton size="small" color="error" onClick={() => handleDelete(n.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              &quot;{n.text}&quot;
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default NotesPanel;
