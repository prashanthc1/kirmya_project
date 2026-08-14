'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { dataOpsApi, ImportPreviewResult } from '../../../features/data_operations/services/dataOpsApi';

interface ImportWizardModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = ['Select Type', 'Upload CSV', 'Dry-Run Preview', 'Execute Import'];

export default function ImportWizardModal({ open, onClose, onComplete }: ImportWizardModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [importType, setImportType] = useState('jobs');
  const [strategy, setStrategy] = useState('create_or_update');
  const [filename, setFilename] = useState('job_postings_sample.csv');
  const [csvContent, setCsvContent] = useState('Job Title,Company Name,Location,Type\nSenior Go Developer,Kirmya Platform,Remote,Full-Time\nProduct Manager,Tech Corp,Dubai,Full-Time');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await dataOpsApi.previewImport(importType, csvContent);
      setPreview(res);
      setActiveStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to parse CSV preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setError(null);
    setLoading(true);
    try {
      await dataOpsApi.createImport(importType, strategy, filename, csvContent);
      onComplete();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to execute import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: 2.5 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#a855f7' }}>
        <CloudUploadIcon /> Step-by-Step CSV Data Import Wizard
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: '#334155' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3, '& .MuiStepLabel-label': { color: '#94a3b8' }, '& .Mui-active .MuiStepLabel-label': { color: '#a855f7', fontWeight: 'bold' } }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 0: Select Type */}
        {activeStep === 0 && (
          <Box sx={{ py: 2 }}>
            <TextField
              select
              fullWidth
              label="Select Approved Import Schema"
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc', borderColor: '#334155' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
            >
              <MenuItem value="jobs">Job Postings (Jobs Schema)</MenuItem>
              <MenuItem value="skills">Technical & Professional Skills</MenuItem>
              <MenuItem value="categories">Job Categories & Industries</MenuItem>
              <MenuItem value="reference_data">Platform Reference Data</MenuItem>
            </TextField>

            <TextField
              select
              fullWidth
              label="Duplicate Handling Strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc', borderColor: '#334155' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
            >
              <MenuItem value="create_or_update">Create or Update Existing Matches</MenuItem>
              <MenuItem value="create_only">Create Only (Ignore Existing)</MenuItem>
              <MenuItem value="skip_duplicates">Skip Duplicates</MenuItem>
              <MenuItem value="reject_duplicates">Reject File If Duplicates Found</MenuItem>
            </TextField>
          </Box>
        )}

        {/* Step 1: Upload CSV */}
        {activeStep === 1 && (
          <Box sx={{ py: 2 }}>
            <TextField
              fullWidth
              label="Original File Name"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
            />
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Paste CSV Content or Sample Data"
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc', fontFamily: 'monospace' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
            />
            <Alert severity="info" sx={{ mt: 1, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
              Formula injection protection is active. Any leading =, +, -, @ will be safely escaped.
            </Alert>
          </Box>
        )}

        {/* Step 2: Dry-Run Preview */}
        {activeStep === 2 && preview && (
          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#38bdf8', mb: 1 }}>
              Dry-Run Validation Summary (No Database Changes Made)
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`Total Rows: ${preview.totalRows}`} color="primary" />
              <Chip label={`Valid Rows: ${preview.validRowsCount}`} color="success" />
              <Chip label={`Invalid Rows: ${preview.invalidRowsCount}`} color="error" />
              <Chip label={`Duplicates: ${preview.duplicateCount}`} color="warning" />
            </Box>

            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>DETECTED & MAPPED COLUMNS</Typography>
            <Paper sx={{ p: 1.5, bgcolor: '#1e293b', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(preview.mappedFields).map(([target, csvCol]) => (
                  <Chip key={target} label={`${csvCol} → ${target}`} size="small" variant="outlined" sx={{ color: '#a855f7', borderColor: '#a855f7' }} />
                ))}
              </Box>
            </Paper>

            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 1 }}>SAMPLE PREVIEW ROWS</Typography>
            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', maxHeight: 200 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { color: '#94a3b8' } }}>
                    {preview.detectedColumns.map((c) => (
                      <TableCell key={c}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.sampleRows.map((r, idx) => (
                    <TableRow key={idx} sx={{ '& td': { color: '#f8fafc' } }}>
                      {preview.detectedColumns.map((c) => (
                        <TableCell key={c}>{r[c] || ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={() => setActiveStep(activeStep - 1)} sx={{ color: '#94a3b8' }}>Back</Button>
        )}
        {activeStep === 0 && (
          <Button variant="contained" onClick={() => setActiveStep(1)} sx={{ bgcolor: '#a855f7' }}>Next: Upload File</Button>
        )}
        {activeStep === 1 && (
          <Button variant="contained" disabled={loading} onClick={handlePreview} sx={{ bgcolor: '#a855f7' }}>
            {loading ? 'Validating...' : 'Validate & Preview'}
          </Button>
        )}
        {activeStep === 2 && (
          <Button variant="contained" color="success" disabled={loading} onClick={handleExecute} sx={{ fontWeight: 'bold' }}>
            {loading ? 'Importing...' : 'Confirm & Execute Import'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
