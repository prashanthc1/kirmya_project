'use client';

import React, { useState } from 'react';
import { Box, Container, Grid, Typography, Avatar, Rating, Stack, IconButton, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from './GlassCard';

interface TestimonialItem {
  id?: string;
  author_name: string;
  author_role: string;
  company_name: string;
  avatar_url?: string;
  quote: string;
  rating?: number;
}

interface TestimonialsSectionProps {
  testimonials?: TestimonialItem[];
}

const defaultTestimonials: TestimonialItem[] = [
  {
    author_name: 'Elena Rostova',
    author_role: 'Senior AI Engineer',
    company_name: 'Nexus AI',
    quote: "Kirmya's AI match engine connected me with top-tier tech roles in under 48 hours after my layoff. Phenomenal platform!",
    rating: 5,
  },
  {
    author_name: 'Tariq Al-Mansoor',
    author_role: 'VP of Engineering',
    company_name: 'Hyperion Labs',
    quote: 'The verified career credentials and seamless internal employee referral requests made hiring lead architects effortless.',
    rating: 5,
  },
  {
    author_name: 'Sarah Jenkins',
    author_role: 'Principal Product Strategist',
    company_name: 'GlobalVentures',
    quote: 'Securing my professional identity and global talent network has never felt more intuitive. Highly recommended!',
    rating: 5,
  },
];

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const theme = useTheme();
  const list = testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  return (
    <Box id="testimonials" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
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
            REAL RECOVERY STORIES
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
            What Our Members Say
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', fontSize: '1.05rem' }}>
            Hear from job seekers and hiring executives who accelerated their career progression on Kirmya.
          </Typography>
        </Box>

        {/* Desktop 3-Card Grid */}
        <Grid container spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
          {list.map((t, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <GlassCard sx={{ height: '100%', p: 3.5, display: 'flex', flexDirection: 'column' }}>
                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Rating value={t.rating || 5} readOnly size="small" sx={{ color: '#f59e0b' }} />
                    <FormatQuoteIcon sx={{ fontSize: 32, color: 'rgba(99, 102, 241, 0.3)' }} />
                  </Stack>

                  <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.65, color: 'text.primary', flexGrow: 1 }}>
                    &quot;{t.quote}&quot;
                  </Typography>

                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>
                      {t.author_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {t.author_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.author_role} at {t.company_name}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Mobile Interactive Carousel */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={springs.entrance}
            >
              <GlassCard sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Rating value={list[currentIndex].rating || 5} readOnly size="small" sx={{ color: '#f59e0b' }} />
                  <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.65 }}>
                    &quot;{list[currentIndex].quote}&quot;
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 800 }}>
                      {list[currentIndex].author_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {list[currentIndex].author_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {list[currentIndex].author_role} at {list[currentIndex].company_name}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <IconButton onClick={handlePrev} size="small" sx={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <ArrowBackIcon />
            </IconButton>
            <IconButton onClick={handleNext} size="small" sx={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <ArrowForwardIcon />
            </IconButton>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
