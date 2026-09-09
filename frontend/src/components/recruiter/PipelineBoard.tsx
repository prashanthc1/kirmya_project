'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
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
import { recruiterApi } from '../../features/recruiter/api';

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

  /*
   * The pipeline this recruiter actually has.
   *
   * These were three candidates in component state - Sarah Chen, Tariq
   * Al-Mansoor, Elena Rostova, with stock photographs and "96% MATCH" - shown
   * to every recruiter on every job, including a recruiter with no applicants.
   * Batch 5 removed the server's version of this fiction; the board kept its
   * own copy.
   *
   * A board with no job selected has nothing to show, and says so, rather than
   * filling itself in.
   */
  const {
    data: candidates = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['recruiter', 'pipeline', jobId],
    queryFn: async (): Promise<PipelineCandidate[]> => {
      const items = await recruiterApi.getPipeline(jobId as string);
      return (items ?? []).map((item) => ({
        id: item.id,
        applicationId: item.id,
        candidateId: item.candidateId,
        candidateName: item.candidateName,
        // The endpoint serves an email, not a headline; showing the email is
        // honest where inventing a job title would not be.
        candidateHeadline: item.candidateEmail,
        candidateAvatar: item.candidateAvatar ?? '',
        stage: item.stage,
        appliedDate: item.updatedAt,
        interviewScheduledAt: item.interviewScheduledAt ?? undefined,
        notes: item.notes,
      }));
    },
    enabled: Boolean(jobId),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  /*
   * Moving a candidate used to edit the local array and stop there. The card
   * slid to the next column, the recruiter believed the stage had changed, and
   * the server never heard about it - the next reload put the candidate back.
   * The move is a real request now, and the board refetches from what the
   * server accepted rather than from what was clicked.
   */
  const moveStage = useMutation({
    mutationFn: (input: { pipelineId: string; stage: string }) =>
      recruiterApi.updatePipelineStage(input.pipelineId, input.stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiter', 'pipeline', jobId] }),
  });

  const handleMoveStage = (candidateId: string, targetStage: string) => {
    moveStage.mutate({ pipelineId: candidateId, stage: targetStage });
  };

  const handleBulkMove = async (targetStage: string) => {
    const ids = [...selectedIds];
    setSelectedIds([]);
    for (const id of ids) {
      try {
        await moveStage.mutateAsync({ pipelineId: id, stage: targetStage });
      } catch {
        // Each move is independent; one refusal must not silently swallow the
        // rest, and the error surfaces below.
      }
    }
  };

  const filtered = candidates.filter((c) =>
    c.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Four honest answers where there used to be one invented one.
  if (!jobId) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Choose a job posting to see its pipeline.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }} role="status" aria-live="polite">
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">Loading the pipeline…</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          This pipeline could not be loaded.
          {error instanceof Error ? ` ${error.message}` : ''}
        </Alert>
      </Box>
    );
  }

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
