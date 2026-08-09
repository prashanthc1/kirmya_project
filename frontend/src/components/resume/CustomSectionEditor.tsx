'use client';

import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

export const CustomSectionEditor: React.FC<{ title: string; content: string; onChange: (title: string, content: string) => void }> = ({
  title,
  content,
  onChange,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Custom Section</Typography>
      <TextField fullWidth label="Section Title" value={title} onChange={(e) => onChange(e.target.value, content)} sx={{ mb: 2 }} />
      <TextField fullWidth multiline rows={4} label="Section Content" value={content} onChange={(e) => onChange(title, e.target.value)} />
    </Box>
  );
};
