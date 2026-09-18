'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  Stack,
  Chip,
  Button,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import ContrastIcon from '@mui/icons-material/Contrast';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { useColorMode } from '../../providers';
import { tokens } from '../../../theme/tokens';
import { ROUTES } from '../../../shared/routes';

export const dynamic = 'force-dynamic';

export default function SettingsAppearancePage() {
  const { mode, setColorMode } = useColorMode();

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Navigation Breadcrumb / Back */}
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            href={ROUTES.SETTINGS.ROOT}
            startIcon={<ArrowBackIcon />}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            Back to Settings Hub
          </Button>
        </Box>

        {/* Page Title Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            mb: 4,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                p: 1.5,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
              }}
            >
              <PaletteOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Appearance & Display Preferences
                </Typography>
                <Chip
                  label={mode === 'light' ? 'Light Mode (Default)' : 'Dark Mode'}
                  color={mode === 'light' ? 'primary' : 'default'}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Customize your visual experience across Kirmya. Theme settings apply immediately and persist in your browser.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Theme Selection Section */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
          Theme Mode
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Light Theme Card */}
          <Grid item xs={12} sm={6}>
            <Card
              elevation={0}
              onClick={() => setColorMode('light')}
              role="button"
              aria-label="Set Light Theme Mode"
              sx={{
                p: 3,
                cursor: 'pointer',
                borderRadius: `${tokens.radius.lg}px`,
                border: '2px solid',
                borderColor: mode === 'light' ? 'primary.main' : 'divider',
                bgcolor: mode === 'light' ? 'action.selected' : 'background.paper',
                transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: `${tokens.radius.md}px`,
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f59e0b',
                    }}
                  >
                    <LightModeIcon sx={{ fontSize: 28 }} />
                  </Box>
                  {mode === 'light' ? (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                      label="Active Theme"
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  ) : (
                    <Button size="small" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Select
                    </Button>
                  )}
                </Stack>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Light Theme
                    </Typography>
                    <Chip label="Default" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                    Clean, high-contrast bright appearance optimized for day-to-day productivity and professional reading clarity.
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          {/* Dark Theme Card */}
          <Grid item xs={12} sm={6}>
            <Card
              elevation={0}
              onClick={() => setColorMode('dark')}
              role="button"
              aria-label="Set Dark Theme Mode"
              sx={{
                p: 3,
                cursor: 'pointer',
                borderRadius: `${tokens.radius.lg}px`,
                border: '2px solid',
                borderColor: mode === 'dark' ? 'primary.main' : 'divider',
                bgcolor: mode === 'dark' ? 'action.selected' : 'background.paper',
                transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.06)',
                },
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: `${tokens.radius.md}px`,
                      bgcolor: '#0f172a',
                      border: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                    }}
                  >
                    <DarkModeIcon sx={{ fontSize: 28 }} />
                  </Box>
                  {mode === 'dark' ? (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                      label="Active Theme"
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  ) : (
                    <Button size="small" variant="outlined" sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Select
                    </Button>
                  )}
                </Stack>

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Dark Theme
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                    Deep contrast aesthetic designed to reduce eye strain in low-light environments while retaining full contrast compliance.
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Live UI Preview Panel */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
          Live Theme Preview
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            mb: 4,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>
            Sample Components in {mode === 'light' ? 'Light Theme' : 'Dark Theme'}
          </Typography>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: `${tokens.radius.md}px`,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Card Title Sample
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This preview reflects the currently selected theme ({mode}). Notice the contrast and clean hierarchy.
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <Button variant="contained" color="primary" size="small" sx={{ fontWeight: 700, textTransform: 'none' }}>
                    Primary Action
                  </Button>
                  <Button variant="outlined" color="primary" size="small" sx={{ fontWeight: 700, textTransform: 'none' }}>
                    Secondary Action
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: `${tokens.radius.md}px`,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Badges & Status Elements
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Status chips and indicators designed to meet WCAG AA contrast guidelines.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label="Success" color="success" size="small" sx={{ fontWeight: 700 }} />
                  <Chip label="In Progress" color="info" size="small" sx={{ fontWeight: 700 }} />
                  <Chip label="Attention" color="warning" size="small" sx={{ fontWeight: 700 }} />
                  <Chip label="Critical" color="error" size="small" sx={{ fontWeight: 700 }} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* Accessibility & Display Standards */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
          Accessibility & Contrast Standards
        </Typography>

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <ContrastIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  WCAG AA/AAA Compliant Contrast
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Every button, label, and input surface adheres to strict luminance contrast ratios (at least 4.5:1 for normal text and 7:1 for enhanced readability in light mode).
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <AccessibilityNewIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Motion & System Preferences
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Transitions automatically respect the operating system&apos;s <code style={{ fontSize: '0.85em' }}>prefers-reduced-motion</code> setting, smoothing layout shifts without sudden flashes.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AuthenticatedLayout>
  );
}
