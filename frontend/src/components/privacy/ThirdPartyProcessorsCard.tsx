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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import PublicIcon from '@mui/icons-material/Public';
import EditIcon from '@mui/icons-material/Edit';
import { ThirdPartyProcessorItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const riskColors: Record<ThirdPartyProcessorItem['riskLevel'], 'success' | 'info' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

const dpaColors: Record<ThirdPartyProcessorItem['dpaStatus'], 'success' | 'warning' | 'error'> = {
  signed: 'success',
  pending: 'warning',
  expired: 'error',
};

export const ThirdPartyProcessorsCard: React.FC = () => {
  const [processors, setProcessors] = useState<ThirdPartyProcessorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<ThirdPartyProcessorItem | null>(null);

  useEffect(() => {
    loadProcessors();
  }, []);

  const loadProcessors = async () => {
    setLoading(true);
    const data = await privacyApi.getThirdPartyProcessors();
    setProcessors(data);
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    const updated = await privacyApi.updateProcessor(editItem.id, editItem);
    setProcessors((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditItem(null);
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
            <HubIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Third-Party Sub-Processor & Transfer Controls Inventory
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage external vendors, Data Processing Agreements (DPA), and cross-border transfer mechanisms.
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Vendor / Sub-Processor</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Service Provided</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Data Categories Shared</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Data Location</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Transfer Mechanism</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>DPA Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Risk Level</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processors.map((proc) => (
              <TableRow key={proc.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{proc.vendorName}</TableCell>
                <TableCell>{proc.serviceType}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {proc.dataShared.map((d, idx) => (
                      <Chip key={idx} label={d} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PublicIcon fontSize="small" color="action" />
                    <Typography variant="body2">{proc.country}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={proc.transferMechanism} size="small" color="secondary" variant="filled" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={proc.dpaStatus.toUpperCase()}
                    color={dpaColors[proc.dpaStatus]}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={proc.riskLevel.toUpperCase()}
                    color={riskColors[proc.riskLevel]}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Tooltip title="Edit Vendor Compliance">
                    <IconButton size="small" onClick={() => setEditItem(proc)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Vendor Modal */}
      {editItem && (
        <Dialog open onClose={() => setEditItem(null)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 800 }}>Update Vendor DPA & Risk Status</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Vendor: {editItem.vendorName}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Transfer Mechanism</InputLabel>
                <Select
                  value={editItem.transferMechanism}
                  label="Transfer Mechanism"
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      transferMechanism: e.target.value as ThirdPartyProcessorItem['transferMechanism'],
                    })
                  }
                >
                  <MenuItem value="SCC">Standard Contractual Clauses (SCC)</MenuItem>
                  <MenuItem value="DPA">Data Processing Addendum (DPA)</MenuItem>
                  <MenuItem value="BCR">Binding Corporate Rules (BCR)</MenuItem>
                  <MenuItem value="Adequacy">EU Adequacy Decision</MenuItem>
                  <MenuItem value="Consent">Explicit User Consent</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>DPA Status</InputLabel>
                <Select
                  value={editItem.dpaStatus}
                  label="DPA Status"
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      dpaStatus: e.target.value as ThirdPartyProcessorItem['dpaStatus'],
                    })
                  }
                >
                  <MenuItem value="signed">Signed & Valid</MenuItem>
                  <MenuItem value="pending">Pending Review</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Vendor Risk Level</InputLabel>
                <Select
                  value={editItem.riskLevel}
                  label="Vendor Risk Level"
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      riskLevel: e.target.value as ThirdPartyProcessorItem['riskLevel'],
                    })
                  }
                >
                  <MenuItem value="low">Low Risk</MenuItem>
                  <MenuItem value="medium">Medium Risk</MenuItem>
                  <MenuItem value="high">High Risk</MenuItem>
                  <MenuItem value="critical">Critical Risk</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Save Updates
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Card>
  );
};

export default ThirdPartyProcessorsCard;
