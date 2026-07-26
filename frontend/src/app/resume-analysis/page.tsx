'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  LinearProgress,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import KeyIcon from '@mui/icons-material/Key';
import SpeedIcon from '@mui/icons-material/Speed';

import { resumeAnalysisApi } from '../../features/resume_analysis/api';
import { ResumeAnalysis } from '../../features/resume_analysis/types';

export default function ResumeAnalysisPage() {
  const [resumeText, setResumeText] = useState(
    'Alex Rivera\nSenior Software Engineer | alex@example.com | github.com/arivera\n\nEXPERIENCE\nSoftware Engineer at TechCorp (2021 - Present)\n- Worked on backend APIs using Go and PostgreSQL.\n- Built user interface components using React and TypeScript.\n- Managed Docker container deployments.\n\nEDUCATION\nB.S. Computer Science, State University'
  );
  const [targetJobTitle, setTargetJobTitle] = useState('Staff Full-Stack Engineer');
  const [targetJobDesc, setTargetJobDesc] = useState(
    'Looking for a Staff Full-Stack Engineer skilled in Go, React, TypeScript, PostgreSQL, Docker, Kubernetes, AWS, and microservices architecture.'
  );

  const [activeAnalysis, setActiveAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await resumeAnalysisApi.getUserAnalysisHistory();
      if (res && res.data && res.data.length > 0) {
        setHistory(res.data);
        if (!activeAnalysis) {
          setActiveAnalysis(res.data[0]);
        }
      } else {
        setActiveAnalysis(mockAnalysis);
        setHistory([mockAnalysis]);
      }
    } catch (err) {
      console.error(err);
      setActiveAnalysis(mockAnalysis);
      setHistory([mockAnalysis]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      setLoading(true);
      const res = await resumeAnalysisApi.analyzeResume({
        resume_text: resumeText,
        target_job_title: targetJobTitle,
        target_job_description: targetJobDesc,
      });
      setActiveAnalysis(res.analysis);
      await fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mockAnalysis: ResumeAnalysis = {
    id: 'res-anal-101',
    user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
    target_job_title: 'Staff Full-Stack Engineer',
    target_job_description: 'Staff engineer with Go, React, PostgreSQL, Docker, Kubernetes experience.',
    resume_text: resumeText,
    status: 'completed',
    created_at: new Date().toISOString(),
    scores: {
      id: 'sc-1',
      analysis_id: 'res-anal-101',
      overall_score: 84,
      ats_compatibility_score: 88,
      structure_score: 82,
      skills_score: 80,
      experience_score: 84,
      job_match_score: 85,
      created_at: new Date().toISOString(),
    },
    improvements: {
      id: 'imp-1',
      analysis_id: 'res-anal-101',
      user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      missing_skills: ['KUBERNETES', 'AWS', 'CI/CD'],
      present_keywords: ['GO', 'REACT', 'TYPESCRIPT', 'POSTGRESQL', 'DOCKER', 'MICROSERVICES', 'REST API'],
      missing_keywords: ['KUBERNETES', 'AWS', 'CI/CD'],
      keyword_density_score: 75,
      structure_feedback: [
        'Standard section headers (Experience, Education) detected correctly.',
        'Dedicated Technical Skills summary section present at top.',
      ],
      experience_bullet_fixes: [
        "Replace passive verb 'Worked on backend APIs' with action verb: 'Architected and deployed high-throughput REST microservices in Go'.",
        "Quantify performance impact: Add metrics like 'reduced database P99 query latency by 45%' or 'improved frontend bundle load time by 30%'.",
      ],
      general_suggestions: [
        'Tailor your summary specifically towards Staff Full-Stack Engineer position requirements.',
        'Ensure contact information (Email, LinkedIn URL, GitHub profile) is formatted cleanly at top.',
        'Export final resume in PDF format with single-column layout for ATS parser readability.',
      ],
      created_at: new Date().toISOString(),
    },
  };

  const currentScores = activeAnalysis?.scores || mockAnalysis.scores!;
  const currentImprovements = activeAnalysis?.improvements || mockAnalysis.improvements!;

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Top Title Banner */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Powered Resume Analysis Foundation
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Deep structural critique, ATS compatibility grading, missing skill detection, and keyword density optimization.
            </Typography>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        <Grid container spacing={3}>
          {/* Left Panel: Input & Settings */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DescriptionIcon sx={{ color: '#38bdf8' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                  Resume & Job Target Input
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Target Job Title"
                    fullWidth
                    size="small"
                    value={targetJobTitle}
                    onChange={(e) => setTargetJobTitle(e.target.value)}
                    sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Target Job Description (Optional)"
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    value={targetJobDesc}
                    onChange={(e) => setTargetJobDesc(e.target.value)}
                    sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Paste Resume Plain Text"
                    multiline
                    rows={8}
                    fullWidth
                    size="small"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    sx={{ textarea: { color: '#fff', fontFamily: 'monospace', fontSize: '0.85rem' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleRunAnalysis}
                    disabled={loading}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1.2, '&:hover': { bgcolor: '#0284c7' } }}
                  >
                    Analyze Resume & ATS Fit
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Panel: Analysis Scores & Detailed Reports */}
          <Grid item xs={12} md={8}>
            {/* Gauges & Top Score Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Overall Resume Score Gauge */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, textAlign: 'center', position: 'relative' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Overall Resume Quality Score</Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', my: 1 }}>
                    <CircularProgress variant="determinate" value={100} size={100} thickness={4} sx={{ color: '#334155' }} />
                    <CircularProgress variant="determinate" value={currentScores.overall_score} size={100} thickness={4} sx={{ color: '#38bdf8', position: 'absolute', left: 0 }} />
                    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                        {currentScores.overall_score}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Scale: 0 to 100 benchmark</Typography>
                </Paper>
              </Grid>

              {/* ATS Compatibility Score Gauge */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, textAlign: 'center', position: 'relative' }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>ATS Compatibility Score</Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', my: 1 }}>
                    <CircularProgress variant="determinate" value={100} size={100} thickness={4} sx={{ color: '#334155' }} />
                    <CircularProgress variant="determinate" value={currentScores.ats_compatibility_score} size={100} thickness={4} sx={{ color: '#10b981', position: 'absolute', left: 0 }} />
                    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                        {currentScores.ats_compatibility_score}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Applicant Tracking System Pass Rate</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* 4-Dimension Breakdown Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid #334155', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Structure</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8', mt: 0.5 }}>{currentScores.structure_score}%</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid #334155', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Skills Match</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#10b981', mt: 0.5 }}>{currentScores.skills_score}%</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid #334155', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Experience</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#a855f7', mt: 0.5 }}>{currentScores.experience_score}%</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: '#0f172a', border: '1px solid #334155', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Job Match</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f59e0b', mt: 0.5 }}>{currentScores.job_match_score}%</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Missing Skills & Keyword Optimization */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <KeyIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                  Missing Skills & Keyword Optimization
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Keyword Density Score</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#38bdf8' }}>{currentImprovements.keyword_density_score}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={currentImprovements.keyword_density_score} sx={{ height: 8, borderRadius: 4, bgcolor: '#0f172a', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 'bold', display: 'block', mb: 1 }}>
                    PRESENT KEYWORDS ({currentImprovements.present_keywords.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {currentImprovements.present_keywords.map((kw, idx) => (
                      <Chip key={idx} label={kw} size="small" sx={{ bgcolor: '#0f172a', color: '#22c55e', border: '1px solid #166534', fontWeight: 'bold' }} />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 'bold', display: 'block', mb: 1 }}>
                    MISSING SKILLS ({currentImprovements.missing_skills.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {currentImprovements.missing_skills.map((kw, idx) => (
                      <Chip key={idx} label={kw} size="small" sx={{ bgcolor: '#0f172a', color: '#ef4444', border: '1px solid #991b1b', fontWeight: 'bold' }} />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Actionable Bullet Point Improvements */}
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AnalyticsIcon sx={{ color: '#a855f7' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                  Actionable Bullet Point Improvements & Structure Suggestions
                </Typography>
              </Box>

              {currentImprovements.experience_bullet_fixes.map((fix, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, bgcolor: '#0f172a', p: 2, borderRadius: 1.5, border: '1px solid #334155' }}>
                  <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#e2e8f0', lineHeight: 1.5 }}>{fix}</Typography>
                </Box>
              ))}

              {currentImprovements.general_suggestions.map((sug, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1, bgcolor: '#0f172a', p: 1.5, borderRadius: 1.5 }}>
                  <CheckCircleOutlineIcon sx={{ color: '#38bdf8', fontSize: 18, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#cbd5e1' }}>{sug}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
