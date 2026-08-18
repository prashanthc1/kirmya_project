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
  Checkbox,
  ListItemText,
  Alert,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { LegalHoldItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const CATEGORIES_LIST = ['User Data', 'Financial', 'Analytics', 'Recruiting', 'Audit Logs'];

export const LegalHoldDialog: React.FC = () => {
  const [holds, setHolds] = useState<LegalHoldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  // Form state
  const [caseNumber, setCaseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [affectedCategories, setAffectedCategories] = useState<string[]>([]);

  useEffect(() => {
    loadHolds();
  }, []);

  const loadHolds = async () => {
    setLoading(true);
    const data = await privacyApi.getLegalHolds();
    setHolds(data);
    setLoading(false);
  };

  const handleCreateHold = async () => {
    if (!caseNumber || !title || !reason || !issuedBy) return;
    const created = await privacyApi.createLegalHold({
      caseNumber,
      title,
      reason,
      issuedBy,
      affectedCategories: affectedCategories.length ? affectedCategories : ['User Data'],
    });
    setHolds((prev) => [created, ...prev]);
    setOpenCreate(false);
    setCaseNumber('');
    setTitle('');
    setReason('');
    setIssuedBy('');
    setAffectedCategories([]);
  };

  const handleRelease = async (id: string) => {
    const updated = await privacyApi.releaseLegalHold(id);
    setHolds((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
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
            <GavelIcon sx={{ color: 'warning.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Legal Data Preservation Holds
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Freeze automated data retention purges for litigation, regulatory audits, or compliance holds.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
        >
          Issue Legal Hold
        </Button>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Case #</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Title & Rationale</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Affected Categories</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Issued By</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Issued At</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holds.map((h) => (
              <TableRow key={h.id} hover>
                <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{h.caseNumber}</TableCell>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {h.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {h.reason}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {h.affectedCategories.map((cat, idx) => (
                      <Chip key={idx} label={cat} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>{h.issuedBy}</TableCell>
                <TableCell>
                  <Chip
                    icon={h.status === 'active' ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    label={h.status.toUpperCase()}
                    color={h.status === 'active' ? 'warning' : 'default'}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  {h.status === 'active' ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => handleRelease(h.id)}
                      sx={{ borderRadius: '8px', textTransform: 'none' }}
                    >
                      Release Hold
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Released {h.releasedAt ? new Date(h.releasedAt).toLocaleDateString() : ''}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Modal */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Issue Preservation Legal Hold</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity="warning" sx={{ borderRadius: '12px' }}>
              Issuing a legal hold halts all scheduled data deletion jobs across matching datasets.
            </Alert>
            <TextField
              label="Case Reference Number"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              fullWidth
              placeholder="e.g. LIT-2026-0911"
            />
            <TextField
              label="Legal Hold Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              placeholder="Descriptive litigation or audit title"
            />
            <TextField
              label="Legal Rationale & Scope"
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
            />
            <TextField
              label="Issued By (Legal Officer)"
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Affected Dataset Categories</InputLabel>
              <Select
                multiple
                value={affectedCategories}
                onChange={(e) => setAffectedCategories(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {CATEGORIES_LIST.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    <Checkbox checked={affectedCategories.indexOf(cat) > -1} />
                    <ListItemText primary={cat} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleCreateHold}>
            Issue Preservation Order
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default LegalHoldDialog;
