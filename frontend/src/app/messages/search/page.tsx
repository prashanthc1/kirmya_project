'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import { MessageItem, messagingApi } from '../../../features/messaging/services/messagingApi';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

function MessageSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await messagingApi.searchMessages(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, performSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    router.replace('/messages/search');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <IconButton component={Link} href="/messages" size="small" aria-label="Back to messages">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Search Messages
        </Typography>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, ml: { xs: 0, sm: 5 } }}>
        Search message history across your authorized conversations.
      </Typography>

      <Box sx={{ mb: 4, ml: { xs: 0, sm: 5 } }}>
        <TextField
          fullWidth
          placeholder="Search keywords in messages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            const params = new URLSearchParams();
            if (e.target.value) params.set('q', e.target.value);
            router.replace(`/messages/search${params.toString() ? `?${params.toString()}` : ''}`);
          }}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClear} aria-label="Clear search query">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: 'background.paper',
            },
          }}
        />
      </Box>

      <Box sx={{ ml: { xs: 0, sm: 5 } }}>
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: `${tokens.radius.md}px` }} />
            ))}
          </Stack>
        ) : results.length > 0 ? (
          <Stack spacing={2}>
            {results.map((msg) => (
              <Card
                key={msg.id}
                component={Link}
                href={`/messages?conv=${msg.conversationId}`}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: `${tokens.radius.md}px`,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                      {msg.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Conversation ID: {msg.conversationId}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                  </Typography>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : query.trim() ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              borderRadius: `${tokens.radius.lg}px`,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              No messages found matching &ldquo;{query}&rdquo;
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check for typos or try searching with different keywords.
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Container>
  );
}

export default function MessageSearchPage() {
  return (
    <AuthenticatedLayout>
      <Suspense fallback={null}>
        <MessageSearchContent />
      </Suspense>
    </AuthenticatedLayout>
  );
}
