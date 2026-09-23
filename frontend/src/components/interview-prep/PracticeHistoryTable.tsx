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
        bgcolor: "background.paper",
        backdropFilter: 'blur(12px)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        color: "text.primary",
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
          <TableHead sx={{ bgcolor: "background.paper" }}>
            <TableRow>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>Session Title</TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>Difficulty</TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>Progress</TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>Score</TableCell>
              <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id} sx={{ '&:hover': { bgcolor: "action.hover" } }}>
                <TableCell sx={{ color: "text.primary", fontWeight: 600 }}>{s.title}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{s.interview_type}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{s.difficulty}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{s.completed_questions}/{s.total_questions}</TableCell>
                <TableCell sx={{ color: "primary.main", fontWeight: 700 }}>{s.overall_score || '--'}/100</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{new Date(s.started_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}

            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 3 }}>
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
