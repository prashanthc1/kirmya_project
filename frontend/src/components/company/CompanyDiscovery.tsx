'use client';

/**
 * Curated company rails on the directory landing page.
 *
 * Each rail is a list the server computed; a rail with nothing in it is not
 * rendered rather than being padded out with unrelated companies. The
 * personalised rails simply come back empty for anonymous visitors.
 */
import React from 'react';
import { Alert, Box, Skeleton, Stack, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

import { useCompanyDiscovery } from '../../features/company/hooks';
import { CompanySummary } from '../../features/company/types';
import { AutoGrid } from './CompanyBadges';
import CompanySummaryCard from './CompanySummaryCard';

interface Rail {
  key: string;
  title: string;
  caption: string;
  icon: React.ReactNode;
  companies: CompanySummary[];
}

export const CompanyDiscovery: React.FC = () => {
  const { data, isLoading, isError, error } = useCompanyDiscovery();

  if (isLoading) {
    return (
      <Stack spacing={4}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Box key={index}>
            <Skeleton variant="text" width={220} height={36} />
            <AutoGrid min={300}>
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <Skeleton
                  key={cardIndex}
                  variant="rounded"
                  height={170}
                  sx={{ borderRadius: '16px' }}
                />
              ))}
            </AutoGrid>
          </Box>
        ))}
      </Stack>
    );
  }

  if (isError) {
    return <Alert severity="error">{error?.message || 'Discovery is unavailable right now.'}</Alert>;
  }

  const rails: Rail[] = [
    {
      key: 'hiringForYourSkills',
      title: 'Hiring for your skills',
      caption: 'Open roles that match the skills on your profile',
      icon: <PsychologyOutlinedIcon color="primary" />,
      companies: data?.hiringForYourSkills ?? [],
    },
    {
      key: 'hiringNearYou',
      title: 'Hiring near you',
      caption: 'Companies recruiting in your location',
      icon: <NearMeOutlinedIcon color="primary" />,
      companies: data?.hiringNearYou ?? [],
    },
    {
      key: 'followedByConnections',
      title: 'Followed by your connections',
      caption: 'Companies people in your network follow',
      icon: <GroupsOutlinedIcon color="primary" />,
      companies: data?.followedByConnections ?? [],
    },
    {
      key: 'trending',
      title: 'Trending',
      caption: 'Gaining followers fastest this week',
      icon: <TrendingUpIcon color="primary" />,
      companies: data?.trending ?? [],
    },
    {
      key: 'hiring',
      title: 'Actively hiring',
      caption: 'Companies with open roles right now',
      icon: <WorkOutlineIcon color="primary" />,
      companies: data?.hiring ?? [],
    },
    {
      key: 'topEmployers',
      title: 'Top rated employers',
      caption: 'Highest rated by the people who work there',
      icon: <EmojiEventsOutlinedIcon color="primary" />,
      companies: data?.topEmployers ?? [],
    },
    {
      key: 'fastGrowing',
      title: 'Fast growing',
      caption: 'Growing their team quickest',
      icon: <RocketLaunchOutlinedIcon color="primary" />,
      companies: data?.fastGrowing ?? [],
    },
  ].filter((rail) => rail.companies.length > 0);

  if (rails.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
        No company recommendations yet. Try searching instead.
      </Typography>
    );
  }

  return (
    <Stack spacing={5}>
      {rails.map((rail) => (
        <Box key={rail.key} component="section">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            {rail.icon}
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
              {rail.title}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {rail.caption}
          </Typography>
          <AutoGrid min={300}>
            {rail.companies.map((company) => (
              <CompanySummaryCard key={`${rail.key}-${company.id}`} company={company} />
            ))}
          </AutoGrid>
        </Box>
      ))}
    </Stack>
  );
};

export default CompanyDiscovery;
