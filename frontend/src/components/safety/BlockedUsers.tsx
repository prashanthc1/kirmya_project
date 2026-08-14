'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Alert,
  TextField,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import { safetyApi } from '../../features/trust_safety/api';
import { UserBlock } from '../../features/trust_safety/types';

export const BlockedUsers: React.FC = () => {
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    safetyApi
      .getUserBlocks()
      .then((res) => {
        if (mounted) {
          setBlocks(res || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleUnblock = async (id: string, blockedId: string) => {
    await safetyApi.unblockUser(blockedId);
    setBlocks((prev) => prev.filter((b) => b.id !== id && b.blocked_id !== blockedId));
    setMessage('Account unblocked successfully. Communication channels restored.');
  };

  const filteredBlocks = blocks.filter(
    (b) =>
      (b.blocked_name || b.blocked_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <BlockIcon color="error" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Blocked Accounts & Entities
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Manage users, recruiters, and companies blocked from contacting you or seeing your profile.
          </Typography>
        </Box>
      </Stack>

      {message && (
        <Alert severity="info" onClose={() => setMessage(null)} sx={{ mb: 2, borderRadius: '12px' }}>
          {message}
        </Alert>
      )}

      <TextField
        size="small"
        placeholder="Search blocked accounts by name or reason..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
        }}
        fullWidth
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredBlocks.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No blocked accounts found.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Entity Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Blocked Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBlocks.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{b.blocked_name || b.blocked_id}</TableCell>
                  <TableCell>
                    <Chip label={b.blocked_type.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{b.reason || 'No reason provided'}</TableCell>
                  <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleUnblock(b.id, b.blocked_id)}
                      sx={{ borderRadius: '8px', fontWeight: 800 }}
                    >
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
};

export default BlockedUsers;
