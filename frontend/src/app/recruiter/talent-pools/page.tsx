'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import TalentPoolManager from '../../../components/recruiter/search/TalentPoolManager';
import { candidateSearchApi } from '../../../features/recruiter/search/api';
import { TalentPoolDTO } from '../../../features/recruiter/search/types';

export default function TalentPoolsPage() {
  const [pools, setPools] = useState<TalentPoolDTO[]>([]);

  const loadPools = () => {
    candidateSearchApi.getTalentPools().then((res) => setPools(res)).catch(() => {});
  };

  useEffect(() => {
    loadPools();
  }, []);

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Talent Pools &amp; Team Pipelines
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Organize candidates into specialized hiring pools and share pipelines with your recruitment team.
        </Typography>
      </Box>

      <TalentPoolManager
        open={true}
        onClose={() => {}}
        talentPools={pools}
        onRefresh={loadPools}
      />
    </RecruiterLayout>
  );
}
