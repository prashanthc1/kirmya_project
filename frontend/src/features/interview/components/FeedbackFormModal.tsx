import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RateReviewIcon from '@mui/icons-material/RateReview';
import StarIcon from '@mui/icons-material/Star';
import { RecommendationType, SubmitFeedbackPayload, InterviewFeedback } from '../types';

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
  const [feedbackText, setFeedbackText] = useState('Demonstrated excellent problem-solving ability, clean code architecture, and clear explanation of concurrency trade-offs.');
  const [strengths, setStrengths] = useState('Strong mastery of Go routines, database indexing, and frontend state synchronization.');
  const [areasForImprovement, setAreasForImprovement] = useState('Could expand knowledge on distributed caching edge-cases.');

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

  const getRecColor = (rec: RecommendationType) => {
    switch (rec) {
      case 'strong_hire':
        return '#16a34a';
      case 'hire':
        return '#22c55e';
      case 'neutral':
        return '#eab308';
      case 'no_hire':
        return '#f97316';
      case 'strong_no_hire':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RateReviewIcon sx={{ color: '#38bdf8' }} />
          <Typography variant="h6" fontWeight="bold">Interview Round Scorecard & Feedback</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        <Grid container spacing={3}>
          {/* Rating Scorecard Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2.5, bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                Candidate Evaluation Metrics
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>Overall Candidate Rating</Typography>
                <Rating
                  value={rating}
                  onChange={(_, val) => val && setRating(val)}
                  precision={1}
                  icon={<StarIcon fontSize="inherit" sx={{ color: '#f59e0b' }} />}
                  emptyIcon={<StarIcon fontSize="inherit" sx={{ color: '#334155' }} />}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>Technical Competency (1-5)</Typography>
                <Rating
                  value={technicalScore}
                  onChange={(_, val) => val && setTechnicalScore(val)}
                  precision={1}
                  icon={<StarIcon fontSize="inherit" sx={{ color: '#38bdf8' }} />}
                  emptyIcon={<StarIcon fontSize="inherit" sx={{ color: '#334155' }} />}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>Communication & Articulation (1-5)</Typography>
                <Rating
                  value={communicationScore}
                  onChange={(_, val) => val && setCommunicationScore(val)}
                  precision={1}
                  icon={<StarIcon fontSize="inherit" sx={{ color: '#a855f7' }} />}
                  emptyIcon={<StarIcon fontSize="inherit" sx={{ color: '#334155' }} />}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>Problem Solving & System Design (1-5)</Typography>
                <Rating
                  value={problemSolvingScore}
                  onChange={(_, val) => val && setProblemSolvingScore(val)}
                  precision={1}
                  icon={<StarIcon fontSize="inherit" sx={{ color: '#10b981' }} />}
                  emptyIcon={<StarIcon fontSize="inherit" sx={{ color: '#334155' }} />}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Recommendation Selection Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2.5, bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ color: '#38bdf8', fontWeight: 'bold', mb: 1 }}>
                  Final Hiring Recommendation
                </FormLabel>
                <RadioGroup
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as RecommendationType)}
                >
                  <FormControlLabel
                    value="strong_hire"
                    control={<Radio sx={{ color: '#16a34a', '&.Mui-checked': { color: '#16a34a' } }} />}
                    label={<Typography fontWeight="bold" sx={{ color: '#16a34a' }}>Strong Hire (Top Tier)</Typography>}
                  />
                  <FormControlLabel
                    value="hire"
                    control={<Radio sx={{ color: '#22c55e', '&.Mui-checked': { color: '#22c55e' } }} />}
                    label={<Typography fontWeight="bold" sx={{ color: '#22c55e' }}>Hire (Meets All Bar Criteria)</Typography>}
                  />
                  <FormControlLabel
                    value="neutral"
                    control={<Radio sx={{ color: '#eab308', '&.Mui-checked': { color: '#eab308' } }} />}
                    label={<Typography sx={{ color: '#eab308' }}>Neutral / Borderline</Typography>}
                  />
                  <FormControlLabel
                    value="no_hire"
                    control={<Radio sx={{ color: '#f97316', '&.Mui-checked': { color: '#f97316' } }} />}
                    label={<Typography sx={{ color: '#f97316' }}>No Hire</Typography>}
                  />
                  <FormControlLabel
                    value="strong_no_hire"
                    control={<Radio sx={{ color: '#ef4444', '&.Mui-checked': { color: '#ef4444' } }} />}
                    label={<Typography fontWeight="bold" sx={{ color: '#ef4444' }}>Strong No Hire</Typography>}
                  />
                </RadioGroup>
              </FormControl>
            </Paper>
          </Grid>

          {/* Written Commentary */}
          <Grid item xs={12}>
            <TextField
              label="Comprehensive Feedback Summary"
              multiline
              rows={3}
              fullWidth
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Key Strengths"
              multiline
              rows={2}
              fullWidth
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Areas for Growth / Concerns"
              multiline
              rows={2}
              fullWidth
              value={areasForImprovement}
              onChange={(e) => setAreasForImprovement(e.target.value)}
              sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>

          {/* Previously Submitted Feedback List */}
          {existingFeedback.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mt: 1, mb: 1 }}>
                Submitted Feedback Submissions ({existingFeedback.length})
              </Typography>
              <Divider sx={{ borderColor: '#334155', mb: 2 }} />
              {existingFeedback.map((fb, idx) => (
                <Paper key={fb.id || idx} sx={{ p: 2, mb: 1, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#e2e8f0' }}>
                      {fb.interviewer_name || 'Interviewer'}
                    </Typography>
                    <Chip
                      label={fb.recommendation.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{ bgcolor: getRecColor(fb.recommendation), color: '#fff', fontWeight: 'bold' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#cbd5e1' }}>{fb.feedback_text}</Typography>
                </Paper>
              ))}
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback Scorecard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default FeedbackFormModal;
