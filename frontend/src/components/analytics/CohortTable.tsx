'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

export default function CohortTable() {
  const cohorts = [
    { date: 'Aug 01', size: 120, d1: '88%', d7: '65%', d14: '54%', d30: '48%' },
    { date: 'Aug 07', size: 145, d1: '91%', d7: '68%', d14: '58%', d30: '50%' },
    { date: 'Aug 14', size: 160, d1: '89%', d7: '66%', d14: '56%', d30: '-' },
  ];

  return (
    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', mb: 2 }}>
          User Retention Cohorts (Day 1 - Day 30)
        </Typography>

        <Table size="small">
          <TableHead sx={{ bgcolor: '#0f172a' }}>
            <TableRow>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Cohort Date</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Size</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Day 1</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Day 7</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Day 14</TableCell>
              <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Day 30</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cohorts.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>{row.date}</TableCell>
                <TableCell sx={{ color: '#cbd5e1' }}>{row.size}</TableCell>
                <TableCell sx={{ color: '#10b981', fontWeight: 'bold' }}>{row.d1}</TableCell>
                <TableCell sx={{ color: '#10b981', fontWeight: 'bold' }}>{row.d7}</TableCell>
                <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>{row.d14}</TableCell>
                <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>{row.d30}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
