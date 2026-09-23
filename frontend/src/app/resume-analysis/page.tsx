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
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await resumeAnalysisApi.getUserAnalysisHistory();
      if (res && res.data && res.data.length > 0) {
        setHistory(res.data);
        if (!activeAnalysis) {
          setActiveAnalysis(res.data[0]);
        }
      } else {
        // No analysis yet. The page used to substitute a fabricated one —
        // invented scores of 84/88/82 and a fixed missing-skills list —
        // presented as this user's own resume analysis, and it appeared
        // whenever the API returned nothing, which for a new user is always.
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
      setLoadError('Your analysis history could not be loaded. Please try again.');
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


  const currentScores = activeAnalysis?.scores;
  const currentImprovements = activeAnalysis?.improvements;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', color: 'text.primary', py: 4 }}>
      <Container maxWidth="xl">
        {/* Top Title Banner */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{    }}>
              AI-Powered Resume Analysis Foundation
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Deep structural critique, ATS compatibility grading, missing skill detection, and keyword density optimization.
            </Typography>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />}

        <Grid container spacing={3}>
          {/* Left Panel: Input & Settings */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DescriptionIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main' }}>
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
                    sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
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
                    sx={{ textarea: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
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
                    sx={{ textarea: { color: 'text.primary', fontFamily: 'monospace', fontSize: '0.85rem' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleRunAnalysis}
                    disabled={loading}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', py: 1.2, '&:hover': { bgcolor: 'primary.main' } }}
                  >
                    Analyze Resume & ATS Fit
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right Panel: Analysis Scores & Detailed Reports */}
          <Grid item xs={12} md={8}>
            {loadError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {loadError}
              </Alert>
            )}

            {/*
              Everything below reads a real analysis. The page used to fall back
              to a fabricated one — invented scores and a fixed skills list,
              rendered as this user's own resume analysis — whenever the API had
              nothing, which for a new user is every visit. An empty state is
              the honest answer, and it tells them how to get a real one.
            */}
            {!currentScores || !currentImprovements ? (
              <Paper sx={{ p: 5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
                  No analysis yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Paste your resume and a target job description on the left, then run the analysis.
                  Your scores and suggested improvements will appear here.
                </Typography>
              </Paper>
            ) : (
            <>
            {/* Gauges & Top Score Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Overall Resume Score Gauge */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, textAlign: 'center', position: 'relative' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Overall Resume Quality Score</Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', my: 1 }}>
                    <CircularProgress variant="determinate" value={100} size={100} thickness={4} sx={{ color: 'text.primary' }} />
                    <CircularProgress variant="determinate" value={currentScores.overall_score} size={100} thickness={4} sx={{ color: 'primary.main', position: 'absolute', left: 0 }} />
                    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                        {currentScores.overall_score}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Scale: 0 to 100 benchmark</Typography>
                </Paper>
              </Grid>

              {/* ATS Compatibility Score Gauge */}
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, textAlign: 'center', position: 'relative' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>ATS Compatibility Score</Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', my: 1 }}>
                    <CircularProgress variant="determinate" value={100} size={100} thickness={4} sx={{ color: 'text.primary' }} />
                    <CircularProgress variant="determinate" value={currentScores.ats_compatibility_score} size={100} thickness={4} sx={{ color: 'success.main', position: 'absolute', left: 0 }} />
                    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main' }}>
                        {currentScores.ats_compatibility_score}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Applicant Tracking System Pass Rate</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* 4-Dimension Breakdown Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Structure</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mt: 0.5 }}>{currentScores.structure_score}%</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Skills Match</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'success.main', mt: 0.5 }}>{currentScores.skills_score}%</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Experience</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mt: 0.5 }}>{currentScores.experience_score}%</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>Job Match</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'warning.main', mt: 0.5 }}>{currentScores.job_match_score}%</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Missing Skills & Keyword Optimization */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <KeyIcon sx={{ color: 'warning.main' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Missing Skills & Keyword Optimization
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Keyword Density Score</Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: 'primary.main' }}>{currentImprovements.keyword_density_score}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={currentImprovements.keyword_density_score} sx={{ height: 8, borderRadius: 4, bgcolor: 'background.default', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold', display: 'block', mb: 1 }}>
                    PRESENT KEYWORDS ({currentImprovements.present_keywords.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {currentImprovements.present_keywords.map((kw, idx) => (
                      <Chip key={idx} label={kw} size="small" sx={{ bgcolor: 'background.default', color: 'success.main', border: 1, borderColor: 'divider', fontWeight: 'bold' }} />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 'bold', display: 'block', mb: 1 }}>
                    MISSING SKILLS ({currentImprovements.missing_skills.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {currentImprovements.missing_skills.map((kw, idx) => (
                      <Chip key={idx} label={kw} size="small" sx={{ bgcolor: 'background.default', color: 'error.main', border: 1, borderColor: 'divider', fontWeight: 'bold' }} />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Actionable Bullet Point Improvements */}
            <Paper sx={{ p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <AnalyticsIcon sx={{ color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  Actionable Bullet Point Improvements & Structure Suggestions
                </Typography>
              </Box>

              {currentImprovements.experience_bullet_fixes.map((fix, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, bgcolor: 'background.default', p: 2, borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
                  <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>{fix}</Typography>
                </Box>
              ))}

              {currentImprovements.general_suggestions.map((sug, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1, bgcolor: 'background.default', p: 1.5, borderRadius: 1.5 }}>
                  <CheckCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 18, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{sug}</Typography>
                </Box>
              ))}
            </Paper>
            </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
