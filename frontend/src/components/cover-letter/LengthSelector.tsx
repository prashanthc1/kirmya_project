'use client';

import React from 'react';
import { Box, Typography, Stack, Card, Alert } from '@mui/material';

export interface LengthSelectorProps {
  value: 'Short' | 'Standard' | 'Detailed';
  currentWordCount?: number;
  onChange: (length: 'Short' | 'Standard' | 'Detailed') => void;
}

const LENGTHS = [
  { id: 'Short', label: 'Short', range: '250–350 words', desc: 'Fast read for high-volume recruiter scanning.' },
  { id: 'Standard', label: 'Standard', range: '350–500 words', desc: 'Optimal balance of experience & motivation.' },
  { id: 'Detailed', label: 'Detailed', range: '500–700 words', desc: 'Comprehensive breakdown for senior/executive roles.' },
];

export const LengthSelector: React.FC<LengthSelectorProps> = ({ value, currentWordCount = 0, onChange }) => {
  const isOverlong = currentWordCount > 600;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        Target Length
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={1.5}>
        {LENGTHS.map((l) => {
          const isSelected = value === l.id;
          return (
            <Card
              key={l.id}
              onClick={() => onChange(l.id as any)}
              sx={{
                flex: 1,
                p: 2,
                cursor: 'pointer',
                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                transition: 'all 0.2s ease',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color={isSelected ? '#818cf8' : 'text.primary'}>
                {l.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                {l.range}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {l.desc}
              </Typography>
            </Card>
          );
        })}
      </Stack>

      {isOverlong && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Your current cover letter is <strong>{currentWordCount} words</strong>. Recruiters prefer concise cover letters between 350-500 words. Consider shortening body paragraphs.
        </Alert>
      )}
    </Box>
  );
};
