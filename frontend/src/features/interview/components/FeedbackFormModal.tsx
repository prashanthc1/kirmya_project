'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Rating,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  Divider,
  Alert,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RateReviewIcon from '@mui/icons-material/RateReview';
import StarIcon from '@mui/icons-material/Star';
import { RecommendationType, SubmitFeedbackPayload, InterviewFeedback } from '../types';
import { tokens } from '../../../theme/tokens';

interface FeedbackFormModalProps {
  open: boolean;
  roundId: string;
  onClose: () => void;
  onSubmitFeedback: (roundId: string, payload: SubmitFeedbackPayload) => Promise<void>;
  existingFeedback?: InterviewFeedback[];
}

export const FeedbackFormModal: React.FC<FeedbackFormModalProps> = ({
  open,
  roundId,
  onClose,
  onSubmitFeedback,
  existingFeedback = [],
}) => {
  const [rating, setRating] = useState<number>(4);
  const [technicalScore, setTechnicalScore] = useState<number>(4);
  const [communicationScore, setCommunicationScore] = useState<number>(5);
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(4);
  const [recommendation, setRecommendation] = useState<RecommendationType>('hire');
  const [feedbackText, setFeedbackText] = useState(
    'Demonstrated excellent problem-solving ability, clean code architecture, and clear explanation of concurrency trade-offs.'
  );
  const [strengths, setStrengths] = useState(
    'Strong mastery of Go routines, database indexing, and frontend state synchronization.'
  );
  const [areasForImprovement, setAreasForImprovement] = useState(
    'Could expand knowledge on distributed caching edge-cases.'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload: SubmitFeedbackPayload = {
        rating,
        technical_score: technicalScore,
        communication_score: communicationScore,
        problem_solving_score: problemSolvingScore,
        recommendation,
        feedback_text: feedbackText,
        strengths,
        areas_for_improvement: areasForImprovement,
      };

      await onSubmitFeedback(roundId, payload);
      setSuccessMsg('Feedback scorecard submitted successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to submit interview feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <RateReviewIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Submit Interview Scorecard & Feedback
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: `${tokens.radius.md}px` }}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: `${tokens.radius.md}px` }}>
            {successMsg}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Overall Rating & Scores */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Overall Candidate Rating
              </Typography>
              <Rating
                value={rating}
                onChange={(e, val) => setRating(val || 3)}
                size="large"
                emptyIcon={<StarIcon fontSize="inherit" />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Technical Execution Score (1-5)
              </Typography>
              <Rating
                value={technicalScore}
                onChange={(e, val) => setTechnicalScore(val || 3)}
                size="large"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Communication & Clarity Score (1-5)
              </Typography>
              <Rating
                value={communicationScore}
                onChange={(e, val) => setCommunicationScore(val || 3)}
                size="large"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Problem Solving & Architecture (1-5)
              </Typography>
              <Rating
                value={problemSolvingScore}
                onChange={(e, val) => setProblemSolvingScore(val || 3)}
                size="large"
              />
            </Grid>
          </Grid>

          <Divider />

          {/* Recommendation */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
              Hiring Recommendation
            </FormLabel>
            <RadioGroup
              row
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as RecommendationType)}
            >
              <FormControlLabel value="strong_hire" control={<Radio color="success" />} label="Strong Hire" />
              <FormControlLabel value="hire" control={<Radio color="success" />} label="Hire" />
              <FormControlLabel value="neutral" control={<Radio color="warning" />} label="Neutral" />
              <FormControlLabel value="no_hire" control={<Radio color="error" />} label="No Hire" />
              <FormControlLabel value="strong_no_hire" control={<Radio color="error" />} label="Strong No Hire" />
            </RadioGroup>
          </FormControl>

          <Divider />

          {/* Feedback Text */}
          <TextField
            label="Detailed Feedback & Assessment"
            multiline
            rows={3}
            fullWidth
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Summarize candidate technical performance, problem decomposition, and depth."
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Key Strengths"
                multiline
                rows={2}
                fullWidth
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Areas for Growth / Improvement"
                multiline
                rows={2}
                fullWidth
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
        >
          {submitting ? 'Submitting...' : 'Submit Scorecard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackFormModal;
