'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import Link from 'next/link';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SecurityIcon from '@mui/icons-material/Security';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StorageIcon from '@mui/icons-material/Storage';
import BlockIcon from '@mui/icons-material/Block';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import BusinessIcon from '@mui/icons-material/Business';
import VerifiedIcon from '@mui/icons-material/Verified';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import { useAuthContext } from '../../context/AuthContext';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

interface SettingSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const SETTING_SECTIONS: SettingSection[] = [
  {
    title: 'Profile & Personal Information',
    description: 'Manage your public profile headline, bio, skills, experience, and contact info.',
    icon: <PersonOutlineIcon fontSize="medium" color="primary" />,
    href: '/profile/edit',
  },
  {
    title: 'Security & Authentication',
    description: 'Update password, configure two-factor authentication, manage sessions and trusted devices.',
    icon: <SecurityIcon fontSize="medium" color="primary" />,
    href: '/settings/security',
    badge: 'Protected',
  },
  {
    title: 'Privacy & Data Subject Rights',
    description: 'Control profile visibility, search discoverability, cookie preferences, and GDPR requests.',
    icon: <PrivacyTipIcon fontSize="medium" color="primary" />,
    href: '/settings/privacy',
  },
  {
    title: 'Notifications & Alerts',
    description: 'Customize email, push, and in-app alerts for messages, job matches, and connections.',
    icon: <NotificationsActiveIcon fontSize="medium" color="primary" />,
    href: '/settings/notifications',
  },
  {
    title: 'Data & Privacy Management',
    description: 'Request full personal archive export (GDPR Art. 20) and review data retention.',
    icon: <StorageIcon fontSize="medium" color="primary" />,
    href: '/settings/data',
  },
  {
    title: 'Safety & Blocked Users',
    description: 'Manage blocked profiles, report history, and trust & safety moderation appeals.',
    icon: <BlockIcon fontSize="medium" color="primary" />,
    href: '/settings/safety/blocked',
  },
  {
    title: 'Billing & Subscriptions',
    description: 'Review premium plans, payment methods, receipts, and invoice history.',
    icon: <CreditCardIcon fontSize="medium" color="primary" />,
    href: '/settings/billing',
  },
  {
    title: 'Employer & Organization Settings',
    description: 'Manage company recruitment workspace, recruiter permissions, and team members.',
    icon: <BusinessIcon fontSize="medium" color="primary" />,
    href: '/employer/settings',
  },
];

export default function SettingsHubPage() {
  const { user } = useAuthContext();

  const displayName =
    (user as any)?.name ||
    [(user as any)?.first_name, (user as any)?.last_name].filter(Boolean).join(' ') ||
    'Account Settings';

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Header Profile Summary */}
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2.5}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={(user as any)?.avatar || ''}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: `${tokens.radius.md}px`,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                }}
              >
                {displayName ? displayName[0].toUpperCase() : 'U'}
              </Avatar>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {displayName}
                  </Typography>
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: 16 }} />}
                    label="Active"
                    color="success"
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, height: 22 }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25 }}>
                  {user?.email || 'Manage your Kirmya security, privacy, and account preferences.'}
                </Typography>
              </Box>
            </Stack>

            <Button
              component={Link}
              href="/profile/edit"
              variant="outlined"
              size="small"
              sx={{
                borderRadius: `${tokens.radius.sm}px`,
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              Edit Profile
            </Button>
          </Stack>
        </Paper>

        {/* Section Grid */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
          Account & Platform Preferences
        </Typography>

        <Grid container spacing={2.5}>
          {SETTING_SECTIONS.map((section) => (
            <Grid item xs={12} sm={6} md={6} key={section.title}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.06)',
                  },
                }}
              >
                <CardActionArea
                  component={Link}
                  href={section.href}
                  sx={{ height: '100%', p: { xs: 2, md: 2.5 } }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: `${tokens.radius.md}px`,
                        bgcolor: 'action.hover',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {section.icon}
                    </Box>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {section.title}
                        </Typography>
                        <ChevronRightIcon color="action" fontSize="small" />
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, lineHeight: 1.5 }}
                      >
                        {section.description}
                      </Typography>

                      {section.badge && (
                        <Chip
                          label={section.badge}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 1.5, height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                        />
                      )}
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </AuthenticatedLayout>
  );
}
