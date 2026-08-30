'use client';

import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';

import { AuthenticatedLayout } from '../../components/shell';
import useAuth from '../../hooks/useAuth';
import { tokens } from '../../theme/tokens';
import { LoadingState } from '../../components/common';

export const dynamic = 'force-dynamic';

type DashboardLink = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const LINKS: DashboardLink[] = [
  {
    href: '/dashboard/applications',
    title: 'Applications',
    description: 'Track every role you have applied to and its current stage.',
    icon: <AssignmentOutlinedIcon color="primary" />,
  },
  {
    href: '/dashboard/recommended-jobs',
    title: 'Recommended Jobs',
    description: 'Openings matched to your profile and recent activity.',
    icon: <WorkOutlineIcon color="primary" />,
  },
  {
    href: '/dashboard/saved-jobs',
    title: 'Saved Jobs',
    description: 'Roles you kept for later consideration.',
    icon: <BookmarkBorderIcon color="primary" />,
  },
  {
    href: '/dashboard/saved-searches',
    title: 'Saved Searches',
    description: 'Search filters you reuse, ready to run again.',
    icon: <SearchOutlinedIcon color="primary" />,
  },
  {
    href: '/dashboard/job-alerts',
    title: 'Job Alerts',
    description: 'Get notified when a matching role is posted.',
    icon: <NotificationsNoneIcon color="primary" />,
  },
  {
    href: '/dashboard/resumes',
    title: 'Resumes',
    description: 'Upload, tailor and version the resumes you send out.',
    icon: <DescriptionOutlinedIcon color="primary" />,
  },
  {
    href: '/dashboard/cover-letters',
    title: 'Cover Letters',
    description: 'Draft and reuse letters from your templates.',
    icon: <MailOutlineIcon color="primary" />,
  },
  {
    href: '/dashboard/interviews',
    title: 'Interviews',
    description: 'Your scheduled interviews and their outcomes.',
    icon: <EventAvailableOutlinedIcon color="primary" />,
  },
  {
    href: '/dashboard/interview-prep',
    title: 'Interview Prep',
    description: 'Practice questions, mock sessions and company research.',
    icon: <AutoAwesomeIcon color="primary" />,
  },
  {
    href: '/dashboard/career-insights',
    title: 'Career Insights',
    description: 'Where your search stands and what to do next.',
    icon: <InsightsOutlinedIcon color="primary" />,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <AuthenticatedLayout maxWidth="wide">
        <LoadingState message="Loading your dashboard..." />
      </AuthenticatedLayout>
    );
  }

  const greetingName = user.firstName?.trim() || 'there';

  return (
    <AuthenticatedLayout maxWidth="wide">
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          Welcome back, {greetingName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your applications, job recommendations, and career recovery toolkit.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {LINKS.map((link) => (
          <Card
            key={link.href}
            elevation={1}
            sx={{
              borderRadius: `${tokens.radius.lg}px`,
              transition: 'transform 150ms ease, box-shadow 150ms ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
          >
            <CardActionArea component={NextLink} href={link.href} sx={{ height: '100%', p: 2.5 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ mb: 1.5 }}>{link.icon}</Box>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
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
    </AuthenticatedLayout>
  );
}
