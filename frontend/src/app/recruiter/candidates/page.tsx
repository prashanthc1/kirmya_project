'use client';

import React, { useState } from 'react';
import { Box, Typography, Grid, Card, Stack, Button } from '@mui/material';
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

  const mockCandidates = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      name: 'Sarah Chen',
      headline: 'Staff Software Engineer & Cloud Architect',
      currentRole: 'Staff Engineer at CloudScale',
      location: 'Dubai, UAE',
      skills: ['Golang', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'Kubernetes'],
      experienceYears: 8,
      matchScore: 96,
      availability: 'Immediate Notice',
      openToWork: true,
      resumeUrl: 'https://kirmya.com/resumes/sarah-chen.pdf',
      resumeAvailable: true,
      verificationStatus: 'Verified',
      saved: true,
      recommendationNote: '96% AI match rating based on job requirements and experience.',
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      name: 'Tariq Al-Mansoor',
      headline: 'Director of Facilities & Asset Management',
      currentRole: 'Facilities Director at Emaar',
      location: 'Abu Dhabi, UAE',
      skills: ['Facilities Management', 'HVAC', 'SLA Auditing', 'Vendor Management'],
      experienceYears: 12,
      matchScore: 94,
      availability: '2 Weeks Notice',
      openToWork: true,
      resumeUrl: 'https://kirmya.com/resumes/tariq-mansoor.pdf',
      resumeAvailable: true,
      verificationStatus: 'Verified',
      saved: false,
      recommendationNote: 'Verified leadership track record in commercial real estate.',
    },
  ];

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
        Matching Candidates ({mockCandidates.length})
      </Typography>

      <Stack spacing={2}>
        {mockCandidates.map((cand) => (
          <CandidateCard key={cand.id} candidate={cand as any} />
        ))}
      </Stack>
    </RecruiterLayout>
  );
}
