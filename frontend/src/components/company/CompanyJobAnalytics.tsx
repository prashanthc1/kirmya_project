'use client';

/**
 * Per-job analytics.
 *
 * This reads the Jobs and Applications modules through the company analytics
 * endpoint; it does not own a job, edit one, or hold a second copy of an
 * application. Acting on a candidate happens in the recruiter screens, which is
 * where the ATS already lives.
 */
import React from 'react';
import NextLink from 'next/link';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useJobAnalytics } from '../../features/company/hooks';
import { AutoGrid, StatTile } from './CompanyBadges';
import { FunnelBars } from './charts';

const numberFormat = new Intl.NumberFormat();

/** Hours as the largest sensible unit. Zero means "not measured yet". */
const duration = (hours: number): string => {
  if (!hours || hours <= 0) return 'Not measured yet';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} days`;
};

interface CompanyJobAnalyticsProps {
  companyId: string;
  jobId: string;
}

export const CompanyJobAnalytics: React.FC<CompanyJobAnalyticsProps> = ({ companyId, jobId }) => {
  const { data, isLoading, isError, error } = useJobAnalytics(companyId, jobId);

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <AutoGrid min={180}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={104} sx={{ borderRadius: '16px' }} />
          ))}
        </AutoGrid>
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: '16px' }} />
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px' }}>
        {error?.message || 'This job’s analytics could not be loaded.'}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <AutoGrid min={180}>
        <StatTile label="Views" value={numberFormat.format(data.views)} />
        <StatTile
          label="Unique viewers"
          value={numberFormat.format(data.uniqueViews)}
          caption="Distinct signed-in and signed-out visitors"
        />
        <StatTile
          label="Applications"
          value={numberFormat.format(data.applications)}
          caption={`${(data.conversionRate * 100).toFixed(1)}% of views`}
        />
        <StatTile
          label="Qualified"
          value={numberFormat.format(data.qualifiedApplications)}
          caption="Met the screening criteria on the job"
        />
        <StatTile label="Time to first review" value={duration(data.avgTimeToReviewHours)} />
        <StatTile label="Time to hire" value={duration(data.avgTimeToHireHours)} />
      </AutoGrid>

      <div>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Pipeline
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <FunnelBars
          stages={[
            { label: 'Applications', value: data.applications },
            { label: 'Shortlisted', value: data.shortlisted },
            { label: 'Interviews', value: data.interviews },
            { label: 'Offers', value: data.offers },
            { label: 'Hires', value: data.hires },
          ]}
        />
      </div>

      <Button
        component={NextLink}
        href={`/recruiter/applications/${data.jobId}`}
        variant="outlined"
        size="small"
        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
      >
        Open applications in the recruiter workspace
      </Button>
    </Stack>
  );
};

interface JobAnalyticsDialogProps {
  companyId: string;
  jobId: string | null;
  jobTitle?: string;
  onClose: () => void;
}

/** The same panel in a dialog, opened from a job row in the dashboard. */
export const JobAnalyticsDialog: React.FC<JobAnalyticsDialogProps> = ({
  companyId,
  jobId,
  jobTitle,
  onClose,
}) => (
  <Dialog open={!!jobId} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle sx={{ pr: 6 }}>
      {jobTitle || 'Job analytics'}
      <IconButton
        onClick={onClose}
        aria-label="Close"
        sx={{ position: 'absolute', right: 12, top: 12 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>
      {jobId && <CompanyJobAnalytics companyId={companyId} jobId={jobId} />}
    </DialogContent>
  </Dialog>
);

export default CompanyJobAnalytics;
