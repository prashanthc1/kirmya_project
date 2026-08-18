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
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import { DataInventoryItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const classificationColors: Record<DataInventoryItem['classification'], 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success'> = {
  Public: 'success',
  Internal: 'info',
  Confidential: 'warning',
  Restricted: 'error',
  PII: 'secondary',
  PHI: 'error',
};

export const DataInventoryTable: React.FC = () => {
  const [items, setItems] = useState<DataInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<DataInventoryItem | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const data = await privacyApi.getDataInventory();
    setItems(data);
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    const updated = await privacyApi.updateDataInventoryItem(editItem.id, editItem);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditItem(null);
  };

  const filteredItems = items.filter((item) =>
    `${item.datasetName} ${item.category} ${item.owner} ${item.classification}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <StorageIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Data Asset & Processing Inventory (RoPA)
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Central catalog of processed datasets, ownership, retention scope, and data sensitivity classifications.
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search datasets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Dataset Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Classification</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Records</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Storage Location</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>PII</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {item.datasetName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {item.id} • Last Audit: {item.lastAuditDate}
                  </Typography>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <Chip
                    label={item.classification}
                    color={classificationColors[item.classification]}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>{item.owner}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {item.recordCount.toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  {item.storageLocation}
                </TableCell>
                <TableCell>
                  {item.hasPII ? (
                    <Chip
                      icon={<SecurityIcon fontSize="small" />}
                      label="Contains PII"
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Chip label="No PII" color="default" variant="outlined" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    color={item.status === 'active' ? 'success' : 'default'}
                    size="small"
                    variant="filled"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit Classification & Status">
                    <IconButton size="small" onClick={() => setEditItem(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No datasets match search criteria.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      {editItem && (
        <Dialog open onClose={() => setEditItem(null)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontWeight: 800 }}>Update Data Asset Metadata</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Dataset Name"
                value={editItem.datasetName}
                onChange={(e) => setEditItem({ ...editItem, datasetName: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Classification</InputLabel>
                <Select
                  value={editItem.classification}
                  label="Classification"
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      classification: e.target.value as DataInventoryItem['classification'],
                    })
                  }
                >
                  <MenuItem value="Public">Public</MenuItem>
                  <MenuItem value="Internal">Internal</MenuItem>
                  <MenuItem value="Confidential">Confidential</MenuItem>
                  <MenuItem value="Restricted">Restricted</MenuItem>
                  <MenuItem value="PII">PII</MenuItem>
                  <MenuItem value="PHI">PHI</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Data Owner / Team"
                value={editItem.owner}
                onChange={(e) => setEditItem({ ...editItem, owner: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editItem.status}
                  label="Status"
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      status: e.target.value as DataInventoryItem['status'],
                    })
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                  <MenuItem value="deprecated">Deprecated</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Card>
  );
};

export default DataInventoryTable;
