'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Rating,
  TextField,
  Button,
  MenuItem,
  Grid,
  useTheme,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { atsApi } from '../../features/ats/api';

interface FeedbackFormProps {
  interviewId: string;
  applicationId: string;
  onSubmitted?: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ interviewId, applicationId, onSubmitted }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [techRating, setTechRating] = useState<number | null>(5);
  const [commRating, setCommRating] = useState<number | null>(5);
  const [expRating, setExpRating] = useState<number | null>(4);
  const [cultureRating, setCultureRating] = useState<number | null>(5);
  const [recommendation, setRecommendation] = useState('Hire');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await atsApi.submitInterviewFeedback({
        interview_id: interviewId,
        application_id: applicationId,
        overall_rating: 5,
        technical_score: techRating || 5,
        communication_score: commRating || 5,
        experience_score: expRating || 5,
        culture_fit_score: cultureRating || 5,
        recommendation,
        notes,
      });
      onSubmitted?.();
    } catch {
      onSubmitted?.();
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <QuizIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Submit Structured Interview Evaluation
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Technical Depth &amp; Architecture:
            </Typography>
            <Rating value={techRating} onChange={(_, val) => setTechRating(val)} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Communication &amp; Leadership:
            </Typography>
            <Rating value={commRating} onChange={(_, val) => setCommRating(val)} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Domain &amp; Hands-on Experience:
            </Typography>
            <Rating value={expRating} onChange={(_, val) => setExpRating(val)} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Culture &amp; Team Fit:
            </Typography>
            <Rating value={cultureRating} onChange={(_, val) => setCultureRating(val)} />
          </Grid>

          <Grid item xs={12}>
            <TextField select label="Overall Hiring Recommendation *" fullWidth value={recommendation} onChange={(e) => setRecommendation(e.target.value)}>
              <MenuItem value="Strong Hire">Strong Hire (High Priority Candidate)</MenuItem>
              <MenuItem value="Hire">Hire (Meets All Technical Bar Requirements)</MenuItem>
              <MenuItem value="Maybe">Maybe (Hold for Comparison)</MenuItem>
              <MenuItem value="Reject">Reject (Does Not Meet Bar)</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField label="Detailed Feedback &amp; Justification *" multiline rows={3} fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Provide detailed technical feedback..." />
          </Grid>
        </Grid>

        <Button type="submit" variant="contained" startIcon={<CheckCircleIcon />} sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.2, px: 4 }}>
          Submit Evaluation Feedback
        </Button>
      </form>
    </Paper>
  );
};

export default FeedbackForm;
