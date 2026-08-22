'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Button,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuizIcon from '@mui/icons-material/Quiz';
import Link from 'next/link';

export default function FAQPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const faqs = [
    {
      category: 'Account & Security',
      q: 'How do I create and verify my Kirmya account?',
      a: 'Sign up with your email address or Google OAuth. Once registered, a 6-digit confirmation code will be dispatched to your email for instant verification.',
    },
    {
      category: 'Account & Security',
      q: 'How do I enable Two-Factor Authentication (TOTP)?',
      a: 'Navigate to Settings -> Security -> Two-Factor Authentication. Scan the QR code using Google Authenticator, 1Password, or Authy, and enter the verification code.',
    },
    {
      category: 'Jobs & Applications',
      q: 'How do job alert recommendations work on Kirmya?',
      a: 'Kirmya AI analyzes your verified skills, candidate location preferences, and career history to calculate a match percentage and send real-time job alert notifications.',
    },
    {
      category: 'Messaging & Networking',
      q: 'Who can send me direct messages on Kirmya?',
      a: 'By default, verified 1st-degree connections can message you directly. For non-connections, direct messages land in your Message Requests inbox.',
    },
    {
      category: 'Privacy & Security',
      q: 'How do I request a full copy of my data or delete my account?',
      a: 'Go to Settings -> Privacy -> Data Rights. You can export your data in JSON/CSV format or request permanent account deletion under GDPR/CCPA guidelines.',
    },
    {
      category: 'Trust & Safety',
      q: 'How do I report abuse, harassment, or fraudulent job postings?',
      a: 'Click the report shield icon on any message, profile, or job listing to submit a report directly to the Trust & Safety moderation queue.',
    },
  ];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <QuizIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Frequently Asked Questions (FAQ)
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Quick answers to common questions about accounts, job applications, messaging, and privacy.
          </Typography>
        </Box>
      </Stack>

      <Card
        sx={{
          borderRadius: '24px',
          p: 2,
          mb: 4,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {faqs.map((faq, index) => (
          <Accordion key={index} elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                [{faq.category}] {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Card>

      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Didn&apos;t find what you were looking for?
        </Typography>
        <Button component={Link} href="/support" variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Contact Support Desk
        </Button>
      </Box>
    </Box>
  );
}
