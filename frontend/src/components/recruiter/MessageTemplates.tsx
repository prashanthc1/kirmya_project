'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  TextField,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';

export interface MessageTemplate {
  id: string;
  title: string;
  category: 'Received' | 'InterviewInvite' | 'Reminder' | 'InfoRequest' | 'Rejection' | 'Offer';
  subject: string;
  body: string;
}

export const MessageTemplates: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: 't1',
      title: 'Interview Invitation',
      category: 'InterviewInvite',
      subject: 'Interview Invitation: {{job_title}} at {{company_name}}',
      body: 'Hi {{candidate_name}},\n\nWe were very impressed by your profile for {{job_title}} at {{company_name}}. We would love to invite you for a 45-minute technical architecture interview on {{interview_date}}.\n\nBest regards,\n{{recruiter_name}}',
    },
    {
      id: 't2',
      title: 'Application Confirmation',
      category: 'Received',
      subject: 'Application Received for {{job_title}}',
      body: 'Dear {{candidate_name}},\n\nThank you for applying for {{job_title}} at {{company_name}}. Our recruiting team is currently reviewing your resume.\n\nBest,\n{{recruiter_name}}',
    },
  ]);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<MessageTemplate>>({
    title: '',
    category: 'InterviewInvite',
    subject: '',
    body: '',
  });

  const variables = ['{{candidate_name}}', '{{job_title}}', '{{company_name}}', '{{interview_date}}', '{{recruiter_name}}'];

  const handleSave = () => {
    if (!formData.title || !formData.body) return;
    const item: MessageTemplate = {
      id: `t_${Date.now()}`,
      title: formData.title || 'Custom Template',
      category: formData.category || 'InterviewInvite',
      subject: formData.subject || '',
      body: formData.body || '',
    };
    setTemplates([...templates, item]);
    setOpen(false);
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      body: (prev.body || '') + ' ' + variable,
    }));
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon color="primary" /> Reusable Recruiter Message Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Standardize candidate communications using automated placeholder variables.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          }}
        >
          Create New Template
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {templates.map((tpl) => (
          <Grid item xs={12} md={6} key={tpl.id}>
            <Card
              sx={{
                borderRadius: '20px',
                p: 3,
                height: '100%',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {tpl.title}
                </Typography>
                <Chip label={tpl.category} size="small" color="primary" sx={{ fontWeight: 800 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}>
                Subject: {tpl.subject}
              </Typography>
              <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)', fontFamily: 'monospace' }}>
                <Typography variant="body2" whiteSpace="pre-line">
                  {tpl.body}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* New Template Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Candidate Message Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Template Name *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                {['Received', 'InterviewInvite', 'Reminder', 'InfoRequest', 'Rejection', 'Offer'].map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Subject Line *"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>
                Insert Dynamic Variables:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {variables.map((v) => (
                  <Chip key={v} label={v} onClick={() => insertVariable(v)} size="small" color="secondary" sx={{ fontWeight: 800, cursor: 'pointer' }} />
                ))}
              </Stack>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Message Body *"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ fontWeight: 800 }}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageTemplates;
