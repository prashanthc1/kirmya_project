'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Paper,
  IconButton,
  Divider,
  Stack,
  Rating,
  useTheme,
  Switch,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import ChatIcon from '@mui/icons-material/Chat';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';

import { landingApi } from '../features/landing/api';
import { LandingContentResponse } from '../features/landing/types';

export default function KirmyaLandingPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [content, setContent] = useState<LandingContentResponse | null>(null);

  useEffect(() => {
    landingApi.getLandingContent().then((res) => setContent(res));
  }, []);

  const themeBg = darkMode ? '#070a12' : '#f8fafc';
  const themeCardBg = darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)';
  const themeTextPrimary = darkMode ? '#f8fafc' : '#0f172a';
  const themeTextSecondary = darkMode ? '#94a3b8' : '#475569';
  const themeBorder = darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)';

  return (
    <Box sx={{ bgcolor: themeBg, color: themeTextPrimary, minHeight: '100vh', transition: 'all 0.3s ease' }}>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Kirmya',
            url: 'https://kirmya.com',
            description:
              'A free professional network helping people find jobs, build connections, improve skills, and recover careers faster.',
          }),
        }}
      />

      {/* Navigation Bar */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(16px)',
          bgcolor: darkMode ? 'rgba(7, 10, 18, 0.8)' : 'rgba(248, 250, 252, 0.8)',
          borderBottom: `1px solid ${themeBorder}`,
          py: 2,
        }}
      >
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 20,
              }}
            >
              K
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ letterSpacing: -0.5 }}>
              Kirmya<Box component="span" sx={{ color: '#0284c7' }}>.com</Box>
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            <Button href="#features" sx={{ color: themeTextSecondary, fontWeight: 500, textTransform: 'none' }}>Features</Button>
            <Button href="#how-it-works" sx={{ color: themeTextSecondary, fontWeight: 500, textTransform: 'none' }}>How it Works</Button>
            <Button href="#ai-assistant" sx={{ color: themeTextSecondary, fontWeight: 500, textTransform: 'none' }}>AI Assistant</Button>
            <Button href="#jobs" sx={{ color: themeTextSecondary, fontWeight: 500, textTransform: 'none' }}>Jobs</Button>
            <Button href="#pricing" sx={{ color: themeTextSecondary, fontWeight: 500, textTransform: 'none' }}>Free Pricing</Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={() => setDarkMode(!darkMode)} sx={{ color: themeTextSecondary }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            <Button
              variant="outlined"
              href="/app/jobs"
              sx={{
                borderColor: '#0284c7',
                color: '#0284c7',
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                px: 2.5,
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              href="/app/jobs"
              sx={{
                background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                color: '#fff',
                borderRadius: 2,
                fontWeight: 'bold',
                textTransform: 'none',
                px: 3,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              }}
            >
              Join Free
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 1. HERO SECTION */}
      <Box sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 10, md: 14 }, position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<AutoAwesomeIcon sx={{ color: '#0284c7 !important' }} />}
                label="AI-POWERED CAREER RECOVERY & NETWORKING"
                sx={{
                  bgcolor: darkMode ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  fontWeight: 'bold',
                  mb: 3,
                  py: 0.5,
                }}
              />

              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.75rem' },
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  mb: 2.5,
                  background: darkMode
                    ? 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)'
                    : 'linear-gradient(180deg, #0F172A 0%, #334155 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Your Career Recovery Starts Here
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: themeTextSecondary,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: 600,
                }}
              >
                A free professional network helping people find jobs, build connections, improve skills, and grow their careers through AI guidance.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 6 }}>
                <Button
                  variant="contained"
                  size="large"
                  href="/app/jobs"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                    color: '#fff',
                    px: 4,
                    py: 1.8,
                    borderRadius: 2.5,
                    fontSize: '1.05rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
                  }}
                >
                  Find Opportunities
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  href="/app/jobs"
                  sx={{
                    borderColor: themeBorder,
                    color: themeTextPrimary,
                    px: 4,
                    py: 1.8,
                    borderRadius: 2.5,
                    fontSize: '1.05rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Build Your Profile
                </Button>
              </Stack>

              {/* Statistics Strip */}
              <Grid container spacing={3} sx={{ pt: 2, borderTop: `1px solid ${themeBorder}` }}>
                {content?.statistics.map((stat) => (
                  <Grid item xs={6} sm={3} key={stat.id}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#0284c7' }}>
                      {stat.stat_value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeTextSecondary, fontWeight: 500 }}>
                      {stat.stat_label}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Hero Interactive Glass Card Preview */}
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 4,
                  bgcolor: themeCardBg,
                  border: `1px solid ${themeBorder}`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: darkMode ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(0,0,0,0.08)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#0284c7', width: 44, height: 44 }}>AI</Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">Kirmya Career Assistant</Typography>
                      <Typography variant="caption" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} /> Active Match Engine
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="92% Match" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                </Box>

                {/* Simulated Job Opportunity Card */}
                <Box sx={{ bgcolor: darkMode ? '#0f172a' : '#f1f5f9', p: 2.5, borderRadius: 3, mb: 2.5, border: `1px solid ${themeBorder}` }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#0284c7' }}>FEATURED MATCH</Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>Facilities Coordinator</Typography>
                  <Typography variant="body2" sx={{ color: themeTextSecondary, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon fontSize="small" /> Dubai, UAE • Emaar Properties
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label="Facilities" size="small" sx={{ bgcolor: themeBorder, fontSize: 11 }} />
                    <Chip label="Vendor Ops" size="small" sx={{ bgcolor: themeBorder, fontSize: 11 }} />
                  </Stack>
                </Box>

                <Typography variant="caption" sx={{ color: themeTextSecondary, display: 'block', textAlign: 'center' }}>
                  ⚡ Real-time AI Skill Gap & Career Recommendation Preview
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 2. PROBLEM SECTION (BEFORE VS AFTER) */}
      <Box sx={{ py: 10, bgcolor: darkMode ? '#0b0f19' : '#f1f5f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0284c7', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Rebuilding Career Confidence
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, mb: 2 }}>
              From Job Loss to Professional Growth
            </Typography>
            <Typography variant="body1" sx={{ color: themeTextSecondary, maxWidth: 700, mx: 'auto' }}>
              We understand the anxiety of career transitions. Kirmya replaces isolation with a powerful network and AI guidance.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4, borderRadius: 3.5, bgcolor: darkMode ? 'rgba(239, 68, 68, 0.05)' : '#fff', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#ef4444', mb: 3 }}>
                  ❌ Before Kirmya
                </Typography>
                <Stack spacing={2}>
                  {['Lost professional connections after layoff', 'Difficult, unguided job search on generic boards', 'Zero feedback on resume & interview performance', 'Unclear skill gaps holding back career progression'].map((point, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography color="error" fontWeight="bold">•</Typography>
                      <Typography variant="body1" sx={{ color: themeTextSecondary }}>{point}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4, borderRadius: 3.5, bgcolor: darkMode ? 'rgba(16, 185, 129, 0.05)' : '#fff', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981', mb: 3 }}>
                  ✅ After Kirmya
                </Typography>
                <Stack spacing={2}>
                  {['Vibrant professional network & peer referrals', 'Curated job marketplace with AI match percentages', 'Personalized AI Career Assistant & Resume Coach', 'Targeted skill recommendations for higher salary offers'].map((point, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ color: '#10b981' }} />
                      <Typography variant="body1" fontWeight={500}>{point}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. HOW KIRMYA WORKS (4-STEP JOURNEY) */}
      <Box id="how-it-works" sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0284c7', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Simple 4-Step Process
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
              How Kirmya Accelerates Your Recovery
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { step: '01', title: 'Create Professional Profile', desc: 'Build your career identity highlighting verified skills and career goals.', icon: <DescriptionIcon /> },
              { step: '02', title: 'Connect with Professionals', desc: 'Join industry guilds and build meaningful referral connections.', icon: <PeopleIcon /> },
              { step: '03', title: 'Discover Opportunities', desc: 'Get matched with relevant local and remote jobs with 90%+ match score.', icon: <SearchIcon /> },
              { step: '04', title: 'Grow Your Career', desc: 'Receive AI career path guidance and skill recommendations.', icon: <SchoolIcon /> },
            ].map((st, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper
                  sx={{
                    p: 3.5,
                    borderRadius: 3.5,
                    bgcolor: themeCardBg,
                    border: `1px solid ${themeBorder}`,
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <Typography variant="h3" fontWeight={800} sx={{ color: 'rgba(2, 132, 199, 0.2)', mb: 2 }}>
                    {st.step}
                  </Typography>
                  <Box sx={{ color: '#0284c7', mb: 1.5 }}>{st.icon}</Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>{st.title}</Typography>
                  <Typography variant="body2" sx={{ color: themeTextSecondary, lineHeight: 1.6 }}>{st.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 4. CORE FEATURES SECTION */}
      <Box id="features" sx={{ py: 12, bgcolor: darkMode ? '#0b0f19' : '#f1f5f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0284c7', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Platform Capabilities
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
              Everything You Need to Succeed
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              { title: 'Professional Profile', desc: 'Build your career identity with verified credentials.', icon: <DescriptionIcon /> },
              { title: 'Job Marketplace', desc: 'Discover multi-country and remote opportunities.', icon: <WorkIcon /> },
              { title: 'Networking', desc: 'Connect with industry peers and hiring managers.', icon: <PeopleIcon /> },
              { title: 'Communities', desc: 'Join career guilds like Facilities, Tech, Marketing.', icon: <GroupsIcon /> },
              { title: 'AI Career Assistant', desc: '24/7 personalized coaching & interview prep.', icon: <AutoAwesomeIcon /> },
              { title: 'Resume Tools', desc: 'Optimize your CV for modern ATS filters.', icon: <DescriptionIcon /> },
              { title: 'Skill Learning', desc: 'Identify high-demand skills to increase salary.', icon: <SchoolIcon /> },
              { title: 'Messaging', desc: 'Direct, secure professional communication.', icon: <ChatIcon /> },
            ].map((f, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card sx={{ p: 3, borderRadius: 3, bgcolor: themeCardBg, border: `1px solid ${themeBorder}`, height: '100%' }}>
                  <Box sx={{ color: '#0284c7', mb: 1.5 }}>{f.icon}</Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>{f.title}</Typography>
                  <Typography variant="body2" sx={{ color: themeTextSecondary }}>{f.desc}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. AI CAREER ASSISTANT SHOWCASE */}
      <Box id="ai-assistant" sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip label="NEXT-GEN AI ASSISTANT" color="secondary" sx={{ fontWeight: 'bold', mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" sx={{ mb: 3 }}>
                Your Personal AI Career Coach
              </Typography>
              <Typography variant="body1" sx={{ color: themeTextSecondary, mb: 4, lineHeight: 1.7 }}>
                Kirmya AI analyzes your experience, identifies skill gaps, rewrites resume sections for ATS compliance, and matches you with roles where you have a competitive edge.
              </Typography>

              <Stack spacing={2}>
                {[
                  'Resume & CV Optimization for ATS systems',
                  'Simulated Mock Interview Practice & Feedback',
                  'Skill Gap Analysis & Course Recommendations',
                  'Personalized Career Growth Trajectories',
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleOutlineIcon sx={{ color: '#a855f7' }} />
                    <Typography fontWeight={500}>{item}</Typography>
                  </Box>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3.5, borderRadius: 4, bgcolor: themeCardBg, border: '1px solid #a855f7', boxShadow: '0 10px 40px rgba(168, 85, 247, 0.15)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pb: 2, borderBottom: `1px solid ${themeBorder}` }}>
                  <Avatar sx={{ bgcolor: '#a855f7' }}>AI</Avatar>
                  <Box>
                    <Typography fontWeight="bold">Kirmya Career Coach</Typography>
                    <Typography variant="caption" sx={{ color: '#a855f7' }}>Online • Ready to assist</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ bgcolor: darkMode ? '#0f172a' : '#f1f5f9', p: 2, borderRadius: 2, maxWidth: '85%' }}>
                    <Typography variant="body2">
                      Hello! I noticed your profile matches 92% of the **Facilities Coordinator** role at Emaar Properties. Would you like me to optimize your resume bullets?
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: '#0284c7', color: '#fff', p: 2, borderRadius: 2, maxWidth: '85%', alignSelf: 'flex-end' }}>
                    <Typography variant="body2">
                      Yes please! Show me how to highlight vendor management.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 6. JOB SEARCH SHOWCASE */}
      <Box id="jobs" sx={{ py: 12, bgcolor: darkMode ? '#0b0f19' : '#f1f5f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#0284c7', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Smart Job Marketplace
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
              Targeted Opportunities with AI Match Ratings
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {content?.featured_jobs.map((j) => (
              <Grid item xs={12} md={4} key={j.id}>
                <Card sx={{ p: 3, borderRadius: 3, bgcolor: themeCardBg, border: `1px solid ${themeBorder}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip label={`${j.match_percentage}% MATCH`} color="success" size="small" sx={{ fontWeight: 'bold' }} />
                    <Typography variant="caption" sx={{ color: themeTextSecondary }}>Verified Posting</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>{j.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#0284c7', fontWeight: 'bold', mb: 1 }}>{j.company}</Typography>
                  <Typography variant="caption" sx={{ color: themeTextSecondary, display: 'block', mb: 2 }}>
                    <LocationOnIcon fontSize="inherit" /> {j.location} • {j.salary_range}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {j.tags.map((t, i) => (
                      <Chip key={i} label={t} size="small" sx={{ fontSize: 11 }} />
                    ))}
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 7. NETWORKING SECTION */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" fontWeight="bold" sx={{ mb: 3 }}>
                Your Next Opportunity Comes Through Your Network
              </Typography>
              <Typography variant="body1" sx={{ color: themeTextSecondary, mb: 4, lineHeight: 1.7 }}>
                Over 70% of jobs are filled through professional connections. Kirmya helps you build authentic relationships, ask for referrals, and engage with industry peers.
              </Typography>
              <Button variant="contained" size="large" href="/app/jobs" sx={{ bgcolor: '#0284c7', color: '#fff', borderRadius: 2, fontWeight: 'bold' }}>
                Build Your Network
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 4, bgcolor: themeCardBg, border: `1px solid ${themeBorder}` }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Featured Professional Connections</Typography>
                <Stack spacing={2}>
                  {[
                    { name: 'Sarah Chen', role: 'Staff Engineer @ Stripe', mutual: '14 Mutual Connections' },
                    { name: 'Tariq Al-Mansoor', role: 'Facilities Manager @ Emaar', mutual: '8 Mutual Connections' },
                  ].map((p, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: darkMode ? '#0f172a' : '#f1f5f9', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#0284c7' }}>{p.name[0]}</Avatar>
                        <Box>
                          <Typography fontWeight="bold" variant="subtitle2">{p.name}</Typography>
                          <Typography variant="caption" sx={{ color: themeTextSecondary, display: 'block' }}>{p.role}</Typography>
                        </Box>
                      </Box>
                      <Button size="small" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>Connect</Button>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 8. COMMUNITY GUILDS */}
      <Box sx={{ py: 10, bgcolor: darkMode ? '#0b0f19' : '#f1f5f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" fontWeight="bold">Join Career Communities</Typography>
            <Typography variant="body1" sx={{ color: themeTextSecondary, mt: 1 }}>Engage in active industry guilds for peer support and referrals.</Typography>
          </Box>
          <Grid container spacing={3}>
            {['Facilities Management Professionals', 'Software Engineers & Cloud Architects', 'Marketing & Brand Strategy Guild', 'Fresh Graduates & Early Career Network'].map((c, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ p: 3, borderRadius: 3, bgcolor: themeCardBg, border: `1px solid ${themeBorder}`, textAlign: 'center' }}>
                  <GroupsIcon sx={{ fontSize: 40, color: '#0284c7', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">{c}</Typography>
                  <Typography variant="caption" sx={{ color: themeTextSecondary, display: 'block', mt: 1 }}>Active Discussions & Referrals</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 9. SUCCESS STORIES */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" fontWeight="bold">Success Stories</Typography>
            <Typography variant="body1" sx={{ color: themeTextSecondary, mt: 1 }}>Real professionals who rebuilt their careers with Kirmya.</Typography>
          </Box>
          <Grid container spacing={4}>
            {content?.testimonials.map((t) => (
              <Grid item xs={12} md={4} key={t.id}>
                <Card sx={{ p: 3.5, borderRadius: 3.5, bgcolor: themeCardBg, border: `1px solid ${themeBorder}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Rating value={t.rating} readOnly size="small" sx={{ mb: 2, color: '#f59e0b' }} />
                  <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 3, flexGrow: 1, lineHeight: 1.6 }}>"{t.quote}"</Typography>
                  <Divider sx={{ mb: 2, borderColor: themeBorder }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={t.avatar_url} alt={t.author_name} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{t.author_name}</Typography>
                      <Typography variant="caption" sx={{ color: themeTextSecondary, display: 'block' }}>{t.author_role} • {t.company_name}</Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 10. TRUST & SAFETY */}
      <Box sx={{ py: 10, bgcolor: darkMode ? '#0b0f19' : '#f1f5f9' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>Trust & Safety First</Typography>
              <Typography variant="body1" sx={{ color: themeTextSecondary, mb: 3 }}>We maintain a verified, scam-free professional ecosystem so you can apply and connect with confidence.</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUserIcon color="primary" />
                    <Typography variant="subtitle2" fontWeight="bold">Verified Companies</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon color="primary" />
                    <Typography variant="subtitle2" fontWeight="bold">Privacy Controls</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 4, bgcolor: themeCardBg, border: `1px solid ${themeBorder}`, textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 60, color: '#0284c7', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold">Enterprise Compliance</Typography>
                <Typography variant="body2" sx={{ color: themeTextSecondary, mt: 1 }}>GDPR Article 15 Data Export & Article 17 Deletion Ready.</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 11. PRICING SECTION (FREE FOREVER FOR JOB SEEKERS) */}
      <Box id="pricing" sx={{ py: 12 }}>
        <Container maxWidth="md">
          <Card sx={{ p: 5, borderRadius: 4, bgcolor: themeCardBg, border: '2px solid #0284c7', textAlign: 'center' }}>
            <Chip label="100% FREE FOR JOB SEEKERS" color="primary" sx={{ fontWeight: 'bold', mb: 2 }} />
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 2 }}>Free Forever for Job Seekers</Typography>
            <Typography variant="body1" sx={{ color: themeTextSecondary, mb: 4 }}>
              Kirmya will never charge candidates to build profiles, apply for jobs, use AI resume tools, or connect with peers.
            </Typography>
            <Grid container spacing={2} sx={{ maxWidth: 500, mx: 'auto', textAlign: 'left', mb: 4 }}>
              {['Free Professional Profile', 'Unlimited Job Applications', 'AI Career Assistant & Resume Optimizer', 'Guild Community Access', 'Direct Messaging'].map((item, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ color: '#10b981' }} />
                    <Typography variant="body2" fontWeight={500}>{item}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Button variant="contained" size="large" href="/app/jobs" sx={{ bgcolor: '#0284c7', color: '#fff', px: 5, py: 1.5, borderRadius: 2.5, fontWeight: 'bold' }}>
              Get Started Free
            </Button>
          </Card>
        </Container>
      </Box>

      {/* 12. CALL TO ACTION */}
      <Box sx={{ py: 12, background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)', color: '#fff', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>Your Next Opportunity Is One Connection Away</Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 400 }}>Join 150,000+ professionals growing their careers on Kirmya today.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" href="/app/jobs" sx={{ bgcolor: '#fff', color: '#0f172a', px: 4, py: 1.5, borderRadius: 2.5, fontWeight: 'bold' }}>
              Join Kirmya Free
            </Button>
            <Button variant="outlined" size="large" href="/app/jobs" sx={{ borderColor: '#fff', color: '#fff', px: 4, py: 1.5, borderRadius: 2.5, fontWeight: 'bold' }}>
              Explore Jobs
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 13. FOOTER */}
      <Box component="footer" sx={{ py: 8, bgcolor: darkMode ? '#05070d' : '#e2e8f0', borderTop: `1px solid ${themeBorder}` }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Kirmya.com</Typography>
              <Typography variant="body2" sx={{ color: themeTextSecondary, lineHeight: 1.6, maxWidth: 300 }}>
                A free professional network helping people find jobs, build connections, improve skills, and recover careers faster.
              </Typography>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Platform</Typography>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Jobs</Typography>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>People</Typography>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Communities</Typography>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Learning</Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Company</Typography>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>About Us</Typography>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Careers</Typography>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Contact</Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Legal</Typography>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Privacy Policy</Typography>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Terms of Service</Typography>
                <Typography variant="caption" sx={{ color: themeTextSecondary }}>Cookie Preferences</Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Social</Typography>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" sx={{ color: themeTextSecondary }}><LinkedInIcon /></IconButton>
                <IconButton size="small" sx={{ color: themeTextSecondary }}><TwitterIcon /></IconButton>
                <IconButton size="small" sx={{ color: themeTextSecondary }}><YouTubeIcon /></IconButton>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: themeBorder, mb: 4 }} />

          <Typography variant="caption" sx={{ color: themeTextSecondary, display: 'block', textAlign: 'center' }}>
            © {new Date().getFullYear()} Kirmya Technologies Inc. All rights reserved. Built with Next.js & Material UI v6.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
