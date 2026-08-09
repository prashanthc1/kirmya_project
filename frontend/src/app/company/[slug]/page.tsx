'use client';

/**
 * The public company home page.
 *
 * It is a summary that links onward rather than a copy of every tab: the
 * overview, the most recent openings and the most recent updates. Everything
 * here is what the API returns for this viewer, so an anonymous visitor and a
 * member see the same page minus whatever the server withheld.
 */
import React from 'react';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';

import CompanyProfile from '../../../components/company/CompanyProfile';
import CompanyAbout from '../../../components/company/CompanyAbout';
import CompanyJobs from '../../../components/company/CompanyJobs';
import CompanyUpdates from '../../../components/company/CompanyUpdates';
import GlassPanel from '../../../components/company/GlassPanel';
import { StatTile, AutoGrid } from '../../../components/company/CompanyBadges';

const numberFormat = new Intl.NumberFormat();

export default function CompanyHomePage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? '';

  return (
    <CompanyProfile slug={slug} activeTab="home">
      {(company) => (
        <Stack spacing={4}>
          <AutoGrid min={180}>
            <StatTile label="Followers" value={numberFormat.format(company.followersCount)} />
            <StatTile label="Open jobs" value={numberFormat.format(company.openJobsCount)} />
            <StatTile label="People on Kirmya" value={numberFormat.format(company.employeesCount)} />
            <StatTile
              label="Reviews"
              value={
                company.reviewCount > 0
                  ? `${company.rating.toFixed(1)} · ${numberFormat.format(company.reviewCount)}`
                  : 'None yet'
              }
            />
          </AutoGrid>

          <GlassPanel
            title="Overview"
            action={
              <Button
                component={NextLink}
                href={`/company/${company.slug}/about`}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Read more
              </Button>
            }
          >
            {company.description ? (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.8,
                  display: '-webkit-box',
                  WebkitLineClamp: 8,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {company.description}
              </Typography>
            ) : (
              <CompanyAbout company={company} />
            )}
          </GlassPanel>

          <Box component="section">
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                Latest openings
              </Typography>
              <Button
                component={NextLink}
                href={`/company/${company.slug}/jobs`}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                All jobs
              </Button>
            </Stack>
            <CompanyJobs
              identifier={slug}
              pageSize={3}
              emptyMessage={`${company.name} has no open roles on Kirmya right now.`}
            />
          </Box>

          <Divider />

          <Box component="section">
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                Recent updates
              </Typography>
              <Button
                component={NextLink}
                href={`/company/${company.slug}/updates`}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                All updates
              </Button>
            </Stack>
            <CompanyUpdates
              identifier={slug}
              companyId={company.id}
              companyName={company.name}
              companyLogoUrl={company.logoUrl}
              viewer={company.viewer}
              pageSize={3}
            />
          </Box>
        </Stack>
      )}
    </CompanyProfile>
  );
}
