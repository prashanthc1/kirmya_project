'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Skeleton,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FilterListIcon from '@mui/icons-material/FilterList';

import { DiscoveryCard } from './DiscoveryCard';
import { recommendationApi } from '../../features/recommendation/services/recommendationApi';
import { FeedItem, FeedItemType } from '../../features/recommendation/types';
import { EmptyState, ErrorState } from '../common';
import { tokens } from '../../theme/tokens';

interface PersonalizedFeedStreamProps {
  initialLimit?: number;
  showTabs?: boolean;
}

export const PersonalizedFeedStream: React.FC<PersonalizedFeedStreamProps> = ({
  initialLimit = 15,
  showTabs = true,
}) => {
  const theme = useTheme();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchFeed = useCallback(
    async (cursor?: string, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const res = await recommendationApi.getFeed({
          cursor,
          limit: initialLimit,
        });

        if (append) {
          setItems((prev) => [...prev, ...(res.items || [])]);
        } else {
          setItems(res.items || []);
        }

        setNextCursor(res.nextCursor);
        setHasMore(Boolean(res.hasMore && res.nextCursor));
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Failed to load personalized feed');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [initialLimit]
  );

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleDismiss = async (id: string) => {
    // Optimistic removal
    setItems((prev) => prev.filter((item) => item.id !== id));
    setToastMessage('Recommendation dismissed');
    try {
      await recommendationApi.submitFeedback(id, 'dismiss');
    } catch {
      // Background retry or silent ignore
    }
  };

  const handleSave = async (id: string) => {
    const isCurrentlySaved = savedItemIds.has(id);
    const updated = new Set(savedItemIds);

    if (isCurrentlySaved) {
      updated.delete(id);
      setToastMessage('Item removed from saved');
    } else {
      updated.add(id);
      setToastMessage('Item saved to your bookmarks');
      try {
        await recommendationApi.submitFeedback(id, 'save');
      } catch {
        // Background ignore
      }
    }
    setSavedItemIds(updated);
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'jobs') return item.itemType === 'job';
    if (activeTab === 'people') return item.itemType === 'person';
    if (activeTab === 'communities') return item.itemType === 'community';
    if (activeTab === 'tips') return item.itemType === 'career_tip';
    return true;
  });

  return (
    <Stack spacing={2.5}>
      {/* Feed Controls Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        sx={{ gap: 1.5 }}
      >
        {showTabs ? (
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 36,
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: `${tokens.radius.sm}px`,
                px: 2,
              },
            }}
          >
            <Tab label="All Stream" value="all" />
            <Tab label="Job Matches" value="jobs" />
            <Tab label="Peer Suggestions" value="people" />
            <Tab label="Communities" value="communities" />
            <Tab label="AI Insights" value="tips" />
          </Tabs>
        ) : (
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Personalized Feed
          </Typography>
        )}

        <Tooltip title="Refresh Feed">
          <IconButton
            size="small"
            onClick={() => fetchFeed()}
            disabled={loading}
            sx={{
              border: `1px solid ${
                theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.1)'
              }`,
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Loading Skeletons */}
      {loading ? (
        <Stack spacing={2}>
          <Skeleton
            variant="rounded"
            height={160}
            sx={{ borderRadius: `${tokens.radius.lg}px` }}
          />
          <Skeleton
            variant="rounded"
            height={160}
            sx={{ borderRadius: `${tokens.radius.lg}px` }}
          />
          <Skeleton
            variant="rounded"
            height={160}
            sx={{ borderRadius: `${tokens.radius.lg}px` }}
          />
        </Stack>
      ) : error ? (
        <ErrorState
          title="Could not load recommendations"
          message={error}
          onRetry={() => fetchFeed()}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No recommendations in this category yet"
          description="Update your target career preferences or explore the full job board to get personalized suggestions."
          actionLabel="Refresh Stream"
          onAction={() => fetchFeed()}
        />
      ) : (
        <Stack spacing={2}>
          {filteredItems.map((item) => (
            <DiscoveryCard
              key={item.id}
              item={item}
              onDismiss={handleDismiss}
              onSave={handleSave}
              isSaved={savedItemIds.has(item.id)}
            />
          ))}

          {/* Load More Action Button */}
          {hasMore && (
            <Box sx={{ textAlign: 'center', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => fetchFeed(nextCursor, true)}
                disabled={loadingMore}
                startIcon={
                  loadingMore ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />
                }
                sx={{
                  borderRadius: `${tokens.radius.md}px`,
                  px: 4,
                  py: 1,
                  fontWeight: 600,
                }}
              >
                {loadingMore ? 'Loading More Matches...' : 'Load More Recommendations'}
              </Button>
            </Box>
          )}
        </Stack>
      )}

      {/* Toast Notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastMessage(null)}
          severity="info"
          sx={{ width: '100%', borderRadius: `${tokens.radius.md}px` }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default PersonalizedFeedStream;
