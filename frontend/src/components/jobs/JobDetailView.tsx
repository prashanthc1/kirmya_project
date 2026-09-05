'use client';

import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  Button,
  Avatar,
  Divider,
  Paper,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { JobDetail } from '../../features/jobs/types';
import { jobsApi } from '../../features/jobs/api';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';
import SavedJobButton from './SavedJobButton';
import ApplyJobModal from '../applications/ApplyJobModal';

export interface JobDetailViewProps {
  job: JobDetail;
  isSaved?: boolean;
  onSaveToggle?: (isSaved: boolean) => void;
}

export const JobDetailView: React.FC<JobDetailViewProps> = ({
  job,
  isSaved: initialSaved = false,
  onSaveToggle,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { authenticated } = useAuth();

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [savedState, setSavedState] = useState(initialSaved);

  // Sync saved state with backend when authenticated
  React.useEffect(() => {
    if (authenticated && job?.id) {
      jobsApi.isJobSaved(job.id).then((saved) => {
        setSavedState(saved);
      }).catch(() => {});
    }
  }, [authenticated, job?.id]);

  const handleApplyClick = () => {
    if (!authenticated) {
      router.push(ROUTES.AUTH.LOGIN);
      return;
    }
    setApplyModalOpen(true);
  };

  const handleSaveToggle = (nextSaved: boolean) => {
    setSavedState(nextSaved);
    onSaveToggle?.(nextSaved);
  };

  return (
    <Box component="article" sx={{ py: 2 }}>
      {/* Header Container */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: `${tokens.radius.lg}px`,
          mb: 4,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Avatar
              src={job.company_logo || undefined}
              variant="rounded"
              sx={{
                width: 64,
                height: 64,
                bgcolor: theme.palette.primary.main,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.5rem',
                borderRadius: `${tokens.radius.md}px`,
              }}
            >
              {(job.company_name || 'K').charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
                {job.title}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                {job.company_handle ? (
                  <Link href={`/company/${job.company_handle}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {job.company_name}
                  </Link>
                ) : (
                  job.company_name || 'Verified Employer'
                )}
                {job.department ? ` • ${job.department}` : ''}
              </Typography>
            </Box>

            <SavedJobButton
              jobId={job.id}
              jobTitle={job.title}
              initialSaved={savedState}
              onToggle={handleSaveToggle}
              size="medium"
            />
          </Stack>

          {/* Key Metadata Badges */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 1 }}>
            {job.location && (
              <Chip icon={<LocationOnOutlinedIcon />} label={job.location} variant="outlined" />
            )}
            {job.work_mode && (
              <Chip label={job.work_mode.toUpperCase()} variant="outlined" color="primary" />
            )}
            {job.employment_type && (
              <Chip icon={<WorkOutlineIcon />} label={job.employment_type} variant="outlined" />
            )}
            {job.salary_range && (
              <Chip icon={<PaymentsOutlinedIcon />} label={job.salary_range} color="success" />
            )}
            {job.is_featured && (
              <Chip label="Featured" color="primary" />
            )}
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* Action CTAs */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            {applied ? (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleOutlineIcon />}
                disabled
                sx={{ borderRadius: `${tokens.radius.md}px`, px: 4 }}
              >
                Application Submitted
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleApplyClick}
                sx={{
                  borderRadius: `${tokens.radius.md}px`,
                  px: 4,
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                Apply for this Role
              </Button>
            )}

            <Button
              component={Link}
              href={ROUTES.JOBS}
              variant="outlined"
              size="large"
              sx={{ borderRadius: `${tokens.radius.md}px` }}
            >
              Back to All Jobs
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Main Body Grid */}
      <Stack spacing={4}>
        {/* Description Section */}
        {job.description && (
          <Paper elevation={1} sx={{ p: { xs: 3, md: 4 }, borderRadius: `${tokens.radius.lg}px` }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
              About the Role
            </Typography>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-line',
                lineHeight: 1.7,
                color: 'text.secondary',
              }}
            >
              {job.description}
            </Typography>
          </Paper>
        )}

        {/* Responsibilities Section */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <Paper elevation={1} sx={{ p: { xs: 3, md: 4 }, borderRadius: `${tokens.radius.lg}px` }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
              Key Responsibilities
            </Typography>
            <Stack spacing={1.5}>
              {job.responsibilities.map((resp, idx) => (
                <Stack key={idx} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 1.2, flexShrink: 0 }} />
                  <Typography variant="body1" color="text.secondary">
                    {resp}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Requirements Section */}
        {job.requirements && job.requirements.length > 0 && (
          <Paper elevation={1} sx={{ p: { xs: 3, md: 4 }, borderRadius: `${tokens.radius.lg}px` }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
              Qualifications & Requirements
            </Typography>
            <Stack spacing={1.5}>
              {job.requirements.map((req, idx) => (
                <Stack key={idx} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 1.2, flexShrink: 0 }} />
                  <Typography variant="body1" color="text.secondary">
                    {req}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Required Skills Chips */}
        {job.skills && job.skills.length > 0 && (
          <Paper elevation={1} sx={{ p: { xs: 3, md: 4 }, borderRadius: `${tokens.radius.lg}px` }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
              Relevant Skills & Technologies
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
              {job.skills.map((skill) => (
                <Chip key={skill} label={skill} color="primary" variant="outlined" />
              ))}
            </Stack>
          </Paper>
        )}

        {/* Benefits Section */}
        {job.benefits && job.benefits.length > 0 && (
          <Paper elevation={1} sx={{ p: { xs: 3, md: 4 }, borderRadius: `${tokens.radius.lg}px` }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
              Benefits & Perks
            </Typography>
            <Stack spacing={1.5}>
              {job.benefits.map((benefit, idx) => (
                <Stack key={idx} direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', mt: 1.2, flexShrink: 0 }} />
                  <Typography variant="body1" color="text.secondary">
                    {benefit}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}
      </Stack>

      {/* Interactive Multi-Step Application Modal */}
      <ApplyJobModal
        open={applyModalOpen}
        job={job}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={() => {
          setApplied(true);
        }}
      />
    </Box>
  );
};

export default JobDetailView;
