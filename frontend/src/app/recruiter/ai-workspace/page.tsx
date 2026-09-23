'use client';

import React, { useState, useEffect } from 'react';
import { surfaceTransition } from '../../../theme/motion';
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
  TextField,
  LinearProgress,
  CircularProgress,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsycholologyIcon from '@mui/icons-material/Psychology';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import DescriptionIcon from '@mui/icons-material/Description';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SecurityIcon from '@mui/icons-material/Security';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { recruiterAIApi } from '../../../features/recruiter_ai/api';
import {
  AICandidateScore,
  AIGeneratedContent,
} from '../../../features/recruiter_ai/types';

export default function RecruiterAIWorkspacePage() {
  const [activeTab, setActiveTab] = useState<'ranking' | 'questions' | 'jd' | 'outreach'>('ranking');
  const [scores, setScores] = useState<AICandidateScore[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AICandidateScore | null>(null);

  const [rawJD, setRawJD] = useState(`We are looking for a Senior Go Engineer to build backend microservices.`);
  const [optimizedJD, setOptimizedJD] = useState<AIGeneratedContent | null>(null);

  const [generatedQuestions, setGeneratedQuestions] = useState<AIGeneratedContent | null>(null);
  const [outreachEmail, setOutreachEmail] = useState<AIGeneratedContent | null>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const mockJobID = 'j1111111-1111-1111-1111-111111111111';

  useEffect(() => {
    handleRankCandidates();
  }, []);

  const handleRankCandidates = async () => {
    try {
      setLoading(true);
      const res = await recruiterAIApi.rankCandidates(mockJobID);
      setScores(res.candidate_scores || []);
      if (res.candidate_scores && res.candidate_scores.length > 0) {
        setSelectedCandidate(res.candidate_scores[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!selectedCandidate) return;
    try {
      setLoading(true);
      const res = await recruiterAIApi.generateInterviewQuestions(selectedCandidate.candidate_id, mockJobID);
      setGeneratedQuestions(res.content);
      setActiveTab('questions');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeJD = async () => {
    try {
      setLoading(true);
      const res = await recruiterAIApi.optimizeJobDescription(rawJD, mockJobID);
      setOptimizedJD(res.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftOutreach = async () => {
    if (!selectedCandidate) return;
    try {
      setLoading(true);
      const res = await recruiterAIApi.draftOutreachEmail(selectedCandidate.candidate_id, mockJobID);
      setOutreachEmail(res.content);
      setActiveTab('outreach');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: '100dvh', color: "text.primary", py: 4 }}>
      <Container maxWidth="xl">
        {/* Header Bar & Enterprise RBAC Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 48, height: 48 }}>
              <AutoAwesomeIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ bgcolor: "transparent", WebkitBackgroundClip: 'text', WebkitTextFillColor: "currentColor" }}>
                Recruiter AI Workspace
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Enterprise AI candidate ranking, resume parsing, interview question generation, JD optimization & outreach
              </Typography>
            </Box>
          </Box>

          <Paper sx={{ p: 1.5, px: 2, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: '#10b981' }} />
            <Box>
              <Typography variant="caption" fontWeight="bold" sx={{ color: '#10b981', display: 'block' }}>
                RBAC Access: Granted
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Role: Recruiter / Org Admin
              </Typography>
            </Box>
          </Paper>
        </Box>

        {toast && (
          <Alert severity="info" sx={{ mb: 3, bgcolor: "background.paper", color: "primary.main", border: '1px solid #38bdf8' }}>
            {toast}
          </Alert>
        )}

        {/* Studio Tabs */}
        <Paper sx={{ mb: 3, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="secondary"
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: "primary.main" },
              '& .MuiTab-root': { color: "text.secondary", fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: "primary.main" },
            }}
          >
            <Tab icon={<PsycholologyIcon fontSize="small" />} iconPosition="start" label="Candidate Leaderboard" value="ranking" />
            <Tab icon={<QuestionAnswerIcon fontSize="small" />} iconPosition="start" label="Interview Questions" value="questions" />
            <Tab icon={<DescriptionIcon fontSize="small" />} iconPosition="start" label="JD Optimizer" value="jd" />
            <Tab icon={<EmailIcon fontSize="small" />} iconPosition="start" label="Outreach Drafter" value="outreach" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: "background.paper", '& .MuiLinearProgress-bar': { bgcolor: "primary.main" } }} />}

        {/* TAB 1: AI CANDIDATE RANKING LEADERBOARD */}
        {activeTab === 'ranking' && (
          <Grid container spacing={3}>
            {/* Candidate List */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
                  Ranked Candidates ({scores.length})
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scores.map((cand) => (
                    <Card
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      sx={{
                        bgcolor: selectedCandidate?.id === cand.id ? "background.default" : "background.paper",
                        border: `1px solid ${selectedCandidate?.id === cand.id ? '#a855f7' : '#334155'}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: surfaceTransition(0.2),
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Chip label={`#${cand.rank_position} RANK`} size="small" sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }} />
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#10b981' }}>
                            {cand.fit_score}% FIT SCORE
                          </Typography>
                        </Box>

                        <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary" }}>
                          {cand.candidate_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {cand.job_title}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Candidate AI Rationale & Resume Analysis */}
            {selectedCandidate && (
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 4, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: "text.primary" }}>
                        {selectedCandidate.candidate_name}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: "primary.main" }}>
                        Applied for: {selectedCandidate.job_title}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button variant="outlined" onClick={handleGenerateQuestions} sx={{ color: "primary.main", borderColor: "primary.main", fontWeight: 'bold' }}>
                        Generate Questions
                      </Button>
                      <Button variant="contained" onClick={handleDraftOutreach} sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }}>
                        Draft Email
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3, borderColor: "divider" }} />

                  {/* AI Match Rationale Card */}
                  <Card sx={{ bgcolor: "background.default", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "primary.main", mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon fontSize="small" /> AI Match Rationale
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.primary" }}>
                        {selectedCandidate.match_rationale}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Strengths vs. Red Flags Breakdown */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2.5, bgcolor: "background.default", border: '1px solid #10b981', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#10b981', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon fontSize="small" /> Highlighted Strengths
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {selectedCandidate.strengths.map((str, idx) => (
                            <Typography key={idx} variant="caption" sx={{ color: "text.primary" }}>
                              • {str}
                            </Typography>
                          ))}
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Paper sx={{ p: 2.5, bgcolor: "background.default", border: '1px solid #f59e0b', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f59e0b', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningAmberIcon fontSize="small" /> Considerations & Gaps
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {selectedCandidate.red_flags.map((rf, idx) => (
                            <Typography key={idx} variant="caption" sx={{ color: "text.primary" }}>
                              • {rf}
                            </Typography>
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* TAB 2: INTERVIEW QUESTION GENERATOR */}
        {activeTab === 'questions' && (
          <Paper sx={{ p: 4, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: "primary.main" }}>
                  AI Tailored Interview Questions
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Targeted questions generated specifically for {selectedCandidate?.candidate_name || 'selected candidate'}
                </Typography>
              </Box>

              <Button variant="contained" onClick={handleGenerateQuestions} sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }}>
                Regenerate Questions
              </Button>
            </Box>

            <Paper sx={{ p: 3, bgcolor: "background.default", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: "text.primary", fontFamily: 'monospace' }}>
                {generatedQuestions?.generated_text || 'Click "Generate Questions" to create candidate-specific technical & behavioral interview prompts.'}
              </Typography>
            </Paper>
          </Paper>
        )}

        {/* TAB 3: JOB DESCRIPTION OPTIMIZER */}
        {activeTab === 'jd' && (
          <Paper sx={{ p: 4, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: "primary.main", mb: 1 }}>
              Job Description Optimization Studio
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              Optimize your JD for 24% higher candidate engagement, inclusive language, and clear technical expectations.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: "text.secondary" }}>
                  Original Job Description Draft:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={rawJD}
                  onChange={(e) => setRawJD(e.target.value)}
                  sx={{ input: { color: "text.primary" }, mb: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: "divider" } }}
                />
                <Button variant="contained" onClick={handleOptimizeJD} sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }}>
                  Optimize JD with AI
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#10b981' }}>
                  AI Optimized Job Description:
                </Typography>
                <Paper sx={{ p: 2.5, bgcolor: "background.default", border: '1px solid #10b981', borderRadius: 2, minHeight: 250 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: "text.primary" }}>
                    {optimizedJD?.generated_text || 'Click "Optimize JD with AI" to generate an optimized description.'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 4: CANDIDATE OUTREACH EMAIL DRAFTER */}
        {activeTab === 'outreach' && (
          <Paper sx={{ p: 4, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>
                  Candidate Outreach Email Assistant
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Personalized candidate email draft for {selectedCandidate?.candidate_name || 'selected candidate'}
                </Typography>
              </Box>

              <Button variant="contained" onClick={handleDraftOutreach} sx={{ bgcolor: '#10b981', color: "success.contrastText", fontWeight: 'bold' }}>
                Redraft Email
              </Button>
            </Box>

            <Paper sx={{ p: 3, bgcolor: "background.default", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 2 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: "text.primary" }}>
                {outreachEmail?.generated_text || 'Click "Draft Email" to create a personalized recruitment message.'}
              </Typography>
            </Paper>

            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                if (outreachEmail?.generated_text) {
                  navigator.clipboard.writeText(outreachEmail.generated_text);
                  setToast('Email copied to clipboard!');
                  setTimeout(() => setToast(null), 3000);
                }
              }}
              sx={{ color: "primary.main", borderColor: "primary.main", fontWeight: 'bold' }}
            >
              Copy to Clipboard
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
