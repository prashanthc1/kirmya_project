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
  Tabs,
  Tab,
  LinearProgress,
  Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EqualizerIcon from '@mui/icons-material/Equalizer';

import { intelligenceApi } from '../../../features/workforce_intelligence/api';
import {
  CareerRecommendation,
  HiringStatistic,
  MarketInsight,
  SkillTrend,
} from '../../../features/workforce_intelligence/types';

export default function WorkforceIntelligencePage() {
  const [tabValue, setTabValue] = useState<number>(0);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [skillTrends, setSkillTrends] = useState<SkillTrend[]>([]);
  const [hiringStats, setHiringStats] = useState<HiringStatistic[]>([]);
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes, hRes, rRes] = await Promise.all([
        intelligenceApi.getMarketInsights(),
        intelligenceApi.getSkillTrends(),
        intelligenceApi.getHiringStatistics(),
        intelligenceApi.getUserRecommendations(),
      ]);
      setMarketInsights(mRes.data || []);
      setSkillTrends(sRes.data || []);
      setHiringStats(hRes.data || []);
      setRecommendations(rRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#38bdf8', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <TrendingUpIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Workforce Intelligence Platform
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Real-time employment market trends, skill demand curves, AI salary forecasting, & talent availability
              </Typography>
            </Box>
          </Box>

          <Chip icon={<AutoAwesomeIcon />} label="AI FORECASTING ENGINE ACTIVE" color="primary" sx={{ fontWeight: 'bold' }} />
        </Box>

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={(_, val) => setTabValue(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" label="Trending Skills & AI Demand Curves" />
            <Tab icon={<EqualizerIcon fontSize="small" />} iconPosition="start" label="Macro Market Growth & Salary Analytics" />
            <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Recruiter Talent Availability" />
            <Tab icon={<PsychologyIcon fontSize="small" />} iconPosition="start" label="AI Candidate Recommendations" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Tab 0: Trending Skills */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {skillTrends.map((sk) => (
              <Grid item xs={12} md={6} key={sk.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip label={sk.category.toUpperCase()} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', fontWeight: 'bold' }} />
                      <Chip label={`SURGING +${sk.growth_yoy_pct}% YoY`} color="success" size="small" sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                      {sk.skill_name}
                    </Typography>

                    <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, mb: 2, border: '1px solid #334155' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Market Demand Index Score:</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#38bdf8' }}>{sk.demand_score} / 100</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={sk.demand_score} sx={{ borderRadius: 1, bgcolor: '#334155', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoneyIcon sx={{ color: '#10b981' }} />
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#10b981' }}>
                        Salary Premium: +{sk.avg_salary_premium_pct}% above baseline
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Macro Market Growth */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {marketInsights.map((mk) => (
              <Grid item xs={12} md={4} key={mk.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Chip label={mk.region} size="small" sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', mb: 1.5 }} />

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 2 }}>
                      {mk.industry}
                    </Typography>

                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#10b981', mb: 0.5 }}>
                      +{mk.growth_rate_pct}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2 }}>
                      Year-over-Year Industry Growth ({mk.time_period})
                    </Typography>

                    <Divider sx={{ borderColor: '#334155', my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>Avg Annual Salary:</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#fff' }}>${mk.avg_salary_usd.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>Active Job Postings:</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#38bdf8' }}>{mk.active_job_postings.toLocaleString()}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 2: Recruiter Talent Availability */}
        {tabValue === 2 && (
          <Grid container spacing={3}>
            {hiringStats.map((st) => (
              <Grid item xs={12} md={6} key={st.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                        {st.role_title}
                      </Typography>
                      <Chip label={`COMPETITION: ${st.competition_level.toUpperCase()}`} color="warning" size="small" sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 'bold', mb: 2 }}>
                      Target Region: {st.region}
                    </Typography>

                    <Grid container spacing= {2}>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, border: '1px solid #334155' }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Available Candidate Pool:</Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>{st.talent_availability_count.toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, border: '1px solid #334155' }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Avg Time-to-Hire:</Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: '#38bdf8' }}>{st.avg_days_to_hire} Days</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 3: AI Candidate Recommendations */}
        {tabValue === 3 && (
          <Grid container spacing={3}>
            {recommendations.map((rec, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #a855f7', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip icon={<AutoAwesomeIcon />} label="HIGH-VALUE SKILL UPGRADE" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#10b981' }}>{rec.salary_bump_est}</Typography>
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                      {rec.recommended_skill}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, lineHeight: 1.6 }}>
                      {rec.reason}
                    </Typography>

                    <Chip label={`AI Confidence: ${Math.round(rec.match_confidence * 100)}%`} size="small" sx={{ bgcolor: '#0f172a', color: '#a855f7', border: '1px solid #a855f7', fontWeight: 'bold' }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
