'use client';

import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { MessageItem, messagingApi } from '@/features/messaging/services/messagingApi';
import TextField from '@mui/material/TextField';

export default function MessageSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageItem[]>([]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    messagingApi.searchMessages(q).then((data) => setResults(data)).catch(() => {});
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Search Authorized Messages
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Full-text search strictly scoped to your active conversations.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search message text..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
        />
      </Box>

      <Stack spacing={2}>
        {results.map((msg) => (
          <Paper key={msg.id} sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{msg.content}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(msg.createdAt).toLocaleString()}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
