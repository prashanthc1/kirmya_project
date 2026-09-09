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
  Alert,
  CircularProgress,
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recruiterApi } from '../../features/recruiter/api';
import LockIcon from '@mui/icons-material/Lock';
import GroupIcon from '@mui/icons-material/Group';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';

interface NotesPanelProps {
  applicationId: string;
  candidateId: string;
  candidateName: string;
}

/*
 * The recruiting team's notes on this candidate, from the API.
 *
 * Two notes lived in component state and were shown on every application: one
 * from "Rashid Al-Maktoum" on a candidate's "depth in Go concurrency
 * primitives", one marked private from "Amira Al-Farsi" quoting salary
 * expectations of $85k-$105k. Neither person exists. The panel took an
 * `applicationId` and ignored it, so both notes appeared against every
 * candidate any recruiter opened, including the salary one.
 *
 * Worse, a note the recruiter wrote themselves was appended to that array
 * under the byline "Rashid Al-Maktoum" and never sent anywhere.
 *
 * `GET` and `POST /recruiter/candidates/:id/notes` are the real thing, and the
 * server records the author.
 */
export const NotesPanel: React.FC<NotesPanelProps> = ({ applicationId, candidateId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');

  const {
    data: notes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recruiter', 'candidate', candidateId, 'notes'],
    queryFn: () => recruiterApi.getCandidateNotes(candidateId),
    enabled: Boolean(candidateId),
  });

  const addNote = useMutation({
    mutationFn: () =>
      recruiterApi.createCandidateNote(candidateId, {
        note: noteText,
        application_id: applicationId,
      }),
    onSuccess: async () => {
      setNoteText('');
      await queryClient.invalidateQueries({
        queryKey: ['recruiter', 'candidate', candidateId, 'notes'],
      });
    },
  });

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote.mutate();
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
          placeholder="Add a note for your hiring team…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          sx={{ mb: 1.5 }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          {/* A "Private Note (Recruiter Only)" checkbox used to sit here. The
              notes endpoint has no visibility field, so the choice was never
              sent and every note was team-visible whichever way it was set.
              Promising a candidate's salary expectations are recruiter-only
              when they are not is the kind of thing that has to be removed
              rather than left looking as if it works. */}
          <span />

          <Button variant="contained" endIcon={<SendIcon />} onClick={handleAddNote} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>
            Add Note
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        {isLoading && (
          <Stack direction="row" spacing={2} alignItems="center" role="status" aria-live="polite">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Loading notes…</Typography>
          </Stack>
        )}

        {isError && !isLoading && (
          <Alert severity="error">
            These notes could not be loaded.
            {error instanceof Error ? ` ${error.message}` : ''}
          </Alert>
        )}

        {addNote.isError && (
          <Alert severity="error">
            Your note was not saved.
            {addNote.error instanceof Error ? ` ${addNote.error.message}` : ''}
          </Alert>
        )}

        {!isLoading && !isError && notes.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No one has left a note on this candidate yet.
          </Typography>
        )}

        {notes.map((n) => (
          <Paper key={n.id} elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 800 }}>
                  {n.recruiterName?.[0] ?? '?'}
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

              {/* Deleting a note had no endpoint and only removed it from
                  this component's copy of the list. */}
            </Stack>

            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              {n.note}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default NotesPanel;
