'use client';

import React, { useState } from 'react';
import { Box, Typography, Grid, Card, Stack, Button, Alert, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { recruiterApi } from '../../../features/recruiter/api';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import CandidateFilters, { CandidateSearchFilters } from '../../../components/recruiter/CandidateFilters';
import CandidateCard from '../../../components/recruiter/CandidateCard';

export default function CandidatesMainPage() {
  const [filters, setFilters] = useState<CandidateSearchFilters>({
    keyword: '',
    jobTitle: '',
    skills: [],
    minExperience: 0,
    maxExperience: 20,
    industry: 'All Industries',
    location: '',
    education: 'Any Education',
    certifications: [],
    languages: [],
    currentCompany: '',
    previousCompany: '',
    availability: 'Any',
    openToWorkOnly: false,
    remotePreference: 'Any',
    salaryMin: 0,
    salaryMax: 200000,
  });

  /*
   * The candidates this recruiter can actually see.
   *
   * This page rendered two people who do not exist - "Sarah Chen" and "Tariq
   * Al-Mansoor" - with employers, twelve years of experience, a "96% AI match
   * rating" and résumé links at kirmya.com/resumes/. It made no request of any
   * kind: every recruiter on the platform saw the same two, and a recruiter
   * with no candidates saw them too.
   */
  const {
    data: candidates = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recruiter', 'candidates'],
    queryFn: () => recruiterApi.getCandidates(),
  });

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Candidate Discovery &amp; Search
        </Typography>

        <Typography variant="subtitle1" color="text.secondary">
          Find verified candidates, match resumes against open jobs, and shortlist talent.
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <CandidateFilters
          filters={filters}
          onChange={setFilters}
          onReset={() =>
            setFilters({
              keyword: '',
              jobTitle: '',
              skills: [],
              minExperience: 0,
              maxExperience: 20,
              industry: 'All Industries',
              location: '',
              education: 'Any Education',
              certifications: [],
              languages: [],
              currentCompany: '',
              previousCompany: '',
              availability: 'Any',
              openToWorkOnly: false,
              remotePreference: 'Any',
              salaryMin: 0,
              salaryMax: 200000,
            })
          }
        />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        Matching Candidates{!isLoading && !isError ? ` (${candidates.length})` : ''}
      </Typography>

      <Stack spacing={2}>
        {isLoading && (
          <Stack direction="row" spacing={2} alignItems="center" role="status" aria-live="polite">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Searching candidates…</Typography>
          </Stack>
        )}
        {isError && !isLoading && (
          <Alert severity="error">
            Candidates could not be loaded.
            {error instanceof Error ? ` ${error.message}` : ''}
          </Alert>
        )}
        {!isLoading && !isError && candidates.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No candidates match these filters yet.
          </Typography>
        )}
        {candidates.map((cand) => (
          <CandidateCard key={cand.id} candidate={cand as any} />
        ))}
      </Stack>
    </RecruiterLayout>
  );
}
