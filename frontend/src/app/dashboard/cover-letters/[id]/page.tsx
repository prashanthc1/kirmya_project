'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Stack, CircularProgress, Paper, Divider } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { Edit as EditIcon, Visibility as PreviewIcon, Share as ShareIcon, Download as DownloadIcon } from '@mui/icons-material';
import { CoverLetterAPI } from '@/features/cover-letter/api';
import { CoverLetter, CoverLetterAnalytics as AnalyticsType, CoverLetterVersion } from '@/features/cover-letter/types';
import { CoverLetterAnalyticsComponent } from '@/components/cover-letter/CoverLetterAnalytics';
import { VersionManager } from '@/components/cover-letter/VersionManager';
import { CoverLetterShareDialog } from '@/components/cover-letter/CoverLetterShareDialog';

export default function CoverLetterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [versions, setVersions] = useState<CoverLetterVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cl, ana, ver] = await Promise.all([
          CoverLetterAPI.getById(id),
          CoverLetterAPI.getAnalytics(id),
          CoverLetterAPI.getVersions(id),
        ]);
        setLetter(cl);
        setAnalytics(ana);
        setVersions(ver);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  if (loading || !letter) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} mb={0.5}>
            {letter.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {letter.jobTitle} • {letter.companyName}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => router.push(`/dashboard/cover-letters/${id}/edit`)}>
            Edit Letter
          </Button>
          <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => router.push(`/dashboard/cover-letters/${id}/preview`)}>
            Live Preview
          </Button>
          <Button variant="outlined" startIcon={<ShareIcon />} onClick={() => setShareDialogOpen(true)}>
            Share Access
          </Button>
        </Stack>
      </Box>

      <Stack spacing={4}>
        {analytics && <CoverLetterAnalyticsComponent analytics={analytics} />}

        <Paper sx={{ p: 4, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)' }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Cover Letter Summary
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', p: 2, borderRadius: 2 }}>
            "{letter.introduction}"
          </Typography>
          <Stack direction="row" spacing={4} mt={2}>
            <Typography variant="body2" color="text.secondary">Template: <strong>{letter.templateName}</strong></Typography>
            <Typography variant="body2" color="text.secondary">Tone: <strong>{letter.tone}</strong></Typography>
            <Typography variant="body2" color="text.secondary">Word Count: <strong>{letter.wordCount} words</strong></Typography>
            <Typography variant="body2" color="#34d399" fontWeight={700}>Match Score: {letter.jobMatchScore}%</Typography>
          </Stack>
        </Paper>

        <VersionManager versions={versions} onRestore={() => {}} />

        <CoverLetterShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          onShare={(level) => CoverLetterAPI.createShare(id, level)}
          onRevoke={() => CoverLetterAPI.deleteShare(id)}
        />
      </Stack>
    </Container>
  );
}
