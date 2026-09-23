'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WorkIcon from '@mui/icons-material/Work';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import { marketplaceApi } from '../../../features/global_marketplace/api';
import {
  Country,
  Currency,
  InternationalJobItem,
  Region,
} from '../../../features/global_marketplace/types';

export default function GlobalJobMarketplacePage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedArrangement, setSelectedArrangement] = useState<string>('ALL');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ORIGINAL');

  const [jobs, setJobs] = useState<InternationalJobItem[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetadata();
    fetchJobs('ALL', 'ALL');
  }, []);

  const loadMetadata = async () => {
    try {
      const [cRes, rRes, currRes] = await Promise.all([
        marketplaceApi.getCountries(),
        marketplaceApi.getRegions(),
        marketplaceApi.getCurrencies(),
      ]);
      setCountries(cRes.data || []);
      setRegions(rRes.data || []);
      setCurrencies(currRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async (region: string, arrangement: string) => {
    try {
      setLoading(true);
      const res = await marketplaceApi.searchJobs(region, 'ALL', arrangement);
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    fetchJobs(newRegion, selectedArrangement);
  };

  const handleArrangementChange = (newArrangement: string) => {
    setSelectedArrangement(newArrangement);
    fetchJobs(selectedRegion, newArrangement);
  };

  const getWorkArrangementBadge = (arr: string) => {
    switch (arr) {
      case 'remote':
        return <Chip label="REMOTE" size="small" sx={{ bgcolor: '#10b981', color: "success.contrastText", fontWeight: 'bold' }} />;
      case 'hybrid':
        return <Chip label="HYBRID" size="small" sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }} />;
      default:
        return <Chip label="ON-SITE" size="small" sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }} />;
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: '100dvh', color: "text.primary", py: 4 }}>
      <Container maxWidth="xl">
        {/* Header Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: "primary.main", p: 1.5, borderRadius: 2, color: "primary.contrastText", display: 'flex' }}>
              <LanguageIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ bgcolor: "transparent", WebkitBackgroundClip: 'text', WebkitTextFillColor: "currentColor" }}>
                Global Job Marketplace Infrastructure
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                International job discovery across UAE 🇦🇪, India 🇮🇳, Saudi Arabia / GCC 🇸🇦, & Global Remote 🌎
              </Typography>
            </Box>
          </Box>

          {/* Currency Switcher */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ color: "primary.main" }}>Display Currency</InputLabel>
            <Select
              value={selectedCurrency}
              label="Display Currency"
              onChange={(e) => setSelectedCurrency(e.target.value)}
              sx={{ color: "text.primary", '& .MuiOutlinedInput-notchedOutline': { borderColor: "divider" } }}
            >
              <MenuItem value="ORIGINAL">Local Currency</MenuItem>
              {currencies.map((curr) => (
                <MenuItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} ({curr.name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Region Filter Tabs */}
        <Paper sx={{ mb: 3, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Tabs
            value={selectedRegion}
            onChange={(_, val) => handleRegionChange(val)}
            textColor="inherit"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: "primary.main" },
              '& .MuiTab-root': { color: "text.secondary", fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: "primary.main" },
            }}
          >
            <Tab icon={<LanguageIcon fontSize="small" />} iconPosition="start" label="All Global Markets" value="ALL" />
            <Tab icon={<TextEmoji text="🇦🇪" />} iconPosition="start" label="UAE (Dubai & Abu Dhabi)" value="ME_GCC" />
            <Tab icon={<TextEmoji text="🇮🇳" />} iconPosition="start" label="India (Bengaluru & Hyd)" value="APAC" />
            <Tab icon={<TextEmoji text="🇸🇦" />} iconPosition="start" label="Saudi Arabia & GCC" value="ME_GCC" />
            <Tab icon={<TextEmoji text="🌎" />} iconPosition="start" label="Global Remote" value="GLOBAL" />
          </Tabs>
        </Paper>

        {/* Work Arrangement Filters */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 'bold', mr: 1 }}>Work Arrangement:</Typography>
          <Chip
            label="All Arrangements"
            clickable
            color={selectedArrangement === 'ALL' ? 'primary' : 'default'}
            onClick={() => handleArrangementChange('ALL')}
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label="🌎 Remote Only"
            clickable
            color={selectedArrangement === 'remote' ? 'primary' : 'default'}
            onClick={() => handleArrangementChange('remote')}
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label="🏢 Hybrid"
            clickable
            color={selectedArrangement === 'hybrid' ? 'primary' : 'default'}
            onClick={() => handleArrangementChange('hybrid')}
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label="📍 On-Site"
            clickable
            color={selectedArrangement === 'onsite' ? 'primary' : 'default'}
            onClick={() => handleArrangementChange('onsite')}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: "background.paper", '& .MuiLinearProgress-bar': { bgcolor: "primary.main" } }} />}

        {/* International Jobs Cards Grid */}
        <Grid container spacing={3}>
          {jobs.map((item) => (
            <Grid item xs={12} md={6} key={item.job_id}>
              <Card sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5">{item.primary_location.flag_emoji}</Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "text.primary" }}>
                        {item.primary_location.country_name} ({item.primary_location.city})
                      </Typography>
                    </Box>

                    {getWorkArrangementBadge(item.primary_location.work_arrangement)}
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 0.5 }}>
                    {item.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 'bold', mb: 2 }}>
                    {item.company}
                  </Typography>

                  <Box sx={{ bgcolor: "background.default", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoneyIcon sx={{ color: '#10b981' }} />
                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#10b981' }}>
                          {item.formatted_salary}
                        </Typography>
                      </Box>

                      <Chip
                        icon={<AutoAwesomeIcon fontSize="small" />}
                        label={`${item.match_score}% MATCH`}
                        size="small"
                        sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }}
                      />
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', py: 1, mt: 'auto' }}
                  >
                    1-Click Global Apply
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

function TextEmoji({ text }: { text: string }) {
  return <span style={{ fontSize: 18, marginRight: 4 }}>{text}</span>;
}
