'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SchoolIcon from '@mui/icons-material/School';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { matchingApi } from '../../../features/ai_job_match/api';
import { AIJobMatch, FeedbackType } from '../../../features/ai_job_match/types';

export default function AIJobMatchPage() {
  const [matches, setMatches] = useState<AIJobMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<AIJobMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await matchingApi.getUserMatches();
      setMatches(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedMatch(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (matchID: string, feedbackType: FeedbackType) => {
    try {
      await matchingApi.submitFeedback(matchID, feedbackType);
      setFeedbackSubmitted(`Feedback (${feedbackType}) logged for ML training dataset.`);
      setTimeout(() => setFeedbackSubmitted(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Emerald
    if (score >= 75) return '#38bdf8'; // Sky Blue
    return '#f59e0b'; // Amber
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#38bdf8', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <AutoAwesomeIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya AI Job Matching Engine
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Multi-dimensional match scoring across 8 factors with ML feedback loops & upskilling recommendations
              </Typography>
            </Box>
          </Box>
        </Box>

        {feedbackSubmitted && (
          <Alert severity="success" sx={{ mb: 3, bgcolor: '#065f46', color: '#ecfdf5', border: '1px solid #10b981' }}>
            {feedbackSubmitted}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        <Grid container spacing={3}>
          {/* Matches Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f8fafc' }}>
                Top Matched Positions ({matches.length})
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {matches.map((m) => (
                  <Card
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    sx={{
                      bgcolor: selectedMatch?.id === m.id ? '#0f172a' : '#1e293b',
                      border: `1px solid ${selectedMatch?.id === m.id ? '#38bdf8' : '#334155'}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#38bdf8' },
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={`${m.overall_score}% MATCH`}
                          size="small"
                          sx={{ bgcolor: getScoreColor(m.overall_score), color: '#0f172a', fontWeight: 'bold' }}
                        />
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {m.match_tier.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>

                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                        {m.job_title}
                      </Typography>

                      <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
                        {m.company_name}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Selected Match Details Studio */}
          {selectedMatch && (
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                {/* Top Section: Score Gauge & Job Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                      {selectedMatch.job_title}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
                      {selectedMatch.company_name}
                    </Typography>
                  </Box>

                  {/* Circular Score Gauge */}
                  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress
                      variant="determinate"
                      value={selectedMatch.overall_score}
                      size={80}
                      thickness={5}
                      sx={{ color: getScoreColor(selectedMatch.overall_score) }}
                    />
                    <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', lineHeight: 1 }}>
                        {selectedMatch.overall_score}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                        MATCH
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3, borderColor: '#334155' }} />

                {/* Natural Language Match Explanation */}
                <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2, mb: 3 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#38bdf8', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon fontSize="small" /> Why You Match This Role
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f8fafc' }}>
                      {selectedMatch.explanation}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Skill Comparison Component */}
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f8fafc' }}>
                  Skill & Requirement Breakdown
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Matched Skills */}
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2.5, bgcolor: '#0f172a', border: '1px solid #10b981', borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#10b981', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon fontSize="small" /> Matched Skills ({selectedMatch.matched_skills.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedMatch.matched_skills.map((skill, idx) => (
                          <Chip key={idx} label={skill} size="small" sx={{ bgcolor: '#065f46', color: '#ecfdf5', fontWeight: 'bold' }} />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Missing Skills */}
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2.5, bgcolor: '#0f172a', border: '1px solid #f43f5e', borderRadius: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f43f5e', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CancelIcon fontSize="small" /> Skill Requirements Needed ({selectedMatch.missing_skills.length})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedMatch.missing_skills.map((skill, idx) => (
                          <Chip key={idx} label={skill} size="small" sx={{ bgcolor: '#881337', color: '#ffe4e6', fontWeight: 'bold' }} />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Multi-Factor Sub-Score Progress Bars */}
                {selectedMatch.breakdown && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f8fafc' }}>
                      8-Factor Score Breakdown
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Skills Match ({selectedMatch.breakdown.skills_score}%)</Typography>
                        <LinearProgress variant="determinate" value={selectedMatch.breakdown.skills_score} sx={{ mt: 0.5, height: 6, borderRadius: 3, bgcolor: '#0f172a', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />
                      </Grid>

                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Experience Seniority ({selectedMatch.breakdown.experience_score}%)</Typography>
                        <LinearProgress variant="determinate" value={selectedMatch.breakdown.experience_score} sx={{ mt: 0.5, height: 6, borderRadius: 3, bgcolor: '#0f172a', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                      </Grid>

                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Career Goals ({selectedMatch.breakdown.goals_score}%)</Typography>
                        <LinearProgress variant="determinate" value={selectedMatch.breakdown.goals_score} sx={{ mt: 0.5, height: 6, borderRadius: 3, bgcolor: '#0f172a', '& .MuiLinearProgress-bar': { bgcolor: '#a855f7' } }} />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Recommended Upskilling Actions */}
                {selectedMatch.recommended_actions?.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon sx={{ color: '#a855f7' }} /> Recommended Actions to Reach 98%+ Match
                    </Typography>

                    <Grid container spacing={2}>
                      {selectedMatch.recommended_actions.map((act, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Card sx={{ bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#38bdf8', mb: 0.5 }}>
                                {act.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1.5 }}>
                                {act.description}
                              </Typography>
                              <Button
                                variant="outlined"
                                size="small"
                                href={act.action_url}
                                endIcon={<OpenInNewIcon fontSize="small" />}
                                sx={{ color: '#38bdf8', borderColor: '#38bdf8', py: 0.2 }}
                              >
                                Enroll Course
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* ML Feedback Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #334155' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Is this match recommendation relevant to your career goals?
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Match Relevant">
                      <IconButton onClick={() => handleFeedback(selectedMatch.id, 'relevant')} sx={{ bgcolor: '#0f172a', color: '#10b981', border: '1px solid #10b981' }}>
                        <ThumbUpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Match Not Relevant">
                      <IconButton onClick={() => handleFeedback(selectedMatch.id, 'not_relevant')} sx={{ bgcolor: '#0f172a', color: '#f43f5e', border: '1px solid #f43f5e' }}>
                        <ThumbDownIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Button
                      variant="contained"
                      onClick={() => handleFeedback(selectedMatch.id, 'applied')}
                      sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', ml: 1 }}
                    >
                      1-Click Apply
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
