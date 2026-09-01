'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  InputAdornment,
  Paper,
} from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SearchIcon from '@mui/icons-material/Search';
import TimerIcon from '@mui/icons-material/Timer';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import { trustSafetyApi } from '../../features/trust_safety/services/trustSafetyApi';
import { SafetyCase } from '../../features/trust_safety/types';

interface ModerationQueueTableProps {
  onSelectCase?: (caseItem: SafetyCase) => void;
}

export const ModerationQueueTable: React.FC<ModerationQueueTableProps> = ({ onSelectCase }) => {
  const [cases, setCases] = useState<SafetyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignCaseModal, setAssignCaseModal] = useState<SafetyCase | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Assign Modal state
  const [assigneeId, setAssigneeId] = useState('mod-tier2');
  const [assignTeam, setAssignTeam] = useState('tier-2-moderation');

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadCases = async () => {
    try {
      const data = await trustSafetyApi.getSafetyCases();
      setCases(data || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleClaim = async (caseId: string) => {
    await trustSafetyApi.claimCase(caseId);
    setStatusMsg(`Case ${caseId} successfully claimed.`);
    loadCases();
  };

  const handleAssignSubmit = async () => {
    if (!assignCaseModal) return;
    await trustSafetyApi.assignCase(assignCaseModal.id, assigneeId, assignTeam);
    setStatusMsg(`Case ${assignCaseModal.case_number || assignCaseModal.id} assigned to ${assigneeId} (${assignTeam}).`);
    setAssignCaseModal(null);
    loadCases();
  };

  const getPriorityBadge = (priority: SafetyCase['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Chip label="URGENT" color="error" size="small" sx={{ fontWeight: 900, borderRadius: '8px' }} />;
      case 'high':
        return <Chip label="HIGH" color="warning" size="small" sx={{ fontWeight: 900, borderRadius: '8px' }} />;
      case 'normal':
        return <Chip label="NORMAL" color="info" size="small" sx={{ fontWeight: 800, borderRadius: '8px' }} />;
      case 'low':
      default:
        return <Chip label="LOW" color="default" size="small" sx={{ fontWeight: 700, borderRadius: '8px' }} />;
    }
  };

  const getRiskScoreBadge = (score: number) => {
    if (score >= 75) {
      return (
        <Chip
          label={`Risk ${score}`}
          color="error"
          size="small"
          sx={{ fontWeight: 900, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
        />
      );
    }
    if (score >= 40) {
      return (
        <Chip
          label={`Risk ${score}`}
          color="warning"
          size="small"
          sx={{ fontWeight: 900, background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
        />
      );
    }
    return (
      <Chip
        label={`Risk ${score}`}
        color="success"
        size="small"
        sx={{ fontWeight: 900, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981' }}
      />
    );
  };

  const getSlaTimerBadge = (deadline?: string) => {
    if (!deadline) return <Typography variant="caption" color="text.secondary">No SLA</Typography>;
    const remainingMs = new Date(deadline).getTime() - Date.now();
    const remainingMins = Math.round(remainingMs / 60000);
    const isOverdue = remainingMs < 0;

    return (
      <Chip
        icon={<TimerIcon fontSize="small" />}
        label={isOverdue ? `Overdue ${Math.abs(remainingMins)}m` : `${remainingMins}m remaining`}
        color={isOverdue ? 'error' : remainingMins < 60 ? 'warning' : 'default'}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 700, borderRadius: '8px' }}
      />
    );
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      (c.target_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.case_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon color="primary" /> Interactive Moderation Queue
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Prioritized content violation cases, SLA deadlines, risk scores, and enforcement triage console.
          </Typography>
        </Box>
        <Chip
          icon={<FilterListIcon />}
          label={`${filteredCases.length} Cases Pending`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 800, borderRadius: '12px' }}
        />
      </Stack>

      {statusMsg && (
        <Alert severity="success" onClose={() => setStatusMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>
          {statusMsg}
        </Alert>
      )}

      {/* Search & Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '16px',
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search by Case Ref, Title or Category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="claimed">Claimed</MenuItem>
              <MenuItem value="assigned">Assigned</MenuItem>
              <MenuItem value="investigating">Investigating</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)}>
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="fake_job">Fake Job / Fraud</MenuItem>
              <MenuItem value="impersonation">Impersonation</MenuItem>
              <MenuItem value="spam">Spam / Outreach</MenuItem>
              <MenuItem value="harassment">Harassment</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Queue Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : filteredCases.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No moderation cases match the current filter criteria.
        </Alert>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }}>Case Ref / Target</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Risk Score</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>SLA Timer</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Status & Assignment</TableCell>
                <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                  onClick={() => onSelectCase && onSelectCase(c)}
                >
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                      {c.case_number || c.id}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {c.target_title || c.target_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Type: {c.target_type.toUpperCase()}
                    </Typography>
                  </TableCell>

                  <TableCell>{getPriorityBadge(c.priority)}</TableCell>

                  <TableCell>{getRiskScoreBadge(c.risk_score)}</TableCell>

                  <TableCell>
                    <Chip label={c.category.toUpperCase().replace('_', ' ')} variant="outlined" size="small" sx={{ fontWeight: 700 }} />
                  </TableCell>

                  <TableCell>{getSlaTimerBadge(c.sla_deadline)}</TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      <Chip label={c.status.toUpperCase()} color="info" size="small" sx={{ fontWeight: 800, width: 'fit-content' }} />
                      {c.assigned_to ? (
                        <Typography variant="caption" color="text.secondary">
                          Assignee: {c.assigned_to}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="warning.main">
                          Unassigned ({c.assigned_team || 'General Queue'})
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {c.status === 'open' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<HowToRegIcon />}
                          onClick={() => handleClaim(c.id)}
                          sx={{ borderRadius: '8px', fontWeight: 800 }}
                        >
                          Claim
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setAssignCaseModal(c)}
                        sx={{ borderRadius: '8px', fontWeight: 800 }}
                      >
                        Assign
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<GavelIcon />}
                        onClick={() => onSelectCase && onSelectCase(c)}
                        sx={{ borderRadius: '8px', fontWeight: 800 }}
                      >
                        Investigate
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Assign Case Modal */}
      <Dialog
        open={Boolean(assignCaseModal)}
        onClose={() => setAssignCaseModal(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Assign Moderation Case</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Assignee Moderator ID"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Assigned Team</InputLabel>
              <Select value={assignTeam} label="Assigned Team" onChange={(e) => setAssignTeam(e.target.value)}>
                <MenuItem value="tier-1-triage">Tier 1 Triage Team</MenuItem>
                <MenuItem value="tier-2-moderation">Tier 2 Senior Moderation</MenuItem>
                <MenuItem value="legal-compliance">Legal & Compliance</MenuItem>
                <MenuItem value="anti-fraud-ops">Anti-Fraud Operations</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAssignCaseModal(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAssignSubmit} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Confirm Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ModerationQueueTable;
