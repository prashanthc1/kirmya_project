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
    <Box sx={{ bgcolor: "background.default", minHeight: '100dvh', color: "text.primary", py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: "primary.main", p: 1.5, borderRadius: 2, color: "primary.contrastText", display: 'flex' }}>
              <TrendingUpIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ bgcolor: "transparent", WebkitBackgroundClip: 'text', WebkitTextFillColor: "currentColor" }}>
                Kirmya Workforce Intelligence Platform
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Real-time employment market trends, skill demand curves, AI salary forecasting, & talent availability
              </Typography>
            </Box>
          </Box>

          <Chip icon={<AutoAwesomeIcon />} label="AI FORECASTING ENGINE ACTIVE" color="primary" sx={{ fontWeight: 'bold' }} />
        </Box>

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={(_, val) => setTabValue(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: "primary.main" },
              '& .MuiTab-root': { color: "text.secondary", fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: "primary.main" },
            }}
          >
            <Tab icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" label="Trending Skills & AI Demand Curves" />
            <Tab icon={<EqualizerIcon fontSize="small" />} iconPosition="start" label="Macro Market Growth & Salary Analytics" />
            <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Recruiter Talent Availability" />
            <Tab icon={<PsychologyIcon fontSize="small" />} iconPosition="start" label="AI Candidate Recommendations" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: "background.paper", '& .MuiLinearProgress-bar': { bgcolor: "primary.main" } }} />}

        {/* Tab 0: Trending Skills */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {skillTrends.map((sk) => (
              <Grid item xs={12} md={6} key={sk.id}>
                <Card sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip label={sk.category.toUpperCase()} size="small" sx={{ bgcolor: "background.default", color: "primary.main", fontWeight: 'bold' }} />
                      <Chip label={`SURGING +${sk.growth_yoy_pct}% YoY`} color="success" size="small" sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 1 }}>
                      {sk.skill_name}
                    </Typography>

                    <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 2, mb: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>Market Demand Index Score:</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: "primary.main" }}>{sk.demand_score} / 100</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={sk.demand_score} sx={{ borderRadius: 1, bgcolor: "action.hover", '& .MuiLinearProgress-bar': { bgcolor: "primary.main" } }} />
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
                <Card sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Chip label={mk.region} size="small" sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', mb: 1.5 }} />

                    <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 2 }}>
                      {mk.industry}
                    </Typography>

                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#10b981', mb: 0.5 }}>
                      +{mk.growth_rate_pct}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: 'block', mb: 2 }}>
                      Year-over-Year Industry Growth ({mk.time_period})
                    </Typography>

                    <Divider sx={{ borderColor: "divider", my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>Avg Annual Salary:</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: "text.primary" }}>${mk.avg_salary_usd.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>Active Job Postings:</Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: "primary.main" }}>{mk.active_job_postings.toLocaleString()}</Typography>
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
                <Card sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary" }}>
                        {st.role_title}
                      </Typography>
                      <Chip label={`COMPETITION: ${st.competition_level.toUpperCase()}`} color="warning" size="small" sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 'bold', mb: 2 }}>
                      Target Region: {st.region}
                    </Typography>

                    <Grid container spacing= {2}>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>Available Candidate Pool:</Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>{st.talent_availability_count.toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ bgcolor: "background.default", p: 2, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>Avg Time-to-Hire:</Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: "primary.main" }}>{st.avg_days_to_hire} Days</Typography>
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
                <Card sx={{ bgcolor: "background.paper", border: '1px solid #a855f7', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip icon={<AutoAwesomeIcon />} label="HIGH-VALUE SKILL UPGRADE" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#10b981' }}>{rec.salary_bump_est}</Typography>
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 1 }}>
                      {rec.recommended_skill}
                    </Typography>

                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, lineHeight: 1.6 }}>
                      {rec.reason}
                    </Typography>

                    <Chip label={`AI Confidence: ${Math.round(rec.match_confidence * 100)}%`} size="small" sx={{ bgcolor: "background.default", color: "primary.main", border: '1px solid #a855f7', fontWeight: 'bold' }} />
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
