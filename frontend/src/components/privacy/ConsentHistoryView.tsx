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
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { ConsentRecord } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

interface ConsentHistoryViewProps {
  history?: ConsentRecord[];
}

export const ConsentHistoryView: React.FC<ConsentHistoryViewProps> = ({ history: propHistory }) => {
  const [items, setItems] = useState<ConsentRecord[]>(propHistory || []);
  const [loading, setLoading] = useState(!propHistory);

  useEffect(() => {
    if (!propHistory) {
      securityApi.getConsentHistory().then((data) => {
        setItems(data);
        setLoading(false);
      });
    }
  }, [propHistory]);

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Consent History & Regulatory Audit Log
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Persistent record of legal agreements, terms of service, privacy policy acceptances, and cookie preferences.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Policy / Document</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Version</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Channel / Source</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{row.document}</TableCell>
                  <TableCell>
                    <Chip label={`v${row.version}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{new Date(row.accepted_at).toLocaleString()}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status ? row.status.toUpperCase() : 'ACTIVE'}
                      color={row.status === 'revoked' ? 'error' : 'success'}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
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

export default ConsentHistoryView;
