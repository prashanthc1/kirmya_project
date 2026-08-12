'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  LinearProgress,
  Autocomplete,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StorageIcon from '@mui/icons-material/Storage';

import { searchApi } from '../../features/search/api';
import {
  SearchCategory,
  SearchHistoryItem,
  SearchResponse,
  SearchSuggestion,
} from '../../features/search/types';

function SearchPageContent() {
  const searchParams = useSearchParams();
  // Seeded from the URL so links into search (the 404 page, shared results) arrive
  // with the query already run — the mount effect below fetches with this value.
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  const fetchSearch = async (q: string, category: SearchCategory) => {
    try {
      setLoading(true);
      const res = await searchApi.search(q, category);
      setSearchResponse(res);
    } catch (err) {
      console.error(err);
      setSearchResponse(mockSearchResponse);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (q: string) => {
    try {
      const res = await searchApi.getSuggestions(q);
      setSuggestions(res.suggestions || []);
    } catch (err) {
      setSuggestions([]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await searchApi.getUserHistory();
      setHistory(res.data || []);
    } catch (err) {
      setHistory([]);
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

  const handleExecuteSearch = () => {
    fetchSearch(query, selectedCategory);
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
      console.error(err);
    }
  };

  const mockSearchResponse: SearchResponse = {
    query: 'Go',
    category: 'all',
    total_results: 6,
    engine_used: 'postgresql-tsvector-v1',
    results: [
      {
        id: 'j-1',
        type: 'jobs',
        title: 'Senior Go Backend Architect',
        subtitle: 'Stripe Global • $180,000 - $220,000 • Remote',
        description: 'Build distributed payment processing pipelines, rate limiting services, and high-throughput PostgreSQL databases.',
        url: '/jobs/rec-1',
        score: 0.98,
      },
      {
        id: 'p-1',
        type: 'people',
        title: 'Alex Rivera',
        subtitle: 'Senior Full-Stack Go & React Engineer',
        description: '5+ years experience building high-scale microservices, PostgreSQL architectures, and Next.js platforms.',
        url: '/profiles/alex-rivera',
        score: 0.95,
      },
      {
        id: 'crs-1',
        type: 'courses',
        title: 'Advanced Go Architecture & PostgreSQL P99 Optimization',
        subtitle: '12 Modules • Verified Certificate',
        description: 'Master GIN indexing, connection pooling, and low-latency microservice design.',
        url: '/learning/courses/go-arch-101',
        score: 0.96,
      },
      {
        id: 'cm-1',
        type: 'communities',
        title: 'Go & Distributed Systems Guild',
        subtitle: '4,250 Members • Active Community',
        description: 'Weekly technical deep dives into Go runtime internals, concurrency primitives, and microservices.',
        url: '/communities/go-guild',
        score: 0.94,
      },
    ],
  };

  const getCategoryIcon = (cat: SearchCategory) => {
    switch (cat) {
      case 'people':
        return <PersonIcon fontSize="small" sx={{ color: '#38bdf8' }} />;
      case 'jobs':
        return <WorkIcon fontSize="small" sx={{ color: '#10b981' }} />;
      case 'companies':
        return <BusinessIcon fontSize="small" sx={{ color: '#a855f7' }} />;
      case 'communities':
        return <GroupsIcon fontSize="small" sx={{ color: '#f59e0b' }} />;
      case 'courses':
        return <SchoolIcon fontSize="small" sx={{ color: '#ec4899' }} />;
      case 'events':
        return <EventIcon fontSize="small" sx={{ color: '#6366f1' }} />;
      default:
        return <SearchIcon fontSize="small" sx={{ color: '#38bdf8' }} />;
    }
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header & OpenSearch Engine Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Unified Kirmya Search Platform
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Global search engine indexing People, Jobs, Companies, Communities, Courses, and Events.
            </Typography>
          </Box>

          <Paper sx={{ p: 1.5, px: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
        </Box>

        {/* Global Search Bar with Autocomplete */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Autocomplete
            freeSolo
            fullWidth
            options={suggestions.map((s) => s.text)}
            inputValue={query}
            onInputChange={(_, value) => handleQueryChange(value)}
            onChange={(_, value) => {
              if (typeof value === 'string') {
                setQuery(value);
                fetchSearch(value, selectedCategory);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search People, Jobs, Companies, Communities, Courses, Events..."
                size="small"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteSearch();
                }}
                sx={{ input: { color: '#fff', fontSize: 16 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
              />
            )}
          />

          <Button
            variant="contained"
            onClick={handleExecuteSearch}
            startIcon={<SearchIcon />}
            sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', px: 3, py: 1, minWidth: 120, '&:hover': { bgcolor: '#0284c7' } }}
          >
            Search
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
                  minWidth: 140,
                }}
              >
                {savedAlert ? 'Saved!' : 'Save Alert'}
              </Button>
            </Tooltip>
          )}
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Category Navigation Tabs */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, val) => setSelectedCategory(val)}
            textColor="inherit"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<SearchIcon fontSize="small" />} iconPosition="start" label="All (Unified)" value="all" />
            <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="People" value="people" />
            <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Jobs" value="jobs" />
            <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Companies" value="companies" />
            <Tab icon={<GroupsIcon fontSize="small" />} iconPosition="start" label="Communities" value="communities" />
            <Tab icon={<SchoolIcon fontSize="small" />} iconPosition="start" label="Courses" value="courses" />
            <Tab icon={<EventIcon fontSize="small" />} iconPosition="start" label="Events" value="events" />
          </Tabs>
        </Paper>

        {/* Recent Searches Pills */}
        {history.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <HistoryIcon fontSize="small" sx={{ color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Recent Searches:</Typography>
            {history.map((h) => (
              <Chip
                key={h.id}
                label={h.query}
                size="small"
                onClick={() => {
                  setQuery(h.query);
                  fetchSearch(h.query, selectedCategory);
                }}
                sx={{ bgcolor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', cursor: 'pointer', '&:hover': { bgcolor: '#334155' } }}
              />
            ))}
          </Box>
        )}

        {/* Search Results Grid */}
        <Grid container spacing={3}>
          {searchResponse?.results.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip
                      icon={getCategoryIcon(item.type)}
                      label={item.type.toUpperCase()}
                      size="small"
                      sx={{ bgcolor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', fontWeight: 'bold' }}
                    />
                    <Chip label={`Relevance ${(item.score * 100).toFixed(0)}%`} size="small" sx={{ bgcolor: '#0f172a', color: '#10b981', fontWeight: 'bold' }} />
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 0.5 }}>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#38bdf8', mb: 1.5, fontWeight: 'bold' }}>
                    {item.subtitle}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, flexGrow: 1 }}>
                    {item.description}
                  </Typography>

                  <Button
                    variant="outlined"
                    fullWidth
                    href={item.url}
                    endIcon={<OpenInNewIcon />}
                    sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold', py: 0.8 }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

// useSearchParams() opts the subtree into client-side rendering, so it needs a
// Suspense boundary to keep the route statically prerenderable.
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}
