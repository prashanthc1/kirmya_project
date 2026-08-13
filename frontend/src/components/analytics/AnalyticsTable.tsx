'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';

interface Column {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface AnalyticsTableProps {
  title: string;
  columns: Column[];
  rows: Record<string, any>[];
}

export default function AnalyticsTable({ title, columns, rows }: AnalyticsTableProps) {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff', mb: 1.5 }}>
        {title}
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#0f172a' }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align || 'left'} sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || 'left'} sx={{ color: '#f8fafc' }}>
                    {row[col.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
