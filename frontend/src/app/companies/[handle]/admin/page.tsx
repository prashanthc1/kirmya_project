'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Box, Card, CardActionArea, CardContent, Stack, Typography, Button } from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { routes } from '@/shared/routes';

/** Company management overview: the sections that exist, and the way back. */
export default function CompanyAdminOverviewPage() {
  const params = useParams();
  const raw = params?.handle;
  const slug = Array.isArray(raw) ? raw[0] : (raw ?? '');

  const sections = [
    { href: routes.company.admin.profile(slug), title: 'Profile', description: 'How the company appears to everyone else.', icon: <BusinessOutlinedIcon /> },
    { href: routes.company.admin.jobs(slug), title: 'Jobs', description: 'Postings, their status and their performance.', icon: <WorkOutlineIcon /> },
    { href: `/companies/${encodeURIComponent(slug)}/admin/people`, title: 'People', description: 'Employees and departments.', icon: <PeopleOutlineIcon /> },
    { href: routes.company.admin.recruiters(slug), title: 'Recruiters', description: 'Who may hire on the company’s behalf.', icon: <BadgeOutlinedIcon /> },
    { href: routes.company.admin.analytics(slug), title: 'Analytics', description: 'Reach, applications and hiring funnel.', icon: <BarChartOutlinedIcon /> },
    { href: routes.company.admin.settings(slug), title: 'Settings', description: 'Roles, verification and company preferences.', icon: <SettingsOutlinedIcon /> },
  ];

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Manage company
        </Typography>
        <Button component={Link} href={routes.company.view(slug)} startIcon={<ArrowBackIcon />} sx={{ textTransform: 'none' }}>
          Back to company
        </Button>
      </Stack>

      <Stack spacing={2}>
        {sections.map(section => (
          <Card key={section.href} variant="outlined">
            <CardActionArea component={Link} href={section.href}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: 'primary.main', display: 'flex' }} aria-hidden>{section.icon}</Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>{section.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{section.description}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
