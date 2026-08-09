'use client';

import React from 'react';
import { Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { MockInterviewSession } from '@/features/interview-prep/types';

interface PracticeHistoryTableProps {
  sessions: MockInterviewSession[];
}

export const PracticeHistoryTable: React.FC<PracticeHistoryTableProps> = ({ sessions }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box p={3} pb={2}>
        <Typography variant="h6" fontWeight={700}>
          Mock Practice Session History
        </Typography>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: 600 }}>
          <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.6)' }}>
            <TableRow>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Session Title</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Difficulty</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Progress</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Score</TableCell>
              <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                <TableCell sx={{ color: '#F8FAFC', fontWeight: 600 }}>{s.title}</TableCell>
                <TableCell sx={{ color: '#CBD5E1' }}>{s.interview_type}</TableCell>
                <TableCell sx={{ color: '#CBD5E1' }}>{s.difficulty}</TableCell>
                <TableCell sx={{ color: '#CBD5E1' }}>{s.completed_questions}/{s.total_questions}</TableCell>
                <TableCell sx={{ color: '#60A5FA', fontWeight: 700 }}>{s.overall_score || '--'}/100</TableCell>
                <TableCell sx={{ color: '#94A3B8' }}>{new Date(s.started_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}

            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: '#64748B', py: 3 }}>
                  No past mock interview sessions recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
