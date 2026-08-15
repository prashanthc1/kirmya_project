'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Box,
  Stack,
  TextField,
  Button,
  Avatar,
  Chip,
  InputAdornment,
  Paper,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MessageIcon from '@mui/icons-material/Message';
import Link from 'next/link';
import { CompanyConnection, networkingApi } from '../../features/networking/services/networkingApi';

export const ReferralDiscoveryCard: React.FC = () => {
  const [companyQuery, setCompanyQuery] = useState('');
  const [results, setResults] = useState<CompanyConnection[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!companyQuery.trim()) return;
    try {
      const data = await networkingApi.getCompanyConnections(companyQuery);
      setResults(data);
      setSearched(true);
    } catch {
      alert('Failed to search company connections.');
    }
  };

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '24px',
        mb: 3,
        backdropFilter: 'blur(16px)',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <BusinessIcon color="secondary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Company Referral Finder
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Find contacts at target companies to request internal job referrals & insights.
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Enter company name (e.g. Kirmya Tech, DataGen, Google)..."
          value={companyQuery}
          onChange={(e) => setCompanyQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" onClick={handleSearch} sx={{ borderRadius: '12px', fontWeight: 800, minWidth: 100 }}>
          Find
        </Button>
      </Stack>

      {searched && (
        <Stack spacing={2}>
          {results.map((comp) => (
            <Paper key={comp.id} variant="outlined" sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontWeight: 800 }}>
                    {comp.companyName[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {comp.companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comp.department ? `${comp.department} • ` : ''}{comp.connectionCount} Network Contacts
                    </Typography>
                  </Box>
                </Stack>
                <Chip label={`${comp.connectionCount} Insiders`} color="secondary" size="small" sx={{ fontWeight: 800 }} />
              </Stack>

              <Stack spacing={1} sx={{ mt: 1 }}>
                {comp.connections.map((c) => (
                  <Stack key={c.userId} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1, bgcolor: 'background.paper', borderRadius: '12px' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.headline}
                      </Typography>
                    </Box>
                    <Button
                      component={Link}
                      href={`/messaging?user=${c.userId}&ref=referral`}
                      size="small"
                      variant="outlined"
                      startIcon={<MessageIcon />}
                      sx={{ borderRadius: '8px', fontWeight: 700 }}
                    >
                      Ask Referral
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ))}

          {results.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontStyle: 'italic' }}>
              No 1st-degree contacts found at &quot;{companyQuery}&quot;. Try searching another company or expand your network!
            </Typography>
          )}
        </Stack>
      )}
    </Card>
  );
};

export default ReferralDiscoveryCard;
