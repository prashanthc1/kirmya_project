'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import SavedSearchManager from '../../../components/recruiter/search/SavedSearchManager';
import { candidateSearchApi } from '../../../features/recruiter/search/api';
import { SavedSearchDTO } from '../../../features/recruiter/search/types';

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearchDTO[]>([]);

  const loadSearches = () => {
    candidateSearchApi.getSavedSearches().then((res) => setSavedSearches(res)).catch(() => {});
  };

  useEffect(() => {
    loadSearches();
  }, []);

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Saved Searches &amp; Candidate Alerts
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure automated email alerts and re-run saved candidate search queries.
        </Typography>
      </Box>

      <SavedSearchManager
        open={true}
        onClose={() => {}}
        savedSearches={savedSearches}
        onRefresh={loadSearches}
        onRunSearch={() => {}}
      />
    </RecruiterLayout>
  );
}
