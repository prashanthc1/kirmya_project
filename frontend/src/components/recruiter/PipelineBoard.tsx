'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Button,
  Chip,
  TextField,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Checkbox,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PipelineCard, { PipelineCandidate } from './PipelineCard';

const defaultStages = [
  'New',
  'Review',
  'Shortlisted',
  'Recruiter Screen',
  'Interview',
  'Final Interview',
  'Offer',
  'Hired',
  'Rejected',
];

interface Props {
  jobId?: string;
  onSelectCandidate?: (candidate: PipelineCandidate) => void;
}

export const PipelineBoard: React.FC<Props> = ({ jobId, onSelectCandidate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  const [candidates, setCandidates] = useState<PipelineCandidate[]>([
    {
      id: 'app_1',
      applicationId: 'a1111111-1111-1111-1111-111111111111',
      candidateId: 'c1111111-1111-1111-1111-111111111111',
      candidateName: 'Sarah Chen',
      candidateHeadline: 'Staff Software Engineer & Cloud Architect',
      candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      matchScore: 96,
      stage: 'New',
      appliedDate: '2 days ago',
      notes: 'Strong backend Go microservices background.',
    },
    {
      id: 'app_2',
      applicationId: 'a2222222-2222-2222-2222-222222222222',
      candidateId: 'c2222222-2222-2222-2222-222222222222',
      candidateName: 'Tariq Al-Mansoor',
      candidateHeadline: 'Director of Facilities & Asset Management',
      candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      matchScore: 94,
      stage: 'Shortlisted',
      appliedDate: '3 days ago',
      notes: 'Passed screening call with hiring manager.',
    },
    {
      id: 'app_3',
      applicationId: 'a3333333-3333-3333-3333-333333333333',
      candidateId: 'c3333333-3333-3333-3333-333333333333',
      candidateName: 'Elena Rostova',
      candidateHeadline: 'Senior AI/ML Research Engineer',
      candidateAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      matchScore: 91,
      stage: 'Interview',
      appliedDate: '4 days ago',
      interviewScheduledAt: '2026-08-15 14:00',
      notes: 'Scheduled for Technical Architecture Round.',
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleMoveStage = (candidateId: string, targetStage: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: targetStage } : c))
    );
  };

  const handleBulkMove = (targetStage: string) => {
    setCandidates((prev) =>
      prev.map((c) => (selectedIds.includes(c.id) ? { ...c, stage: targetStage } : c))
    );
    setSelectedIds([]);
  };

  const filtered = candidates.filter((c) =>
    c.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      {/* Control Bar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search candidates in pipeline..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ width: { xs: '100%', sm: 300 } }}
        />

        <Stack direction="row" spacing={1.5} alignItems="center">
          {selectedIds.length > 0 && (
            <Chip label={`${selectedIds.length} Selected (Bulk)`} color="primary" sx={{ fontWeight: 800 }} />
          )}

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="kanban">
              <ViewKanbanIcon sx={{ mr: 0.5 }} /> Kanban
            </ToggleButton>
            <ToggleButton value="list">
              <FormatListBulletedIcon sx={{ mr: 0.5 }} /> List
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {/* Board View */}
      {viewMode === 'kanban' ? (
        <Box sx={{ display: 'flex', gap: 2, pb: 2, overflowX: 'auto', minHeight: 600 }}>
          {defaultStages.map((stage) => {
            const stageCandidates = filtered.filter((c) => c.stage === stage);
            return (
              <Box
                key={stage}
                sx={{
                  minWidth: 280,
                  maxWidth: 320,
                  flexShrink: 0,
                  bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                  borderRadius: '20px',
                  p: 2,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    {stage}
                  </Typography>
                  <Chip label={stageCandidates.length} size="small" color="primary" sx={{ fontWeight: 800, height: 20 }} />
                </Stack>

                <Stack spacing={2}>
                  {stageCandidates.map((cand) => (
                    <PipelineCard
                      key={cand.id}
                      candidate={cand}
                      stages={defaultStages}
                      onMoveStage={handleMoveStage}
                      onViewDetails={(c) => onSelectCandidate && onSelectCandidate(c)}
                    />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map((cand) => (
            <Card
              key={cand.id}
              sx={{
                p: 2,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Checkbox
                  checked={selectedIds.includes(cand.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds([...selectedIds, cand.id]);
                    else setSelectedIds(selectedIds.filter((id) => id !== cand.id));
                  }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{cand.candidateName}</Typography>
                  <Typography variant="caption" color="text.secondary">{cand.candidateHeadline}</Typography>
                </Box>
              </Stack>
              <Chip label={cand.stage} color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default PipelineBoard;
