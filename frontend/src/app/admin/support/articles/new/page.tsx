'use client';

import React from 'react';
import { Container, Card, Typography, TextField, Button, Stack, MenuItem } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function AdminNewArticlePage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} href="/admin/support" startIcon={<ArrowBackIcon />} sx={{ mb: 2, fontWeight: 800 }}>
        Back to Admin Desk
      </Button>
      <Card sx={{ borderRadius: '24px', p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>Create Knowledge Base Article</Typography>
        <Stack spacing={2.5}>
          <TextField label="Article Title" fullWidth required />
          <TextField select label="Category" defaultValue="getting_started" fullWidth>
            <MenuItem value="getting_started">Getting Started</MenuItem>
            <MenuItem value="account">Account & Security</MenuItem>
            <MenuItem value="jobs">Jobs & Applications</MenuItem>
          </TextField>
          <TextField label="Summary" multiline rows={2} fullWidth required />
          <TextField label="Article Content (Markdown / Text)" multiline rows={8} fullWidth required />
          <Button variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Publish Article
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
