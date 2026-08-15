'use client';

import React, { useState } from 'react';
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
  Paper,
  Chip,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import AddIcon from '@mui/icons-material/Add';

export const AdminLegalCMS: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [docs, setDocs] = useState([
    { slug: 'terms', title: 'Terms of Service', version: '1.0.0', status: 'Published', effective: '2026-08-12' },
    { slug: 'privacy', title: 'Privacy Policy', version: '1.0.0', status: 'Published', effective: '2026-08-12' },
    { slug: 'cookies', title: 'Cookie Policy', version: '1.0.0', status: 'Published', effective: '2026-08-12' },
    { slug: 'ai-policy', title: 'AI Policy', version: '1.0.0', status: 'Published', effective: '2026-08-12' },
  ]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <GavelIcon sx={{ color: '#6366f1', fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Legal Document &amp; Compliance CMS
            </Typography>
          </Stack>
          <Typography variant="subtitle1" color="text.secondary">
            Publish versioned legal policies, manage cookie registry, monitor data requests, and set retention policies.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: '12px', fontWeight: 800 }}>
          New Legal Document
        </Button>
      </Stack>

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Document Title &amp; Slug</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Current Version</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Effective Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.slug} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{doc.title}</Typography>
                    <Typography variant="caption" color="text.secondary">/legal/{doc.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`v${doc.version}`} size="small" color="primary" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={doc.status} size="small" color="success" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{doc.effective}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" sx={{ fontWeight: 700 }}>Edit Version</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AdminLegalCMS;
