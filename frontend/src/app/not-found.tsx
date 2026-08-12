'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NorthEastIcon from '@mui/icons-material/NorthEast';

import BrandMark from '../components/brand/BrandMark';

// Every destination here was checked against the running app. Note that `/jobs`
// itself has no page, so these point at the job routes that do resolve.
const RECOVERY_LINKS = [
  { href: '/jobs/match', label: 'Job matches' },
  { href: '/jobs/recommendations', label: 'Recommended for you' },
  { href: '/companies', label: 'Companies hiring' },
  { href: '/dashboard', label: 'Your dashboard' },
  { href: '/', label: 'Home' },
];

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const runSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ maxWidth: 620 }}>
          <BrandMark size={48} />

          <Typography
            variant="body2"
            sx={{ mt: 4, mb: 1.5, color: 'text.secondary', fontWeight: 600, letterSpacing: '0.04em' }}
          >
            Error 404
          </Typography>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.1rem', md: '2.9rem' },
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              mb: 2,
              textWrap: 'balance',
            }}
          >
            We couldn&apos;t find that page.
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', fontSize: '1.05rem', mb: 4, maxWidth: 520 }}
          >
            The link may be broken, or the page may have moved. Search for what you need, or
            pick up from one of these.
          </Typography>

          <Box component="form" onSubmit={runSearch} sx={{ mb: 5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                fullWidth
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs, companies, people"
                // lowercase `inputProps` targets the native <input>; the capitalised
                // `InputProps` below would put the label on the wrapper, where screen
                // readers never reach it.
                inputProps={{ 'aria-label': 'Search Kirmya' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{ px: 4, flexShrink: 0, borderRadius: '12px' }}
              >
                Search
              </Button>
            </Stack>
          </Box>

          <Stack
            direction="row"
            spacing={0}
            useFlexGap
            sx={{ flexWrap: 'wrap', columnGap: 3, rowGap: 1.5 }}
            component="nav"
            aria-label="Suggested pages"
          >
            {RECOVERY_LINKS.map((link) => (
              <MuiLink
                key={link.href}
                component={NextLink}
                href={link.href}
                underline="hover"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'primary.main',
                }}
              >
                {link.label}
                <NorthEastIcon sx={{ fontSize: 14 }} />
              </MuiLink>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
