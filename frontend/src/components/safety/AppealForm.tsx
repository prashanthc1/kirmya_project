'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { safetyApi } from '../../features/trust_safety/api';

export const AppealForm: React.FC = () => {
  const [decisionId, setDecisionId] = useState('dec-001');
  const [reason, setReason] = useState('False Flag');
  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!explanation) {
      setStatus('Please provide an explanation for your appeal.');
      return;
    }
    await safetyApi.submitAppeal({
      decision_id: decisionId,
      reason,
      explanation,
    });
    setStatus('Appeal submitted successfully. A moderator will review your evidence.');
    setExplanation('');
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3, maxWidth: 650 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <GavelIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Submit Moderation Decision Appeal</Typography>
      </Stack>

      <Stack spacing={2.5}>
        {status && <Alert severity={status.includes('successfully') ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>{status}</Alert>}

        <TextField
          label="Enforcement Decision Reference ID"
          value={decisionId}
          onChange={(e) => setDecisionId(e.target.value)}
          fullWidth
        />

        <TextField
          label="Primary Appeal Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
        />

        <TextField
          label="Detailed Explanation & Verification Context"
          multiline
          rows={4}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Provide evidence or context demonstrating compliance with Kirmya platform policies..."
          fullWidth
        />

        <Button variant="contained" onClick={handleSubmit} sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2 }}>
          Submit Formal Appeal
        </Button>
      </Stack>
    </Card>
  );
};

export default AppealForm;
