'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Stack,
  Alert,
  MenuItem,
} from '@mui/material';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BugReportIcon from '@mui/icons-material/BugReport';
import { supportApi } from '../../features/support/services/supportApi';

export const FeedbackForm: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ui_ux');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmitFeature = async () => {
    if (!title || !description) return;
    await supportApi.createFeatureRequest({ title, category, description });
    setSuccess('Thank you! Your feature request has been submitted for review.');
    setTitle('');
    setDescription('');
  };

  const handleSubmitBug = async () => {
    if (!title || !description) return;
    await supportApi.createBugReport({ title, description, steps_to_reproduce: steps });
    setSuccess('Bug report logged successfully. Our engineering team has been notified.');
    setTitle('');
    setDescription('');
    setSteps('');
  };

  return (
    <Card sx={{ borderRadius: '24px', p: { xs: 3, md: 5 }, maxWidth: 700, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        {tab === 0 ? <RateReviewIcon color="primary" /> : <BugReportIcon color="error" />}
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          {tab === 0 ? 'Submit Feature Request' : 'Report a Bug'}
        </Typography>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Feature Request" sx={{ fontWeight: 800 }} />
        <Tab label="Bug Report" sx={{ fontWeight: 800 }} />
      </Tabs>

      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}

      {tab === 0 ? (
        <Stack spacing={2.5}>
          <TextField
            label="Feature Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Add dark theme option to candidate dashboard..."
            fullWidth
            required
          />
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
          >
            <MenuItem value="ui_ux">UI / Design Experience</MenuItem>
            <MenuItem value="jobs">Jobs & Search</MenuItem>
            <MenuItem value="messaging">Messaging & Networking</MenuItem>
            <MenuItem value="analytics">Career Analytics</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <TextField
            label="Description & Business Value"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain how this feature helps your career or recruitment workflow..."
            fullWidth
            required
          />
          <Button variant="contained" onClick={handleSubmitFeature} sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2 }}>
            Submit Feature Request
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          <TextField
            label="Bug Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Job alert dropdown alignment issue on mobile..."
            fullWidth
            required
          />
          <TextField
            label="Bug Description & Observed Behavior"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Steps to Reproduce"
            multiline
            rows={3}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="1. Go to job search... 2. Click filter... 3. See error..."
            fullWidth
          />
          <Button variant="contained" color="error" onClick={handleSubmitBug} sx={{ borderRadius: '12px', fontWeight: 800, py: 1.2 }}>
            Report Bug
          </Button>
        </Stack>
      )}
    </Card>
  );
};

export default FeedbackForm;
