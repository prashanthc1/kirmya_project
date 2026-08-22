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
import StorageIcon from '@mui/icons-material/Storage';
import ReplayIcon from '@mui/icons-material/Replay';

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

const MOCK_RESULTS: SearchResultItem[] = [
  {
    id: 'j-1',
    type: 'jobs',
    title: 'Senior Go Backend Architect',
    subtitle: 'Stripe Global • $180,000 - $220,000 • Remote',
    description: 'Build distributed payment processing pipelines, rate limiting services, and high-throughput PostgreSQL databases using Go microservices.',
    url: '/jobs/rec-1',
    score: 0.98,
    metadata: { tags: ['Go', 'PostgreSQL', 'Microservices', 'Distributed Systems'] },
  },
  {
    id: 'p-1',
    type: 'people',
    title: 'Alex Rivera',
    subtitle: 'Senior Full-Stack Go & React Engineer',
    description: '5+ years experience building high-scale microservices, PostgreSQL architectures, and Next.js platforms.',
    url: '/profiles/alex-rivera',
    score: 0.95,
    metadata: { skills: ['Go', 'React', 'TypeScript', 'Next.js'] },
  },
  {
    id: 'c-1',
    type: 'companies',
    title: 'Stripe Inc.',
    subtitle: 'Financial Infrastructure • 8,000+ Employees',
    description: 'Financial infrastructure for the internet. Millions of companies use Stripe software to accept payments and manage business online.',
    url: '/companies/stripe',
    score: 0.97,
    metadata: { highlights: ['FinTech', 'Unicorn', 'Remote-First', 'High-Growth'] },
  },
  {
    id: 'crs-1',
    type: 'courses',
    title: 'Advanced Go Architecture & PostgreSQL P99 Optimization',
    subtitle: '12 Modules • Verified Certificate',
    description: 'Master GIN indexing, connection pooling, low-latency microservice design, and distributed tracing.',
    url: '/learning/courses/go-arch-101',
    score: 0.96,
    metadata: { tags: ['Go', 'PostgreSQL', 'Performance', 'Database'] },
  },
  {
    id: 'cm-1',
    type: 'communities',
    title: 'Go & Distributed Systems Guild',
    subtitle: '4,250 Members • Active Community',
    description: 'Weekly technical deep dives into Go runtime internals, concurrency primitives, and cloud native architectures.',
    url: '/communities/go-guild',
    score: 0.94,
    metadata: { tags: ['Community', 'Go', 'Open Source', 'Mentorship'] },
  },
  {
    id: 'ev-1',
    type: 'events',
    title: 'Global Go & Microservices Summit 2026',
    subtitle: 'Oct 24-26, 2026 • San Francisco & Online',
    description: 'Annual flagship conference featuring lead maintainers of Go, Kubernetes, and high-throughput backend infrastructure.',
    url: '/events/go-summit-2026',
    score: 0.92,
    metadata: { tags: ['Conference', 'Keynotes', 'Networking', 'Go'] },
  },
];

const INITIAL_HISTORY: SearchHistoryItem[] = [
  { id: 'h-1', user_id: 'u-1', query: 'Go Backend Architect', category_filter: 'jobs', results_count: 14, searched_at: '2026-08-14' },
  { id: 'h-2', user_id: 'u-1', query: 'Alex Rivera', category_filter: 'people', results_count: 3, searched_at: '2026-08-14' },
  { id: 'h-3', user_id: 'u-1', query: 'Stripe', category_filter: 'companies', results_count: 8, searched_at: '2026-08-13' },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get('q') || '';
  const urlCategory = (searchParams.get('category') as SearchCategory) || 'all';

  const [query, setQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>(urlCategory);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>(INITIAL_HISTORY);
  const [filters, setFilters] = useState<SearchFilterParams>({});
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
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
    } catch (err) {
      // Filter mock results based on query and category
      const filtered = MOCK_RESULTS.filter((item) => {
        const matchesCategory = category === 'all' || item.type === category;
        const matchesQuery =
          !q ||
          item.title.toLowerCase().includes(q.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(q.toLowerCase()) ||
          item.description.toLowerCase().includes(q.toLowerCase());
        return matchesCategory && matchesQuery;
      });

      setSearchResponse({
        query: q,
        category,
        total_results: filtered.length,
        engine_used: 'postgresql-tsvector-v1',
        results: filtered,
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
      setSuggestions(res.suggestions || []);
    } catch (err) {
      setSuggestions([
        { text: `${q} in Jobs`, category: 'jobs' },
        { text: `${q} in People`, category: 'people' },
        { text: `${q} in Companies`, category: 'companies' },
      ]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await searchApi.getUserHistory();
      if (res.data && res.data.length > 0) {
        setHistory(res.data);
      }
    } catch (err) {
      // Keep initial history
    }
  };

  useEffect(() => {
    fetchSearch(query, selectedCategory);
    fetchHistory();
  }, [selectedCategory]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    fetchSuggestions(newQuery);
  };

  const handleExecuteSearch = (searchQuery?: string) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    updateURL(q, selectedCategory);
    fetchSearch(q, selectedCategory);
  };

  const handleCategoryChange = (_: React.SyntheticEvent, newCategory: SearchCategory) => {
    setSelectedCategory(newCategory);
    updateURL(query, newCategory);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    try {
      await searchApi.deleteHistoryItem(id);
    } catch (err) {
      // Handled in UI state
    }
  };

  const handleClearHistory = async () => {
    setHistory([]);
    try {
      await searchApi.clearHistory();
    } catch (err) {
      // Handled in UI state
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await searchApi.reindex({ full_reindex: true });
      setToastMessage('Reindexing requested successfully!');
    } catch (err) {
      setToastMessage('Reindexing triggered (mock response)');
    } finally {
      setReindexing(false);
    }
  };

  const handleSaveSearchAlert = async () => {
    if (!query) return;
    try {
      await searchApi.savePreference({
        saved_query: query,
        email_alert_enabled: true,
      });
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3000);
    } catch (err) {
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3000);
    }
  };

  const handleApplyFilters = () => {
    fetchSearch(query, selectedCategory);
    setToastMessage('Filters applied successfully');
  };

  const handleResetFilters = () => {
    setFilters({});
    fetchSearch(query, selectedCategory);
    setToastMessage('Filters reset');
  };

  const hasActiveFilters = Object.keys(filters).some((k) => {
    const val = filters[k];
    return Array.isArray(val) ? val.length > 0 : Boolean(val);
  });

  const results = searchResponse?.results || [];

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header & OpenSearch Engine Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Unified Kirmya Search Platform
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Global search engine indexing People, Jobs, Companies, Communities, Courses, and Events.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Paper
              sx={{
                p: 1.5,
                px: 2,
                bgcolor: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <StorageIcon sx={{ color: '#38bdf8' }} />
              <Box>
                <Typography variant="caption" fontWeight="bold" sx={{ color: '#38bdf8', display: 'block' }}>
                  Engine: {searchResponse?.engine_used || 'postgresql-tsvector-v1'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  OpenSearch Migration Ready
                </Typography>
              </Box>
            </Paper>

            <Tooltip title="Trigger Search Reindex">
              <Button
                variant="outlined"
                onClick={handleReindex}
                disabled={reindexing}
                startIcon={<ReplayIcon fontSize="small" />}
                sx={{
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  bgcolor: 'rgba(30, 41, 59, 0.6)',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  borderRadius: 2.5,
                  py: 1,
                  '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)', borderColor: '#38bdf8' },
                }}
              >
                Reindex Engine
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Global Search Bar */}
        <Box sx={{ mb: 3 }}>
          <GlobalSearchBar
            query={query}
            onQueryChange={handleQueryChange}
            onSearch={handleExecuteSearch}
            suggestions={suggestions}
            history={history}
            loading={loading}
            onSelectHistory={(q) => {
              setQuery(q);
              handleExecuteSearch(q);
            }}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
          />
        </Box>

        {/* Filter Toggle & Save Alert bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsFilterSidebarOpen(true)}
            startIcon={<FilterListIcon />}
            sx={{
              color: hasActiveFilters ? '#38bdf8' : '#cbd5e1',
              borderColor: hasActiveFilters ? '#38bdf8' : '#334155',
              bgcolor: hasActiveFilters ? 'rgba(56, 189, 248, 0.1)' : 'rgba(30, 41, 59, 0.6)',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { borderColor: '#38bdf8', bgcolor: 'rgba(56, 189, 248, 0.15)' },
            }}
          >
            {hasActiveFilters ? 'Filters Active' : 'Filter Results'}
          </Button>

          {query && (
            <Tooltip title="Save Search Alert">
              <Button
                variant={savedAlert ? 'contained' : 'outlined'}
                onClick={handleSaveSearchAlert}
                startIcon={<BookmarkBorderIcon />}
                sx={{
                  bgcolor: savedAlert ? '#22c55e' : 'transparent',
                  color: savedAlert ? '#fff' : '#38bdf8',
                  borderColor: savedAlert ? '#22c55e' : '#38bdf8',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                {savedAlert ? 'Alert Saved!' : 'Save Search Alert'}
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Category Navigation Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            bgcolor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2.5,
          }}
        >
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            textColor="inherit"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8', height: 3 },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none', minHeight: 48 },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<SearchIcon fontSize="small" />} iconPosition="start" label="All Results" value="all" />
            <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Jobs" value="jobs" />
            <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="People" value="people" />
            <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Companies" value="companies" />
            <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Communities" value="communities" />
            <Tab icon={<SchoolIcon fontSize="small" />} iconPosition="start" label="Courses" value="courses" />
            <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label="Events" value="events" />
          </Tabs>
        </Paper>

        {/* Recent Searches Manager */}
        <RecentSearchesManager
          history={history}
          onSelectSearch={(q) => {
            setQuery(q);
            handleExecuteSearch(q);
          }}
          onDeleteItem={handleDeleteHistoryItem}
          onClearAll={handleClearHistory}
          loading={loading}
        />

        {/* Results Grid / Loading Skeletons / Empty State */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((n) => (
              <Grid item xs={12} md={6} key={n}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', borderRadius: 3 }}>
                  <Skeleton variant="text" width="60%" height={32} sx={{ bgcolor: '#334155' }} />
                  <Skeleton variant="text" width="40%" height={24} sx={{ bgcolor: '#334155', mb: 2 }} />
                  <Skeleton variant="rectangular" height={80} sx={{ bgcolor: '#334155', borderRadius: 2 }} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : results.length === 0 ? (
          <SearchEmptyState
            query={query}
            onSelectKeyword={(kw) => {
              setQuery(kw);
              handleExecuteSearch(kw);
            }}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        ) : (
          <Grid container spacing={3}>
            {results.map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <SearchResultCard
                  item={item}
                  onAction={(action, targetItem) => {
                    setToastMessage(`Action '${action}' performed on ${targetItem.title}`);
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Search Filters Drawer */}
        <SearchFiltersSidebar
          open={isFilterSidebarOpen}
          onClose={() => setIsFilterSidebarOpen(false)}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          onApplyFilters={handleApplyFilters}
          isDrawer={true}
        />

        {/* Toast Notification */}
        <Snackbar
          open={Boolean(toastMessage)}
          autoHideDuration={3000}
          onClose={() => setToastMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setToastMessage(null)} severity="info" sx={{ bgcolor: '#1e293b', color: '#38bdf8' }}>
            {toastMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
