'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';

import CompanyDashboardShell from '../../../components/company/CompanyDashboardShell';
import CompanyDashboard from '../../../components/company/CompanyDashboard';
import GlassPanel from '../../../components/company/GlassPanel';

export default function EmployerDashboardPage() {
  return (
    <CompanyDashboardShell
      title="Employer Recruitment Dashboard"
      description="Monitor active jobs, recruitment pipelines, applicant tracking, and recruiter activity."
      requires="company:view"
      actions={({ companyId }) => (
        <Stack direction="row" spacing={1.5}>
          <Button
            component={NextLink}
            href={`/employer/jobs?company=${companyId}`}
            variant="contained"
            size="small"
            startIcon={<WorkOutlineIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Post New Job
          </Button>
          <Button
            component={NextLink}
            href={`/employer/team?company=${companyId}`}
            variant="outlined"
            size="small"
            startIcon={<GroupAddOutlinedIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Invite Recruiter
          </Button>
          <Button
            component={NextLink}
            href={`/employer/settings?company=${companyId}`}
            variant="outlined"
            size="small"
            startIcon={<SettingsOutlinedIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Settings
          </Button>
        </Stack>
      )}
    >
      {({ membership, companyId, can }) => (
        <Stack spacing={3}>
          {/* Quick Recruitment Metric Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '12px',
                        bgcolor: 'primary.50',
                        color: 'primary.main',
                        display: 'flex',
                      }}
                    >
                      <WorkOutlineIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Active Jobs
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {membership.company.openJobsCount ?? 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '12px',
                        bgcolor: 'info.50',
                        color: 'info.main',
                        display: 'flex',
                      }}
                    >
                      <DescriptionOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Applications
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        Tracker Active
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '12px',
                        bgcolor: 'secondary.50',
                        color: 'secondary.main',
                        display: 'flex',
                      }}
                    >
                      <PeopleAltOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Candidates
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        Pipeline Ready
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '12px',
                        bgcolor: 'warning.50',
                        color: 'warning.main',
                        display: 'flex',
                      }}
                    >
                      <EventAvailableOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Interviews
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        Coordinated
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  bgcolor: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '12px',
                        bgcolor: 'success.50',
                        color: 'success.main',
                        display: 'flex',
                      }}
                    >
                      <HowToRegOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Followers
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {membership.company.followersCount ?? 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Main Company Overview */}
          <CompanyDashboard
            companyId={companyId}
            slug={membership.company.slug}
            can={can}
          />
        </Stack>
      )}
    </CompanyDashboardShell>
  );
}
