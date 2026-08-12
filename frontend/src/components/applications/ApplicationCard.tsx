'use client';

import React from 'react';
import { Box, Paper, Typography, Avatar, Chip, Button, IconButton, Tooltip, Stack } from '@mui/material';
import { surfaceTransition } from '../../theme/motion';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MessageIcon from '@mui/icons-material/Message';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { ApplicationSummary, ApplicationStage } from '@/features/applications/types';

interface ApplicationCardProps {
  application: ApplicationSummary;
  onViewDetails: (app: ApplicationSummary) => void;
  onMessageRecruiter?: (app: ApplicationSummary) => void;
  onWithdraw?: (app: ApplicationSummary) => void;
  onToggleSave?: (app: ApplicationSummary) => void;
}

const getStatusColor = (status: ApplicationStage) => {
  switch (status) {
    case 'Applied':
      return { bg: 'rgba(0, 102, 255, 0.12)', color: '#0066FF' };
    case 'Viewed':
      return { bg: 'rgba(0, 204, 255, 0.12)', color: '#00CCFF' };
    case 'Shortlisted':
      return { bg: 'rgba(255, 153, 0, 0.12)', color: '#FF9900' };
    case 'Interview':
      return { bg: 'rgba(153, 51, 255, 0.12)', color: '#9933FF' };
    case 'Offer':
      return { bg: 'rgba(0, 204, 102, 0.12)', color: '#00CC66' };
    case 'Accepted':
      return { bg: 'rgba(51, 204, 51, 0.12)', color: '#33CC33' };
    case 'Rejected':
      return { bg: 'rgba(255, 51, 102, 0.12)', color: '#FF3366' };
    default:
      return { bg: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF' };
  }
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onViewDetails,
  onMessageRecruiter,
  onWithdraw,
  onToggleSave,
}) => {
  const statusStyle = getStatusColor(application.current_status);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: surfaceTransition(0.25),
        '&:hover': {
          borderColor: 'rgba(0, 102, 255, 0.4)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar
            src={application.company_logo}
            alt={application.company_name}
            variant="rounded"
            sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'background.paper' }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>
              {application.job_title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
              {application.company_name}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={application.current_status}
          size="small"
          sx={{
            bgcolor: statusStyle.bg,
            color: statusStyle.color,
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: 1.5,
          }}
        />
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <LocationOnIcon fontSize="small" sx={{ color: 'primary.main', fontSize: 16 }} />
          <Typography variant="caption">{application.location}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
          <Typography variant="caption">Applied {new Date(application.applied_at).toLocaleDateString()}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'primary.light', fontWeight: 600 }}>
          {application.salary_range}
        </Typography>
      </Stack>

      {application.recruiter_name && (
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={application.recruiter_avatar} sx={{ width: 28, height: 28 }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Recruiter Contact
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                {application.recruiter_name}
              </Typography>
            </Box>
          </Box>
          {onMessageRecruiter && (
            <IconButton size="small" onClick={() => onMessageRecruiter(application)} sx={{ color: 'primary.main' }}>
              <MessageIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}

      {application.next_interview_date && (
        <Box
          sx={{
            p: 1.2,
            mb: 2,
            borderRadius: 2,
            background: 'rgba(153, 51, 255, 0.1)',
            border: '1px solid rgba(153, 51, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#CC99FF',
          }}
        >
          <EventIcon fontSize="small" />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Interview: {new Date(application.next_interview_date).toLocaleString()}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={() => onViewDetails(application)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #0066FF 0%, #00CCFF 100%)',
          }}
        >
          View Details
        </Button>

        <Stack direction="row" spacing={0.5}>
          {onToggleSave && (
            <Tooltip title={application.is_saved ? 'Remove Bookmark' : 'Save Opportunity'}>
              <IconButton size="small" onClick={() => onToggleSave(application)} sx={{ color: application.is_saved ? '#FF9900' : 'text.secondary' }}>
                {application.is_saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          {onWithdraw && application.current_status !== 'Rejected' && application.current_status !== 'Accepted' && (
            <Tooltip title="Withdraw Application">
              <IconButton size="small" onClick={() => onWithdraw(application)} sx={{ color: 'error.main' }}>
                <CancelOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};
