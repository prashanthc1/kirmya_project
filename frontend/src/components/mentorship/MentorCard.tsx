import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  Stack,
  Rating,
  Divider,
} from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Link from 'next/link';
import { MentorProfile } from '../../features/mentorship/types';

interface MentorCardProps {
  mentor: MentorProfile;
  onRequestMentorship?: (mentor: MentorProfile) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor, onRequestMentorship }) => {
  const getAvailabilityColor = (status: MentorProfile['availability']) => {
    switch (status) {
      case 'available':
        return { label: 'Available', color: 'success' as const };
      case 'busy':
        return { label: 'Limited Spots', color: 'warning' as const };
      case 'unavailable':
      default:
        return { label: 'Unavailable', color: 'default' as const };
    }
  };

  const avail = getAvailabilityColor(mentor.availability);

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.75)'
            : 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(255, 255, 255, 0.6)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: (theme) =>
          theme.palette.mode === 'light'
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.08)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        borderRadius: '20px',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 16px 40px 0 rgba(99, 102, 241, 0.15)'
              : '0 16px 40px 0 rgba(0, 0, 0, 0.5)',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header: Avatar, Name, Rating, Availability */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar
            src={mentor.avatar}
            alt={mentor.name}
            sx={{
              width: 64,
              height: 64,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
            }}
          />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700} noWrap>
                {mentor.name}
              </Typography>
              <Chip
                label={avail.label}
                color={avail.color}
                size="small"
                variant="filled"
                sx={{ fontWeight: 600, fontSize: '0.72rem' }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ fontWeight: 500 }}>
              {mentor.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <WorkOutlineIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {mentor.company} • {mentor.experience_years} yrs exp
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Rating and Price */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            bgcolor: (theme) =>
              theme.palette.mode === 'light'
                ? 'rgba(99, 102, 241, 0.05)'
                : 'rgba(129, 140, 248, 0.08)',
            p: 1.25,
            borderRadius: '12px',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StarRoundedIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            <Typography variant="body2" fontWeight={700}>
              {mentor.rating.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({mentor.total_reviews} reviews)
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            {mentor.pricing_model === 'free' || mentor.rate === 0
              ? 'Free Mentorship'
              : `$${mentor.rate}/session`}
          </Typography>
        </Box>

        {/* Bio */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.5,
          }}
        >
          {mentor.bio}
        </Typography>

        {/* Topics */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
            Core Focus Areas
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ gap: 0.75 }}>
            {mentor.topics.slice(0, 3).map((topic) => (
              <Chip
                key={topic}
                label={topic}
                size="small"
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === 'light'
                      ? 'rgba(99, 102, 241, 0.08)'
                      : 'rgba(129, 140, 248, 0.15)',
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Skills */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
            Skills & Expertise
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
            {mentor.skills.slice(0, 4).map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.72rem' }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              component={Link}
              href={`/mentorship/mentors/${mentor.id}`}
              variant="outlined"
              size="medium"
              fullWidth
              sx={{ borderRadius: '12px', fontWeight: 600 }}
            >
              View Profile
            </Button>
            <Button
              variant="contained"
              size="medium"
              fullWidth
              disabled={mentor.availability === 'unavailable'}
              onClick={() => onRequestMentorship?.(mentor)}
              sx={{
                borderRadius: '12px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
              }}
            >
              Request
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MentorCard;
