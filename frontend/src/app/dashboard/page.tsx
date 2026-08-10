'use client';

/**
 * The candidate dashboard landing page.
 *
 * Everything under /dashboard was already built as its own route, but the
 * directory had no page of its own, so the App Router answered /dashboard with
 * a 404 — which is where sign-in sends every user whose role is not admin,
 * company or recruiter. This is the index for those routes.
 */
import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

import useAuth from '../../hooks/useAuth';

export const dynamic = 'force-dynamic';

type DashboardLink = {
  href: string;
  title: string;
  description: string;
};

// Each entry points at a route that already exists under src/app/dashboard.
const LINKS: DashboardLink[] = [
  {
    href: '/dashboard/applications',
    title: 'Applications',
    description: 'Track every role you have applied to and its current stage.',
  },
  {
    href: '/dashboard/recommended-jobs',
    title: 'Recommended jobs',
    description: 'Openings matched to your profile and recent activity.',
  },
  {
    href: '/dashboard/job-recommendations',
    title: 'Job recommendations',
    description: 'Suggestions refreshed as your profile changes.',
  },
  {
    href: '/dashboard/saved-jobs',
    title: 'Saved jobs',
    description: 'Roles you kept for later.',
  },
  {
    href: '/dashboard/saved-searches',
    title: 'Saved searches',
    description: 'Search filters you reuse, ready to run again.',
  },
  {
    href: '/dashboard/job-alerts',
    title: 'Job alerts',
    description: 'Get told when a matching role is posted.',
  },
  {
    href: '/dashboard/resumes',
    title: 'Resumes',
    description: 'Upload, tailor and version the resumes you send out.',
  },
  {
    href: '/dashboard/cover-letters',
    title: 'Cover letters',
    description: 'Draft and reuse letters from your templates.',
  },
  {
    href: '/dashboard/interviews',
    title: 'Interviews',
    description: 'Your scheduled interviews and their outcomes.',
  },
  {
    href: '/dashboard/interview-prep',
    title: 'Interview prep',
    description: 'Practice questions, mock sessions and company research.',
  },
  {
    href: '/dashboard/career-insights',
    title: 'Career insights',
    description: 'Where your search stands and what to do next.',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    // AuthContext starts with user null while it exchanges the refresh cookie,
    // so the redirect has to wait for loading to settle or a signed-in user is
    // bounced to sign-in on every hard refresh.
    if (!loading && !user) {
      router.replace('/signin');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="text" width={280} height={48} />
        <Skeleton variant="text" width={420} />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', mt: 3 }}>
          {LINKS.map((link) => (
            <Skeleton key={link.href} variant="rounded" height={116} />
          ))}
        </Box>
      </Container>
    );
  }

  const greetingName = user.firstName?.trim() || 'there';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1">
          Welcome back, {greetingName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pick up where you left off.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {LINKS.map((link) => (
          <Card key={link.href} variant="outlined">
            <CardActionArea component={NextLink} href={link.href} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {link.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {link.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
