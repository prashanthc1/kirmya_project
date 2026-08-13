'use client';

import React, { useState } from 'react';
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
  Stack,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export const ReportList: React.FC = () => {
  const [reports] = useState([
    {
      id: 'rep-101',
      target_type: 'job',
      target_title: 'Remote Senior Data Engineer',
      category: 'fake_job',
      status: 'submitted',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <ReportProblemIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>My Submitted Reports</Typography>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Report ID</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Target Entity</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Date Submitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r.id}>
                <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{r.id}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{r.target_title}</TableCell>
                <TableCell><Chip label={r.category.toUpperCase()} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={r.status.toUpperCase()} color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default ReportList;
