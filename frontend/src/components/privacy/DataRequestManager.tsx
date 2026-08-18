'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
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
  IconButton,
  Tooltip,
} from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AddIcon from '@mui/icons-material/Add';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { DataSubjectRequestItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const statusColors: Record<DataSubjectRequestItem['status'], 'warning' | 'info' | 'secondary' | 'success' | 'error'> = {
  pending: 'warning',
  in_review: 'info',
  processing: 'secondary',
  completed: 'success',
  rejected: 'error',
};

export const DataRequestManager: React.FC = () => {
  const [requests, setRequests] = useState<DataSubjectRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<DataSubjectRequestItem | null>(null);
  const [newStatus, setNewStatus] = useState<DataSubjectRequestItem['status']>('pending');
  const [notes, setNotes] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  // New request form state
  const [newUserId, setNewUserId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newReqType, setNewReqType] = useState<DataSubjectRequestItem['requestType']>('access');
  const [newDueDate, setNewDueDate] = useState('2026-09-20');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await privacyApi.getDataSubjectRequests();
    setRequests(data);
    setLoading(false);
  };

  const handleOpenUpdate = (req: DataSubjectRequestItem) => {
    setSelectedReq(req);
    setNewStatus(req.status);
    setNotes(req.notes || '');
  };

  const handleSaveUpdate = async () => {
    if (!selectedReq) return;
    const updated = await privacyApi.updateDSRStatus(selectedReq.id, newStatus, notes);
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedReq(null);
  };

  const handleCreateRequest = async () => {
    if (!newUserId || !newUserEmail) return;
    const created = await privacyApi.createDataSubjectRequest({
      userId: newUserId,
      userEmail: newUserEmail,
      requestType: newReqType,
      dueDate: newDueDate,
    });
    setRequests((prev) => [created, ...prev]);
    setOpenCreate(false);
    setNewUserId('');
    setNewUserEmail('');
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        backdropFilter: 'blur(12px)',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AssignmentIndIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Data Subject Rights (DSAR / DSR) Desk
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage GDPR, CCPA, and privacy rights requests (Access, Erasure, Export, Portability, Restriction).
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
        >
          Submit DSR Request
        </Button>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Request ID</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>User Email</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Submitted At</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Notes</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} hover>
                <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{req.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{req.userEmail}</TableCell>
                <TableCell>
                  <Chip
                    label={req.requestType.toUpperCase()}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>{new Date(req.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ color: 'warning.main', fontWeight: 700 }}>
                  {new Date(req.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={req.status.replace('_', ' ').toUpperCase()}
                    color={statusColors[req.status]}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {req.notes || '-'}
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Tooltip title="Update Request Status & Notes">
                    <IconButton size="small" onClick={() => handleOpenUpdate(req)}>
                      <EditNoteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No Data Subject Rights requests found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Dialog */}
      {selectedReq && (
        <Dialog open onClose={() => setSelectedReq(null)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 800 }}>
            Update DSR Request ({selectedReq.id})
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                User: {selectedReq.userEmail} ({selectedReq.userId})
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value as DataSubjectRequestItem['status'])}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_review">In Review</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Compliance Audit Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log fulfillment steps or legal rationale for rejection..."
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedReq(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveUpdate}>
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Data Subject Rights Request</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="User ID"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              fullWidth
              placeholder="e.g. usr-1029"
            />
            <TextField
              label="User Email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              fullWidth
              placeholder="user@example.com"
            />
            <FormControl fullWidth>
              <InputLabel>Request Type</InputLabel>
              <Select
                value={newReqType}
                label="Request Type"
                onChange={(e) =>
                  setNewReqType(e.target.value as DataSubjectRequestItem['requestType'])
                }
              >
                <MenuItem value="access">Access (GDPR Art. 15 / CCPA)</MenuItem>
                <MenuItem value="erasure">Erasure / Right to be Forgotten (Art. 17)</MenuItem>
                <MenuItem value="export">Data Export (Art. 20)</MenuItem>
                <MenuItem value="rectification">Rectification (Art. 16)</MenuItem>
                <MenuItem value="restriction">Restriction of Processing (Art. 18)</MenuItem>
                <MenuItem value="portability">Portability (Art. 20)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Compliance Due Date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRequest}>
            Create Request
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DataRequestManager;
