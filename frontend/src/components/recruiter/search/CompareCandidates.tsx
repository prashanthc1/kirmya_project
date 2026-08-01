'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Stack,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { CandidateSearchResultItem } from '../../../features/recruiter/search/types';

interface CompareCandidatesProps {
  open: boolean;
  onClose: () => void;
  candidates: CandidateSearchResultItem[];
}

export const CompareCandidates: React.FC<CompareCandidatesProps> = ({ open, onClose, candidates }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (candidates.length === 0) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
        Candidate Side-by-Side Comparison Matrix ({candidates.length})
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: 180 }}>Criteria</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center" sx={{ minWidth: 220 }}>
                    <Avatar src={c.avatarUrl} sx={{ width: 50, height: 50, mx: 'auto', mb: 1, bgcolor: 'primary.main', fontWeight: 800 }}>
                      {c.name[0]}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                      {c.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {c.headline}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>AI Match Score</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center">
                    <Chip
                      icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                      label={`${c.aiMatch.overallScore}% MATCH`}
                      color="success"
                      sx={{ fontWeight: 900, fontSize: '0.8rem' }}
                    />
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Experience</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center">
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {c.yearsExperience} Years Exp
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.currentPosition} at {c.company}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Location</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {c.location}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Top Skills</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center">
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center" useFlexGap sx={{ gap: 0.5 }}>
                      {c.skills.slice(0, 4).map((sk) => (
                        <Chip key={sk} label={sk} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                      ))}
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Expected Salary</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center">
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {c.expectedSalary}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Availability &amp; Notice</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center">
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      {c.availability}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Notice: {c.noticePeriod}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Education</TableCell>
                {candidates.map((c) => (
                  <TableCell key={c.id} align="center">
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {c.educationDegree}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
};

export default CompareCandidates;
