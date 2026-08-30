'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  IconButton,
  TextField,
  Button,
  Divider,
  Alert,
  Link as MuiLink,
  useTheme,
} from '@mui/material';
import BrandLockup from '../brand/BrandLockup';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';
import SendIcon from '@mui/icons-material/Send';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';

export const Footer: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <Box
      id="footer"
      component="footer"
      aria-label="Site footer"
      sx={{
        bgcolor: isDark ? '#05070d' : '#f8fafc',
        color: 'text.primary',
        pt: { xs: 8, md: 10 },
        pb: 6,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {/* Brand & Newsletter Column */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2.5}>
              <Link href={ROUTES.HOME} style={{ textDecoration: 'none', color: 'inherit' }}>
                <BrandLockup size={36} variant="h5" />
              </Link>

              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 340 }}>
                Kirmya is a professional networking and career platform dedicated to helping job seekers recover after transitions, connect with peer communities, receive verified referrals, and match with verified employers.
              </Typography>

              {/* Newsletter Subscription */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Subscribe to Career Advice & Updates
                </Typography>
                {subscribed ? (
                  <Alert severity="success" sx={{ borderRadius: `${tokens.radius.sm}px` }}>
                    Subscribed successfully!
                  </Alert>
                ) : (
                  <form onSubmit={handleSubscribe}>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        placeholder="Enter your email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        type="email"
                        required
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: `${tokens.radius.sm}px`,
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          borderRadius: `${tokens.radius.sm}px`,
                          px: 2.5,
                        }}
                      >
                        <SendIcon fontSize="small" />
                      </Button>
                    </Stack>
                  </form>
                )}
              </Box>

              {/* Social Icons */}
              <Stack direction="row" spacing={1}>
                {[
                  { icon: <LinkedInIcon fontSize="small" />, href: 'https://linkedin.com', label: 'LinkedIn' },
                  { icon: <GitHubIcon fontSize="small" />, href: 'https://github.com', label: 'GitHub' },
                  { icon: <XIcon fontSize="small" />, href: 'https://x.com', label: 'X' },
                ].map((s, idx) => (
                  <IconButton
                    key={idx}
                    component="a"
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': { color: 'primary.main', bgcolor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.08)' },
                    }}
                  >
                    {s.icon}
                  </IconButton>
                ))}
              </Stack>
            </Stack>
          </Grid>

          {/* Links Column 1: Platform */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Platform
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink component={Link} href={ROUTES.JOBS} variant="body2" color="text.secondary" underline="hover">
                Find Jobs
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.COMPANIES} variant="body2" color="text.secondary" underline="hover">
                Companies
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.COMMUNITIES} variant="body2" color="text.secondary" underline="hover">
                Communities
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.ABOUT} variant="body2" color="text.secondary" underline="hover">
                About Us
              </MuiLink>
            </Stack>
          </Grid>

          {/* Links Column 2: Resources */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Support
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink component={Link} href={ROUTES.HELP} variant="body2" color="text.secondary" underline="hover">
                Help & FAQ
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.SUPPORT} variant="body2" color="text.secondary" underline="hover">
                Contact Support
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.CAREERS} variant="body2" color="text.secondary" underline="hover">
                Careers
              </MuiLink>
            </Stack>
          </Grid>

          {/* Links Column 3: Legal & Trust */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Legal & Trust
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink component={Link} href={ROUTES.PRIVACY} variant="body2" color="text.secondary" underline="hover">
                Privacy Policy
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.TERMS} variant="body2" color="text.secondary" underline="hover">
                Terms of Service
              </MuiLink>
              <MuiLink component={Link} href="/cookies" variant="body2" color="text.secondary" underline="hover">
                Cookie Policy
              </MuiLink>
            </Stack>
          </Grid>

          {/* Links Column 4: Account */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Account
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink component={Link} href={ROUTES.AUTH.LOGIN} variant="body2" color="text.secondary" underline="hover">
                Sign In
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.AUTH.SIGNUP} variant="body2" color="text.secondary" underline="hover">
                Create Account
              </MuiLink>
              <MuiLink component={Link} href={ROUTES.AUTH.FORGOT_PASSWORD} variant="body2" color="text.secondary" underline="hover">
                Forgot Password
              </MuiLink>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 4 }} />

        {/* Copyright */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Kirmya Technologies Inc. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Designed for professional momentum and career recovery.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
