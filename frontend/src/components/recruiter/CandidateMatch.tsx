'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Stack,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ShieldIcon from '@mui/icons-material/Shield';

interface Props {
  candidateId: string;
  candidateName: string;
}

export const CandidateMatch: React.FC<Props> = ({ candidateId, candidateName }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const matchData = {
    overallMatch: 96,
    skillsMatch: 98,
    experienceMatch: 95,
    educationMatch: 90,
    locationMatch: 100,
    roleMatch: 95,
    careerAlignment: 94,
    missingRequirements: ['Apache Kafka Streaming (Minor)'],
    potentialConcerns: ['Immediate notice period requirement; fast-tracked offer recommended.'],
    transferableSkills: [
      'PostgreSQL GIN Index Tuning',
      'High-Throughput Microservice Architecture',
      'Go Concurrency Patterns',
      'Technical Mentorship',
    ],
    explanation:
      "Candidate displays exceptional alignment with core Go microservices requirement and cloud infrastructure management. 8+ years hands-on production experience directly mirrors the target Senior Architect job requirements.",
  };

  return (
    <Box>
      <Alert severity="info" icon={<ShieldIcon />} sx={{ mb: 3, borderRadius: '14px' }}>
        <strong>Fair Hiring Policy:</strong> AI match recommendations must never be the sole basis for rejecting candidates. Recruiters must always inspect underlying candidate profile credentials and verified experience.
      </Alert>

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <AutoAwesomeIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              AI Candidate Match Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explaining suitability for {candidateName} against active job requirements.
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 3,
                borderRadius: '20px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                OVERALL MATCH SCORE
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, color: 'primary.main', my: 1 }}>
                {matchData.overallMatch}%
              </Typography>
              <Chip label="EXCEPTIONAL FIT" color="primary" size="small" sx={{ fontWeight: 900 }} />
            </Box>
          </Grid>

          <Grid item xs={12} sm={8}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Skills Match</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{matchData.skillsMatch}%</Typography>
                <LinearProgress variant="determinate" value={matchData.skillsMatch} color="primary" sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Experience Fit</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{matchData.experienceMatch}%</Typography>
                <LinearProgress variant="determinate" value={matchData.experienceMatch} color="success" sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Location Match</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{matchData.locationMatch}%</Typography>
                <LinearProgress variant="determinate" value={matchData.locationMatch} color="info" sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Education Alignment</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{matchData.educationMatch}%</Typography>
                <LinearProgress variant="determinate" value={matchData.educationMatch} color="secondary" sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Role Alignment</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{matchData.roleMatch}%</Typography>
                <LinearProgress variant="determinate" value={matchData.roleMatch} color="warning" sx={{ borderRadius: 2 }} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Career Alignment</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{matchData.careerAlignment}%</Typography>
                <LinearProgress variant="determinate" value={matchData.careerAlignment} color="primary" sx={{ borderRadius: 2 }} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Detailed Qualitative Analysis */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutlineIcon /> Verified Transferable Skills
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
              {matchData.transferableSkills.map((sk) => (
                <Chip key={sk} label={sk} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
              ))}
            </Stack>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon /> Potential Considerations &amp; Missing Requirements
            </Typography>
            <Stack spacing={1}>
              {matchData.missingRequirements.map((req, i) => (
                <Alert key={i} severity="warning" sx={{ borderRadius: '10px', py: 0.5 }}>
                  Missing Requirement: {req}
                </Alert>
              ))}
              {matchData.potentialConcerns.map((con, i) => (
                <Alert key={i} severity="info" sx={{ borderRadius: '10px', py: 0.5 }}>
                  Note: {con}
                </Alert>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ p: 3, borderRadius: '16px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                AI Recommendation Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {matchData.explanation}
              </Typography>
              <Chip label="RECOMMENDED FOR TECHNICAL INTERVIEW" color="success" sx={{ fontWeight: 900 }} />
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default CandidateMatch;
