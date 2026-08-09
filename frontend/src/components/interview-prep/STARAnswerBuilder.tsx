'use client';

import React, { useState } from 'react';
import { Box, TextField, Button, Stack, Typography, Paper } from '@mui/material';
import { AutoAwesome, Check } from '@mui/icons-material';

interface STARAnswerBuilderProps {
  initialAnswer?: string;
  initialS?: string;
  initialT?: string;
  initialA?: string;
  initialR?: string;
  onSave: (fullAnswer: string, star: { s: string; t: string; a: string; r: string }) => Promise<void>;
  onCancel: () => void;
}

export const STARAnswerBuilder: React.FC<STARAnswerBuilderProps> = ({
  initialAnswer = '',
  initialS = '',
  initialT = '',
  initialA = '',
  initialR = '',
  onSave,
  onCancel,
}) => {
  const [s, setS] = useState(initialS);
  const [t, setT] = useState(initialT);
  const [a, setA] = useState(initialA);
  const [r, setR] = useState(initialR);
  const [fullAnswer, setFullAnswer] = useState(initialAnswer);
  const [saving, setSaving] = useState(false);

  const handleAutoAssemble = () => {
    const assembled = `Situation: ${s}\nTask: ${t}\nAction: ${a}\nResult: ${r}`;
    setFullAnswer(assembled.trim());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalAns = fullAnswer || `Situation: ${s}. Task: ${t}. Action: ${a}. Result: ${r}.`;
      await onSave(finalAns, { s, t, a, r });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#60A5FA' }}>
          STAR Method Response Framework
        </Typography>
        <Button
          size="small"
          startIcon={<AutoAwesome />}
          onClick={handleAutoAssemble}
          sx={{ color: '#A78BFA', textTransform: 'none', fontWeight: 600 }}
        >
          Auto-Assemble Response
        </Button>
      </Stack>

      <Stack spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          label="Situation (Set the context & background)"
          multiline
          rows={2}
          value={s}
          onChange={(e) => setS(e.target.value)}
          placeholder="e.g. At my previous company, our team faced a tight 2-week deadline for launching a high-throughput payment API..."
          sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
        />

        <TextField
          label="Task (Describe your specific responsibility/goal)"
          multiline
          rows={2}
          value={t}
          onChange={(e) => setT(e.target.value)}
          placeholder="e.g. My goal was to redesign the database schema and eliminate latency bottlenecks without causing service downtime..."
          sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
        />

        <TextField
          label="Action (Detail the specific steps YOU took)"
          multiline
          rows={2}
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="e.g. I implemented Redis caching, optimized indexing, and led pair programming reviews..."
          sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
        />

        <TextField
          label="Result (Quantify metrics & positive outcomes)"
          multiline
          rows={2}
          value={r}
          onChange={(e) => setR(e.target.value)}
          placeholder="e.g. As a result, API response times dropped by 45% and the system handled 100k daily requests cleanly..."
          sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
        />

        <TextField
          label="Full Combined Answer Text"
          multiline
          rows={3}
          value={fullAnswer}
          onChange={(e) => setFullAnswer(e.target.value)}
          placeholder="Complete narrative response..."
          sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
        />
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={onCancel} sx={{ color: '#94A3B8' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={<Check />}
          sx={{
            background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 2.5,
            px: 3,
          }}
        >
          {saving ? 'Saving...' : 'Save Practiced Answer'}
        </Button>
      </Stack>
    </Paper>
  );
};
