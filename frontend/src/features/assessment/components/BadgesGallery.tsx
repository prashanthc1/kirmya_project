import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShareIcon from '@mui/icons-material/Share';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { SkillBadge, BadgeTier } from '../types';

interface BadgesGalleryProps {
  badges: SkillBadge[];
}

export const BadgesGallery: React.FC<BadgesGalleryProps> = ({
  badges,
}) => {
  const getTierBadgeStyle = (tier: BadgeTier) => {
    switch (tier) {
      case 'Platinum':
        return { bg: '#a855f7', color: '#fff', border: '#c084fc' };
      case 'Gold':
        return { bg: '#f59e0b', color: '#0f172a', border: '#fbbf24' };
      case 'Silver':
        return { bg: '#94a3b8', color: '#0f172a', border: '#cbd5e1' };
      default:
        return { bg: '#b45309', color: '#fff', border: '#d97706' };
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Banner */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <WorkspacePremiumIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            Verified Candidate Skill Badges
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Industry-recognized skill badges automatically awarded upon passing technical assessments. Add to your candidate profile to signal verified competence to recruiters.
        </Typography>
      </Paper>

      {badges.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#0f172a', border: '1px solid #334155' }}>
          <VerifiedIcon sx={{ fontSize: 48, color: '#334155', mb: 1 }} />
          <Typography variant="h6" sx={{ color: '#94a3b8' }}>No skill badges earned yet</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Take an assessment and achieve a passing score to earn your verified badge.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {badges.map((badge) => {
            const tierStyle = getTierBadgeStyle(badge.tier);

            return (
              <Grid item xs={12} sm={6} md={4} key={badge.id}>
                <Card sx={{ bgcolor: '#1e293b', border: `2px solid ${tierStyle.border}`, borderRadius: 2.5, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      <VerifiedIcon sx={{ fontSize: 56, color: tierStyle.bg }} />
                    </Box>

                    <Chip
                      label={`${badge.tier.toUpperCase()} TIER`}
                      size="small"
                      sx={{ bgcolor: tierStyle.bg, color: tierStyle.color, fontWeight: 'bold', mb: 1.5, alignSelf: 'center' }}
                    />

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                      {badge.badge_title}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#94a3b8', mb: 2, display: 'block' }}>
                      Issued to {badge.user_name || 'Alex Rivera'} on {new Date(badge.issued_at).toLocaleDateString()}
                    </Typography>

                    <Box sx={{ bgcolor: '#0f172a', p: 1.5, borderRadius: 1.5, mb: 2, border: '1px solid #334155' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Verification Code:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                        {badge.verification_code}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 2, flexGrow: 1 }}>
                      {badge.skills_validated?.map((skill, idx) => (
                        <Chip
                          key={idx}
                          label={skill}
                          size="small"
                          sx={{ bgcolor: '#0f172a', color: '#94a3b8', fontSize: '0.7rem', border: '1px solid #334155' }}
                        />
                      ))}
                    </Box>

                    <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<ShareIcon />}
                      onClick={() => alert(`Share badge code: ${badge.verification_code}`)}
                      sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
                    >
                      Share Badge
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};
export default BadgesGallery;
