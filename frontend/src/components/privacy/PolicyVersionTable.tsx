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
  Tooltip,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PublishIcon from '@mui/icons-material/Publish';
import { PolicyVersionItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const statusColors: Record<PolicyVersionItem['status'], 'warning' | 'success' | 'default'> = {
  draft: 'warning',
  published: 'success',
  deprecated: 'default',
};

export const PolicyVersionTable: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyVersionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    const data = await privacyApi.getPolicyVersions();
    setPolicies(data);
    setLoading(false);
  };

  const handlePublish = async (id: string) => {
    const updated = await privacyApi.publishPolicyVersion(id);
    setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
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
            <MenuBookIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Internal Privacy Policies & Version Register
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Audit trail of policy revisions, effective dates, changelogs, and published compliance documentation.
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Policy Title</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Version</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Effective Date</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Author / Owner</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Changelog Summary</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((pol) => (
              <TableRow key={pol.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{pol.policyName}</TableCell>
                <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>v{pol.version}</TableCell>
                <TableCell>{pol.effectiveDate}</TableCell>
                <TableCell>{pol.author}</TableCell>
                <TableCell sx={{ maxWidth: 240 }}>{pol.changelog}</TableCell>
                <TableCell>
                  <Chip
                    label={pol.status.toUpperCase()}
                    color={statusColors[pol.status]}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  {pol.status === 'draft' && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PublishIcon />}
                      onClick={() => handlePublish(pol.id)}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Publish Version
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default PolicyVersionTable;
