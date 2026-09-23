'use client';

import React, { useState } from 'react';
import { Paper, Box, Typography, TextField, Button, MenuItem, Stack, Grid } from '@mui/material';
import { AutoAwesome, Send, Save } from '@mui/icons-material';
import { SaveInterviewNoteRequest } from '@/features/interview-prep/types';

interface PostInterviewFormProps {
  preparationId: string;
  onSaveNote: (req: SaveInterviewNoteRequest) => Promise<void>;
  onOpenThankYou?: () => void;
}

export const PostInterviewForm: React.FC<PostInterviewFormProps> = ({ preparationId, onSaveNote, onOpenThankYou }) => {
  const [interviewers, setInterviewers] = useState('');
  const [topics, setTopics] = useState('');
  const [questions, setQuestions] = useState('');
  const [performance, setPerformance] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [feeling, setFeeling] = useState('Good');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (generateThankYou: boolean) => {
    setSaving(true);
    try {
      await onSaveNote({
        preparation_id: preparationId,
        interviewers,
        topics_discussed: topics,
        questions_asked: questions,
        candidate_performance: performance,
        personal_notes: personalNotes,
        overall_feeling: feeling,
        potential_strengths: strengths,
        potential_weaknesses: weaknesses,
        generate_thank_you: generateThankYou,
      });
      if (generateThankYou && onOpenThankYou) {
        onOpenThankYou();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: "background.paper",
        backdropFilter: 'blur(12px)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        color: "text.primary",
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
        Post-Interview Debrief & Notes
      </Typography>

      <Stack spacing={2.5}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Interviewers Met (Names & Roles)"
              fullWidth
              value={interviewers}
              onChange={(e) => setInterviewers(e.target.value)}
              placeholder="e.g. Alex Rivera (Lead Architect), Sarah Jenkins (Engineering Director)"
              sx={{ '& .MuiOutlinedInput-root': { color: "text.primary" }, '& .MuiInputLabel-root': { color: "text.secondary" } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Overall Vibe / Feeling"
              fullWidth
              value={feeling}
              onChange={(e) => setFeeling(e.target.value as any)}
              sx={{ '& .MuiOutlinedInput-root': { color: "text.primary" }, '& .MuiInputLabel-root': { color: "text.secondary" } }}
            >
              <MenuItem value="Excellent">Excellent 🔥</MenuItem>
              <MenuItem value="Good">Good 👍</MenuItem>
              <MenuItem value="Average">Average 😐</MenuItem>
              <MenuItem value="Challenging">Challenging 😓</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <TextField
          label="Key Topics Discussed"
          multiline
          rows={2}
          fullWidth
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="e.g. System scalability, team growth, microservices migration..."
          sx={{ '& .MuiOutlinedInput-root': { color: "text.primary" }, '& .MuiInputLabel-root': { color: "text.secondary" } }}
        />

        <TextField
          label="Specific Questions Asked by Interviewer"
          multiline
          rows={2}
          fullWidth
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          placeholder="e.g. How do you handle cache invalidation at scale?"
          sx={{ '& .MuiOutlinedInput-root': { color: "text.primary" }, '& .MuiInputLabel-root': { color: "text.secondary" } }}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Key Strengths Demonstrated"
              multiline
              rows={2}
              fullWidth
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="e.g. Clear STAR articulation, strong system design depth..."
              sx={{ '& .MuiOutlinedInput-root': { color: "text.primary" }, '& .MuiInputLabel-root': { color: "text.secondary" } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Areas to Refine for Next Round"
              multiline
              rows={2}
              fullWidth
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="e.g. Be more concise in the Situation setup..."
              sx={{ '& .MuiOutlinedInput-root': { color: "text.primary" }, '& .MuiInputLabel-root': { color: "text.secondary" } }}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} justifyContent="flex-end" pt={1}>
          <Button
            variant="outlined"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            startIcon={<Save />}
            sx={{ borderColor: "divider", color: '#fff', borderRadius: 2.5 }}
          >
            Save Debrief Notes
          </Button>

          <Button
            variant="contained"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            startIcon={<AutoAwesome />}
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              borderRadius: 2.5,
              px: 3,
            }}
          >
            Save & Generate Thank-You Email
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
