'use client';

import React from 'react';
import {
  Stack,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  Paper,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  TextField,
} from '@mui/material';

import { tokens } from '../../theme/tokens';
import { CandidateDocument } from '../../features/applications/api';

export interface ApplyJobResumeSelectorProps {
  documents: CandidateDocument[];
  loadingDocs: boolean;
  selectedResumeId: string;
  customResumeUrl: string;
  onResumeSelect: (docId: string) => void;
  onCustomResumeUrlChange: (url: string) => void;
}

export const ApplyJobResumeSelector: React.FC<ApplyJobResumeSelectorProps> = ({
  documents,
  loadingDocs,
  selectedResumeId,
  customResumeUrl,
  onResumeSelect,
  onCustomResumeUrlChange,
}) => {
  return (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Select a tailored resume from your profile or provide a document link.
      </Typography>

      {loadingDocs ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : documents.length > 0 ? (
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            Uploaded Resumes & Documents
          </FormLabel>
          <RadioGroup
            value={selectedResumeId}
            onChange={(e) => onResumeSelect(e.target.value)}
          >
            {documents.map((doc) => (
              <Paper
                key={doc.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: `${tokens.radius.md}px`,
                  border: '1px solid',
                  borderColor: selectedResumeId === doc.id ? 'primary.main' : 'divider',
                  bgcolor: selectedResumeId === doc.id ? 'action.selected' : 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => onResumeSelect(doc.id)}
              >
                <FormControlLabel
                  value={doc.id}
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {doc.title || 'Resume Document'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Chip label={doc.document_type || 'Resume'} size="small" variant="outlined" />
                        {doc.is_default && <Chip label="Default" size="small" color="primary" />}
                        <Typography variant="caption" color="text.secondary">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>
            ))}
          </RadioGroup>
        </FormControl>
      ) : (
        <Alert severity="info" sx={{ borderRadius: `${tokens.radius.md}px` }}>
          No resumes found in your profile library. You can provide a direct resume link below or upload one in your Profile documents.
        </Alert>
      )}

      <TextField
        fullWidth
        label="Direct Resume / Portfolio URL (Optional)"
        placeholder="https://storage.kirmya.com/resumes/my-resume.pdf"
        value={customResumeUrl}
        onChange={(e) => onCustomResumeUrlChange(e.target.value)}
        helperText="Recruiters will be able to review this document securely."
      />
    </Stack>
  );
};

export default ApplyJobResumeSelector;
