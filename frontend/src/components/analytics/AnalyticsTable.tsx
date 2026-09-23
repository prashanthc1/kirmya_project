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
      <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 1.5 }}>
        {title}
      </Typography>
      <TableContainer component={Paper} sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} align={col.align || 'left'} sx={{ color: "text.secondary", fontWeight: 'bold' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx} sx={{ '&:hover': { bgcolor: "action.hover" } }}>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || 'left'} sx={{ color: "text.primary" }}>
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
