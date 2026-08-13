'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  Box,
} from '@mui/material';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import SendIcon from '@mui/icons-material/Send';
import { supportApi } from '../../features/support/services/supportApi';

export const ContactSupport: React.FC = () => {
  const [category, setCategory] = useState('jobs');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [createdTicket, setCreatedTicket] = useState<{ ticket_number: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { value: 'account', label: 'Account & Security' },
    { value: 'jobs', label: 'Jobs & Applications' },
    { value: 'recruiters', label: 'Recruiters & Hiring' },
    { value: 'companies', label: 'Companies & Profiles' },
    { value: 'messaging', label: 'Messaging & Networking' },
    { value: 'privacy', label: 'Privacy & Data Rights' },
    { value: 'trust_safety', label: 'Trust & Safety' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'other', label: 'General Query' },
  ];

  const handleSubmit = async () => {
    if (!subject || !description) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    const ticket = await supportApi.createTicket({
      category,
      subject,
      description,
      priority,
    });
    setCreatedTicket(ticket);
  };

  return (
    <Card sx={{ borderRadius: '24px', p: { xs: 3, md: 5 }, maxWidth: 750, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <ContactSupportIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Create Support Request
        </Typography>
      </Stack>

      {createdTicket ? (
        <Alert severity="success" sx={{ borderRadius: '16px', py: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Ticket Submitted Successfully!
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Your support ticket number is <strong>{createdTicket.ticket_number}</strong>. Our team will respond shortly.
          </Typography>
        </Alert>
      ) : (
        <Stack spacing={3}>
          {error && <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>}

          <TextField
            select
            label="Support Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
          >
            {categories.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your inquiry..."
            fullWidth
            required
          />

          <TextField
            label="Detailed Description"
            multiline
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide full details, including steps to reproduce if reporting a technical issue..."
            fullWidth
            required
          />

          <TextField
            select
            label="Urgency Preference"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            fullWidth
            helperText="Internal support rules determine final queue prioritization."
          >
            <MenuItem value="low">Low (General guidance)</MenuItem>
            <MenuItem value="normal">Normal (Standard query)</MenuItem>
            <MenuItem value="high">High (Feature blocking issue)</MenuItem>
            <MenuItem value="urgent">Urgent (Account compromise / Critical security)</MenuItem>
          </TextField>

          <Button
            variant="contained"
            onClick={handleSubmit}
            endIcon={<SendIcon />}
            sx={{ borderRadius: '12px', fontWeight: 800, py: 1.5, fontSize: '1rem' }}
          >
            Submit Support Request
          </Button>
        </Stack>
      )}
    </Card>
  );
};

export default ContactSupport;
