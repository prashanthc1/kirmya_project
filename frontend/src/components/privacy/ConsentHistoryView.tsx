'use client';

import React from 'react';
import {
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { ConsentHistoryItem } from '../../features/legal/types';

interface ConsentHistoryViewProps {
  history?: ConsentHistoryItem[];
}

export const ConsentHistoryView: React.FC<ConsentHistoryViewProps> = ({ history }) => {
  const items: ConsentHistoryItem[] = history || [
    { id: 'c1', document: 'Terms of Service', version: '1.0.0', accepted_at: '2026-06-15T10:00:00Z', source: 'Web Sign-up' },
    { id: 'c2', document: 'Privacy Policy', version: '1.0.0', accepted_at: '2026-06-15T10:00:00Z', source: 'Web Sign-up' },
    { id: 'c3', document: 'Cookie Preferences', version: '1.0.0', accepted_at: '2026-07-20T14:30:00Z', source: 'Cookie Banner' },
  ];

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Consent History Audit Log</Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Policy / Document</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Version</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Channel / Source</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ fontWeight: 700 }}>{row.document}</TableCell>
                <TableCell><Chip label={`v${row.version}`} size="small" variant="outlined" /></TableCell>
                <TableCell>{new Date(row.accepted_at).toLocaleString()}</TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell><Chip label="Active Consent" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default ConsentHistoryView;
