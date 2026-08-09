'use client';

import React, { useState, useEffect } from 'react';
import { Grid, Box, Tabs, Tab } from '@mui/material';
import CompanyDirectoryLayout from '../../components/company/CompanyDirectoryLayout';
import DirectorySearchBar from '../../components/company/DirectorySearchBar';
import CompanyFilters from '../../components/company/CompanyFilters';
import CompanyGrid from '../../components/company/CompanyGrid';
import FeaturedCompanies from '../../components/company/FeaturedCompanies';
import IndustryGrid from '../../components/company/IndustryGrid';
import MapView from '../../components/company/MapView';
import RecommendationSection from '../../components/company/RecommendationSection';
import {
  CompanyDirectoryItem,
  CompanyFilterQuery,
  IndustryCategory,
} from '../../features/companies/types';
import { companiesApi } from '../../features/companies/api';

export default function CompaniesDirectoryPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [directoryData, setDirectoryData] = useState<{
    companies: CompanyDirectoryItem[];
    total: number;
    page: number;
    totalPages: number;
  }>({ companies: [], total: 0, page: 1, totalPages: 1 });

  const [featured, setFeatured] = useState<CompanyDirectoryItem[]>([]);
  const [recommended, setRecommended] = useState<CompanyDirectoryItem[]>([]);
  const [industries, setIndustries] = useState<IndustryCategory[]>([]);

  const [filters, setFilters] = useState<CompanyFilterQuery>({
    query: '',
    industry: '',
    size: '',
    country: '',
    city: '',
    actively_hiring: false,
    verified: false,
    sort: 'most_relevant',
    page: 1,
    limit: 12,
  });

  const fetchDirectory = async (currentFilters: CompanyFilterQuery) => {
    setLoading(true);
    try {
      const res = await companiesApi.getDirectory(currentFilters);
      setDirectoryData(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(filters);
  }, [filters]);

  useEffect(() => {
    companiesApi.getFeatured().then((res) => setFeatured(res)).catch(() => {});
    companiesApi.getRecommended().then((res) => setRecommended(res as any)).catch(() => {});
    companiesApi.getIndustries().then((res) => setIndustries(res)).catch(() => {});
  }, []);

  const handleSearch = (query: string, location?: string) => {
    setFilters((prev) => ({
      ...prev,
      query,
      country: location || prev.country,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: CompanyFilterQuery) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      industry: '',
      size: '',
      country: '',
      city: '',
      actively_hiring: false,
      verified: false,
      sort: 'most_relevant',
      page: 1,
      limit: 12,
    });
  };

  const handleSelectIndustry = (indName: string) => {
    setFilters((prev) => ({ ...prev, industry: indName, page: 1 }));
  };

  return (
    <CompanyDirectoryLayout>
      {/* Top Search Bar */}
      <DirectorySearchBar onSearch={handleSearch} />

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Employers" sx={{ fontWeight: 800, textTransform: 'none' }} />
          <Tab label="Explore Industries" sx={{ fontWeight: 800, textTransform: 'none' }} />
          <Tab label="Map View" sx={{ fontWeight: 800, textTransform: 'none' }} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          {/* AI Recommendation Section */}
          <RecommendationSection recommended={recommended} />

          {/* Featured Companies Section */}
          <FeaturedCompanies companies={featured} />

          {/* Main Directory & Filters Grid */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={3.5}>
              <CompanyFilters
                filters={filters}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </Grid>

            <Grid item xs={12} md={8.5}>
              <CompanyGrid
                companies={directoryData.companies}
                loading={loading}
                page={directoryData.page}
                totalPages={directoryData.totalPages}
                onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 1 && (
        <IndustryGrid industries={industries} onSelectIndustry={handleSelectIndustry} />
      )}

      {activeTab === 2 && <MapView />}
    </CompanyDirectoryLayout>
  );
}
