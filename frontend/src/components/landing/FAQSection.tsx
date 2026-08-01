'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GlassCard from './GlassCard';

export const FAQSection: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [expanded, setExpanded] = useState<string | false>('panel0');

  const faqs = [
    {
      q: 'What is Kirmya?',
      a: 'Kirmya is a professional networking and AI-powered career platform specifically built to help job seekers find opportunities, receive employee referrals, optimize resumes, and accelerate career recovery.',
    },
    {
      q: 'Is Kirmya free?',
      a: 'Yes! Kirmya is 100% free for job seekers. You can build profiles, apply for jobs, use AI resume tools, join communities, and request referrals at zero cost.',
    },
    {
      q: 'How does AI help in my job search?',
      a: 'Kirmya AI analyzes job descriptions against your experience, calculates match percentages, rewrites resume bullet points for ATS compliance, provides simulated mock interviews, and suggests skills to boost your salary.',
    },
    {
      q: 'How do employee referrals work?',
      a: 'Kirmya connects candidates directly with verified employee advocates at top hiring companies. You can send a referral request message to bypass cold ATS application black holes.',
    },
    {
      q: 'Can recruiters and companies use Kirmya?',
      a: 'Yes, corporate recruiters and hiring managers can register company pages, post open roles, and utilize AI candidate vector ranking to find pre-screened talent 3x faster.',
    },
    {
      q: 'How secure is my data?',
      a: 'Your data is secured using 256-bit SSL encryption. Kirmya is fully GDPR and SOC 2 compliant, giving you full control over profile privacy, data export, and account deletion.',
    },
    {
      q: 'How do I join professional communities?',
      a: 'Once registered, you can browse and join industry guilds (e.g., Facilities, Engineering, Marketing) to participate in peer discussions, Q&A sessions, and virtual career events.',
    },
    {
      q: 'Can I upload my existing resume?',
      a: 'Absolutey! You can upload your PDF or DOCX resume, and Kirmya AI will automatically extract your work history, skills, and achievements to populate your profile in seconds.',
    },
  ];

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box id="faq" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              color: 'primary.main',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            FREQUENTLY ASKED QUESTIONS
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
            Got Questions? We Have Answers.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.05rem' }}>
            Everything you need to know about getting started on Kirmya.
          </Typography>
        </Box>

        <GlassCard sx={{ p: { xs: 2, sm: 4 } }}>
          {faqs.map((faq, idx) => {
            const panelId = `panel${idx}`;
            const isExp = expanded === panelId;
            return (
              <Accordion
                key={idx}
                expanded={isExp}
                onChange={handleChange(panelId)}
                elevation={0}
                sx={{
                  bgcolor: 'transparent',
                  borderBottom: idx === faqs.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  '&:before': { display: 'none' },
                  py: 1,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: isExp ? 'primary.main' : 'text.secondary' }} />}
                  aria-controls={`${panelId}-content`}
                  id={`${panelId}-header`}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1rem', md: '1.15rem' },
                      color: isExp ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.98rem' }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </GlassCard>
      </Container>
    </Box>
  );
};

export default FAQSection;
