import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Rating,
  Chip,
  Stack,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RateReviewIcon from '@mui/icons-material/RateReview';
import StarIcon from '@mui/icons-material/Star';
import { MentorshipFeedback } from '../../features/mentorship/types';

interface MentorshipFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  mentorshipId: string;
  sessionId?: string;
  targetName?: string;
  onSubmit: (feedback: Partial<MentorshipFeedback>) => Promise<void>;
}

const DEFAULT_TAGS = [
  'Insightful Advice',
  'Actionable Feedback',
  'Technical Mastery',
  'Great Listener',
  'Career Booster',
  'Empathic Encouragement',
];

export const MentorshipFeedbackModal: React.FC<MentorshipFeedbackModalProps> = ({
  open,
  onClose,
  mentorshipId,
  sessionId,
  targetName = 'your mentor',
  onSubmit,
}) => {
  const [rating, setRating] = useState<number | null>(5);
  const [comments, setComments] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Insightful Advice']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError('Please provide a star rating.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        mentorship_id: mentorshipId,
        session_id: sessionId,
        rating: rating,
        comments: comments.trim(),
        tags: selectedTags,
        reviewer_role: 'mentee',
      });
      setComments('');
      setRating(5);
      setSelectedTags(['Insightful Advice']);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
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
          borderRadius: '24px',
          background: (theme) =>
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          border: (theme) =>
            theme.palette.mode === 'light'
              ? '1px solid rgba(255, 255, 255, 0.8)'
              : '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RateReviewIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Leave Mentorship Feedback
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, pt: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Share your experience and review for <strong>{targetName}</strong>. Your honest feedback helps maintain a thriving mentorship community.
          </Typography>

          {/* Rating */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Overall Rating
            </Typography>
            <Rating
              name="feedback-rating"
              value={rating}
              precision={1}
              size="large"
              onChange={(_, newValue) => setRating(newValue)}
              emptyIcon={<StarIcon style={{ opacity: 0.35 }} fontSize="inherit" />}
            />
          </Box>

          {/* Tags */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Highlight Key Highlights
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1, mt: 1 }}>
              {DEFAULT_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    clickable
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => toggleTag(tag)}
                    sx={{ borderRadius: '10px', fontWeight: 600 }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Comments */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Review Comments
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="What went well? How did this mentorship session impact your career progression?"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '12px', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              borderRadius: '12px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              px: 3,
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MentorshipFeedbackModal;
