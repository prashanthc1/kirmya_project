import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedIcon from '@mui/icons-material/Verified';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { UserAssessmentResult } from '../types';

interface ResultReportModalProps {
  open: boolean;
  result: UserAssessmentResult;
  onClose: () => void;
}

export const ResultReportModal: React.FC<ResultReportModalProps> = ({
  open,
  result,
  onClose,
}) => {
  const getBadgeColor = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return '#a855f7';
      case 'Gold':
        return '#f59e0b';
      case 'Silver':
        return '#94a3b8';
      default:
        return '#b45309';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ color: result.passed ? '#f59e0b' : '#ef4444' }} />
          <Typography variant="h6" fontWeight="bold">Assessment Evaluation & Scorecard</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: 'background.default', color: 'text.primary', p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          {result.passed ? (
            <Chip
              icon={<CheckCircleIcon sx={{ color: 'text.primary' }} />}
              label="ASSESSMENT PASSED"
              sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold', fontSize: '1rem', py: 2, px: 2 }}
            />
          ) : (
            <Chip
              icon={<CancelIcon sx={{ color: 'text.primary' }} />}
              label="ASSESSMENT NOT PASSED"
              sx={{ bgcolor: 'error.main', color: 'error.contrastText', fontWeight: 'bold', fontSize: '1rem', py: 2, px: 2 }}
            />
          )}

          <Typography variant="h2" fontWeight="bold" sx={{ color: 'primary.main', mt: 2 }}>
            {result.score_percentage}%
          </Typography>

          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            {result.assessment_title}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Multiple Choice Score</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.main', mt: 0.5 }}>
                {result.mcq_score}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>AI Practical Score</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'success.main', mt: 0.5 }}>
                {result.practical_ai_score}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Candidate Percentile Rank</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'primary.main', mt: 0.5 }}>
                Top {100 - result.percentile_rank}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* AI Practical Evaluation Feedback */}
        {result.ai_feedback_summary && (
          <Paper sx={{ p: 2.5, mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main' }}>
                AI Evaluation Feedback & Analysis
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
              {result.ai_feedback_summary}
            </Typography>
          </Paper>
        )}

        {/* Earned Badge Showcase */}
        {result.earned_badge && (
          <Paper sx={{ p: 3, bgcolor: 'background.paper', border: `2px solid ${getBadgeColor(result.earned_badge.tier)}`, borderRadius: 2.5, textAlign: 'center' }}>
            <VerifiedIcon sx={{ fontSize: 50, color: getBadgeColor(result.earned_badge.tier), mb: 1 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
              {result.earned_badge.badge_title}
            </Typography>
            <Chip
              label={`${result.earned_badge.tier} Tier Skill Badge`}
              size="small"
              sx={{ bgcolor: getBadgeColor(result.earned_badge.tier), color: 'text.primary', fontWeight: 'bold', my: 1 }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Verification Code: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{result.earned_badge.verification_code}</span>
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', '&:hover': { bgcolor: 'primary.main' } }}
        >
          Close & View Skill Dashboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ResultReportModal;
