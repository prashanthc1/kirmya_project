'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import Link from 'next/link';

export const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { code: 'getting_started', title: 'Getting Started', desc: 'Account creation, profile setup, and onboarding guides.', icon: <RocketLaunchIcon color="primary" /> },
    { code: 'account', title: 'Account & Security', desc: 'Password recovery, Two-Factor Auth, and active sessions.', icon: <LockOutlinedIcon color="primary" /> },
    { code: 'jobs', title: 'Jobs & Applications', desc: 'Finding opportunities, application tracking, and job alerts.', icon: <WorkOutlineIcon color="primary" /> },
    { code: 'privacy', title: 'Privacy & Data Rights', desc: 'Cookie preferences, data export, and account deletion.', icon: <ShieldOutlinedIcon color="primary" /> },
    { code: 'messaging', title: 'Messaging & Community', desc: 'Direct chat safety, network connections, and community forums.', icon: <ForumOutlinedIcon color="primary" /> },
    { code: 'troubleshooting', title: 'Troubleshooting & Bugs', desc: 'Common issues, bug reporting, and feature suggestions.', icon: <BugReportOutlinedIcon color="primary" /> },
  ];

  const popularArticles = [
    { title: 'How to Create and Optimize Your Kirmya Candidate Profile', slug: 'create-and-optimize-kirmya-candidate-profile', category: 'Getting Started' },
    { title: 'Setting Up Two-Factor Authentication (TOTP)', slug: 'setup-two-factor-authentication-totp', category: 'Account & Security' },
    { title: 'Understanding Employer Application Delivery Timelines', slug: 'employer-application-delivery-timelines', category: 'Jobs & Applications' },
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Hero Header */}
      <Card
        sx={{
          borderRadius: '24px',
          p: { xs: 4, md: 6 },
          mb: 4,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(156, 39, 176, 0.08) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
          Kirmya Help & Support Center
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}>
          Search our knowledge base, explore frequently asked questions, or connect with our support team.
        </Typography>

        <TextField
          placeholder="Search articles, guides, topics (e.g., 2FA, resume import, job alerts)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ maxWidth: 650, mx: 'auto', bgcolor: 'background.paper', borderRadius: '16px' }}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Card>

      {/* Category Grid */}
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
        Browse Knowledge Base Categories
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {categories.map((cat) => (
          <Grid item xs={12} sm={6} md={4} key={cat.code}>
            <Card
              component={Link}
              href={`/help/articles?category=${cat.code}`}
              sx={{
                p: 3,
                borderRadius: '20px',
                height: '100%',
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: '14px' }}>
                  {cat.icon}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {cat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cat.desc}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Popular Articles */}
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
        Popular Knowledge Base Articles
      </Typography>
      <Grid container spacing={2} sx={{ mb: 6 }}>
        {popularArticles.map((art) => (
          <Grid item xs={12} md={4} key={art.slug}>
            <Card sx={{ p: 3, borderRadius: '20px' }}>
              <Chip label={art.category} size="small" color="primary" sx={{ mb: 1.5, fontWeight: 700 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {art.title}
              </Typography>
              <Button component={Link} href={`/help/articles/${art.slug}`} size="small" sx={{ fontWeight: 800, p: 0 }}>
                Read Article →
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Need Help CTA */}
      <Card
        sx={{
          borderRadius: '24px',
          p: 4,
          bgcolor: 'background.paper',
          border: '1px dashed primary.main',
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Still Need Assistance?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Our support team is available to assist with technical queries, account protection, and feedback.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button component={Link} href="/support" variant="contained" sx={{ borderRadius: '12px', fontWeight: 800, px: 4 }}>
            Contact Support Desk
          </Button>
          <Button component={Link} href="/feedback" variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800, px: 4 }}>
            Submit Feedback / Bug Report
          </Button>
        </Stack>
      </Card>
    </Box>
  );
};

export default HelpCenter;
