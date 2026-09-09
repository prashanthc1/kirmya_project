'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Box, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import { routes } from '../../../../shared/routes';

/**
 * Community management overview.
 *
 * A hub for the sections that exist, and a way back to the community itself.
 * It lists what can be done rather than restating figures from elsewhere: a
 * management landing page that invents a metric is the defect this project has
 * spent several batches removing.
 */
export default function CommunityAdminOverviewPage() {
  const params = useParams();
  const raw = params?.id;
  const slug = Array.isArray(raw) ? raw[0] : (raw ?? '');

  const sections = [
    {
      href: routes.community.admin.moderation(slug),
      title: 'Moderation',
      description: 'Review reported posts and take moderation action.',
      icon: <GavelOutlinedIcon />,
    },
    {
      href: routes.community.admin.settings(slug),
      title: 'Settings',
      description: 'Name, description, visibility and joining rules.',
      icon: <SettingsOutlinedIcon />,
    },
  ];

  return (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Manage community
        </Typography>
        <Button
          component={Link}
          href={routes.community.view(slug)}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: 'none' }}
        >
          Back to community
        </Button>
      </Stack>

      <Stack spacing={2}>
        {sections.map(section => (
          <Card key={section.href} variant="outlined">
            <CardActionArea component={Link} href={section.href}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: 'primary.main', display: 'flex' }} aria-hidden>
                    {section.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.description}
                    </Typography>
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
