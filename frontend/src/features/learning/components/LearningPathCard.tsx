import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { LearningPath } from '../types';

interface LearningPathCardProps {
  path: LearningPath;
  onEnrollPath: (path: LearningPath) => void;
}

export const LearningPathCard: React.FC<LearningPathCardProps> = ({
  path,
  onEnrollPath,
}) => {
  return (
    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Chip
            icon={<RouteIcon sx={{ color: '#38bdf8 !important' }} />}
            label={path.category}
            size="small"
            sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="caption" fontWeight="bold">{path.estimated_weeks} Weeks Track</Typography>
          </Box>
        </Box>

        <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
          {path.title}
        </Typography>

        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, flexGrow: 1 }}>
          {path.description}
        </Typography>

        <Box sx={{ bgcolor: '#0f172a', p: 1.5, borderRadius: 1.5, mb: 2, border: '1px solid #334155' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
            Target Career Outcome:
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ color: '#38bdf8' }}>
            {path.target_role}
          </Typography>
        </Box>

        {path.badge_name && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#a855f7' }}>
            <WorkspacePremiumIcon fontSize="small" />
            <Typography variant="caption" fontWeight="bold">
              Earn Badge: {path.badge_name}
            </Typography>
          </Box>
        )}

        <Divider sx={{ borderColor: '#334155', mb: 2 }} />

        <Button
          variant="contained"
          fullWidth
          onClick={() => onEnrollPath(path)}
          endIcon={<ArrowForwardIcon />}
          sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: '#0284c7' } }}
        >
          Enroll In Career Path
        </Button>
      </CardContent>
    </Card>
  );
};
export default LearningPathCard;
