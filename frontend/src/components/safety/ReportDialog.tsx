'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddLinkIcon from '@mui/icons-material/AddLink';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import { safetyApi } from '../../features/trust_safety/api';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTargetType?: string;
  defaultTargetId?: string;
  defaultTargetTitle?: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onClose,
  defaultTargetType = 'job',
  defaultTargetId = 'target-001',
  defaultTargetTitle = 'Reported Item',
}) => {
  const [targetType, setTargetType] = useState(defaultTargetType);
  const [targetId, setTargetId] = useState(defaultTargetId);
  const [targetTitle, setTargetTitle] = useState(defaultTargetTitle);
  const [category, setCategory] = useState('fake_job');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceList, setEvidenceList] = useState<string[]>([]);
  const [reporterPrivacy, setReporterPrivacy] = useState(true);
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
    // Sanitize description text
    const sanitizedDescription = description.trim().replace(/<[^>]*>?/gm, '');

    if (!sanitizedDescription) {
      setStatus('Please provide a description of the safety violation.');
      return;
    }

    setSubmitting(true);
    try {
      await safetyApi.submitReport({
        target_type: targetType,
        target_id: targetId,
        target_title: targetTitle,
        category,
        description: sanitizedDescription,
        evidence_urls: evidenceList,
        reporter_privacy: reporterPrivacy,
      });

      setStatus('Report submitted successfully. A confidential confirmation ID has been generated.');
      setTimeout(() => {
        onClose();
        setStatus(null);
        setDescription('');
        setEvidenceList([]);
        setSubmitting(false);
      }, 1500);
    } catch {
      setStatus('Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Submit Confidential Safety Report</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info" icon={<PrivacyTipIcon />} sx={{ borderRadius: '12px' }}>
            <Typography variant="body2" color="text.secondary">
              Reporters remain completely confidential. Our Trust & Safety team will review your report in accordance with Kirmya platform policies.
            </Typography>
          </Alert>

          <FormControl fullWidth>
            <InputLabel>Target Entity Type</InputLabel>
            <Select value={targetType} label="Target Entity Type" onChange={(e) => setTargetType(e.target.value)}>
              <MenuItem value="job">Job Posting</MenuItem>
              <MenuItem value="user">User Profile</MenuItem>
              <MenuItem value="recruiter">Recruiter Account</MenuItem>
              <MenuItem value="company">Company</MenuItem>
              <MenuItem value="community">Community / Group</MenuItem>
              <MenuItem value="message">Message / Chat</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Report Category / Violation Reason</InputLabel>
            <Select value={category} label="Report Category / Violation Reason" onChange={(e) => setCategory(e.target.value)}>
              <MenuItem value="fake_job">Fake Job / Recruitment Scam</MenuItem>
              <MenuItem value="spam">Spam / Unsolicited Promotion</MenuItem>
              <MenuItem value="impersonation">Identity Impersonation</MenuItem>
              <MenuItem value="harassment">Harassment or Bullying</MenuItem>
              <MenuItem value="phishing">Phishing / Malicious Links</MenuItem>
              <MenuItem value="privacy_violation">Privacy Violation</MenuItem>
              <MenuItem value="other">Other Policy Violation</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <TextField
              label="Detailed Description & Evidence Context"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              placeholder="Describe what occurred, including any advance fee payment requests, suspicious external links, or off-platform communication..."
              fullWidth
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
              {description.length} / 1000 characters
            </Typography>
          </Box>

          {/* Evidence Attachment Links */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Evidence Links (Screenshots / Documents)
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="https://example.com/evidence-screenshot.png"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
              />
              <Button
                variant="outlined"
                startIcon={<AddLinkIcon />}
                onClick={handleAddEvidence}
                sx={{ borderRadius: '8px', fontWeight: 800 }}
              >
                Add
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
                    <ListItemText
                      primary={url}
                      primaryTypographyProps={{ variant: 'caption', noWrap: true, fontWeight: 700 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Reporter Privacy Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={reporterPrivacy}
                onChange={(e) => setReporterPrivacy(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Keep Reporter Identity Confidential
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Your identity is protected and will never be shared with the reported party.
                </Typography>
              </Box>
            }
          />

          {status && (
            <Alert severity={status.includes('successfully') ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>
              {status}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ fontWeight: 800 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Submit Confidential Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;
