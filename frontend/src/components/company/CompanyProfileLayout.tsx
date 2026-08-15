'use client';

import React from 'react';
import {
  Box,
  Container,
  Stack,
  IconButton,
  Button,
  useTheme,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useColorMode } from '../../app/providers';

interface CompanyProfileLayoutProps {
  company: any;
  profile: any;
  children: React.ReactNode;
}

export const CompanyProfileLayout: React.FC<CompanyProfileLayoutProps> = ({
  company,
  profile,
  children,
}) => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const router = useRouter();

  // Schema.org JSON-LD Organization Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company?.name,
    url: profile?.website,
    logo: profile?.logoUrl || 'https://kirmya.com/logo.png',
    description: profile?.about,
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile?.location,
    },
    numberOfEmployees: profile?.companySize,
    foundingDate: profile?.foundedYear?.toString(),
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: 'background.default',
        color: 'text.primary',
        pb: 10,
      }}
    >
      {/* Schema.org Structured Data Inject */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation Bar Header */}
      <Box
        sx={{
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/companies')}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Back to Companies Directory
            </Button>

            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Stack>
        </Container>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default CompanyProfileLayout;
