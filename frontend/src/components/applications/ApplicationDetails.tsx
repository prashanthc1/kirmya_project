'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Button, Stepper, Step, StepLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ApplicationDetail } from '@/features/applications/types';
import { ApplicationTimeline } from './ApplicationTimeline';
import { useRouter } from 'next/navigation';

interface ApplicationDetailsProps {
  application?: ApplicationDetail;
  detail?: ApplicationDetail;
  onWithdraw?: () => void;
  onMessageRecruiter?: () => void;
}

export function ApplicationDetails({
  application: appProp,
  detail: detailProp,
  onWithdraw,
  onMessageRecruiter,
}: ApplicationDetailsProps) {
  const application = appProp || detailProp;
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const router = useRouter();

  if (!application) return <Typography>Loading...</Typography>;
  
  const steps = ['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Offer'];
  const currentStep = steps.indexOf(application.summary.current_status);

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="text" sx={{ mb: 2 }} onClick={() => router.push('/applications')}>Back to Applications</Button>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4">{application.summary.job_title}</Typography>
          <Typography variant="h6" color="text.secondary">{application.summary.company_name}</Typography>
          <Typography>{application.summary.location} • {application.summary.salary_range}</Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
            Under Review: The recruiter has reviewed your application profile
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={currentStep >= 0 ? currentStep : 0}>
          {steps.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      <ApplicationTimeline items={application.timeline} />

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Submitted Documents</Typography>
        <Button sx={{ mr: 2 }}>Resume PDF</Button>
        <Button>Cover Letter PDF</Button>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Button variant="outlined" color="error" onClick={() => setWithdrawOpen(true)}>Withdraw Application</Button>
        <Button variant="outlined" sx={{ ml: 2 }}>View Original Job Posting</Button>
      </Box>

      <Dialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)}>
        <DialogTitle>Withdraw</DialogTitle>
        <DialogContent>Are you sure?</DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => setWithdrawOpen(false)}>Withdraw</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
