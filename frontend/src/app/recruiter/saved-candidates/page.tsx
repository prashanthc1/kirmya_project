'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import RecruiterLayout from '../../../components/recruiter/RecruiterLayout';
import CandidateGrid from '../../../components/recruiter/search/CandidateGrid';
import CandidatePreviewDrawer from '../../../components/recruiter/search/CandidatePreviewDrawer';
import { candidateSearchApi } from '../../../features/recruiter/search/api';
import { CandidateSearchResultItem } from '../../../features/recruiter/search/types';

export default function SavedCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateSearchResultItem[]>([]);
  const [previewCandidate, setPreviewCandidate] = useState<CandidateSearchResultItem | null>(null);

  useEffect(() => {
    candidateSearchApi.getSavedCandidates().then((res) => setCandidates(res)).catch(() => {});
  }, []);

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Saved Candidates &amp; Bookmarks
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Quickly access bookmarked candidates for ongoing job openings and talent pipelines.
        </Typography>
      </Box>

      <CandidateGrid
        candidates={candidates}
        totalResults={candidates.length}
        onPreview={(cand) => setPreviewCandidate(cand)}
        onAddToPool={() => {}}
        onCompareToggle={() => {}}
        comparedIds={[]}
      />

      <CandidatePreviewDrawer
        open={Boolean(previewCandidate)}
        onClose={() => setPreviewCandidate(null)}
        candidate={previewCandidate}
      />
    </RecruiterLayout>
  );
}
