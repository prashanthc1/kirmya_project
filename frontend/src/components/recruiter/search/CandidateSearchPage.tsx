'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Button, Stack, Paper, Chip } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import RecruiterLayout from '../RecruiterLayout';
import SearchBar from './SearchBar';
import FilterSidebar from './FilterSidebar';
import CandidateGrid from './CandidateGrid';
import CandidatePreviewDrawer from './CandidatePreviewDrawer';
import CompareCandidates from './CompareCandidates';
import SavedSearchManager from './SavedSearchManager';
import TalentPoolManager from './TalentPoolManager';
import { candidateSearchApi } from '../../../features/recruiter/search/api';
import {
  CandidateSearchResultItem,
  SavedSearchDTO,
  TalentPoolDTO,
} from '../../../features/recruiter/search/types';

export const CandidateSearchPage: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateSearchResultItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [engineUsed, setEngineUsed] = useState('');
  const [loading, setLoading] = useState(false);

  // Drawers & Modals State
  const [previewCandidate, setPreviewCandidate] = useState<CandidateSearchResultItem | null>(null);
  const [comparedCandidates, setComparedCandidates] = useState<CandidateSearchResultItem[]>([]);
  const [openCompareModal, setOpenCompareModal] = useState(false);

  const [openSavedSearches, setOpenSavedSearches] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearchDTO[]>([]);

  const [openTalentPools, setOpenTalentPools] = useState(false);
  const [talentPools, setTalentPools] = useState<TalentPoolDTO[]>([]);
  const [selectedPoolCandidate, setSelectedPoolCandidate] = useState<CandidateSearchResultItem | null>(null);

  const fetchCandidates = (params?: any) => {
    setLoading(true);
    candidateSearchApi
      .searchCandidates(params)
      .then((res) => {
        setCandidates(res.candidates);
        setTotalResults(res.totalResults);
        setEngineUsed(res.engineUsed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadSavedSearches = () => {
    candidateSearchApi.getSavedSearches().then((res) => setSavedSearches(res)).catch(() => {});
  };

  const loadTalentPools = () => {
    candidateSearchApi.getTalentPools().then((res) => setTalentPools(res)).catch(() => {});
  };

  useEffect(() => {
    fetchCandidates();
    loadSavedSearches();
    loadTalentPools();
  }, []);

  const handleSearch = (query: string, booleanMode: boolean, location?: string) => {
    fetchCandidates({ q: query, booleanMode, city: location });
  };

  const handleApplyFilters = (filters: any) => {
    fetchCandidates(filters);
  };

  const handleCompareToggle = (candidate: CandidateSearchResultItem, selected: boolean) => {
    if (selected) {
      if (comparedCandidates.length >= 4) return;
      setComparedCandidates([...comparedCandidates, candidate]);
    } else {
      setComparedCandidates(comparedCandidates.filter((c) => c.id !== candidate.id));
    }
  };

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
          Enterprise Candidate Search &amp; Talent Discovery
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Search qualified professionals, apply advanced multi-attribute filters, evaluate AI match ratings, and manage talent pools.
        </Typography>
      </Box>

      {/* Top Search Bar */}
      <SearchBar onSearch={handleSearch} onSaveSearchClick={() => setOpenSavedSearches(true)} />

      {/* Grid Layout: Left Filter Sidebar + Right Candidate Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={3.5}>
          <FilterSidebar onApplyFilters={handleApplyFilters} />
        </Grid>

        <Grid item xs={12} lg={8.5}>
          <CandidateGrid
            candidates={candidates}
            totalResults={totalResults}
            engineUsed={engineUsed}
            onPreview={(cand) => setPreviewCandidate(cand)}
            onAddToPool={(cand) => {
              setSelectedPoolCandidate(cand);
              setOpenTalentPools(true);
            }}
            onCompareToggle={handleCompareToggle}
            comparedIds={comparedCandidates.map((c) => c.id)}
          />
        </Grid>
      </Grid>

      {/* Sticky Bottom Comparison Floating Bar */}
      {comparedCandidates.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            py: 1.5,
            px: 3,
            borderRadius: '20px',
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            backdropFilter: 'blur(16px)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {comparedCandidates.length} Candidates Selected for Side-by-Side Comparison
          </Typography>
          <Button
            variant="contained"
            startIcon={<CompareArrowsIcon />}
            onClick={() => setOpenCompareModal(true)}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Compare Now
          </Button>
          <Button variant="text" color="inherit" onClick={() => setComparedCandidates([])} sx={{ fontWeight: 700 }}>
            Clear
          </Button>
        </Paper>
      )}

      {/* Drawers & Modals */}
      <CandidatePreviewDrawer
        open={Boolean(previewCandidate)}
        onClose={() => setPreviewCandidate(null)}
        candidate={previewCandidate}
      />

      <CompareCandidates
        open={openCompareModal}
        onClose={() => setOpenCompareModal(false)}
        candidates={comparedCandidates}
      />

      <SavedSearchManager
        open={openSavedSearches}
        onClose={() => setOpenSavedSearches(false)}
        savedSearches={savedSearches}
        onRefresh={loadSavedSearches}
        onRunSearch={(q, f) => fetchCandidates({ q, ...f })}
      />

      <TalentPoolManager
        open={openTalentPools}
        onClose={() => {
          setOpenTalentPools(false);
          setSelectedPoolCandidate(null);
        }}
        talentPools={talentPools}
        selectedCandidate={selectedPoolCandidate}
        onRefresh={loadTalentPools}
      />
    </RecruiterLayout>
  );
};

export default CandidateSearchPage;
