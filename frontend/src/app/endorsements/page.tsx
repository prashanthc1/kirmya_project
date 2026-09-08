'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  LinearProgress,
  Divider,
  Avatar,
  AvatarGroup,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ContactsIcon from '@mui/icons-material/Contacts';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { endorsementApi } from '../../features/endorsement/api';
import {
  SkillEndorsementGroup,
  ProfessionalRecommendation,
  ProfessionalReference,
} from '../../features/endorsement/types';

export default function EndorsementsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [endorsementGroups, setEndorsementGroups] = useState<SkillEndorsementGroup[]>([]);
  const [recommendations, setRecommendations] = useState<ProfessionalRecommendation[]>([]);
  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [abuseError, setAbuseError] = useState<string | null>(null);

  // Form states
  const [endorseSkillName, setEndorseSkillName] = useState('Go Microservices');
  const [targetUserId, setTargetUserId] = useState('c8d7e6f5-4a3b-2c1d-0e9f-8a7b6c5d4e3f');

  const [recContent, setRecContent] = useState(
    'Alex is an outstanding senior engineer who architected our core streaming API. Demonstrated exceptional Go concurrency and team mentorship.'
  );
  const [recRelationship, setRecRelationship] = useState('managed_directly');

  const [refName, setRefName] = useState('');
  const [refTitle, setRefTitle] = useState('');
  const [refCompany, setRefCompany] = useState('');
  const [refEmail, setRefEmail] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEnd, resRec, resRef] = await Promise.allSettled([
        endorsementApi.getUserEndorsements(),
        endorsementApi.getRecommendationsForUser(),
        endorsementApi.getUserReferences(),
      ]);

      // A failed load is a failed load. These three used to fall back to
      // endorsements and recommendations from people who do not exist, at
      // named employers, which is indistinguishable from real ones on screen.
      const failed: string[] = [];

      if (resEnd.status === 'fulfilled') {
        setEndorsementGroups(resEnd.value?.data ?? []);
      } else {
        setEndorsementGroups([]);
        failed.push('endorsements');
      }

      if (resRec.status === 'fulfilled') {
        setRecommendations(resRec.value?.data ?? []);
      } else {
        setRecommendations([]);
        failed.push('recommendations');
      }

      if (resRef.status === 'fulfilled') {
        setReferences(resRef.value?.data ?? []);
      } else {
        setReferences([]);
        failed.push('references');
      }

      setLoadError(failed.length > 0 ? `Could not load ${failed.join(', ')}. Try again shortly.` : null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEndorseSkill = async () => {
    setAbuseError(null);
    try {
      setLoading(true);
      // The endorser's name and title come from the signed-in account on the
      // server. They used to be sent from here as a fixed job title.
      await endorsementApi.endorseSkill({
        user_id: targetUserId,
        skill_name: endorseSkillName,
      });
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Endorsement failed due to abuse prevention rules.';
      setAbuseError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteRecommendation = async () => {
    setAbuseError(null);
    try {
      setLoading(true);
      await endorsementApi.submitRecommendation({
        recipient_id: targetUserId,
        relationship: recRelationship,
        content_text: recContent,
      });
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Submission failed due to abuse prevention rules.';
      setAbuseError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecStatus = async (id: string, status: 'accepted' | 'hidden' | 'flagged') => {
    try {
      setLoading(true);
      await endorsementApi.updateRecommendationStatus(id, { status, is_flagged: status === 'flagged' });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReference = async () => {
    try {
      setLoading(true);
      await endorsementApi.createReference({
        referee_name: refName,
        referee_title: refTitle,
        company_name: refCompany,
        referee_email: refEmail,
        relationship: 'former_manager',
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };




  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LinkedIn-Style Endorsements & Recommendations Studio
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Showcase peer skill endorsements, written recommendations, and verified professional references with built-in abuse prevention.
            </Typography>
          </Box>

          {/* Abuse Prevention Badge */}
          <Paper sx={{ p: 1.5, px: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: '#22c55e' }} />
            <Box>
              <Typography variant="caption" fontWeight="bold" sx={{ color: '#22c55e', display: 'block' }}>
                Abuse Protection Active
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Self-endorsement block • Consent approval • Duplicate filter
              </Typography>
            </Box>
          </Paper>
        </Box>

        {abuseError && (
          <Alert severity="error" sx={{ mb: 3, bgcolor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b' }}>
            {abuseError}
          </Alert>
        )}

        {loadError && (
          <Alert severity="warning" sx={{ mb: 3, bgcolor: '#78350f', color: '#fde68a', border: '1px solid #92400e' }}>
            {loadError}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<WorkspacePremiumIcon fontSize="small" />} iconPosition="start" label="Skill Endorsements" />
            <Tab icon={<FormatQuoteIcon fontSize="small" />} iconPosition="start" label="Written Recommendations" />
            <Tab icon={<ContactsIcon fontSize="small" />} iconPosition="start" label="Professional References" />
          </Tabs>
        </Paper>

        <Grid container spacing={3}>
          {/* Left Interaction Panel */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Endorse a Peer Candidate&apos;s Skill
                  </Typography>
                  <TextField
                    label="Candidate ID (Target Peer)"
                    fullWidth
                    size="small"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <TextField
                    label="Skill to Endorse"
                    fullWidth
                    size="small"
                    value={endorseSkillName}
                    onChange={(e) => setEndorseSkillName(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleEndorseSkill}
                    startIcon={<ThumbUpAltIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  >
                    Submit Skill Endorsement
                  </Button>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Write a Professional Recommendation
                  </Typography>
                  <TextField
                    label="Candidate ID (Recipient)"
                    fullWidth
                    size="small"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Select
                    value={recRelationship}
                    size="small"
                    fullWidth
                    onChange={(e) => setRecRelationship(e.target.value)}
                    sx={{ mb: 2, color: '#fff', bgcolor: '#0f172a', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
                  >
                    <MenuItem value="managed_directly">Managed candidate directly</MenuItem>
                    <MenuItem value="worked_same_team">Worked together on same engineering team</MenuItem>
                    <MenuItem value="client">Client / External Stakeholder</MenuItem>
                  </Select>
                  <TextField
                    label="Written Recommendation Content"
                    multiline
                    rows={4}
                    fullWidth
                    size="small"
                    value={recContent}
                    onChange={(e) => setRecContent(e.target.value)}
                    sx={{ mb: 2, textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleWriteRecommendation}
                    startIcon={<FormatQuoteIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  >
                    Submit Recommendation
                  </Button>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Add Professional Reference Contact
                  </Typography>
                  <TextField
                    label="Referee Name"
                    fullWidth
                    size="small"
                    value={refName}
                    onChange={(e) => setRefName(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <TextField
                    label="Title / Position"
                    fullWidth
                    size="small"
                    value={refTitle}
                    onChange={(e) => setRefTitle(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <TextField
                    label="Company Name"
                    fullWidth
                    size="small"
                    value={refCompany}
                    onChange={(e) => setRefCompany(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <TextField
                    label="Referee Email"
                    fullWidth
                    size="small"
                    value={refEmail}
                    onChange={(e) => setRefEmail(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCreateReference}
                    startIcon={<ContactsIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  >
                    Add Reference
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Feed Panel */}
          <Grid item xs={12} md={7}>
            {activeTab === 0 && (
              <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', minHeight: 400 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                  Candidate Endorsed Skills ({endorsementGroups.length})
                </Typography>
                <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                <Grid container spacing={2}>
                  {endorsementGroups.map((group, idx) => (
                    <Grid item xs={12} key={idx}>
                      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                                {group.skill_name}
                              </Typography>
                              <Chip label={`${group.endorsement_count} Endorsements`} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              Endorsed by {group.endorsers.map((e) => e.endorser_name).join(', ')}
                            </Typography>
                          </Box>

                          <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem' } }}>
                            {group.endorsers.map((e) => (
                              <Avatar key={e.id} alt={e.endorser_name} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                                {e.endorser_name.charAt(0)}
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {activeTab === 1 && (
              <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', minHeight: 400 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                  Written Recommendations ({recommendations.length})
                </Typography>
                <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                <Grid container spacing={2}>
                  {recommendations.map((rec) => (
                    <Grid item xs={12} key={rec.id}>
                      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ bgcolor: '#a855f7', color: '#fff', fontWeight: 'bold' }}>
                                {rec.author_name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                                  {rec.author_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  {rec.author_title} • {rec.relationship.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </Box>

                            <Chip
                              label={rec.status.toUpperCase()}
                              size="small"
                              sx={{ bgcolor: rec.status === 'accepted' ? '#22c55e' : '#f59e0b', color: '#fff', fontWeight: 'bold' }}
                            />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#cbd5e1', my: 2, fontStyle: 'italic', lineHeight: 1.6 }}>
                            &quot;{rec.content_text}&quot;
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {rec.status === 'pending_approval' && (
                              <Button size="small" variant="contained" onClick={() => handleUpdateRecStatus(rec.id, 'accepted')} startIcon={<CheckCircleIcon />} sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold' }}>
                                Accept Recommendation
                              </Button>
                            )}
                            <Button size="small" variant="outlined" onClick={() => handleUpdateRecStatus(rec.id, 'hidden')} startIcon={<VisibilityOffIcon />} sx={{ color: '#94a3b8', borderColor: '#334155' }}>
                              Hide
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => handleUpdateRecStatus(rec.id, 'flagged')} startIcon={<FlagIcon />} sx={{ color: '#ef4444', borderColor: '#991b1b' }}>
                              Report Abuse
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {activeTab === 2 && (
              <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', minHeight: 400 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                  Verified Professional References ({references.length})
                </Typography>
                <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                <Grid container spacing={2}>
                  {references.map((ref) => (
                    <Grid item xs={12} key={ref.id}>
                      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                              {ref.referee_name} ({ref.referee_title})
                            </Typography>
                            <Chip label={ref.status.toUpperCase()} size="small" sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#38bdf8' }}>Company: {ref.company_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Email: {ref.referee_email}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
