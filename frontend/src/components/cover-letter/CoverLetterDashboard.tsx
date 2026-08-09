'use client';

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AIIcon,
  Description as TemplateIcon,
  FolderSpecial as JobIcon,
} from '@mui/icons-material';
import { CoverLetterCard } from './CoverLetterCard';
import { CoverLetter } from '@/features/cover-letter/types';

export interface CoverLetterDashboardProps {
  letters: CoverLetter[];
  onCreateNew: () => void;
  onGenerateAI: () => void;
  onBrowseTemplates: () => void;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CoverLetterDashboard: React.FC<CoverLetterDashboardProps> = ({
  letters,
  onCreateNew,
  onGenerateAI,
  onBrowseTemplates,
  onEdit,
  onPreview,
  onDuplicate,
  onDownload,
  onShare,
  onDelete,
}) => {
  const totalLetters = letters.length;
  const jobSpecificCount = letters.filter((l) => l.isJobSpecific).length;
  const aiGeneratedCount = letters.filter((l) => l.isAiGenerated).length;

  return (
    <Stack spacing={4}>
      {/* Header Stat Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total Cover Letters
              </Typography>
              <Typography variant="h3" fontWeight={800} color="#818cf8">
                {totalLetters}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Job Tailored Letters
              </Typography>
              <Typography variant="h3" fontWeight={800} color="#34d399">
                {jobSpecificCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                AI Copilot Generations
              </Typography>
              <Typography variant="h3" fontWeight={800} color="#c084fc">
                {aiGeneratedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Primary Action Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={onCreateNew} sx={{ borderRadius: 3, py: 1.5, px: 3, fontWeight: 700 }}>
          Create Cover Letter
        </Button>
        <Button variant="outlined" size="large" startIcon={<AIIcon />} onClick={onGenerateAI} sx={{ borderRadius: 3, py: 1.5, px: 3, fontWeight: 700, borderColor: '#6366f1', color: '#818cf8' }}>
          Generate With AI
        </Button>
        <Button variant="outlined" size="large" startIcon={<TemplateIcon />} onClick={onBrowseTemplates} sx={{ borderRadius: 3, py: 1.5, px: 3, fontWeight: 700 }}>
          Browse Templates
        </Button>
      </Stack>

      {/* Cover Letter Cards Grid */}
      <Box>
        <Typography variant="h5" fontWeight={800} mb={3}>
          Your Saved Cover Letters
        </Typography>
        {letters.length === 0 ? (
          <Card sx={{ background: 'rgba(255, 255, 255, 0.02)', p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} color="text.secondary" mb={1}>
              No Cover Letters Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Create a personalized cover letter to stand out to top recruiters.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateNew} sx={{ borderRadius: 2 }}>
              Create First Cover Letter
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {letters.map((l) => (
              <Grid item xs={12} sm={6} md={4} key={l.id}>
                <CoverLetterCard
                  letter={l}
                  onEdit={onEdit}
                  onPreview={onPreview}
                  onDuplicate={onDuplicate}
                  onDownload={onDownload}
                  onShare={onShare}
                  onDelete={onDelete}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Stack>
  );
};
