'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Stack,
  Button,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, AutoAwesome as AIIcon, Analytics as AnalyticsIcon } from '@mui/icons-material';
import { CoverLetterToolbar } from './CoverLetterToolbar';
import { ToneSelector } from './ToneSelector';
import { LengthSelector } from './LengthSelector';
import { AIWritingAssistant } from './AIWritingAssistant';
import { CoverLetter } from '@/features/cover-letter/types';

export interface CoverLetterEditorProps {
  initialLetter: CoverLetter;
  onSave: (letter: CoverLetter) => Promise<void>;
  onOpenTailorDialog: () => void;
}

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({
  initialLetter,
  onSave,
  onOpenTailorDialog,
}) => {
  const [letter, setLetter] = useState<CoverLetter>(initialLetter);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof CoverLetter, value: any) => {
    setLetter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormat = (command: string) => {
    document.execCommand(command, false);
  };

  const handleAiAction = async (actionType: string) => {
    if (actionType === 'shorten') {
      setLetter((prev) => ({
        ...prev,
        body: 'Throughout my career, I built resilient distributed microservices in Golang and Next.js, optimizing database query latency by 35%.',
      }));
    } else if (actionType === 'opening') {
      setLetter((prev) => ({
        ...prev,
        introduction: 'It is with great enthusiasm that I apply for the position. With extensive experience delivering scalable web systems, I offer immediate value.',
      }));
    }
  };

  const handleSaveClick = async () => {
    setSaving(true);
    try {
      await onSave(letter);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <TextField
          variant="standard"
          value={letter.name}
          onChange={(e) => handleChange('name', e.target.value)}
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: '1.75rem', fontWeight: 800 },
          }}
        />
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<AIIcon />} onClick={onOpenTailorDialog} sx={{ borderRadius: 2 }}>
            Tailor to Job
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveClick} disabled={saving} sx={{ borderRadius: 2 }}>
            Save Changes
          </Button>
        </Stack>
      </Box>

      <AIWritingAssistant onAction={handleAiAction} />

      <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)' }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Recipient & Target Role Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Recipient Name"
              fullWidth
              value={letter.recipientName}
              onChange={(e) => handleChange('recipientName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Recipient Title"
              fullWidth
              value={letter.recipientTitle}
              onChange={(e) => handleChange('recipientTitle', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Name"
              fullWidth
              value={letter.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Target Job Title"
              fullWidth
              value={letter.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Job Reference Number"
              fullWidth
              value={letter.jobReferenceNumber}
              onChange={(e) => handleChange('jobReferenceNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Location & Date"
              fullWidth
              value={`${letter.location} | ${letter.date}`}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)' }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Cover Letter Content Editor
        </Typography>

        <CoverLetterToolbar
          onFormat={handleFormat}
          wordCount={letter.wordCount}
          charCount={letter.characterCount}
        />

        <Stack spacing={2.5} mt={2}>
          <TextField
            label="Opening Greeting"
            fullWidth
            value={letter.openingGreeting}
            onChange={(e) => handleChange('openingGreeting', e.target.value)}
          />
          <TextField
            label="Introduction"
            multiline
            rows={3}
            fullWidth
            value={letter.introduction}
            onChange={(e) => handleChange('introduction', e.target.value)}
          />
          <TextField
            label="Body Paragraphs"
            multiline
            rows={6}
            fullWidth
            value={letter.body}
            onChange={(e) => handleChange('body', e.target.value)}
          />
          <TextField
            label="Closing Statement"
            multiline
            rows={3}
            fullWidth
            value={letter.closing}
            onChange={(e) => handleChange('closing', e.target.value)}
          />
          <TextField
            label="Signature"
            fullWidth
            value={letter.signature}
            onChange={(e) => handleChange('signature', e.target.value)}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)' }}>
        <Stack spacing={3}>
          <ToneSelector value={letter.tone} onChange={(t) => handleChange('tone', t)} />
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          <LengthSelector
            value={letter.targetLength}
            currentWordCount={letter.wordCount}
            onChange={(l) => handleChange('targetLength', l)}
          />
        </Stack>
      </Paper>
    </Stack>
  );
};
