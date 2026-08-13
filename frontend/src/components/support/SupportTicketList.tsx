'use client';

import React, { useState, useEffect } from 'react';
import {
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
} from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import Link from 'next/link';
import { supportApi } from '../../features/support/services/supportApi';
import { SupportTicket } from '../../features/support/types';

export const SupportTicketList: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    supportApi.getUserTickets().then(setTickets);
  }, []);

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <ConfirmationNumberIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>My Support Requests</Typography>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Ticket Number</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Created Date</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id}>
                <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{t.ticket_number}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.subject}</TableCell>
                <TableCell><Chip label={t.category.toUpperCase()} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={t.status.toUpperCase()} color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button component={Link} href={`/support/tickets/${t.id}`} size="small">
                    View Thread
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

export default SupportTicketList;
