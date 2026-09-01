'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Skeleton,
  Tooltip,
  Snackbar,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import FilterListIcon from '@mui/icons-material/FilterList';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import { searchApi } from '../../features/search/api';
import {
  SearchCategory,
  SearchFilterParams,
  SearchHistoryItem,
  SearchResponse,
  SearchResultItem,
  SearchSuggestion,
} from '../../features/search/types';

import GlobalSearchBar from '../../components/search/GlobalSearchBar';
import SearchResultCard from '../../components/search/SearchResultCard';
import SearchFiltersSidebar from '../../components/search/SearchFiltersSidebar';
import RecentSearchesManager from '../../components/search/RecentSearchesManager';
import SearchEmptyState from '../../components/search/SearchEmptyState';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get('q') || '';
  const urlCategory = (searchParams.get('category') as SearchCategory) || 'all';

  const [query, setQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>(urlCategory);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [filters, setFilters] = useState<SearchFilterParams>({});
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const updateURL = (q: string, category: SearchCategory) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category && category !== 'all') params.set('category', category);
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : '/search');
  };

  const fetchSearch = async (q: string, category: SearchCategory) => {
    setLoading(true);
    try {
      const res = await searchApi.search(q, category);
      setSearchResponse(res);
    } catch (err: any) {
      console.error('Search query error:', err);
      setSearchResponse({
        query: q,
        category,
        total_results: 0,
        engine_used: 'postgresql-tsvector-v1',
        results: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (q: string) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await searchApi.getSuggestions(q);
      setSuggestions(res?.suggestions || []);
    } catch (err) {
      setSuggestions([]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await searchApi.getUserHistory();
      if (res?.data) {
        setHistory(res.data);
      }
    } catch (err) {
      setHistory([]);
    }
  };

  useEffect(() => {
    setQuery(urlQuery);
    setSelectedCategory(urlCategory);
    fetchSearch(urlQuery, urlCategory);
  }, [urlQuery, urlCategory]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSearchSubmit = (newQuery?: string) => {
    const target = newQuery !== undefined ? newQuery : query;
    setQuery(target);
    updateURL(target, selectedCategory);
  };

  const handleCategoryChange = (_: React.SyntheticEvent, newCat: SearchCategory) => {
    setSelectedCategory(newCat);
    updateURL(query, newCat);
  };

  const handleSaveSearch = async () => {
    if (!query) return;
    try {
      await searchApi.savePreference({
        saved_query: query,
        filters: { category: selectedCategory, ...filters },
        email_alert_enabled: true,
      });
      setToastMessage('Search query saved to your alerts and preferences.');
    } catch (err) {
      setToastMessage('Could not save search query.');
    }
  };

  const results = searchResponse?.results || [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Header Search Surface */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              Global Search & Multi-Entity Discovery
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Find verified people, high-impact jobs, accredited companies, technical communities, and events.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Tooltip title="Save this search query to job alerts">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BookmarkBorderIcon />}
                  disabled={!query}
                  onClick={handleSaveSearch}
                  sx={{ borderRadius: `${tokens.radius.sm}px`, textTransform: 'none', fontWeight: 700 }}
                >
                  Save Search Alert
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <GlobalSearchBar
          value={query}
          onChange={(val) => {
            setQuery(val);
            fetchSuggestions(val);
          }}
          onSearch={handleSearchSubmit}
          suggestions={suggestions}
          onSelectSuggestion={(sug) => {
            setQuery(sug.text);
            setSelectedCategory(sug.category);
            updateURL(sug.text, sug.category);
          }}
        />
      </Paper>

      {/* Category Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'none',
              minHeight: 48,
            },
          }}
        >
          <Tab icon={<SearchIcon fontSize="small" />} iconPosition="start" label="All Results" value="all" />
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="People" value="people" />
          <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Jobs" value="jobs" />
          <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Companies" value="companies" />
          <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Communities" value="communities" />
          <Tab icon={<SchoolIcon fontSize="small" />} iconPosition="start" label="Courses" value="courses" />
          <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label="Events" value="events" />
        </Tabs>
      </Paper>

      {/* Results Layout Grid */}
      <Grid container spacing={3}>
        {/* Main Results Column */}
        <Grid item xs={12} md={8}>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            </Stack>
          ) : results.length === 0 ? (
            <SearchEmptyState query={query} onClear={() => handleSearchSubmit('')} />
          ) : (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Showing <strong>{results.length}</strong> {selectedCategory !== 'all' ? selectedCategory : ''} results
                  {query && <> for &ldquo;<strong>{query}</strong>&rdquo;</>}
                </Typography>
              </Box>

              {results.map((item) => (
                <SearchResultCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </Stack>
          )}
        </Grid>

        {/* Sidebar Column: Recent Searches & Quick Filters */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <RecentSearchesManager
              history={history}
              onSelectQuery={(q, cat) => {
                setQuery(q);
                setSelectedCategory((cat as SearchCategory) || 'all');
                updateURL(q, (cat as SearchCategory) || 'all');
              }}
              onDeleteItem={async (id) => {
                await searchApi.deleteHistoryItem(id);
                fetchHistory();
              }}
              onClearAll={async () => {
                await searchApi.clearHistory();
                setHistory([]);
              }}
            />

            <SearchFiltersSidebar
              open={isFilterSidebarOpen}
              onClose={() => setIsFilterSidebarOpen(false)}
              filters={filters}
              onFilterChange={setFilters}
              onReset={() => setFilters({})}
            />
          </Stack>
        </Grid>
      </Grid>

      {/* Toast Notification */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setToastMessage(null)} sx={{ borderRadius: `${tokens.radius.md}px` }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default function SearchPage() {
  return (
    <AuthenticatedLayout>
      <Suspense
        fallback={
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
          </Container>
        }
      >
        <SearchPageContent />
      </Suspense>
    </AuthenticatedLayout>
  );
}
