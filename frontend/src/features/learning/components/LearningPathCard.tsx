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
    <Card sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)' } }}>
      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Chip
            icon={<RouteIcon sx={{ color: '#38bdf8 !important' }} />}
            label={path.category}
            size="small"
            sx={{ bgcolor: "background.default", color: "primary.main", border: (theme) => `1px solid ${theme.palette.divider}`, fontWeight: 'bold' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: "text.secondary" }}>
            <AccessTimeIcon fontSize="small" />
            <Typography variant="caption" fontWeight="bold">{path.estimated_weeks} Weeks Track</Typography>
          </Box>
        </Box>

        <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 1 }}>
          {path.title}
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, flexGrow: 1 }}>
          {path.description}
        </Typography>

        <Box sx={{ bgcolor: "background.default", p: 1.5, borderRadius: 1.5, mb: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: 'block', mb: 0.5 }}>
            Target Career Outcome:
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ color: "primary.main" }}>
            {path.target_role}
          </Typography>
        </Box>

        {path.badge_name && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: "primary.main" }}>
            <WorkspacePremiumIcon fontSize="small" />
            <Typography variant="caption" fontWeight="bold">
              Earn Badge: {path.badge_name}
            </Typography>
          </Box>
        )}

        <Divider sx={{ borderColor: "divider", mb: 2 }} />

        <Button
          variant="contained"
          fullWidth
          onClick={() => onEnrollPath(path)}
          endIcon={<ArrowForwardIcon />}
          sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', py: 1, '&:hover': { bgcolor: "primary.main" } }}
        >
          Enroll In Career Path
        </Button>
      </CardContent>
    </Card>
  );
};
export default LearningPathCard;
