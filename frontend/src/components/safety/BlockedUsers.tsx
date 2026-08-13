'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { safetyApi } from '../../features/trust_safety/api';

export const BlockedUsers: React.FC = () => {
  const [blocks, setBlocks] = useState([
    { id: 'blk-1', blocked_id: 'u-88', blocked_type: 'user', name: 'Suspicious Recruiter Account', created_at: new Date(Date.now() - 864000000).toISOString() },
  ]);
  const [message, setMessage] = useState<string | null>(null);

  const handleUnblock = async (id: string, blockedId: string) => {
    await safetyApi.unblockUser(blockedId);
    setBlocks(blocks.filter((b) => b.id !== id));
    setMessage('User unblocked successfully.');
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <BlockIcon color="error" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Blocked Accounts & Entities</Typography>
      </Stack>

      {message && <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>{message}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Entity Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Blocked Date</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blocks.map((b) => (
              <TableRow key={b.id}>
                <TableCell sx={{ fontWeight: 700 }}>{b.name}</TableCell>
                <TableCell>{b.blocked_type.toUpperCase()}</TableCell>
                <TableCell>{new Date(b.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button size="small" color="error" onClick={() => handleUnblock(b.id, b.blocked_id)}>
                    Unblock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default BlockedUsers;
