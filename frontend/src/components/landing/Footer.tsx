'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import SendIcon from '@mui/icons-material/Send';

export const Footer: React.FC = () => {
  const router = useRouter();
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
      sx={{
        bgcolor: isDark ? '#05070d' : '#f1f5f9',
        color: 'text.primary',
        pt: 10,
        pb: 6,
        borderTop: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {/* Brand & Newsletter Column */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2.5}>
              <BrandLockup size={36} variant="h5" />

              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 340 }}>
                Kirmya is a professional networking and AI-powered career platform dedicated to helping job seekers find opportunities, build connections, receive referrals, and accelerate career growth.
              </Typography>

              {/* Newsletter Subscription */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  Subscribe to Career Advice & Job Alerts
                </Typography>
                {subscribed ? (
                  <Alert severity="success" sx={{ borderRadius: '10px' }}>
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
                            borderRadius: '10px',
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        sx={{
                          borderRadius: '10px',
                          px: 2.5,
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
                  { icon: <LinkedInIcon fontSize="small" />, href: 'https://linkedin.com' },
                  { icon: <GitHubIcon fontSize="small" />, href: 'https://github.com' },
                  { icon: <XIcon fontSize="small" />, href: 'https://x.com' },
                  { icon: <FacebookIcon fontSize="small" />, href: 'https://facebook.com' },
                  { icon: <InstagramIcon fontSize="small" />, href: 'https://instagram.com' },
                ].map((s, idx) => (
                  <IconButton
                    key={idx}
                    component="a"
                    href={s.href}
                    target="_blank"
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': { color: 'primary.main', bgcolor: 'rgba(99, 102, 241, 0.1)' },
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
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Platform
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink onClick={() => router.push('/jobs')} variant="body2" color="text.secondary" underline="hover" sx={{ cursor: 'pointer' }}>
                Jobs
              </MuiLink>
              <MuiLink onClick={() => router.push('/companies')} variant="body2" color="text.secondary" underline="hover" sx={{ cursor: 'pointer' }}>
                Companies
              </MuiLink>
              <MuiLink onClick={() => router.push('/communities')} variant="body2" color="text.secondary" underline="hover" sx={{ cursor: 'pointer' }}>
                Communities
              </MuiLink>
              <MuiLink href="#ai-assistant" variant="body2" color="text.secondary" underline="hover">
                AI Features
              </MuiLink>
              <MuiLink href="#features" variant="body2" color="text.secondary" underline="hover">
                Resources
              </MuiLink>
            </Stack>
          </Grid>

          {/* Links Column 2: Resources */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Help & Resources
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink href="#faq" variant="body2" color="text.secondary" underline="hover">
                Help Center
              </MuiLink>
              <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
                Blog
              </MuiLink>
              <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
                Career Advice
              </MuiLink>
              <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
                Resume Tips
              </MuiLink>
              <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
                Interview Tips
              </MuiLink>
            </Stack>
          </Grid>

          {/* Links Column 3: Legal */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Legal & Policy
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink href="/privacy" variant="body2" color="text.secondary" underline="hover">
                Privacy Policy
              </MuiLink>
              <MuiLink href="/terms" variant="body2" color="text.secondary" underline="hover">
                Terms of Service
              </MuiLink>
              <MuiLink href="/cookies" variant="body2" color="text.secondary" underline="hover">
                Cookie Policy
              </MuiLink>
              <MuiLink href="/guidelines" variant="body2" color="text.secondary" underline="hover">
                Community Guidelines
              </MuiLink>
            </Stack>
          </Grid>

          {/* Links Column 4: Company */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
              Company
            </Typography>
            <Stack spacing={1.2}>
              <MuiLink href="#why-kirmya" variant="body2" color="text.secondary" underline="hover">
                About Us
              </MuiLink>
              <MuiLink href="#footer" variant="body2" color="text.secondary" underline="hover">
                Contact
              </MuiLink>
              <MuiLink href="/jobs" variant="body2" color="text.secondary" underline="hover">
                Careers
              </MuiLink>
              <MuiLink href="#" variant="body2" color="text.secondary" underline="hover">
                Press & Media
              </MuiLink>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Kirmya Technologies Inc. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={3}>
            <MuiLink href="/privacy" variant="caption" color="text.secondary" underline="hover">
              Privacy
            </MuiLink>
            <MuiLink href="/terms" variant="caption" color="text.secondary" underline="hover">
              Terms
            </MuiLink>
            <MuiLink href="/cookies" variant="caption" color="text.secondary" underline="hover">
              Cookies
            </MuiLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
