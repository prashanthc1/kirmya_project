'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  MenuItem,
  TextField,
  Pagination,
  Button,
} from '@mui/material';
import CandidateCard from './CandidateCard';
import { CandidateSearchResultItem } from '../../../features/recruiter/search/types';

interface CandidateGridProps {
  candidates: CandidateSearchResultItem[];
  totalResults: number;
  engineUsed?: string;
  onPreview: (candidate: CandidateSearchResultItem) => void;
  onAddToPool: (candidate: CandidateSearchResultItem) => void;
  onCompareToggle: (candidate: CandidateSearchResultItem, selected: boolean) => void;
  comparedIds: string[];
}

export const CandidateGrid: React.FC<CandidateGridProps> = ({
  candidates,
  totalResults,
  engineUsed,
  onPreview,
  onAddToPool,
  onCompareToggle,
  comparedIds,
}) => {
  const [sortBy, setSortBy] = useState('match_score');
  const [page, setPage] = useState(1);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap" useFlexGap gap={1}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Matching Candidates ({totalResults})
          </Typography>
          {engineUsed && (
            <Typography variant="caption" color="text.secondary">
              Search Engine: <strong>{engineUsed}</strong>
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <TextField select size="small" label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="match_score">AI Match Score</MenuItem>
            <MenuItem value="relevance">Relevance</MenuItem>
            <MenuItem value="experience">Years Experience</MenuItem>
            <MenuItem value="newest">Recently Active</MenuItem>
          </TextField>
        </Stack>
      </Stack>

      {candidates.map((cand) => (
        <CandidateCard
          key={cand.id}
          candidate={cand}
          onPreview={onPreview}
          onAddToPool={onAddToPool}
          onCompareToggle={onCompareToggle}
          isCompared={comparedIds.includes(cand.id)}
        />
      ))}

      {totalResults > 10 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 4, mb: 2 }}>
          <Pagination count={Math.ceil(totalResults / 10)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Stack>
      )}
    </Box>
  );
};

export default CandidateGrid;
