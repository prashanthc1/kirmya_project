'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Rating,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  useTheme,
  Divider,
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Props {
  interviewId?: string;
  candidateName?: string;
  onSubmitted?: () => void;
}

export const InterviewFeedback: React.FC<Props> = ({
  interviewId = 'int_101',
  candidateName = 'Sarah Chen',
  onSubmitted,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [scores, setScores] = useState({
    technical: 5,
    communication: 5,
    problemSolving: 5,
    cultureFit: 5,
    leadership: 4,
    overall: 5,
  });

  const [recommendation, setRecommendation] = useState<'Strong Hire' | 'Hire' | 'Maybe' | 'No Hire'>('Strong Hire');
  const [comments, setComments] = useState(
    'Candidate demonstrated exceptional mastery of Go microservices architecture, memory allocation profiling, and PostgreSQL GIN index optimization. Excellent communication skills.'
  );

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRatingChange = (field: keyof typeof scores, val: number | null) => {
    setScores((prev) => ({ ...prev, [field]: val || 5 }));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      if (onSubmitted) onSubmitted();
    }, 1000);
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: { xs: 2.5, md: 4 },
        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: 800,
        mx: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <RateReviewIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Structured Interview Scorecard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submit evaluation feedback for <strong>{candidateName}</strong>
          </Typography>
        </Box>
      </Box>

      {success ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
            Feedback Submitted!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your structured interview evaluation has been recorded in the candidate scorecards pipeline.
          </Typography>
        </Box>
      ) : (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Technical Skills</Typography>
              <Rating value={scores.technical} onChange={(_, v) => handleRatingChange('technical', v)} size="large" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Communication &amp; Clarity</Typography>
              <Rating value={scores.communication} onChange={(_, v) => handleRatingChange('communication', v)} size="large" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Problem Solving &amp; Architecture</Typography>
              <Rating value={scores.problemSolving} onChange={(_, v) => handleRatingChange('problemSolving', v)} size="large" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Culture &amp; Role Alignment</Typography>
              <Rating value={scores.cultureFit} onChange={(_, v) => handleRatingChange('cultureFit', v)} size="large" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Leadership &amp; Ownership</Typography>
              <Rating value={scores.leadership} onChange={(_, v) => handleRatingChange('leadership', v)} size="large" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Overall Rating</Typography>
              <Rating value={scores.overall} onChange={(_, v) => handleRatingChange('overall', v)} size="large" />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Overall Recommendation *"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as any)}
              >
                {['Strong Hire', 'Hire', 'Maybe', 'No Hire'].map((rec) => (
                  <MenuItem key={rec} value={rec}>
                    {rec}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Detailed Interview Comments &amp; Rationale *"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              variant="contained"
              size="large"
              disabled={submitting}
              onClick={handleSubmit}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                px: 4,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              {submitting ? 'Submitting Scorecard...' : 'Submit Scorecard'}
            </Button>
          </Stack>
        </Box>
      )}
    </Card>
  );
};

export default InterviewFeedback;
