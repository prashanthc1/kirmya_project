'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Grid, Typography, Button, Stack, Chip, useTheme } from '@mui/material';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GlassCard from './GlassCard';

interface CompanySectionProps {
  /** Counted companies with at least one open role. Absent when uncountable. */
  hiringCompanies?: number;
}

export const CompanySection: React.FC<CompanySectionProps> = ({ hiringCompanies }) => {
  const router = useRouter();
  const theme = useTheme();

  /*
   * F15. #10b981 on a 15% wash of itself reads 2.11:1 in light mode — the worst
   * contrast on the page, and it is 13px bold text, so no large-text exemption
   * applies. As with the other eyebrows, one colour cannot serve both grounds:
   * #065f46 on the light composite = 6.40:1, #34d399 on the dark one = 7.37:1.
   */
  const accent = theme.palette.mode === 'dark' ? '#34d399' : '#065f46';

  const companyBenefits = [
    'Premium Employer Branding & Company Pages',
    'Custom Career Portal & Job Listing Showcases',
    'Enterprise Talent Acquisition Workflow Integrations',
    'Comprehensive Executive Hiring Dashboard',
    'Official Verified Corporate Employer Badge',
    'Direct Access to Layoff Recovery Talent Pools',
  ];

  return (
    <Box id="companies" sx={{ py: 10, position: 'relative' }}>
      <Container maxWidth="xl">
        <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<CorporateFareIcon sx={{ color: `${accent} !important` }} />}
                label="FOR ENTERPRISES & ORGANIZATIONS"
                sx={{
                  fontWeight: 800,
                  px: 1,
                  mb: 2,
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: accent,
                }}
              />
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
                Build Your Employer Brand & Acquire Top Talent
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
                Showcase your corporate culture, manage job openings, and hire verified professionals within an ethical, privacy-first platform.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                {companyBenefits.map((b, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleOutlineIcon sx={{ color: accent, fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {b}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/organization')}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: '12px',
                  fontWeight: 800,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                }}
              >
                Register Company
              </Button>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '18px',
                  bgcolor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  textAlign: 'center',
                }}
              >
                {/*
                  This tile carried a hardcoded "4,850+" with nothing behind it.
                  The real count now comes from the landing API when it can be
                  counted; when it cannot, the tile keeps its heading and drops
                  the number rather than inventing one.
                */}
                {/*
                  The count uses the same per-mode accent as the eyebrow above,
                  and for the same reason. #10b981 on this tile's own 8% wash
                  composites to #ebf9f4 in light mode and reads 2.34:1, against
                  the 3:1 that 22px bold text needs.

                  This one is worth noting for how it hid: the tile renders only
                  when the API returns a real count, so an accessibility scan run
                  against a build that could not reach the API sees no number at
                  all and passes. The first scan of this page did exactly that.
                */}
                {typeof hiringCompanies === 'number' && (
                  <Typography variant="h4" sx={{ fontWeight: 900, color: accent, mb: 1 }}>
                    {hiringCompanies.toLocaleString()}
                  </Typography>
                )}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Verified Companies Hiring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join leading enterprises, tech hubs, and high-growth startups hiring on Kirmya.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </GlassCard>
      </Container>
    </Box>
  );
};

export default CompanySection;
