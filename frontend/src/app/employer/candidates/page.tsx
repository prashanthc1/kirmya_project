'use client';

import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import GlassPanel from '../../../components/company/GlassPanel';

interface CandidateCardData {
  id: string;
  name: string;
  role: string;
  location: string;
  skills: string[];
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired';
  matchScore: number;
  rating: number;
}

const INITIAL_CANDIDATES: CandidateCardData[] = [
  {
    id: 'c-1',
    name: 'Jordan Lee',
    role: 'Senior React / Next.js Architect',
    location: 'San Francisco, CA',
    skills: ['TypeScript', 'Next.js', 'GraphQL', 'MUI'],
    stage: 'Applied',
    matchScore: 92,
    rating: 4.8,
  },
  {
    id: 'c-2',
    name: 'Morgan Brooks',
    role: 'Backend Go Specialist',
    location: 'Austin, TX',
    skills: ['Golang', 'PostgreSQL', 'Docker', 'gRPC'],
    stage: 'Screening',
    matchScore: 95,
    rating: 4.9,
  },
  {
    id: 'c-3',
    name: 'Taylor Swift',
    role: 'Product Designer (UI/UX)',
    location: 'Remote',
    skills: ['Figma', 'User Research', 'Design Systems'],
    stage: 'Interview',
    matchScore: 89,
    rating: 4.6,
  },
  {
    id: 'c-4',
    name: 'Chris Hemsworth',
    role: 'Cloud DevOps Engineer',
    location: 'Seattle, WA',
    skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
    stage: 'Offer',
    matchScore: 97,
    rating: 5.0,
  },
  {
    id: 'c-5',
    name: 'Patricia Arquette',
    role: 'Data Scientist / AI Specialist',
    location: 'New York, NY',
    skills: ['Python', 'PyTorch', 'NLP', 'Vector DB'],
    stage: 'Hired',
    matchScore: 94,
    rating: 4.9,
  },
];

const PIPELINE_STAGES: Array<{ key: CandidateCardData['stage']; title: string; color: string }> = [
  { key: 'Applied', title: 'Applied / Sourced', color: '#6366F1' },
  { key: 'Screening', title: 'Recruiter Screening', color: '#F59E0B' },
  { key: 'Interview', title: 'Interviewing', color: '#3B82F6' },
  { key: 'Offer', title: 'Offer Stage', color: '#8B5CF6' },
  { key: 'Hired', title: 'Hired Candidates', color: '#10B981' },
];

export default function EmployerCandidatesPage() {
  const [candidates, setCandidates] = React.useState<CandidateCardData[]>(INITIAL_CANDIDATES);
  const [search, setSearch] = React.useState('');

  const advanceCandidate = (candidateId: string) => {
    const stageOrder: CandidateCardData['stage'][] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const currIndex = stageOrder.indexOf(c.stage);
        const nextStage = currIndex < stageOrder.length - 1 ? stageOrder[currIndex + 1] : c.stage;
        return { ...c, stage: nextStage };
      })
    );
  };

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <CompanyDashboardShell
      title="Candidate Pipeline"
      description="Visual multi-stage candidate pipeline and recruitment talent pool."
      requires="application:view"
    >
      {() => (
        <Stack spacing={3}>
          <GlassPanel>
            <TextField
              placeholder="Search candidates by name, target role, or skills..."
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </GlassPanel>

          {/* Pipeline Kanban Grid */}
          <Grid container spacing={2}>
            {PIPELINE_STAGES.map((stage) => {
              const stageCandidates = filtered.filter((c) => c.stage === stage.key);
              return (
                <Grid item xs={12} sm={6} md={2.4} key={stage.key}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      bgcolor: 'background.paper',
                      border: '1px solid rgba(99, 102, 241, 0.12)',
                      minHeight: 450,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: stage.color }}>
                        {stage.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={stageCandidates.length}
                        sx={{ bgcolor: `${stage.color}15`, color: stage.color, fontWeight: 700 }}
                      />
                    </Stack>

                    <Stack spacing={2} sx={{ flexGrow: 1 }}>
                      {stageCandidates.length === 0 ? (
                        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          No candidates in this stage
                        </Typography>
                      ) : (
                        stageCandidates.map((cand) => (
                          <Card
                            key={cand.id}
                            elevation={0}
                            sx={{
                              borderRadius: '12px',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              bgcolor: 'action.hover',
                              p: 1.5,
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                  {cand.name.charAt(0)}
                                </Avatar>
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                                    {cand.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    {cand.role}
                                  </Typography>
                                </Box>
                              </Stack>

                              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                {cand.skills.slice(0, 2).map((skill) => (
                                  <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                ))}
                              </Stack>

                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={`${cand.matchScore}% Match`}
                                  color="success"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                                {cand.stage !== 'Hired' && (
                                  <Button
                                    size="small"
                                    onClick={() => advanceCandidate(cand.id)}
                                    endIcon={<ArrowForwardIcon fontSize="inherit" />}
                                    sx={{ fontSize: '0.7rem', py: 0, textTransform: 'none' }}
                                  >
                                    Next Stage
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                          </Card>
                        ))
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      )}
    </CompanyDashboardShell>
  );
}
