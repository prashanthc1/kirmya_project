'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import AddLinkIcon from '@mui/icons-material/AddLink';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import { safetyApi } from '../../features/trust_safety/api';

export const AppealForm: React.FC = () => {
  const [decisionId, setDecisionId] = useState('dec-001');
  const [reason, setReason] = useState('False Positive Flag');
  const [explanation, setExplanation] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceList, setEvidenceList] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAddEvidence = () => {
    if (evidenceUrl && evidenceUrl.trim().length > 0) {
      setEvidenceList([...evidenceList, evidenceUrl.trim()]);
      setEvidenceUrl('');
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceList(evidenceList.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!explanation || explanation.trim().length < 10) {
      setStatus('Please provide a detailed explanation of at least 10 characters for your appeal.');
      return;
    }

    setSubmitting(true);
    try {
      await safetyApi.submitAppeal({
        decision_id: decisionId,
        reason,
        explanation: explanation.trim(),
        evidence_urls: evidenceList,
      });
      setStatus('Appeal submitted successfully. A human safety moderator will review your appeal within 24-48 hours.');
      setExplanation('');
      setEvidenceList([]);
      setSubmitting(false);
    } catch {
      setStatus('Failed to submit appeal. Please check details and try again.');
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3, maxWidth: 700 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <GavelIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Submit Moderation Decision Appeal
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Request human moderator review if you believe an enforcement action was made in error.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2.5}>
        <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: '12px' }}>
          <Typography variant="body2">
            Appeals are evaluated by senior safety moderators. Provide official links or documentation to support your case.
          </Typography>
        </Alert>

        {status && (
          <Alert severity={status.includes('successfully') ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>
            {status}
          </Alert>
        )}

        <TextField
          label="Enforcement Decision Reference ID"
          value={decisionId}
          onChange={(e) => setDecisionId(e.target.value)}
          placeholder="e.g. dec-001 or CASE-2026-0801"
          fullWidth
          required
        />

        <FormControl fullWidth>
          <InputLabel>Primary Reason for Appeal</InputLabel>
          <Select value={reason} label="Primary Reason for Appeal" onChange={(e) => setReason(e.target.value)}>
            <MenuItem value="False Positive Flag">False Positive Flag / System Error</MenuItem>
            <MenuItem value="Misunderstood Context">Misunderstood Context or Communication</MenuItem>
            <MenuItem value="Verified Identity">Verified Recruiter / Corporate Identity</MenuItem>
            <MenuItem value="Resolved Issue">Security Breach Resolved / Password Changed</MenuItem>
            <MenuItem value="Other">Other Reason</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Detailed Explanation & Verification Context"
          multiline
          rows={4}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Provide evidence, business verification links, or detailed context demonstrating compliance with Kirmya policies..."
          fullWidth
          required
        />

        {/* Evidence Links */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Supporting Evidence Links (Optional)
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="https://example.com/verification-credentials.pdf"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
            />
            <Button
              variant="outlined"
              startIcon={<AddLinkIcon />}
              onClick={handleAddEvidence}
              sx={{ borderRadius: '8px', fontWeight: 800 }}
            >
              Add Link
            </Button>
          </Stack>

          {evidenceList.length > 0 && (
            <List dense sx={{ bgcolor: 'action.hover', borderRadius: '12px', p: 1 }}>
              {evidenceList.map((url, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => handleRemoveEvidence(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={url} primaryTypographyProps={{ variant: 'caption', noWrap: true, fontWeight: 700 }} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2 }}
        >
          Submit Formal Appeal
        </Button>
      </Stack>
    </Card>
  );
};

export default AppealForm;
