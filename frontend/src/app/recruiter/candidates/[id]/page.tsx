'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Box, Typography, Button, Stack, Avatar, Paper, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';
import RecruiterLayout from '../../../../components/recruiter/RecruiterLayout';
import MatchScoreCard from '../../../../components/recruiter/search/MatchScoreCard';
import { candidateSearchApi } from '../../../../features/recruiter/search/api';
import { CandidateSearchResultItem } from '../../../../features/recruiter/search/types';

export default function CandidateDetailPage() {
  const params = useParams();
  const [candidate, setCandidate] = useState<CandidateSearchResultItem | null>(null);

  useEffect(() => {
    if (params?.id) {
      candidateSearchApi.getCandidateDetail(params.id as string).then((res) => setCandidate(res)).catch(() => {});
    }
  }, [params?.id]);

  if (!candidate) return null;

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} component="a" href="/recruiter/candidates" sx={{ fontWeight: 700, mb: 2 }}>
          Back to Search
        </Button>
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar src={candidate.avatarUrl} sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontWeight: 800, fontSize: '2rem' }}>
            {candidate.name[0]}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {candidate.name}
              </Typography>
              <Chip label={`${candidate.aiMatch.overallScore}% MATCH`} color="success" sx={{ fontWeight: 900 }} />
            </Stack>
            <Typography variant="subtitle1" color="text.secondary">
              {candidate.headline}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {candidate.location} • {candidate.yearsExperience} Years Experience
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Button variant="contained" startIcon={<MessageIcon />} sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Send Message
        </Button>
        <Button variant="outlined" startIcon={<DescriptionIcon />} component="a" href={candidate.resumeUrl} target="_blank" sx={{ borderRadius: '12px', fontWeight: 700 }}>
          Download Resume
        </Button>
      </Stack>

      <MatchScoreCard match={candidate.aiMatch} />
    </RecruiterLayout>
  );
}
