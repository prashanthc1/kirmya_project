'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Stack,
  Divider,
  Tab,
  Tabs,
  Alert,
  useTheme,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import VerifiedIcon from '@mui/icons-material/Verified';
import DescriptionIcon from '@mui/icons-material/Description';
import MessageIcon from '@mui/icons-material/Message';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CandidateResume from './CandidateResume';
import CandidateMatch from './CandidateMatch';
import RecruiterNotes from './RecruiterNotes';

interface Props {
  candidateId: string;
}

export const CandidateProfile: React.FC<Props> = ({ candidateId }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabIndex, setTabIndex] = useState(0);

  const candidate = {
    id: candidateId,
    name: 'Sarah Chen',
    headline: 'Staff Software Engineer & Cloud Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    location: 'Dubai, United Arab Emirates',
    currentRole: 'Staff Software Engineer at CloudScale',
    experienceYears: 8,
    availability: 'Immediate Notice (Layoff Support)',
    openToWork: true,
    verificationStatus: 'Verified Profile',
    matchScore: 96,
    skills: ['Golang', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Microservices'],
    certifications: ['AWS Certified Solutions Architect (Professional)', 'Certified Kubernetes Administrator'],
    about:
      'Passionate Distributed Systems & Cloud Architect with 8+ years building enterprise Go microservices, database engine optimizations, and frontend single-page applications.',
    experiences: [
      {
        title: 'Staff Software Engineer',
        company: 'CloudScale Technologies',
        period: '2022 - Present',
        description: 'Led core backend microservices team. Reduced P99 PostgreSQL query latency by 45%.',
      },
      {
        title: 'Senior Backend Developer',
        company: 'Apex Digital Solutions',
        period: '2019 - 2022',
        description: 'Architected high-throughput payment pipelines handling $50M+ monthly transactions in Go.',
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'American University of Sharjah',
        year: '2019',
      },
    ],
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header Banner Card */}
      <Card
        sx={{
          borderRadius: '24px',
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          p: 3,
          mb: 3,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar src={candidate.avatar} sx={{ width: 88, height: 88, borderRadius: '20px' }}>
              {candidate.name[0]}
            </Avatar>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {candidate.name}
                </Typography>
                <Chip icon={<VerifiedIcon />} label={candidate.verificationStatus} color="success" size="small" sx={{ fontWeight: 800 }} />
                <Chip icon={<AutoAwesomeIcon />} label={`${candidate.matchScore}% MATCH`} color="primary" size="small" sx={{ fontWeight: 900 }} />
              </Stack>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
                {candidate.headline}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{candidate.location}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">{candidate.experienceYears} Years Experience • {candidate.availability}</Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<DescriptionIcon />}
              onClick={() => setTabIndex(1)}
              sx={{ borderRadius: '12px', fontWeight: 800 }}
            >
              View Resume
            </Button>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              sx={{
                borderRadius: '12px',
                fontWeight: 800,
                px: 3,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              Message Candidate
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
          <Tab label="Professional Profile" sx={{ fontWeight: 800 }} />
          <Tab label="Resume & ATS Analysis" sx={{ fontWeight: 800 }} />
          <Tab label="AI Job Match Scorecard" sx={{ fontWeight: 800 }} />
          <Tab label="Recruiter Internal Notes" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab Panels */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: '20px', p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                About Professional
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {candidate.about}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                Work Experience
              </Typography>
              <Stack spacing={2.5}>
                {candidate.experiences.map((exp, i) => (
                  <Box key={i}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {exp.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {exp.company} • {exp.period}
                    </Typography>
                    <Typography variant="body2">{exp.description}</Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                Education
              </Typography>
              <Stack spacing={2}>
                {candidate.education.map((ed, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SchoolIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{ed.degree}</Typography>
                      <Typography variant="caption" color="text.secondary">{ed.institution} ({ed.year})</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '20px', p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Key Technical Skills
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                {candidate.skills.map((sk) => (
                  <Chip key={sk} label={sk} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                ))}
              </Stack>

              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Verified Certifications
              </Typography>
              <Stack spacing={1.5}>
                {candidate.certifications.map((cert, i) => (
                  <Box key={i} sx={{ p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>{cert}</Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabIndex === 1 && <CandidateResume candidateId={candidateId} candidateName={candidate.name} />}
      {tabIndex === 2 && <CandidateMatch candidateId={candidateId} candidateName={candidate.name} />}
      {tabIndex === 3 && <RecruiterNotes candidateId={candidateId} candidateName={candidate.name} />}
    </Box>
  );
};

export default CandidateProfile;
