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
      <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ color: result.passed ? '#f59e0b' : '#ef4444' }} />
          <Typography variant="h6" fontWeight="bold">Assessment Evaluation & Scorecard</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          {result.passed ? (
            <Chip
              icon={<CheckCircleIcon sx={{ color: '#fff !important' }} />}
              label="ASSESSMENT PASSED"
              sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold', fontSize: '1rem', py: 2, px: 2 }}
            />
          ) : (
            <Chip
              icon={<CancelIcon sx={{ color: '#fff !important' }} />}
              label="ASSESSMENT NOT PASSED"
              sx={{ bgcolor: '#ef4444', color: '#fff', fontWeight: 'bold', fontSize: '1rem', py: 2, px: 2 }}
            />
          )}

          <Typography variant="h2" fontWeight="bold" sx={{ color: '#38bdf8', mt: 2 }}>
            {result.score_percentage}%
          </Typography>

          <Typography variant="subtitle1" sx={{ color: '#94a3b8' }}>
            {result.assessment_title}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Multiple Choice Score</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#38bdf8', mt: 0.5 }}>
                {result.mcq_score}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>AI Practical Score</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981', mt: 0.5 }}>
                {result.practical_ai_score}%
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, bgcolor: '#1e293b', border: '1px solid #334155', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>Candidate Percentile Rank</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#a855f7', mt: 0.5 }}>
                Top {100 - result.percentile_rank}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* AI Practical Evaluation Feedback */}
        {result.ai_feedback_summary && (
          <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoAwesomeIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                AI Evaluation Feedback & Analysis
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#e2e8f0', lineHeight: 1.5 }}>
              {result.ai_feedback_summary}
            </Typography>
          </Paper>
        )}

        {/* Earned Badge Showcase */}
        {result.earned_badge && (
          <Paper sx={{ p: 3, bgcolor: '#1e293b', border: `2px solid ${getBadgeColor(result.earned_badge.tier)}`, borderRadius: 2.5, textAlign: 'center' }}>
            <VerifiedIcon sx={{ fontSize: 50, color: getBadgeColor(result.earned_badge.tier), mb: 1 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
              {result.earned_badge.badge_title}
            </Typography>
            <Chip
              label={`${result.earned_badge.tier} Tier Skill Badge`}
              size="small"
              sx={{ bgcolor: getBadgeColor(result.earned_badge.tier), color: '#0f172a', fontWeight: 'bold', my: 1 }}
            />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Verification Code: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{result.earned_badge.verification_code}</span>
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
        >
          Close & View Skill Dashboard
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ResultReportModal;
