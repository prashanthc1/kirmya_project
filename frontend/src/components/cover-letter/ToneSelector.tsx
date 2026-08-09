'use client';

import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';

export interface ToneSelectorProps {
  value: string;
  onChange: (tone: string) => void;
}

const TONES = [
  { id: 'Professional', label: 'Professional', desc: 'Balanced & formal' },
  { id: 'Confident', label: 'Confident', desc: 'Strong & assertive' },
  { id: 'Executive', label: 'Executive', desc: 'Leadership focused' },
  { id: 'Friendly', label: 'Friendly', desc: 'Warm & approachable' },
  { id: 'Concise', label: 'Concise', desc: 'Direct & to the point' },
  { id: 'Enthusiastic', label: 'Enthusiastic', desc: 'Passionate & high-energy' },
  { id: 'Technical', label: 'Technical', desc: 'Data & stack oriented' },
];

export const ToneSelector: React.FC<ToneSelectorProps> = ({ value, onChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} mb={1}>
        Cover Letter Tone
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {TONES.map((t) => {
          const isSelected = value === t.id;
          return (
            <Chip
              key={t.id}
              label={`${t.label} — ${t.desc}`}
              onClick={() => onChange(t.id)}
              color={isSelected ? 'primary' : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={{
                borderRadius: 2,
                px: 1,
                py: 0.5,
                fontWeight: isSelected ? 700 : 400,
                cursor: 'pointer',
                borderColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.15)',
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
};
