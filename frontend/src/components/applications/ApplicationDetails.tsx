'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  Grid,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import MessageIcon from '@mui/icons-material/Message';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { ApplicationDetail } from '@/features/applications/types';
import { ApplicationTimeline } from './ApplicationTimeline';

interface ApplicationDetailsProps {
  detail: ApplicationDetail;
  onClose?: () => void;
  onMessageRecruiter?: () => void;
  onWithdraw?: () => void;
}

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  detail,
  onClose,
  onMessageRecruiter,
  onWithdraw,
}) => {
  const { summary } = detail;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
          <Avatar
            src={summary.company_logo}
            alt={summary.company_name}
            variant="rounded"
            sx={{ width: 64, height: 64, borderRadius: 2 }}
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {summary.job_title}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              {summary.company_name}
            </Typography>
          </Box>
        </Box>
        {onClose && (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Job Details
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon sx={{ color: 'primary.main' }} />
                <Typography variant="body2">{summary.location}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon sx={{ color: 'primary.main' }} />
                <Typography variant="body2">{summary.employment_type}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyIcon sx={{ color: 'primary.main' }} />
                <Typography variant="body2">{summary.salary_range}</Typography>
              </Box>
            </Stack>

            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 3, whitespace: 'pre-line' }}>
              {detail.job_description}
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Key Skills & Tech Stack
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {detail.skills.map((skill) => (
                <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
              ))}
            </Box>

            {detail.submitted_resume && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0, 102, 255, 0.08)', border: '1px solid rgba(0, 102, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DescriptionIcon sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Submitted Resume
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {detail.submitted_resume.title}
                    </Typography>
                  </Box>
                </Box>
                <Button size="small" variant="text" component="a" href={detail.submitted_resume.file_url} target="_blank">
                  View
                </Button>
              </Box>
            )}
          </Paper>

          {detail.offer && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(0, 204, 102, 0.08)',
                border: '1px solid rgba(0, 204, 102, 0.3)',
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#00CC66', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlineIcon /> Job Offer Received!
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Congratulations! You received a formal job offer for <strong>{detail.offer.position_title}</strong> with compensation <strong>{detail.offer.salary}</strong>.
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Benefits: {detail.offer.benefits}
              </Typography>
              <Button variant="contained" color="success" sx={{ borderRadius: 2, fontWeight: 700 }}>
                Accept Offer
              </Button>
            </Paper>
          )}

          <ApplicationTimeline timeline={detail.timeline} currentStatus={summary.current_status} />
        </Grid>

        <Grid item xs={12} md={4}>
          {summary.recruiter_name && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                mb: 3,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Assigned Recruiter
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={summary.recruiter_avatar} sx={{ width: 48, height: 48 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {summary.recruiter_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {summary.recruiter_email}
                  </Typography>
                </Box>
              </Box>
              {onMessageRecruiter && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MessageIcon />}
                  onClick={onMessageRecruiter}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Send Message
                </Button>
              )}
            </Paper>
          )}

          {onWithdraw && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={onWithdraw}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Withdraw Application
            </Button>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};
