'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Avatar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ApplicationDetail, ApplicationSummary } from '../../features/applications/types';
import { ApplicationTimeline } from './ApplicationTimeline';
import { getStatusChipProps } from './ApplicationCard';
import { tokens } from '../../theme/tokens';

interface ApplicationDetailsProps {
  application?: ApplicationDetail;
  detail?: ApplicationDetail;
  onWithdraw?: () => void;
  onMessageRecruiter?: () => void;
}

const STAGES_ORDER = ['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Offer', 'Accepted'];

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  application: appProp,
  detail: detailProp,
  onWithdraw,
  onMessageRecruiter,
}) => {
  const application = appProp || detailProp;
  const router = useRouter();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  if (!application || !application.summary) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: `${tokens.radius.lg}px` }}>
        <Typography variant="body1" color="text.secondary">
          Loading application details...
        </Typography>
      </Paper>
    );
  }

  const { summary, timeline = [], submitted_resume, submitted_cover_letter, interviews = [], offer } = application;
  const chipProps = getStatusChipProps(summary.current_status);

  // Stepper calculations
  const activeStep = STAGES_ORDER.indexOf(summary.current_status);
  const isRejected = summary.current_status === 'Rejected';
  const isWithdrawn = summary.current_status === 'Withdrawn';

  const handleConfirmWithdraw = () => {
    setWithdrawOpen(false);
    if (onWithdraw) onWithdraw();
  };

  return (
    <Box data-testid="application-details" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Banner Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2.5}
        >
          {/* Company & Job Information */}
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Avatar
              src={summary.company_logo}
              alt={summary.company_name}
              sx={{
                width: 64,
                height: 64,
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: 'primary.main',
                fontWeight: 800,
                fontSize: '1.5rem',
              }}
            >
              {summary.company_name ? summary.company_name[0].toUpperCase() : 'C'}
            </Avatar>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {summary.job_title}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25 }}>
                {summary.company_name}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                {summary.location && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <LocationOnOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {summary.location}
                    </Typography>
                  </Stack>
                )}

                {summary.salary_range && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AttachMoneyIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {summary.salary_range}
                    </Typography>
                  </Stack>
                )}

                {summary.employment_type && (
                  <Chip
                    label={summary.employment_type}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>

          {/* Status & Secondary Actions */}
          <Stack direction={{ xs: 'row', md: 'column' }} alignItems={{ xs: 'center', md: 'flex-end' }} spacing={1.5}>
            <Chip
              {...chipProps}
              sx={{
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: `${tokens.radius.pill}px`,
                px: 1,
                py: 0.5,
              }}
            />

            <Stack direction="row" spacing={1}>
              <Button
                component={Link}
                href={`/jobs/${summary.job_id}`}
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon fontSize="small" />}
                sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 600 }}
              >
                Job Posting
              </Button>

              {!isWithdrawn && !isRejected && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setWithdrawOpen(true)}
                  sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 600 }}
                >
                  Withdraw
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* Status Explanation Box */}
        {summary.status_explanation && (
          <Alert
            severity={
              isRejected
                ? 'error'
                : isWithdrawn
                ? 'info'
                : summary.current_status === 'Offer'
                ? 'success'
                : 'info'
            }
            icon={isRejected ? undefined : <CheckCircleIcon fontSize="inherit" />}
            sx={{
              mt: 3,
              borderRadius: `${tokens.radius.md}px`,
              fontWeight: 500,
            }}
          >
            {summary.status_explanation}
          </Alert>
        )}
      </Paper>

      {/* Pipeline Stepper (If not withdrawn or rejected) */}
      {!isWithdrawn && !isRejected && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5 }}>
            Application Stage Progress
          </Typography>

          <Stepper
            activeStep={activeStep >= 0 ? activeStep : 0}
            alternativeLabel
            sx={{
              '& .MuiStepLabel-label': {
                fontWeight: 700,
                fontSize: '0.8rem',
              },
            }}
          >
            {STAGES_ORDER.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      {/* Main Grid: Details + Sidebar */}
      <Grid container spacing={3}>
        {/* Left Column: Timeline & Offer */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Offer Card if present */}
            {offer && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.06)',
                  border: '1px solid',
                  borderColor: 'success.main',
                }}
              >
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 800, mb: 1 }}>
                  Formal Job Offer
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {offer.position_title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Compensation: {offer.salary} {offer.currency} • Contract: {offer.contract_type}
                </Typography>
                {offer.benefits && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Benefits: {offer.benefits}
                  </Typography>
                )}
              </Paper>
            )}

            {/* Application Timeline */}
            <ApplicationTimeline items={timeline} />
          </Stack>
        </Grid>

        {/* Right Column: Submitted Documents & Contact */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Submitted Documents */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: `${tokens.radius.lg}px`,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                Submitted Documents
              </Typography>

              <Stack spacing={1.5}>
                {submitted_resume ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: `${tokens.radius.md}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <DescriptionOutlinedIcon color="primary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {submitted_resume.title || 'Resume PDF'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Submitted Document
                        </Typography>
                      </Box>
                    </Stack>

                    {submitted_resume.file_url && (
                      <Button
                        component="a"
                        href={submitted_resume.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        startIcon={<FileDownloadOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        View
                      </Button>
                    )}
                  </Paper>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Profile Snapshot submitted with application.
                  </Typography>
                )}

                {submitted_cover_letter && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: `${tokens.radius.md}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <DescriptionOutlinedIcon color="secondary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {submitted_cover_letter.title || 'Cover Letter'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cover Letter
                        </Typography>
                      </Box>
                    </Stack>

                    {submitted_cover_letter.file_url && (
                      <Button
                        component="a"
                        href={submitted_cover_letter.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        startIcon={<FileDownloadOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        View
                      </Button>
                    )}
                  </Paper>
                )}
              </Stack>
            </Paper>

            {/* Scheduled Interviews */}
            {interviews.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventOutlinedIcon color="primary" /> Interview Schedule
                </Typography>

                <Stack spacing={1.5}>
                  {interviews.map((iv) => (
                    <Paper key={iv.id} variant="outlined" sx={{ p: 2, borderRadius: `${tokens.radius.md}px` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {iv.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {new Date(iv.scheduled_start).toLocaleString()}
                      </Typography>
                      {iv.meeting_link && (
                        <Button
                          component="a"
                          href={iv.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="contained"
                          size="small"
                          sx={{ mt: 1.5, borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
                        >
                          Join Interview Video
                        </Button>
                      )}
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Recruiter Contact */}
            {summary.recruiter_name && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Assigned Recruiter
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={summary.recruiter_avatar} sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 800 }}>
                    {summary.recruiter_name[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {summary.recruiter_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Talent Acquisition Lead
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  component={Link}
                  href="/messages"
                  variant="outlined"
                  fullWidth
                  startIcon={<EmailOutlinedIcon />}
                  sx={{ mt: 2, borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
                >
                  Send Message
                </Button>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberOutlinedIcon color="error" /> Withdraw Application
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to withdraw your application for <strong>{summary.job_title}</strong> at {summary.company_name}? This action will notify the hiring team.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWithdrawOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmWithdraw} color="error" variant="contained">
            Confirm Withdrawal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationDetails;
