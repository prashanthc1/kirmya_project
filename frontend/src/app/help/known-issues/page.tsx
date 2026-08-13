'use client';

import React from 'react';
import { Container, Card, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';

export default function HelpKnownIssuesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>Known System Issues & Workarounds</Typography>
      <Card sx={{ borderRadius: '24px', p: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Issue Title</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Affected Component</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Workaround</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Mobile dropdown alignment in job alerts</TableCell>
              <TableCell>Job Search UI</TableCell>
              <TableCell><Chip label="INVESTIGATING" color="warning" size="small" sx={{ fontWeight: 800 }} /></TableCell>
              <TableCell>Rotate mobile screen or use desktop viewport.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </Container>
  );
}
