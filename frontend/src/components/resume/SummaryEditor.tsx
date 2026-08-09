'use client';

import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Stack, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface SummaryEditorProps {
  summary: string;
  onChange: (summary: string) => void;
}

export const SummaryEditor: React.FC<SummaryEditorProps> = ({ summary, onChange }) => {
  const [tone, setTone] = useState('Executive');

  const handleAIAction = (actionType: string) => {
    let prefix = '';
    if (actionType === 'improve') prefix = 'Results-driven Senior Engineer with proven expertise in building high-concurrency microservices. ';
    if (actionType === 'shorten') prefix = 'Accomplished Tech Lead specializing in Go microservices and React dashboards. ';
    if (actionType === 'expand') prefix = 'Experienced Full-Stack Architect with a background scaling enterprise cloud services to 5M+ daily requests. ';

    onChange(`${prefix}${summary}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Professional Summary
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tone</InputLabel>
            <Select value={tone} label="Tone" onChange={(e) => setTone(e.target.value)}>
              <MenuItem value="Professional">Professional</MenuItem>
              <MenuItem value="Executive">Executive</MenuItem>
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Concise">Concise</MenuItem>
              <MenuItem value="Achievement-focused">Achievement-focused</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={5}
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a compelling 3-4 sentence overview of your career background, key technical strengths, and quantifiable value..."
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Character Count: {summary.length} / 500
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeIcon sx={{ color: '#9933FF' }} />}
            onClick={() => handleAIAction('improve')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            AI Improve
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleAIAction('shorten')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Shorten
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleAIAction('expand')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Expand
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
